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
import type { IntegersAsBigInt } from '../src/util.ts'
import { parseValue as _parseValue } from '../src/primitive.ts'
import { TomlError } from '../src/error.ts'
import { TomlDate } from '../src/date.ts'

function parseValue(str: string, iab: IntegersAsBigInt) {
	return _parseValue({ s: str, p: 0, d: 0 }, iab, undefined)
}

it('parses integers', () => {
	expect(parseValue('+99', false)).toBe(99)
	expect(parseValue('42', false)).toBe(42)
	expect(parseValue('0', false)).toBe(0)
	expect(parseValue('-17', false)).toBe(-17)
})

it('parses integers with underscores', () => {
	expect(parseValue('1_000', false)).toBe(1000)
	expect(parseValue('5_349_221', false)).toBe(5349221)
	expect(parseValue('53_49_221', false)).toBe(5349221)
	expect(parseValue('1_2_3_4_5', false)).toBe(12345)
})

it('parses hex integers', () => {
	expect(parseValue('0xDEADBEEF', false)).toBe(0xdeadbeef)
	expect(parseValue('0xdeadbeef', false)).toBe(0xdeadbeef)
	expect(parseValue('0xdead_beef', false)).toBe(0xdeadbeef)
})

it('parses octal integers', () => {
	expect(parseValue('0o01234567', false)).toBe(0o01234567)
	expect(parseValue('0o0123_4567', false)).toBe(0o01234567)
})

it('parses binary integers', () => {
	expect(parseValue('0b11010110', false)).toBe(0b11010110)
	expect(parseValue('0b1101_0110', false)).toBe(0b11010110)
})

it('rejects integers too large on number_or_error', () => {
	expect(() => parseValue('9007199254740992', false)).toThrow(TomlError)
})

it('supports integers larger than the max safe integer number when bigints are enabled', () => {
	expect(parseValue('9007199254740992', 'asNeeded')).toBe(9007199254740992n)
	expect(parseValue('9007199254740992', true)).toBe(9007199254740992n)
})

it('supports integers larger than the Number max value when bigints are enabled', () => {
	const nineRepeat = '9'.repeat(310)
	expect(parseValue(nineRepeat, 'asNeeded')).toBe(BigInt(nineRepeat))
	expect(parseValue(nineRepeat, true)).toBe(BigInt(nineRepeat))
})

it('supports floats larger than the max safe integer number', () => {
	expect(parseValue('9007199254740992.0', false)).toBe(9007199254740992.0)
	expect(parseValue('9007199254740992.0', 'asNeeded')).toBe(9007199254740992.0)
	expect(parseValue('9007199254740992.0', true)).toBe(9007199254740992.0)
})

it('only uses bigint for large values when bigints are enabled as needed', () => {
	expect(parseValue('10', 'asNeeded')).toBe(10)
})

it('interprets TOML-floats larger than the Number max value as Infinity', () => {
	let nineRepeatFloat = '9'.repeat(310) + '.0'
	expect(parseValue(nineRepeatFloat, false)).toBe(Infinity)
	expect(parseValue(nineRepeatFloat, 'asNeeded')).toBe(Infinity)
	expect(parseValue(nineRepeatFloat, true)).toBe(Infinity)
	nineRepeatFloat = '-' + nineRepeatFloat
	expect(parseValue(nineRepeatFloat, false)).toBe(-Infinity)
	expect(parseValue(nineRepeatFloat, 'asNeeded')).toBe(-Infinity)
	expect(parseValue(nineRepeatFloat, true)).toBe(-Infinity)
})

it('rejects leading zeroes', () => {
	expect(() => parseValue('0123', false)).toThrow(TomlError)
	expect(() => parseValue('01.10', false)).toThrow(TomlError)
	expect(() => parseValue('0_1.10', false)).toThrow(TomlError)
})

it('rejects invalid underscores', () => {
	expect(() => parseValue('_10', false)).toThrow(TomlError)
	expect(() => parseValue('10_', false)).toThrow(TomlError)
	expect(() => parseValue('1__0', false)).toThrow(TomlError)

	expect(() => parseValue('+_10', false)).toThrow(TomlError)
	expect(() => parseValue('0x_10', false)).toThrow(TomlError)
})

it('parses floats', () => {
	expect(parseValue('+1.0', false)).toBe(1)
	expect(parseValue('3.1415', false)).toBe(3.1415)
	expect(parseValue('-0.01', false)).toBe(-0.01)

	expect(parseValue('5e+22', false)).toBe(5e22)
	expect(parseValue('1e06', false)).toBe(1e6)
	expect(parseValue('-2E-2', false)).toBe(-2e-2)

	expect(parseValue('6.626e-34', false)).toBe(6.626e-34)
})

it('rejects invalid floats', () => {
	expect(() => parseValue('.7', false)).toThrow(TomlError)
	expect(() => parseValue('7.', false)).toThrow(TomlError)
	expect(() => parseValue('3.e+20', false)).toThrow(TomlError)
})

it('parses floats with underscores', () => {
	expect(parseValue('224_617.445_991_228', false)).toBe(224617.445991228)
})

it('handles signed zero floating-point TOML values', () => {
	expect(parseValue('+0.0', false)).toBe(+0)
	expect(parseValue('-0.0', false)).toBe(-0)
})

it('handles signed zero integer TOML values', () => {
	expect(parseValue('+0', false)).toBe(parseValue('-0', false))
	expect(parseValue('+0', true)).toBe(parseValue('-0', true))
})

it('parses infinity', () => {
	expect(parseValue('inf', false)).toBe(Infinity)
	expect(parseValue('+inf', false)).toBe(Infinity)
	expect(parseValue('-inf', false)).toBe(-Infinity)

	expect(() => parseValue('Inf', false)).toThrow(TomlError)
	expect(() => parseValue('Infinity', false)).toThrow(TomlError)
})

it('parses not a number', () => {
	expect(parseValue('nan', false)).toBe(NaN)
	expect(parseValue('+nan', false)).toBe(NaN)
	expect(parseValue('-nan', false)).toBe(NaN)

	expect(() => parseValue('NaN', false)).toThrow(TomlError)
})

it('parses datetimes', () => {
	expect(parseValue('1979-05-27T07:32:00', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T00:32:00.999999', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999'))
	expect(parseValue('1979-05-27T07:32:00Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32:00-07:00', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
	expect(parseValue('1979-05-27T00:32:00.999999-07:00', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999-07:00'))
	expect(parseValue('1979-05-27T07:32', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T07:32Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32-07:00', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
})

it('parses datetimes with a space instead of T', () => {
	expect(parseValue('1979-05-27 07:32:00Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses datetimes with lowercase T', () => {
	expect(parseValue('1979-05-27t07:32:00Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses dates', () => {
	expect(parseValue('1979-05-27', false)).toStrictEqual(new TomlDate('1979-05-27'))
})

it('parses times', () => {
	expect(parseValue('07:32:00', false)).toStrictEqual(new TomlDate('07:32:00'))
	expect(parseValue('00:32:00.999999', false)).toStrictEqual(new TomlDate('00:32:00.999999'))
	expect(parseValue('07:32', false)).toStrictEqual(new TomlDate('07:32:00'))
})

it('rejects invalid dates', () => {
	expect(() => parseValue('07:3:00', false)).toThrow(TomlError)
	expect(() => parseValue('27-05-1979', false)).toThrow(TomlError)
})

it('handles extreme datetimes', () => {
	expect(parseValue('0001-01-01 00:00:00Z', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00Z'))
	expect(parseValue('0001-01-01 00:00:00', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01 00:00Z', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01 00:00', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01', false)).toStrictEqual(new TomlDate('0001-01-01'))

	expect(parseValue('9999-12-31 23:59:59Z', false)).toStrictEqual(new TomlDate('9999-12-31 23:59:59Z'))
	expect(parseValue('9999-12-31 23:59:59', false)).toStrictEqual(new TomlDate('9999-12-31 23:59:59'))
	expect(parseValue('9999-12-31', false)).toStrictEqual(new TomlDate('9999-12-31'))
})
