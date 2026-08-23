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
import type { IntegersAsBigInt, TomlValue } from './util.js'
import { parseString } from './primitive.js'
import { parseArray, parseInlineTable } from './struct.js'
import { TomlError } from './error.js'

type NumberBase = 2 | 8 | 10 | 16

function isDigit(char: number, base: NumberBase): boolean {
	return base === 16
		? (char > 0x2f && char < 0x3a) || (char > 0x40 && char < 0x47) || (char > 0x60 && char < 0x67)
		: (char > 0x2f && char < 0x30 + base)
}

/** @internal */
export function extractValue(ctx: ParseContext, end: number | undefined, integersAsBigInt: IntegersAsBigInt): TomlValue {
	let err = { toml: ctx.s, ptr: ctx.p }
	let c = ctx.s.charCodeAt(ctx.p)

	// Structs
	if (c === 0x5b /* [ */ || c === 0x7b /* { */) {
		if (!ctx.d--) throw new TomlError('document contains excessively nested structures. aborting.', ctx)

		let value = c === 0x5b /* [ */
			? parseArray(ctx, integersAsBigInt)
			: parseInlineTable(ctx, integersAsBigInt)

		ctx.d++
		return value
	}

	// Strings
	if (c === 0x22 /* " */ || c === 0x27 /* ' */) {
		return parseString(ctx)
	}

	// Booleans
	// We can fast-path because the first character is enough to know the only possible value
	if (c === 0x74 /* t */) { // Only possible valid value is `true`
		if (ctx.s.charCodeAt(++ctx.p) !== 0x72 || ctx.s.charCodeAt(++ctx.p) !== 0x75 || ctx.s.charCodeAt(++ctx.p) !== 0x65)
			throw new TomlError('invalid value', err)
		ctx.p++
		return true
	}

	if (c === 0x66 /* f */) { // Only possible valid value is `false`
		if (ctx.s.charCodeAt(++ctx.p) !== 0x61 || ctx.s.charCodeAt(++ctx.p) !== 0x6c || ctx.s.charCodeAt(++ctx.p) !== 0x73 || ctx.s.charCodeAt(++ctx.p) !== 0x65)
			throw new TomlError('invalid value', err)
		ctx.p++
		return false
	}

	if (c === 0x2b /* + */ || c === 0x2d /* - */) {
		return parseNumber(ctx, ++ctx.p, 0, 10, 0x2c - c, end, integersAsBigInt)
	}

	// FIXME: IF c is digit AND next is digit
	//          THEN IF next(2) is : -> LOCAL TIME
	//               ELSE IF next(2) is digit AND next(3) is digit AND next(4) is -
	//                 THEN DATE
	//         OTHERWISE: PARSE NUMBER
	return parseNumber(ctx, ctx.p, 0, 10, 1, end, integersAsBigInt)
}

// State:
// 0: init
// 1: integer
// 2: fractional dot
// 3: fractional
// 4: exponent letter
// 5: exponent
// -1: leading 0
// >9: underscore; see below
//     -> 12: was integer
//     -> 14: was fractional
//     -> 16: was exponent
// states 2-5, 14, 16 are ONLY permitted iif base === 10
function parseNumber(
	ctx: ParseContext,
	startPtr: number,
	state: number,
	base: NumberBase,
	sign: number,
	endChr: number | undefined,
	integersAsBigInt: IntegersAsBigInt,
) {
	let err = { toml: ctx.s, ptr: startPtr }
	let hasUnderscores = false

	for (startPtr = ctx.p; ctx.p < ctx.s.length; ctx.p++) {
		let c = ctx.s.charCodeAt(ctx.p)

		// The way the states are numbered is not random: underscores are always permitted in odd-numbered states and
		// never permitted in even-numbered ones. If we're in the leading zero state, we just don't take this branch
		// which will allow the leading zero branch to be reached with a better error message.
		if (c === 0x5f /* _ */ && state > 0) {
			if (!(state & 1)) throw new TomlError('illegal underscore', ctx)
			state += 11 // 11 is a marker that makes the state even and greater than 9
			hasUnderscores = true
		}

		// If init state, check for special values
		else if (!state && (c === 0x69 /* i */ || c === 0x6e /* n */)) return parseSpecialFloat(ctx, c, sign)

		// Also if init, check if 0
		// Leading zeroes are not allowed, so the only valid next character has to be `b`, `o`, or `x`
		else if (!state && base === 10 && c === 0x30 /* 0 */) {
			ctx.p++
			if ((c = ctx.s.charCodeAt(ctx.p++)) === 0x78 /* x */)
				return parseNumber(ctx, startPtr, 0, 16, sign, endChr, integersAsBigInt)
			if (c === 0x62 /* b */)
				return parseNumber(ctx, startPtr, 0, 2, sign, endChr, integersAsBigInt)
			if (c === 0x6f /* o */)
				return parseNumber(ctx, startPtr, 0, 8, sign, endChr, integersAsBigInt)

			ctx.p -= 2
			state = -1
		}

		// Transition to fractional part
		else if (c === 0x2e /* . */) {
			// Only base 10 numerals may have a decimal part, and we must still be parsing the integer part
			// No trailing underscore is allowed, the check also takes care of that
			if (base !== 10 || (state !== 1 && state !== -1))
				throw new TomlError('illegal decimal marker', ctx)
			state = 2
		}

		// Transition to exponent part
		// Exclude base 16 as `e` is a valid digit then
		else if (base !== 16 && (c === 0x65 /* e */ || c === 0x45 /* E */)) {
			if (base < 9 || (state !== 1 && state !== 3 && state !== -1))
				throw new TomlError('illegal exponent marker', ctx)
			state = 4
		}

		// End of value
		else if (
			// Structure end or next value delimiter
			(endChr && (c === endChr || c === 0x2c /* , */)) ||
			// Whitespace
			c === 0x20 || c === 0x9 /* \t */ || c === 0xa /* \n */ || (c === 0xd /* \r */ && ctx.s.charCodeAt(ctx.p + 1) === 0xa /* \n */) ||
			// Comment
			c === 0x23 /* # */
		) break

		// Leading zero not allowed
		else if (state < 0) {
			throw new TomlError('illegal leading zero', err)
		}

		// + and - are permitted in state 4 only (handled before entering the function for state 0)
		else if (c === 0x2b /* + */ || c === 0x2d /* - */) {
			if (state !== 4) throw new TomlError('illegal sign', ctx)
		}

		// All special cases have been handled; only digits are allowed here
		else if (!isDigit(c, base)) {
			throw new TomlError('illegal character in numeric literal', ctx)
		}

		// Clear state flags
		else if (state > 9) state -= 11
		else if (!(state & 1)) state++
	}

	// Even-numbered states absolutely require a digit next; not even end of value is permitted
	if (!(state & 1)) throw new TomlError('unfinished numeric value', err)

	let str = ctx.s.slice(startPtr, ctx.p)
	if (hasUnderscores) str = str.replace(/_/g, '')
	if (state > 1) return parseFloat(str) * sign

	let isBigInteger
	let val: number | bigint = parseInt(str, base) * sign || 0

	if ((isBigInteger = !Number.isSafeInteger(val)) && !integersAsBigInt) {
		throw new TomlError('integer value cannot be represented losslessly', err)
	}

	return isBigInteger || integersAsBigInt === true
		? BigInt(str) * BigInt(sign)
		: val
}

function parseSpecialFloat(ctx: ParseContext, c: number, sign: number) {
	let err = { toml: ctx.s, ptr: ctx.p++ }

	if (c === 0x69 /* i */) {
		if (ctx.s.charCodeAt(ctx.p++) !== 0x6e || ctx.s.charCodeAt(ctx.p++) !== 0x66)
			throw new TomlError('invalid value', err)

		return sign / 0
	}

	if (c !== 0x6e /* n */ || ctx.s.charCodeAt(ctx.p++) !== 0x61 || ctx.s.charCodeAt(ctx.p++) !== 0x6e)
		throw new TomlError('invalid value', err)

	return NaN
}
