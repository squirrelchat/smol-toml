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

import { TomlDate } from './date.js'
import { TomlError } from './error.js'

// let CTRL_REGEX = /[\x00-\x08\x0f-\x1f\x7f]/
let INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/
let FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/
let LEADING_ZERO = /^[+-]?0[0-9_]/

export function parseString(str: string, ptr: number): [string, number] {
	let c = str[ptr++]!
	let first = c
	let isLiteral = c === "'"
	let isMultiline = c === str[ptr] && c === str[ptr + 1]
	if (isMultiline) {
		// Trim initial newline
		if (str[ptr += 2] === '\n') ptr++
		else if (str[ptr] === '\r' && str[ptr + 1] === '\n') ptr += 2
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
	let sliceStart = ptr

	// states:
	//   0 - decoding
	//   1 - decoding escape
	//   2 - whitespace escape (no newline encountered yet, must fail on non-whitespace)
	//   3 - whitespace escape (newline encountered, allowed to transition back to normal decode)
	let state = 0
	for (let i = ptr; i < str.length; i++) {
		c = str[i]!

		// Deal with newlines first, since that simplifies control character checking and handling across all states
		if (isMultiline && (c === '\n' || (c === '\r' && str[i + 1] === '\n'))) {
			state = state && 3
		}

		// Control characters are banned in TOML, so we throw an error if we encounter them
		else if ((c < '\x20' && c !== '\t') || c === '\x7f') {
			throw new TomlError('control characters are not allowed in strings', {
				toml: str,
				ptr: i,
			})
		}

		// The string might terminate while we're parsing through a newline escape.
		// It must have encountered a newline; otherwise, it'll simply fail in another branch.
		else if ((!state || state === 3) && c === first && (!isMultiline || (str[i + 1] === first && str[i + 2] === first))) {
			if (isMultiline) {
				// If the string ends with 4-5 quotes, then the first 1-2 are part of the string
				if (str[i + 3] === first) i++
				if (str[i + 3] === first) i++
			}

			return [
				// If we're in a newline escape still, then there's nothing to add.
				// Also try to avoid concat if there's nothing to add to parsed, or nothing has been added to parsed.
				state ? parsed : parsed + str.slice(sliceStart, i),
				i + (isMultiline ? 3 : 1),
			]
		}

		else if (!state) {
			if (!isLiteral && c === '\\') {
				parsed += str.slice(sliceStart, (sliceStart = i))
				state = 1
			}
		}

		else if (state === 1) {
			if (c === 'x' || c === 'u' || c === 'U') { // Unicode escape
				let value = 0
				let len = c === 'x' ? 2 : c === 'u' ? 4 : 8
				for (let j = 0; j < len; j++, i++) {
					let hex = str.charCodeAt(i + 1)
					let digit =
						/* 0-9 */ hex >= 0x30 && hex <= 0x39 ? hex - 0x30 :
						/* A-F */ hex >= 0x41 && hex <= 0x46 ? hex - 0x41 + 10 :
						/* a-f */ hex >= 0x61 && hex <= 0x66 ? hex - 0x61 + 10 : -1

					if (digit < 0) throw new TomlError('invalid non-hex character in unicode escape', { toml: str, ptr: i + 1 })
					value = (value << 4) | digit
				}

				// Because JS does bitwise on signed 32bit integers, all 0xfzzzzzzz values are actually seen as negative
				if (value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
					throw new TomlError('invalid unicode escape', { toml: str, ptr: i })
				}

				parsed += String.fromCodePoint(value)
				sliceStart = i + 1
				state = 0
			}

			else if (c === ' ' || c === '\t') { // If it was a newline, it'd have been handled earlier
				state = 2
			}

			else {
				if (c === 'b') parsed += '\b'
				else if (c === 't') parsed += '\t'
				else if (c === 'n') parsed += '\n'
				else if (c === 'f') parsed += '\f'
				else if (c === 'r') parsed += '\r'
				else if (c === 'e') parsed += '\x1b'
				else if (c === '"') parsed += '"'
				else if (c === '\\') parsed += '\\'
				else throw new TomlError('unrecognized escape sequence', { toml: str, ptr: i })
				sliceStart = i + 1
				state = 0
			}
		}

		else if (c !== ' ' && c !== '\t') {
			if (state === 2) {
				throw new TomlError('invalid escape: only line-ending whitespace may be escaped', {
					toml: str,
					ptr: sliceStart,
				})
			}

			// State cannot be zero, or we'd have branched earlier already.
			// If it's a backslash, immediately transition to the escape state so it can be processed.
			state = !isLiteral && c === '\\' ? 1 : 0
			sliceStart = i
		}
	}

	throw new TomlError('unfinished string', { toml: str, ptr })
}

export type IntegersAsBigInt = undefined | boolean | 'asNeeded'

export function parseValue(value: string, toml: string, ptr: number, integersAsBigInt: IntegersAsBigInt): boolean | number | bigint | TomlDate {
	// Constant values
	if (value === 'true') return true
	if (value === 'false') return false
	if (value === '-inf') return -Infinity
	if (value === 'inf' || value === '+inf') return Infinity
	if (value === 'nan' || value === '+nan' || value === '-nan') return NaN

	// Avoid FP representation of -0
	if (value === '-0') return integersAsBigInt ? 0n : 0

	// Numbers
	let isInt = INT_REGEX.test(value)
	if (isInt || FLOAT_REGEX.test(value)) {
		if (LEADING_ZERO.test(value)) {
			throw new TomlError('leading zeroes are not allowed', {
				toml: toml,
				ptr: ptr,
			})
		}

		value = value.replace(/_/g, '')
		let numeric: number | bigint = +value

		if (isNaN(numeric)) {
			throw new TomlError('invalid number', {
				toml: toml,
				ptr: ptr,
			})
		}

		if (isInt) {
			if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
				throw new TomlError('integer value cannot be represented losslessly', {
					toml: toml,
					ptr: ptr,
				})
			}

			if (isInt || integersAsBigInt === true) numeric = BigInt(value)
		}

		return numeric
	}

	const date = new TomlDate(value)
	if (!date.isValid()) {
		throw new TomlError('invalid value', {
			toml: toml,
			ptr: ptr,
		})
	}

	return date
}
