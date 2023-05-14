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
import TomlError from '../src/error.js'
import TomlDate from '../src/date.js'

it('parses integers', () => {
	expect(parseValue('+99', '', 0)).toBe(99)
	expect(parseValue('42', '', 0)).toBe(42)
	expect(parseValue('0', '', 0)).toBe(0)
	expect(parseValue('-17', '', 0)).toBe(-17)
})

it('parses integers with underscores', () => {
	expect(parseValue('1_000', '', 0)).toBe(1000)
	expect(parseValue('5_349_221', '', 0)).toBe(5349221)
	expect(parseValue('53_49_221', '', 0)).toBe(5349221)
	expect(parseValue('1_2_3_4_5', '', 0)).toBe(12345)
})

it('parses hex integers', () => {
	expect(parseValue('0xDEADBEEF', '', 0)).toBe(0xDEADBEEF)
	expect(parseValue('0xdeadbeef', '', 0)).toBe(0xDEADBEEF)
	expect(parseValue('0xdead_beef', '', 0)).toBe(0xDEADBEEF)
})

it('parses octal integers', () => {
	expect(parseValue('0o01234567', '', 0)).toBe(0o01234567)
	expect(parseValue('0o0123_4567', '', 0)).toBe(0o01234567)
})


it('parses binary integers', () => {
	expect(parseValue('0b11010110', '', 0)).toBe(0b11010110)
	expect(parseValue('0b1101_0110', '', 0)).toBe(0b11010110)
})

it('rejects numbers too large', () => {
	expect(() => parseValue('9007199254740992', '', 0)).toThrowError(TomlError)
})

it('rejects leading zeroes', () => {
	expect(() => parseValue('0123', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('01.10', '', 0)).toThrowError(TomlError)
})

it('rejects invalid numbers', () => {
	expect(() => parseValue('Infinity', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('NaN', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('+0x01', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('-0x01', '', 0)).toThrowError(TomlError)
})

it('parses floats', () => {
	expect(parseValue('+1.0', '', 0)).toBe(1)
	expect(parseValue('3.1415', '', 0)).toBe(3.1415)
	expect(parseValue('-0.01', '', 0)).toBe(-0.01)

	expect(parseValue('5e+22', '', 0)).toBe(5e22)
	expect(parseValue('1e06', '', 0)).toBe(1e6)
	expect(parseValue('-2E-2', '', 0)).toBe(-2e-2)

	expect(parseValue('6.626e-34', '', 0)).toBe(6.626e-34)
})

it('rejects invalid floats', () => {
	expect(() => parseValue('.7', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('7.', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('3.e+20', '', 0)).toThrowError(TomlError)
})

it('parses floats with underscores', () => {
	expect(parseValue('224_617.445_991_228', '', 0)).toBe(224617.445991228)
})

it('handles +0.0 and -0.0', () => {
	expect(parseValue('+0.0', '', 0)).toBe(+0)
	expect(parseValue('-0.0', '', 0)).toBe(-0)
})

it('parses infinity', () => {
	expect(parseValue('inf', '', 0)).toBe(Infinity)
	expect(parseValue('+inf', '', 0)).toBe(Infinity)
	expect(parseValue('-inf', '', 0)).toBe(-Infinity)

	expect(() => parseValue('Inf', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('Infinity', '', 0)).toThrowError(TomlError)
})

it('parses not a number', () => {
	expect(parseValue('nan', '', 0)).toBe(NaN)
	expect(parseValue('+nan', '', 0)).toBe(NaN)
	expect(parseValue('-nan', '', 0)).toBe(NaN)

	expect(() => parseValue('NaN', '', 0)).toThrowError(TomlError)
})

it('parses booleans', () => {
	expect(parseValue('true', '', 0)).toBe(true)
	expect(parseValue('false', '', 0)).toBe(false)

	expect(() => parseValue('True', '', 0)).toThrowError(TomlError)
})

it('parses datetimes', () => {
	expect(parseValue('1979-05-27T07:32:00', '', 0)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T00:32:00.999999', '', 0)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999'))
	expect(parseValue('1979-05-27T07:32:00Z', '', 0)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32:00-07:00', '', 0)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
	expect(parseValue('1979-05-27T00:32:00.999999-07:00', '', 0)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999-07:00'))
})

it('parses datetimes with a space instead of T', () => {
	expect(parseValue('1979-05-27 07:32:00Z', '', 0)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses dates', () => {
	expect(parseValue('1979-05-27', '', 0)).toStrictEqual(new TomlDate('1979-05-27'))
})

it('parses times', () => {
	expect(parseValue('07:32:00', '', 0)).toStrictEqual(new TomlDate('07:32:00'))
	expect(parseValue('00:32:00.999999', '', 0)).toStrictEqual(new TomlDate('00:32:00.999999'))
})

it('rejects invalid dates', () => {
	expect(() => parseValue('07:3:00', '', 0)).toThrowError(TomlError)
	expect(() => parseValue('27-05-1979', '', 0)).toThrowError(TomlError)
})
