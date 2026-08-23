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
import { extractValue } from '../src/extract.ts'
import { TomlError } from '../src/error.ts'

it('parses booleans', () => {
	expect(extractValue({ s: 'true', p: 0, d: 0 }, undefined, false)).toBe(true)
	expect(extractValue({ s: 'false', p: 0, d: 0 }, undefined, false)).toBe(false)

	expect(() => extractValue({ s: 'True', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('parses integers', () => {
	expect(extractValue({ s: '+99', p: 0, d: 0 }, undefined, false)).toBe(99)
	expect(extractValue({ s: '42', p: 0, d: 0 }, undefined, false)).toBe(42)
	expect(extractValue({ s: '0', p: 0, d: 0 }, undefined, false)).toBe(0)
	expect(extractValue({ s: '-17', p: 0, d: 0 }, undefined, false)).toBe(-17)
})

it('parses integers with underscores', () => {
	expect(extractValue({ s: '1_000', p: 0, d: 0 }, undefined, false)).toBe(1000)
	expect(extractValue({ s: '5_349_221', p: 0, d: 0 }, undefined, false)).toBe(5349221)
	expect(extractValue({ s: '53_49_221', p: 0, d: 0 }, undefined, false)).toBe(5349221)
	expect(extractValue({ s: '1_2_3_4_5', p: 0, d: 0 }, undefined, false)).toBe(12345)
})

it('parses hex integers', () => {
	expect(extractValue({ s: '0xDEADBEEF', p: 0, d: 0 }, undefined, false)).toBe(0xdeadbeef)
	expect(extractValue({ s: '0xdeadbeef', p: 0, d: 0 }, undefined, false)).toBe(0xdeadbeef)
	expect(extractValue({ s: '0xdead_beef', p: 0, d: 0 }, undefined, false)).toBe(0xdeadbeef)
})

it('parses octal integers', () => {
	expect(extractValue({ s: '0o01234567', p: 0, d: 0 }, undefined, false)).toBe(0o01234567)
	expect(extractValue({ s: '0o0123_4567', p: 0, d: 0 }, undefined, false)).toBe(0o01234567)
})

it('parses binary integers', () => {
	expect(extractValue({ s: '0b11010110', p: 0, d: 0 }, undefined, false)).toBe(0b11010110)
	expect(extractValue({ s: '0b1101_0110', p: 0, d: 0 }, undefined, false)).toBe(0b11010110)
})

it('rejects integers too large on number_or_error', () => {
	expect(() => extractValue({ s: '9007199254740992', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('supports integers larger than the max safe integer number when bigints are enabled', () => {
	expect(extractValue({ s: '9007199254740992', p: 0, d: 0 }, undefined, 'asNeeded')).toBe(9007199254740992n)
	expect(extractValue({ s: '9007199254740992', p: 0, d: 0 }, undefined, true)).toBe(9007199254740992n)
})

it('supports integers larger than the Number max value when bigints are enabled', () => {
	const nineRepeat = '9'.repeat(310)
	expect(extractValue({ s: nineRepeat, p: 0, d: 0 }, undefined, 'asNeeded')).toBe(BigInt(nineRepeat))
	expect(extractValue({ s: nineRepeat, p: 0, d: 0 }, undefined, true)).toBe(BigInt(nineRepeat))
})

it('supports floats larger than the max safe integer number', () => {
	expect(extractValue({ s: '9007199254740992.0', p: 0, d: 0 }, undefined, false)).toBe(9007199254740992.0)
	expect(extractValue({ s: '9007199254740992.0', p: 0, d: 0 }, undefined, 'asNeeded')).toBe(9007199254740992.0)
	expect(extractValue({ s: '9007199254740992.0', p: 0, d: 0 }, undefined, true)).toBe(9007199254740992.0)
})

it('only uses bigint for large values when bigints are enabled as needed', () => {
	expect(extractValue({ s: '10', p: 0, d: 0 }, undefined, 'asNeeded')).toBe(10)
})

it('interprets TOML-floats larger than the Number max value as Infinity', () => {
	let nineRepeatFloat = '9'.repeat(310) + '.0'
	expect(extractValue({ s: nineRepeatFloat, p: 0, d: 0 }, undefined, false)).toBe(Infinity)
	expect(extractValue({ s: nineRepeatFloat, p: 0, d: 0 }, undefined, 'asNeeded')).toBe(Infinity)
	expect(extractValue({ s: nineRepeatFloat, p: 0, d: 0 }, undefined, true)).toBe(Infinity)
	nineRepeatFloat = '-' + nineRepeatFloat
	expect(extractValue({ s: nineRepeatFloat, p: 0, d: 0 }, undefined, false)).toBe(-Infinity)
	expect(extractValue({ s: nineRepeatFloat, p: 0, d: 0 }, undefined, 'asNeeded')).toBe(-Infinity)
	expect(extractValue({ s: nineRepeatFloat, p: 0, d: 0 }, undefined, true)).toBe(-Infinity)
})

it('rejects leading zeroes', () => {
	expect(() => extractValue({ s: '0123', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '01.10', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '0_1.10', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('rejects invalid underscores', () => {
	expect(() => extractValue({ s: '_10', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '10_', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '1__0', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)

	expect(() => extractValue({ s: '+_10', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '0x_10', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('parses floats', () => {
	expect(extractValue({ s: '+1.0', p: 0, d: 0 }, undefined, false)).toBe(1)
	expect(extractValue({ s: '3.1415', p: 0, d: 0 }, undefined, false)).toBe(3.1415)
	expect(extractValue({ s: '-0.01', p: 0, d: 0 }, undefined, false)).toBe(-0.01)

	expect(extractValue({ s: '5e+22', p: 0, d: 0 }, undefined, false)).toBe(5e22)
	expect(extractValue({ s: '1e06', p: 0, d: 0 }, undefined, false)).toBe(1e6)
	expect(extractValue({ s: '-2E-2', p: 0, d: 0 }, undefined, false)).toBe(-2e-2)

	expect(extractValue({ s: '6.626e-34', p: 0, d: 0 }, undefined, false)).toBe(6.626e-34)
})

it('rejects invalid floats', () => {
	expect(() => extractValue({ s: '.7', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '7.', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: '3.e+20', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('parses floats with underscores', () => {
	expect(extractValue({ s: '224_617.445_991_228', p: 0, d: 0 }, undefined, false)).toBe(224617.445991228)
})

it('handles signed zero floating-point TOML values', () => {
	expect(extractValue({ s: '+0.0', p: 0, d: 0 }, undefined, false)).toBe(+0)
	expect(extractValue({ s: '-0.0', p: 0, d: 0 }, undefined, false)).toBe(-0)
})

it('handles signed zero integer TOML values', () => {
	expect(extractValue({ s: '+0', p: 0, d: 0 }, undefined, false)).toBe(extractValue({ s: '-0', p: 0, d: 0 }, undefined, false))
	expect(extractValue({ s: '+0', p: 0, d: 0 }, undefined, true)).toBe(extractValue({ s: '-0', p: 0, d: 0 }, undefined, true))
})

it('parses infinity', () => {
	expect(extractValue({ s: 'inf', p: 0, d: 0 }, undefined, false)).toBe(Infinity)
	expect(extractValue({ s: '+inf', p: 0, d: 0 }, undefined, false)).toBe(Infinity)
	expect(extractValue({ s: '-inf', p: 0, d: 0 }, undefined, false)).toBe(-Infinity)

	expect(() => extractValue({ s: 'Inf', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
	expect(() => extractValue({ s: 'Infinity', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('parses not a number', () => {
	expect(extractValue({ s: 'nan', p: 0, d: 0 }, undefined, false)).toBe(NaN)
	expect(extractValue({ s: '+nan', p: 0, d: 0 }, undefined, false)).toBe(NaN)
	expect(extractValue({ s: '-nan', p: 0, d: 0 }, undefined, false)).toBe(NaN)

	expect(() => extractValue({ s: 'NaN', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('extracts value of correct type', () => {
	{
		const ctx = { s: '[ 1, 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual(1)
		expect(ctx.p).toBe(3)
	}
	{
		const ctx = { s: '[ "uwu", 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual('uwu')
		expect(ctx.p).toBe(7)
	}
	{
		const ctx = { s: '[ {}, 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual({})
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = { s: '[ 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual(2)
		expect(ctx.p).toBe(3)
	}
	{
		const ctx = { s: '2\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual(2)
		expect(ctx.p).toBe(1)
	}

	{
		const ctx = { s: '"""uwu"""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('uwu')
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = { s: '"""this is a "multiline string""""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('this is a "multiline string"')
		expect(ctx.p).toBe(34)
	}
	{
		const ctx = { s: '"""this is a "multiline string"""""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('this is a "multiline string""')
		expect(ctx.p).toBe(35)
	}
	{
		const ctx = { s: '"uwu""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('uwu')
		expect(ctx.p).toBe(5)
	}

	{
		const ctx = { s: '"\\\\"\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('\\')
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = { s: "'uwu\\'", p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('uwu\\')
		expect(ctx.p).toBe(6)
	}
})
