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
import { parseString } from './primitive.js'
import { extractValue } from './extract.js'
import { skipVoid, type TomlTable, type TomlValue } from './util.js'
import { TomlError } from './error.js'

/** @internal */
export function parseKey(ctx: ParseContext, end = 0x3d /* = */): string[] {
	// States:
	// 0: before first char
	// 1: parsing bare key
	// 2: after key component
	let err = { toml: ctx.s, ptr: ctx.p-- }
	let state = 0
	let parsed = []
	let sliceStart
	let c

	while (c = ctx.s.charCodeAt(++ctx.p)) {
		// End of key
		if (c === end) {
			if (!state) throw new TomlError('unexpected end of key', ctx)
			if (state === 1) parsed.push(ctx.s.slice(sliceStart, ctx.p))
			return ctx.p++, parsed
		}

		// Dotted key separator
		else if (c === 0x2e /* . */) {
			if (!state) throw new TomlError('illegal empty bare key', ctx)
			if (state === 1) parsed.push(ctx.s.slice(sliceStart, ctx.p))
			state = 0
		}

		// Quoted key
		else if (!state && (c === 0x22 /* " */ || c === 0x27 /* ' */)) {
			if (c === ctx.s.charCodeAt(ctx.p + 1) && c === ctx.s.charCodeAt(ctx.p + 2))
				throw new TomlError('illegal quoted key: multiline strings are not allowed', ctx)
			parsed.push(parseString(ctx))
			state = 2
			ctx.p--
		}

		// Whitespace; no-op in state 0 and 2, end of bare key in state 1
		else if (c === 0x20 || c === 0x9 /* \t */) {
			if (state === 1) {
				parsed.push(ctx.s.slice(sliceStart, ctx.p))
				state = 2
			}
		}

		// If state is post-key, no character is allowed; otherwise ensure it's a bare-key component
		else if (state === 2 || (c < 0x30 && c !== 0x2d /* - */) || (c > 0x39 && c < 0x41) || (c > 0x5a && c < 0x61 && c !== 0x5f /* _ */) || c > 0x7a) {
			throw new TomlError('illegal character in key', ctx)
		}

		// Illegal character
		else if (!state) {
			state = 1
			sliceStart = ctx.p
		}
	}

	throw new TomlError('incomplete key-value: cannot find end of key', err)
}

/** @internal */
export function parseInlineTable(ctx: ParseContext): TomlTable {
	let err = { toml: ctx.s, ptr: ctx.p }
	let res: TomlTable = {}
	let seen = new Set()
	let c: number

	ctx.p++
	while (ctx.p < ctx.s.length) {
		skipVoid(ctx)
		if ((c = ctx.s.charCodeAt(ctx.p)) === 0x7d /* } */) {
			ctx.p++
			return res
		}

		let k: string
		let t: any = res
		let hasOwn = false
		let err = { toml: ctx.s, ptr: ctx.p }

		let key = parseKey(ctx)
		for (let i = 0; i < key.length; i++) {
			if (i) t = hasOwn! ? t[k!] : (t[k!] = {})

			k = key[i]!
			if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== 'object' || seen.has(t[k]))) {
				throw new TomlError('trying to redefine an already defined value', err)
			}

			if (!hasOwn && k === '__proto__') {
				Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true })
			}
		}

		if (hasOwn) {
			throw new TomlError('trying to redefine an already defined value', err)
		}

		skipVoid(ctx, true, true)
		let value = extractValue(ctx, 0x7d /* } */)
		if (typeof (t[k!] = value) === 'object') seen.add(value)

		skipVoid(ctx)
		if ((c = ctx.s.charCodeAt(ctx.p++)) === 0x7d /* } */) {
			return res
		}

		if (c !== 0x2c /* , */) {
			throw new TomlError('expected comma or end of structure', { toml: ctx.s, ptr: ctx.p - 1 })
		}
	}

	throw new TomlError('unfinished table encountered', err)
}

/** @internal */
export function parseArray(ctx: ParseContext): TomlValue[] {
	let err = { toml: ctx.s, ptr: ctx.p }
	let res: TomlValue[] = []
	let c

	ctx.p++
	while (ctx.p < ctx.s.length) {
		skipVoid(ctx)
		if ((c = ctx.s.charCodeAt(ctx.p)) === 0x5d /* ] */) {
			ctx.p++
			return res
		}

		res.push(extractValue(ctx, 0x5d /* ] */))

		skipVoid(ctx)
		if ((c = ctx.s.charCodeAt(ctx.p++)) === 0x5d /* ] */) {
			return res
		}

		if (c !== 0x2c /* , */) {
			throw new TomlError('expected comma or end of structure', { toml: ctx.s, ptr: ctx.p - 1 })
		}
	}

	throw new TomlError('unfinished array encountered', err)
}
