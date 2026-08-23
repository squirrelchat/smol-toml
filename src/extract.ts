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
import { TomlError, TomlErrorOptions } from './error.js'
import { TomlDate } from './date.ts';

type NumberBase = 2 | 8 | 10 | 16

function isDigit(char: number, base: NumberBase = 10): boolean {
	return base === 16
		? (char > 0x2f && char < 0x3a) || (char > 0x40 && char < 0x47) || (char > 0x60 && char < 0x67)
		: (char > 0x2f && char < 0x30 + base)
}

function isEndOfValue(char: number, delim: number | undefined) {
	return !char ||
		// Whitespace -- we're permissive on `\r` for performance; it'll be dealt with later anyway
		char === 0x20 || char === 0x9 /* \t */ || char === 0xa /* \n */ || char === 0xd /* \r */ ||
		// Structure end or next value delimiter
		(delim && (char === delim || char === 0x2c /* , */)) ||
		// Comment
		char === 0x23 /* # */
}

/** @internal */
export function extractValue(ctx: ParseContext, end: number | undefined): TomlValue {
	let err = { toml: ctx.s, ptr: ctx.p }
	let c = ctx.s.charCodeAt(ctx.p)

	// Structs
	if (c === 0x5b /* [ */ || c === 0x7b /* { */) {
		if (!ctx.d--) throw new TomlError('document contains excessively nested structures. aborting.', ctx)

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
			throw new TomlError('invalid value', err)
		return ctx.p++, true
	}

	if (c === 0x66 /* f */) { // Only possible valid value is `false`
		if (ctx.s.charCodeAt(++ctx.p) !== 0x61 || ctx.s.charCodeAt(++ctx.p) !== 0x6c || ctx.s.charCodeAt(++ctx.p) !== 0x73 || ctx.s.charCodeAt(++ctx.p) !== 0x65)
			throw new TomlError('invalid value', err)
		return ctx.p++, false
	}

	if (c === 0x2b /* + */ || c === 0x2d /* - */) {
		return parseNumber(ctx, ctx.s.charCodeAt(++ctx.p), ctx.p - 1, 10, 0x2c - c, end)
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

	return parseNumber(ctx, c, ctx.p, 10, 0, end)
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
	c: number,
	startPtr: number,
	base: NumberBase,
	sign: number,
	endChr: number | undefined,
): number | bigint {
	let state = 0
	let err = { toml: ctx.s, ptr: startPtr }
	let hasUnderscores = false

	for (; ctx.p < ctx.s.length && !isEndOfValue(c, endChr); c = ctx.s.charCodeAt(++ctx.p)) {
		if (!state) {
			// (+/-)inf
			if (c === 0x69 /* i */) {
				if (ctx.s.charCodeAt(++ctx.p) !== 0x6e || ctx.s.charCodeAt(++ctx.p) !== 0x66)
					throw new TomlError('invalid value', err)
				return ctx.p++, (sign || 1) / 0
			}

			// (+/-)nan
			if (c === 0x6e /* n */) {
				if (ctx.s.charCodeAt(++ctx.p) !== 0x61 || ctx.s.charCodeAt(++ctx.p) !== 0x6e)
					throw new TomlError('invalid value', err)
				return ctx.p++, NaN
			}

			// Leading zero
			// Only allowed cases: `0<EOV>`, `0.(...)`, `0e(...)`, `0x(...)`, `0b(...)`, `0o(...)`
			// FWIW, `0e(...)` is a stupid case, but it's not banned per-se so we have to parse it
			if (base === 10 && c === 0x30 /* 0 */) {
				c = ctx.s.charCodeAt(++ctx.p)
				if (isEndOfValue(c, endChr)) return ctx.bi === true ? 0n : 0 // note: conveniently deals with `-0`

				if (!sign) {
					let _base = 0 as NumberBase | 0
					if (c === 0x78 /* x */) _base = 16
					else if (c === 0x62 /* b */) _base = 2
					else if (c === 0x6f /* o */) _base = 8
					if (_base) return parseNumber(ctx, ctx.s.charCodeAt(++ctx.p), startPtr, _base, sign, endChr)
				}

				if (c === 0x2e /* . */) state = 2
				else if (c === 0x65 /* e */ || c === 0x45 /* E */) state = 4
				else throw new TomlError('illegal leading zero', err)
				continue
			}
		}

		// The way the states are numbered is not random: underscores are always permitted in odd-numbered states and
		// never permitted in even-numbered ones.
		if (c === 0x5f /* _ */) {
			if (!(state & 1)) throw new TomlError('illegal underscore', ctx)
			state += 11 // 11 is a marker that makes the state even and greater than 9; see the numbering + rationale above
			hasUnderscores = true
		}

		// Transition to fractional part. Only base 10 numerals may have a decimal part.
		else if (base === 10 && state === 1 && c === 0x2e /* . */) {
			state = 2
		}

		// Transition to exponent part. Explicitly check base, `E` is a valid hex digit.
		else if (base === 10 && (state === 1 || state === 3) && (c === 0x65 /* e */ || c === 0x45 /* E */)) {
			state = 4
		}

		// + and - are permitted in state 4 only (handled before entering the function for state 0)
		else if (c === 0x2b /* + */ || c === 0x2d /* - */) {
			if (state !== 4) throw new TomlError('illegal sign', ctx)
		}

		// All special cases have been handled; only digits are allowed here
		else if (!isDigit(c, base)) {
			throw new TomlError(`illegal character in base ${base} numeric literal`, ctx)
		}

		// Clear state flags
		else if (state > 9) state -= 11
		else if (!(state & 1)) state++
	}

	// Even-numbered states absolutely require a digit next; not even end of value is permitted
	if (!(state & 1)) throw new TomlError('unfinished numeric value', err)

	let str = ctx.s.slice(startPtr, ctx.p)
	if (hasUnderscores) str = str.replaceAll('_', '') // perf: replaceAll 1.25x faster than replace with a regex
	if (state > 1) return parseFloat(str)

	if (ctx.bi !== true) int: {
		// Don't need to handle `-0`; return 0 is always inlined
		let val = parseInt(base !== 10 ? str.slice(2) : str, base)
		if (!Number.isSafeInteger(val)) {
			if (ctx.bi) break int
			throw new TomlError('integer value cannot be represented losslessly', err)
		}

		return val
	}

	return BigInt(str)
}

function parseDate(ctx: ParseContext, c: number, endChr: number | undefined) {
	let start = ctx.p++, err = { toml: ctx.s, ptr: start }

	if (
		!isDigit(c) ||
		!isDigit(ctx.s.charCodeAt(ctx.p++)) ||
		!isDigit(ctx.s.charCodeAt(ctx.p++)) ||
		!isDigit(ctx.s.charCodeAt(ctx.p++))
	) {
		return parseNumber(ctx, c, ctx.p = start, 10, 0, endChr)
	}

	if (!(c = ctx.s.charCodeAt(ctx.p += 6)) || ((c !== 0x20 || !isDigit(ctx.s.charCodeAt(ctx.p + 1))) && c !== 0x54 /* T */ && c !== 0x74 /* t */)) {
		let t = ctx.s.slice(start, ctx.p)
		return ctx.ld ? tomlDateFrom(t, err) : temporalSafeFrom(Temporal.PlainDate, t, err)
	}

	if (ctx.s.charCodeAt(ctx.p += 3) !== 0x3a /* : */)
		throw new TomlError('invalid date-time: time part is malformed', err)

	if (ctx.s.charCodeAt(ctx.p += 3) === 0x3a /* : */) ctx.p += 3
	if (ctx.s.charCodeAt(ctx.p) === 0x2e /* . */)
		while (isDigit(ctx.s.charCodeAt(++ctx.p))) ;

	if (c = ctx.s.charCodeAt(ctx.p)) {
		if (c === 0x5a /* Z */ || c === 0x7a /* z */) {
			let t = ctx.s.slice(start, ctx.p++)
			return ctx.ld ? tomlDateFrom(t, err) : temporalSafeFrom(Temporal.ZonedDateTime, t + '[UTC]', err)
		}

		if (c === 0x2b /* + */ || c === 0x2d /* - */) {
			// Temporal's ZonedDateTime is weird asf when it comes to dealing with traditional offsets...
			// It's 1.2x faster to allocate a new string to pass to ZDT than use Instant.toZonedDateTimeISO
			let t = ctx.s.slice(start, ctx.p += 6)
			return ctx.ld ? tomlDateFrom(t, err) : temporalSafeFrom(Temporal.ZonedDateTime, t + '[' + ctx.s.slice(ctx.p - 6, ctx.p) + ']', err)
		}
	}

	let t = ctx.s.slice(start, ctx.p)
	return ctx.ld ? tomlDateFrom(t, err) : temporalSafeFrom(Temporal.PlainDateTime, t, err)
}

function parseTime(ctx: ParseContext, c: number, endChr: number | undefined) {
	let err = { toml: ctx.s, ptr: ctx.p }

	if (!isDigit(c) || !isDigit(ctx.s.charCodeAt(++ctx.p))) {
		return parseNumber(ctx, c, --ctx.p, 10, 0, endChr)
	}

	if (ctx.s.charCodeAt(ctx.p += 4) === 0x3a /* : */) ctx.p += 3
	if (ctx.s.charCodeAt(ctx.p) === 0x2e /* . */)
		while (isDigit(ctx.s.charCodeAt(++ctx.p))) ;

	let t = ctx.s.slice(err.ptr, ctx.p)
	return ctx.ld ? tomlDateFrom(t, err) : temporalSafeFrom(Temporal.PlainTime, t, err)
}

function tomlDateFrom(str: string, err: TomlErrorOptions) {
	let date = new TomlDate(str)
	if (!date.isValid()) throw new TomlError('invalid date', err)
	return date
}

function temporalSafeFrom(t: AnyTemporalDateTimeCtor, str: string, err: TomlErrorOptions) {
	try {
		return t.from(str)
	} catch (e) {
		throw new TomlError((e instanceof Error ? e.message : e?.toString()) + ` (while parsing ${str})`, err)
	}
}
