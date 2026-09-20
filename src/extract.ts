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
import type { AnyTemporalDateTimeCtor, TomlValue } from './util.js'
import { parseString } from './primitive.js'
import { parseArray, parseInlineTable } from './struct.js'
import { TomlError } from './error.js'
import { TomlDate } from './date.ts';

type NumberBase = 2 | 8 | 10 | 16

function isDigit(char: number, base: NumberBase = 10): boolean {
	return base === 16
		? (char > 0x2f && char < 0x3a) || (char > 0x40 && char < 0x47) || (char > 0x60 && char < 0x67)
		: (char > 0x2f && char < 0x30 + base)
}

function isEndOfValue(char: number, delim: number | undefined) {
	// Whitespace -- we're permissive on `\r` for performance; it'll be dealt with later anyway
	return char === 0x20 || char === 0x9 /* \t */ || char === 0xa /* \n */ || char === 0xd /* \r */ ||
		// Structure end or next value delimiter
		(delim && (char === delim || char === 0x2c /* , */)) ||
		// Comment
		char === 0x23 /* # */
}

/** @internal */
export function extractValue(ctx: ParseContext, end: number | undefined): TomlValue {
	let errPtr = ctx.p
	let c = ctx.s.charCodeAt(ctx.p)

	// Structs
	if (c === 0x5b /* [ */ || c === 0x7b /* { */) {
		ctx.d-- || TomlError.x('document contains excessively nested structures. aborting.', ctx)

		let value = c === 0x5b /* [ */
			? parseArray(ctx)
			: parseInlineTable(ctx)

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
			TomlError.x('invalid value', ctx, errPtr)
		return ctx.p++, true
	}

	if (c === 0x66 /* f */) { // Only possible valid value is `false`
		if (ctx.s.charCodeAt(++ctx.p) !== 0x61 || ctx.s.charCodeAt(++ctx.p) !== 0x6c || ctx.s.charCodeAt(++ctx.p) !== 0x73 || ctx.s.charCodeAt(++ctx.p) !== 0x65)
			TomlError.x('invalid value', ctx, errPtr)
		return ctx.p++, false
	}

	if (c === 0x2b /* + */ || c === 0x2d /* - */) {
		return parseNumber(ctx, ctx.p, ctx.s.charCodeAt(++ctx.p), 0x2c - c, end)
	}

	// Rough heuristic, but `parseDate` falls back to number parsing if it's a false positive.
	// e.g.: `a = 1\n-------------- = 1` would match this heuristic, but gracefully fallback to numbers.
	if (ctx.s.charCodeAt(ctx.p + 4) === 0x2d /* - */ && ctx.s.charCodeAt(ctx.p + 7) === 0x2d /* - */) {
		return parseDate(ctx, c, end)
	}

	// Same logic as above; `parseTime` falls back to number parsing if it's a false positive.
	if (ctx.s.charCodeAt(ctx.p + 2) === 0x3a /* : */) {
		return parseTime(ctx, c, end)
	}

	return parseNumber(ctx, ctx.p, c, 0, end)
}

// State:
// 0: init
// 1: integer
// 2: fractional dot
// 3: fractional
// 4: exponent letter
// 5: exponent
// >9: underscore; see below
//     -> 12: was integer
//     -> 14: was fractional
//     -> 16: was exponent
// states 2-5, 14, 16 are ONLY permitted iif base === 10
function parseNumber(
	ctx: ParseContext,
	startPtr: number,
	startChr: number,
	sign: number,
	endChr: number | undefined,
): number | bigint {
	let c = startChr
	let state = 0
	let hasUnderscores = false

	// (+/-)inf
	if (c === 0x69 /* i */) {
		if (ctx.s.charCodeAt(++ctx.p) !== 0x6e || ctx.s.charCodeAt(++ctx.p) !== 0x66)
			TomlError.x('invalid value', ctx, startPtr)
		return ctx.p++, (sign || 1) / 0
	}

	// (+/-)nan
	if (c === 0x6e /* n */) {
		if (ctx.s.charCodeAt(++ctx.p) !== 0x61 || ctx.s.charCodeAt(++ctx.p) !== 0x6e)
			TomlError.x('invalid value', ctx, startPtr)
		return ctx.p++, NaN
	}

	// Leading zero
	// Only allowed cases: `0<EOV>`, `0.(...)`, `0e(...)`, `0x(...)`, `0b(...)`, `0o(...)`
	// FWIW, `0e(...)` is a stupid case, but it's not banned per-se so we have to parse it
	if (c === 0x30 /* 0 */) {
		if (++ctx.p >= ctx.s.length || isEndOfValue(c = ctx.s.charCodeAt(ctx.p), endChr)) return ctx.bi === true ? 0n : 0 // note: conveniently deals with `-0`

		if (!sign) {
			if (c === 0x78 /* x */) return parseIntegerBaseN(ctx, startPtr, 16, endChr)
			else if (c === 0x62 /* b */) return parseIntegerBaseN(ctx, startPtr, 2, endChr)
			else if (c === 0x6f /* o */) return parseIntegerBaseN(ctx, startPtr, 8, endChr)
		}

		if (c === 0x2e /* . */) state = 2
		else if (c === 0x65 /* e */ || c === 0x45 /* E */) state = 4
		else TomlError.x('illegal leading zero', ctx, startPtr)
	}

	// If the 1st char is not a digit by now, then it's not a valid TOML value at all
	else if (!isDigit(c)) TomlError.x('invalid value', ctx, startPtr)

	while (++ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p), !isEndOfValue(c, endChr))) {
		if (!state) state = 1 // Detects single-digit numbers we can use a fast parse path for

		// The way the states are numbered is not random: underscores are always permitted in odd-numbered states and
		// never permitted in even-numbered ones.
		if (c === 0x5f /* _ */) {
			if (!(state & 1)) TomlError.x('illegal underscore', ctx)
			state += 11 // 11 is a marker that makes the state even and greater than 9; see the numbering + rationale above
			hasUnderscores = true
		}

		// Transition to fractional part.
		else if (state === 1 && c === 0x2e /* . */) state = 2

		// Transition to exponent part.
		else if ((state === 1 || state === 3) && (c === 0x65 /* e */ || c === 0x45 /* E */)) state = 4

		// + and - are permitted in state 4 only (handled before entering the function for state 0)
		else if (state === 4 && (c === 0x2b /* + */ || c === 0x2d /* - */)) { /* no-op */ }

		// All special cases have been handled; only digits are allowed here
		else if (!isDigit(c)) TomlError.x(`illegal character in numeric literal`, ctx)

		// Clear state flags
		else if (state > 9) state -= 11
		else if (!(state & 1)) state++
	}

	// Single-char number; we can fast-path these very easily.
	if (!state) {
		let val = startChr - 0x30 /* 0 */
		return ctx.bi === true ? BigInt(val) : val
	}

	// Even-numbered states absolutely require a digit next; not even end of value is permitted
	if (!(state & 1)) TomlError.x('unfinished numeric value', ctx, startPtr)

	let str = ctx.s.slice(startPtr, ctx.p)
	if (hasUnderscores) str = str.replaceAll('_', '') // perf: replaceAll 1.25x faster than replace with a regex

	return state > 1
		? parseFloat(str)
		: parseInteger(ctx, str, 10, startPtr)
}

function parseIntegerBaseN(
	ctx: ParseContext,
	startPtr: number,
	base: NumberBase,
	endChr: number | undefined,
) {
	let c, underscore = 1
	while (++ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p), !isEndOfValue(c, endChr))) {
		if (c === 0x5f /* _ */) {
			if (underscore & 1) TomlError.x('illegal underscore', ctx)
			underscore = 3
		}

		// We only need to check if the number is a valid digit, nothing else is permitted
		else if (!isDigit(c, base)) TomlError.x(`illegal character in numeric literal`, ctx)

		// Clear underscore flag
		else if (underscore & 1) underscore--
	}

	// Trailing underscore is not allowed
	if (underscore & 1) TomlError.x('unfinished numeric value', ctx)

	let str = ctx.s.slice(startPtr + 2, ctx.p)
	if (underscore) str = str.replaceAll('_', '') // perf: replaceAll 1.25x faster than replace with a regex

	return parseInteger(ctx, str, base, startPtr)
}

function parseInteger(ctx: ParseContext, str: string, base: NumberBase, startPtr: number) {
	if (ctx.bi !== true) int: {
		let val = parseInt(str, base)
		if (!Number.isSafeInteger(val)) {
			if (ctx.bi) break int
			TomlError.x('integer value cannot be represented losslessly', ctx, startPtr)
		}

		return val
	}

	return base === 10 ? BigInt(str) : BigInt((base === 2 ? '0b' : base === 8 ? '0o' : '0x') + str)
}

function parseDate(ctx: ParseContext, c: number, endChr: number | undefined) {
	let startPtr = ctx.p++

	if (
		!isDigit(c) ||
		!isDigit(ctx.s.charCodeAt(ctx.p++)) ||
		!isDigit(ctx.s.charCodeAt(ctx.p++)) ||
		!isDigit(ctx.s.charCodeAt(ctx.p++))
	) {
		return parseNumber(ctx, ctx.p = startPtr, c, 0, endChr)
	}

	if (!(c = ctx.s.charCodeAt(ctx.p += 6)) || ((c !== 0x20 || !isDigit(ctx.s.charCodeAt(ctx.p + 1))) && c !== 0x54 /* T */ && c !== 0x74 /* t */)) {
		let t = ctx.s.slice(startPtr, ctx.p)
		return ctx.ld ? tomlDateFrom(ctx, t, startPtr) : temporalSafeFrom(ctx, Temporal.PlainDate, t, startPtr)
	}

	if (ctx.s.charCodeAt(ctx.p += 3) !== 0x3a /* : */)
		TomlError.x('invalid date-time: time part is malformed', ctx, startPtr)

	if (ctx.s.charCodeAt(ctx.p += 3) === 0x3a /* : */) ctx.p += 3
	if (ctx.s.charCodeAt(ctx.p) === 0x2e /* . */)
		while (isDigit(ctx.s.charCodeAt(++ctx.p))) ;

	if (c = ctx.s.charCodeAt(ctx.p)) {
		if (c === 0x5a /* Z */ || c === 0x7a /* z */) {
			let t = ctx.s.slice(startPtr, ctx.p++)
			return ctx.ld ? tomlDateFrom(ctx, t, startPtr) : temporalSafeFrom(ctx, Temporal.ZonedDateTime, t + '[+00:00]', startPtr)
		}

		if (c === 0x2b /* + */ || c === 0x2d /* - */) {
			// Temporal's ZonedDateTime is weird asf when it comes to dealing with traditional offsets...
			// It's 1.2x faster to allocate a new string to pass to ZDT than use Instant.toZonedDateTimeISO
			let t = ctx.s.slice(startPtr, ctx.p += 6)
			return ctx.ld ? tomlDateFrom(ctx, t, startPtr) : temporalSafeFrom(ctx, Temporal.ZonedDateTime, t + '[' + ctx.s.slice(ctx.p - 6, ctx.p) + ']', startPtr)
		}
	}

	let t = ctx.s.slice(startPtr, ctx.p)
	return ctx.ld ? tomlDateFrom(ctx, t, startPtr) : temporalSafeFrom(ctx, Temporal.PlainDateTime, t, startPtr)
}

function parseTime(ctx: ParseContext, c: number, endChr: number | undefined) {
	let start = ctx.p

	if (!isDigit(c) || !isDigit(ctx.s.charCodeAt(++ctx.p))) {
		return parseNumber(ctx, --ctx.p, c, 0, endChr)
	}

	if (ctx.s.charCodeAt(ctx.p += 4) === 0x3a /* : */) ctx.p += 3
	if (ctx.s.charCodeAt(ctx.p) === 0x2e /* . */)
		while (isDigit(ctx.s.charCodeAt(++ctx.p))) ;

	let t = ctx.s.slice(start, ctx.p)
	return ctx.ld ? tomlDateFrom(ctx, t, start) : temporalSafeFrom(ctx, Temporal.PlainTime, t, start)
}

function tomlDateFrom(ctx: ParseContext, str: string, errPtr: number) {
	let date = new TomlDate(str)
	if (!date.isValid()) TomlError.x('invalid date', ctx, errPtr)
	return date
}

function temporalSafeFrom(ctx: ParseContext, t: AnyTemporalDateTimeCtor, str: string, errPtr: number) {
	try {
		return t.from(str)
	} catch (e) {
		TomlError.x(e instanceof Error ? e.message : e?.toString()!, ctx, errPtr)
	}
}
