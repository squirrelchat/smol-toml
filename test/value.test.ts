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

import { it, expect } from 'vitest'
import { parseValue } from '../src/primitive.js'
import { TomlError } from '../src/error.js'
import { TomlDate } from '../src/date.js'
import 'temporal-polyfill/global'

it('parses integers', () => {
	expect(parseValue('+99', '', 0, false, false)).toBe(99)
	expect(parseValue('42', '', 0, false, false)).toBe(42)
	expect(parseValue('0', '', 0, false, false)).toBe(0)
	expect(parseValue('-17', '', 0, false, false)).toBe(-17)
})

it('parses integers with underscores', () => {
	expect(parseValue('1_000', '', 0, false, false)).toBe(1000)
	expect(parseValue('5_349_221', '', 0, false, false)).toBe(5349221)
	expect(parseValue('53_49_221', '', 0, false, false)).toBe(5349221)
	expect(parseValue('1_2_3_4_5', '', 0, false, false)).toBe(12345)
})

it('parses hex integers', () => {
	expect(parseValue('0xDEADBEEF', '', 0, false, false)).toBe(0xDEADBEEF)
	expect(parseValue('0xdeadbeef', '', 0, false, false)).toBe(0xDEADBEEF)
	expect(parseValue('0xdead_beef', '', 0, false, false)).toBe(0xDEADBEEF)
})

it('parses octal integers', () => {
	expect(parseValue('0o01234567', '', 0, false, false)).toBe(0o01234567)
	expect(parseValue('0o0123_4567', '', 0, false, false)).toBe(0o01234567)
})


it('parses binary integers', () => {
	expect(parseValue('0b11010110', '', 0, false, false)).toBe(0b11010110)
	expect(parseValue('0b1101_0110', '', 0, false, false)).toBe(0b11010110)
})

it('rejects integers too large on number_or_error', () => {
	expect(() => parseValue('9007199254740992', '', 0, false, false)).toThrowError(TomlError)
})

it('supports integers larger than the max safe integer number when bigints are enabled', () => {
	expect(parseValue('9007199254740992', '', 0, "asNeeded", false)).toBe(9007199254740992n)
	expect(parseValue('9007199254740992', '', 0, true, false)).toBe(9007199254740992n)
})

it('supports integers larger than the Number max value when bigints are enabled', () => {
	const nineRepeat = '9'.repeat(310)
	expect(parseValue(nineRepeat, '', 0, "asNeeded", false)).toBe(BigInt(nineRepeat))
	expect(parseValue(nineRepeat, '', 0, true, false)).toBe(BigInt(nineRepeat))
})

it('supports floats larger than the max safe integer number', () => {
	expect(parseValue('9007199254740992.0', '', 0, false, false)).toBe(9007199254740992.0)
	expect(parseValue('9007199254740992.0', '', 0, "asNeeded", false)).toBe(9007199254740992.0)
	expect(parseValue('9007199254740992.0', '', 0, true, false)).toBe(9007199254740992.0)
})

it('only uses bigint for large values when bigints are enabled as needed', () => {
	expect(parseValue('10', '', 0, "asNeeded", false)).toBe(10)
})

it('interprets TOML-floats larger than the Number max value as Infinity', () => {
	let nineRepeatFloat = '9'.repeat(310) + ".0"
	expect(parseValue(nineRepeatFloat, '', 0, false, false)).toBe(Infinity)
	expect(parseValue(nineRepeatFloat, '', 0, "asNeeded", false)).toBe(Infinity)
	expect(parseValue(nineRepeatFloat, '', 0, true, false)).toBe(Infinity)
	nineRepeatFloat = '-' + nineRepeatFloat
	expect(parseValue(nineRepeatFloat, '', 0, false, false)).toBe(-Infinity)
	expect(parseValue(nineRepeatFloat, '', 0, "asNeeded", false)).toBe(-Infinity)
	expect(parseValue(nineRepeatFloat, '', 0, true, false)).toBe(-Infinity)
})

it('rejects leading zeroes', () => {
	expect(() => parseValue('0123', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('01.10', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('0_1.10', '', 0, false, false)).toThrowError(TomlError)
})

it('rejects invalid numbers', () => {
	expect(() => parseValue('Infinity', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('NaN', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('+0x01', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('-0x01', '', 0, false, false)).toThrowError(TomlError)
})

it('rejects invalid underscores', () => {
	expect(() => parseValue('_10', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('10_', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('1__0', '', 0, false, false)).toThrowError(TomlError)

	expect(() => parseValue('+_10', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('0x_10', '', 0, false, false)).toThrowError(TomlError)
})

it('parses floats', () => {
	expect(parseValue('+1.0', '', 0, false, false)).toBe(1)
	expect(parseValue('3.1415', '', 0, false, false)).toBe(3.1415)
	expect(parseValue('-0.01', '', 0, false, false)).toBe(-0.01)

	expect(parseValue('5e+22', '', 0, false, false)).toBe(5e22)
	expect(parseValue('1e06', '', 0, false, false)).toBe(1e6)
	expect(parseValue('-2E-2', '', 0, false, false)).toBe(-2e-2)

	expect(parseValue('6.626e-34', '', 0, false, false)).toBe(6.626e-34)
})

it('rejects invalid floats', () => {
	expect(() => parseValue('.7', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('7.', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('3.e+20', '', 0, false, false)).toThrowError(TomlError)
})

it('parses floats with underscores', () => {
	expect(parseValue('224_617.445_991_228', '', 0, false, false)).toBe(224617.445991228)
})

it('handles signed zero floating-point TOML values', () => {
	expect(parseValue('+0.0', '', 0, false, false)).toBe(+0)
	expect(parseValue('-0.0', '', 0, false, false)).toBe(-0)
})

it('handles signed zero integer TOML values', () => {
	expect(parseValue('+0', '', 0, false, false))
		.toBe(parseValue('-0', '', 0, false, false))
	expect(parseValue('+0', '', 0, true, false))
		.toBe(parseValue('-0', '', 0, true, false))
})

it('parses infinity', () => {
	expect(parseValue('inf', '', 0, false, false)).toBe(Infinity)
	expect(parseValue('+inf', '', 0, false, false)).toBe(Infinity)
	expect(parseValue('-inf', '', 0, false, false)).toBe(-Infinity)

	expect(() => parseValue('Inf', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('Infinity', '', 0, false, false)).toThrowError(TomlError)
})

it('parses not a number', () => {
	expect(parseValue('nan', '', 0, false, false)).toBe(NaN)
	expect(parseValue('+nan', '', 0, false, false)).toBe(NaN)
	expect(parseValue('-nan', '', 0, false, false)).toBe(NaN)

	expect(() => parseValue('NaN', '', 0, false, false)).toThrowError(TomlError)
})

it('parses booleans', () => {
	expect(parseValue('true', '', 0, false, false)).toBe(true)
	expect(parseValue('false', '', 0, false, false)).toBe(false)

	expect(() => parseValue('True', '', 0, false, false)).toThrowError(TomlError)
})

it('parses datetimes', () => {
	expect(parseValue('1979-05-27T07:32:00', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T00:32:00.999999', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999'))
	expect(parseValue('1979-05-27T07:32:00Z', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32:00-07:00', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
	expect(parseValue('1979-05-27T00:32:00.999999-07:00', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999-07:00'))
	expect(parseValue('1979-05-27T07:32', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T07:32Z', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32-07:00', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
})

it('parses datetimes with a space instead of T', () => {
	expect(parseValue('1979-05-27 07:32:00Z', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses datetimes with lowercase T', () => {
	expect(parseValue('1979-05-27t07:32:00Z', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses dates', () => {
	expect(parseValue('1979-05-27', '', 0, false, false)).toStrictEqual(new TomlDate('1979-05-27'))
})

it('parses times', () => {
	expect(parseValue('07:32:00', '', 0, false, false)).toStrictEqual(new TomlDate('07:32:00'))
	expect(parseValue('00:32:00.999999', '', 0, false, false)).toStrictEqual(new TomlDate('00:32:00.999999'))
	expect(parseValue('07:32', '', 0, false, false)).toStrictEqual(new TomlDate('07:32:00'))
})

it('rejects invalid dates', () => {
	expect(() => parseValue('07:3:00', '', 0, false, false)).toThrowError(TomlError)
	expect(() => parseValue('27-05-1979', '', 0, false, false)).toThrowError(TomlError)
})

it('handles extreme datetimes', () => {
	expect(parseValue('0001-01-01 00:00:00Z', '', 0, false, false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00Z'))
	expect(parseValue('0001-01-01 00:00:00', '', 0, false, false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01 00:00Z', '', 0, false, false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00')) // FIXME why no Z ?
	expect(parseValue('0001-01-01 00:00', '', 0, false, false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01', '', 0, false, false)).toStrictEqual(new TomlDate('0001-01-01'))

	expect(parseValue('9999-12-31 23:59:59Z', '', 0, false, false)).toStrictEqual(new TomlDate('9999-12-31 23:59:59Z'))
	expect(parseValue('9999-12-31 23:59:59', '', 0, false, false)).toStrictEqual(new TomlDate('9999-12-31 23:59:59'))
	expect(parseValue('9999-12-31', '', 0, false, false)).toStrictEqual(new TomlDate('9999-12-31'))
})

it('parses datetimes to Temporal', () => {
	expect(parseValue('1979-05-27T07:32:00', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDateTime.from('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T00:32:00.999999', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDateTime.from('1979-05-27T00:32:00.999999'))
	expect(parseValue('1979-05-27T07:32:00Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00[UTC]'))
	expect(parseValue('1979-05-27T00:32:00-07:00', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T00:32:00[-07:00]'))
	expect(parseValue('1979-05-27T00:32:00.999999-07:00', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T00:32:00.999999[-07:00]'))
	expect(parseValue('1979-05-27T07:32', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDateTime.from('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T07:32Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00[UTC]'))
	expect(parseValue('1979-05-27T00:32-07:00', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T00:32:00[-07:00]'))
})

it('parses datetimes with a space instead of T to Temporal', () => {
	expect(parseValue('1979-05-27 07:32:00Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00[UTC]'))
})

it('parses datetimes with lowercase T to Temporal', () => {
	expect(parseValue('1979-05-27t07:32:00Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00[UTC]'))
})

it('parses dates to Temporal', () => {
	expect(parseValue('1979-05-27', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDate.from('1979-05-27'))
})

it('parses times to Temporal', () => {
	expect(parseValue('07:32:00', '', 0, false, true))
		.toStrictEqual(Temporal.PlainTime.from('07:32:00'))
	expect(parseValue('00:32:00.999999', '', 0, false, true))
		.toStrictEqual(Temporal.PlainTime.from('00:32:00.999999'))
	expect(parseValue('07:32', '', 0, false, true))
		.toStrictEqual(Temporal.PlainTime.from('07:32:00'))
})

it('rejects invalid dates to Temporal', () => {
	expect(() => parseValue('07:3:00', '', 0, false, true)).toThrowError(TomlError)
	expect(() => parseValue('27-05-1979', '', 0, false, true)).toThrowError(TomlError)
})

it('handles extreme datetimes to Temporal', () => {
	expect(parseValue('0001-01-01 00:00:00Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('0001-01-01 00:00:00[UTC]'))
	expect(parseValue('0001-01-01 00:00:00', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDateTime.from('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01 00:00Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('0001-01-01 00:00:00[UTC]'))
	expect(parseValue('0001-01-01 00:00', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDateTime.from('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDate.from('0001-01-01'))

	expect(parseValue('9999-12-31 23:59:59Z', '', 0, false, true))
		.toStrictEqual(Temporal.ZonedDateTime.from('9999-12-31 23:59:59[UTC]'))
	expect(parseValue('9999-12-31 23:59:59', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDateTime.from('9999-12-31 23:59:59'))
	expect(parseValue('9999-12-31', '', 0, false, true))
		.toStrictEqual(Temporal.PlainDate.from('9999-12-31'))
})
