/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import type { ParseContext } from './parse.ts'
import { TomlError } from './error.js'

// let CTRL_REGEX = /[\x00-\x08\x0f-\x1f\x7f]/

/** @internal */
export function parseString(ctx: ParseContext): string {
	let start = ctx.p
	let c = ctx.s.charCodeAt(ctx.p++)
	let first = c
	let isLiteral = c === 0x27 /* ' */
	let isMultiline = c === ctx.s.charCodeAt(ctx.p) && c === ctx.s.charCodeAt(ctx.p + 1)
	if (isMultiline) {
		// Trim initial newline
		if ((c = ctx.s.charCodeAt(ctx.p += 2)) === 0xa /* \n */) ctx.p++
		else if (c === 0xd /* \r */ && ctx.s.charCodeAt(ctx.p + 1) === 0xa /* \n */) ctx.p += 2
	}

	/*
	The fast path does not seem to bring significant performance gains, so it's commented out.
	Kept for reference and/or future fafoing.

	Without: spec  5.08 µs/iter    3.88 ipc (99.44% cache)   23.90 branch misses   28.61k cycles    111.01k instructions
	         5MB   115.73 ms/iter  2.51 ipc (98.36% cache)   3.12M branch misses   619.30M cycles   1.56G instructions

	With:    spec  5.09 µs/iter    3.90 ipc (99.46% cache)   24.42 branch misses   28.57k cycles    111.49k instructions
	         5MB   113.89 ms/iter  2.47 ipc (98.38% cache)   3.12M branch misses   611.94M cycles   1.51G instructions

	if (c === "'") {
		// Literal strings fast path - no transform needs to occur; just grab the str and that's it
		let endPtr = str.indexOf(isMultiline ? "'''" : "'", ptr)
		if (endPtr < 0) {
			throw new TomlError("unfinished string literal", { toml: str, ptr })
		}

		if (isMultiline) {
			// If the string ends with 4-5 quotes, then the first 1-2 are part of the string
			if (str[endPtr + 3] === "'") endPtr++
			if (str[endPtr + 3] === "'") endPtr++
		}

		let string = str.slice(ptr, endPtr)
		if (CTRL_REGEX.test(string)) {
			let match = string.match(CTRL_REGEX)!
			throw new TomlError('control characters are not allowed in strings', { toml: str, ptr: ptr + (match.index ?? 0) })
		}
		return [string, endPtr + (isMultiline ? 3 : 1)]
	}
	*/

	let parsed = ''
	let sliceStart = ctx.p

	// states:
	//   0 - decoding
	//   1 - decoding escape
	//   2 - whitespace escape (no newline encountered yet, must fail on non-whitespace)
	//   3 - whitespace escape (newline encountered, allowed to transition back to normal decode)
	let state = 0
	for (; ctx.p < ctx.s.length; ctx.p++) {
		c = ctx.s.charCodeAt(ctx.p)!

		// Deal with newlines first, since that simplifies control character checking and handling across all states
		if (isMultiline && (c === 0xa /* \n */ || (c === 0xd /* \r */ && ctx.s.charCodeAt(ctx.p + 1) === 0xa /* \n */))) {
			state = state && 3
		}

		// Control characters are banned in TOML, so we throw an error if we encounter them
		else if ((c < 0x20 && c !== 0x9 /* \t */) || c === 0x7f) {
			throw new TomlError('control characters are not allowed in strings', ctx)
		}

		// The string might terminate while we're parsing through a newline escape.
		// It must have encountered a newline; otherwise, it'll simply fail in another branch.
		else if ((!state || state === 3) && c === first && (!isMultiline || (ctx.s.charCodeAt(ctx.p + 1) === first && ctx.s.charCodeAt(ctx.p + 2) === first))) {
			if (isMultiline) {
				// If the string ends with 4-5 quotes, then the first 1-2 are part of the string
				if (ctx.s.charCodeAt(ctx.p + 3) === first) ctx.p++
				if (ctx.s.charCodeAt(ctx.p + 3) === first) ctx.p++
			}

			// If we're in a newline escape still, then there's nothing to add.
			if (!state) {
				// Avoid a useless concat operation if the string can be used as-is.
				let s = ctx.s.slice(sliceStart, ctx.p)
				parsed = parsed ? parsed + s : s;
			}

			ctx.p += isMultiline ? 3 : 1
			return parsed
		}

		// Baseline state; keep moving forward unless an escape sequence starts
		else if (!state) {
			if (!isLiteral && c === 0x5c /* \ */) {
				parsed += ctx.s.slice(sliceStart, (sliceStart = ctx.p))
				state = 1
			}
		}

		else if (state === 1) {
			if (c === 0x78 /* x */ || c === 0x75 /* u */ || c === 0x55 /* U */) { // Unicode escape
				let err = { toml: ctx.s, ptr: ctx.p++ - 1 }
				let value = 0
				let len = c === 0x78 /* x */ ? 2 : c === 0x75 /* u */ ? 4 : 8
				for (let j = 0; j < len; j++, ctx.p++) {
					let hex = ctx.s.charCodeAt(ctx.p)
					let digit =
						/* 0-9 */ hex >= 0x30 && hex <= 0x39 ? hex - 0x30 :
						/* A-F */ hex >= 0x41 && hex <= 0x46 ? hex - 0x41 + 10 :
						/* a-f */ hex >= 0x61 && hex <= 0x66 ? hex - 0x61 + 10 : -1

					if (digit < 0) throw new TomlError('invalid non-hex character in unicode escape', ctx)
					value = (value << 4) | digit
				}

				// Because JS does bitwise on signed 32bit integers, all 0xfzzzzzzz values are actually seen as negative
				if (value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
					throw new TomlError('invalid unicode escape', err)
				}

				parsed += String.fromCodePoint(value)
				sliceStart = ctx.p--
				state = 0
			}

			// Newline escape sequence. We only need to care about spaces and tabs; newlines are dealt with earlier
			else if (isMultiline && (c === 0x20 || c === 0x9 /* \t */)) {
				state = 2
			}

			// Basic escape sequence
			else {
				if (c === 0x62 /* b */) parsed += '\b'
				else if (c === 0x74 /* t */) parsed += '\t'
				else if (c === 0x6e /* n */) parsed += '\n'
				else if (c === 0x66 /* f */) parsed += '\f'
				else if (c === 0x72 /* r */) parsed += '\r'
				else if (c === 0x65 /* e */) parsed += '\x1b'
				else if (c === 0x22 /* " */) parsed += '"'
				else if (c === 0x5c /* \ */) parsed += '\\'
				else throw new TomlError('unrecognised escape sequence', ctx)
				sliceStart = ctx.p + 1
				state = 0
			}
		}

		// Newline escape continuation: keep moving forward until the first non-whitespace char
		else if (c !== 0x20 && c !== 0x9 /* \t */) {
			if (state === 2) {
				throw new TomlError('invalid escape: only line-ending whitespace may be escaped', {
					toml: ctx.s,
					ptr: sliceStart,
				})
			}

			// State cannot be zero, or we'd have branched earlier already.
			// If it's a backslash, immediately transition to the escape state so it can be processed.
			state = !isLiteral && c === 0x5c /* \ */ ? 1 : 0
			sliceStart = ctx.p
		}
	}

	throw new TomlError('unfinished string', { toml: ctx.s, ptr: start })
}
