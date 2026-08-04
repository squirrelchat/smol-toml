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
import { type IntegersAsBigInt, parseString, parseValue } from './primitive.js'
import { parseArray, parseInlineTable } from './struct.js'
import { skipVoid, skipUntil, skipComment, type TomlValue } from './util.js'
import { TomlError } from './error.js'

function sliceAndTrimEndOf(str: string, start: number, end: number): [string, number] {
	let value = str.slice(start, end)

	let commentIdx = value.indexOf('#')
	if (commentIdx > -1) {
		// The call to skipComment allows to "validate" the comment
		// (absence of control characters)
		skipComment({ s: str, p: commentIdx, d: 0 })
		value = value.slice(0, commentIdx)
	}

	return [value.trimEnd(), commentIdx]
}

/** @internal */
export function extractValue(ctx: ParseContext, end: number | undefined, integersAsBigInt: IntegersAsBigInt): TomlValue {
	let c = ctx.s.charCodeAt(ctx.p)
	if (c === 0x5b /* [ */ || c === 0x7b /* { */) {
		if (!ctx.d--) {
			throw new TomlError('document contains excessively nested structures. aborting.', {
				toml: ctx.s,
				ptr: ctx.p,
			})
		}

		let value = c === 0x5b /* [ */
			? parseArray(ctx, integersAsBigInt)
			: parseInlineTable(ctx, integersAsBigInt)

		ctx.d++
		if (end) {
			skipVoid(ctx)
			if ((c = ctx.s.charCodeAt(ctx.p)) === 0x2c /* , */) ctx.p++
			else if (c !== end) {
				throw new TomlError('expected comma or end of structure', {
					toml: ctx.s,
					ptr: ctx.p,
				})
			}
		}

		return value
	}

	if (c === 0x22 /* " */ || c === 0x27 /* ' */) {
		let parsed = parseString(ctx)
		if (end) {
			skipVoid(ctx)

			if (ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p)) !== 0x2c /* , */ && c !== end && c !== 0xa /* \n */ && 0xd /* \r */) {
				throw new TomlError('unexpected character encountered', {
					toml: ctx.s,
					ptr: ctx.p,
				})
			}

			if (c === 0x2c /* , */) ctx.p++
		}

		return parsed
	}

	let ptr = ctx.p
	skipUntil(ctx, 0x2c /* , */, end)

	let [rawValue, commentIdx] = sliceAndTrimEndOf(ctx.s, ptr, ctx.p - (ctx.s[ctx.p - 1] === ',' ? 1 : 0))
	if (!rawValue) {
		throw new TomlError('incomplete declaration: value expected', {
			toml: ctx.s,
			ptr: ptr,
		})
	}

	if (end && commentIdx > -1) {
		ctx.p = ptr + commentIdx
		skipVoid(ctx)
		if (ctx.s.charCodeAt(ctx.p) === 0x2c /* , */) ctx.p++
	}

	return parseValue(rawValue, integersAsBigInt, { toml: ctx.s, ptr })
}
