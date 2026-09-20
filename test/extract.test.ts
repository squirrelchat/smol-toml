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

import { it, expect, describe } from 'vitest'
import { extractValue } from '../src/extract.ts'
import { TomlDate } from '../src/date.ts'
import { TomlError } from '../src/error.ts'
import { mkctx } from './_testutils.ts'

it('parses booleans', () => {
	expect(extractValue(mkctx('true'), undefined)).toBe(true)
	expect(extractValue(mkctx('false'), undefined)).toBe(false)

	expect(() => extractValue(mkctx('True'), undefined)).toThrow(TomlError)
})

it('parses integers', () => {
	expect(extractValue(mkctx('+99'), undefined)).toBe(99)
	expect(extractValue(mkctx('42'), undefined)).toBe(42)
	expect(extractValue(mkctx('0'), undefined)).toBe(0)
	expect(extractValue(mkctx('-17'), undefined)).toBe(-17)
})

it('parses integers with underscores', () => {
	expect(extractValue(mkctx('1_000'), undefined)).toBe(1000)
	expect(extractValue(mkctx('5_349_221'), undefined)).toBe(5349221)
	expect(extractValue(mkctx('53_49_221'), undefined)).toBe(5349221)
	expect(extractValue(mkctx('1_2_3_4_5'), undefined)).toBe(12345)
})

it('parses hex integers', () => {
	expect(extractValue(mkctx('0xDEADBEEF'), undefined)).toBe(0xdeadbeef)
	expect(extractValue(mkctx('0xdeadbeef'), undefined)).toBe(0xdeadbeef)
	expect(extractValue(mkctx('0xdead_beef'), undefined)).toBe(0xdeadbeef)
})

it('parses octal integers', () => {
	expect(extractValue(mkctx('0o01234567'), undefined)).toBe(0o01234567)
	expect(extractValue(mkctx('0o0123_4567'), undefined)).toBe(0o01234567)
})

it('parses binary integers', () => {
	expect(extractValue(mkctx('0b11010110'), undefined)).toBe(0b11010110)
	expect(extractValue(mkctx('0b1101_0110'), undefined)).toBe(0b11010110)
})

it('rejects integers too large on number_or_error', () => {
	expect(() => extractValue(mkctx('9007199254740992'), undefined)).toThrow(TomlError)
})

it('supports integers larger than the max safe integer number when bigints are enabled', () => {
	expect(extractValue(mkctx('9007199254740992', { bigint: 'asNeeded' }), undefined)).toBe(9007199254740992n)
	expect(extractValue(mkctx('9007199254740992', { bigint: true }), undefined)).toBe(9007199254740992n)
})

it('supports integers larger than the Number max value when bigints are enabled', () => {
	const nineRepeat = '9'.repeat(310)
	expect(extractValue(mkctx(nineRepeat, { bigint: 'asNeeded' }), undefined)).toBe(BigInt(nineRepeat))
	expect(extractValue(mkctx(nineRepeat, { bigint: true }), undefined)).toBe(BigInt(nineRepeat))
})

it('supports floats larger than the max safe integer number', () => {
	expect(extractValue(mkctx('9007199254740992.0'), undefined)).toBe(9007199254740992.0)
	expect(extractValue(mkctx('9007199254740992.0', { bigint: 'asNeeded' }), undefined)).toBe(9007199254740992.0)
	expect(extractValue(mkctx('9007199254740992.0', { bigint: true }), undefined)).toBe(9007199254740992.0)
})

it('only uses bigint for large values when bigints are enabled as needed', () => {
	expect(extractValue(mkctx('10', { bigint: 'asNeeded' }), undefined)).toBe(10)
})

it('interprets TOML-floats larger than the Number max value as Infinity', () => {
	let nineRepeatFloat = '9'.repeat(310) + '.0'
	expect(extractValue(mkctx(nineRepeatFloat, { bigint: false }), undefined)).toBe(Infinity)
	expect(extractValue(mkctx(nineRepeatFloat, { bigint: 'asNeeded' }), undefined)).toBe(Infinity)
	expect(extractValue(mkctx(nineRepeatFloat, { bigint: true }), undefined)).toBe(Infinity)
	nineRepeatFloat = '-' + nineRepeatFloat
	expect(extractValue(mkctx(nineRepeatFloat, { bigint: false }), undefined)).toBe(-Infinity)
	expect(extractValue(mkctx(nineRepeatFloat, { bigint: 'asNeeded' }), undefined)).toBe(-Infinity)
	expect(extractValue(mkctx(nineRepeatFloat, { bigint: true }), undefined)).toBe(-Infinity)
})

it('rejects leading zeroes', () => {
	expect(() => extractValue(mkctx('0123'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('01.10'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('0_1.10'), undefined)).toThrow(TomlError)
})

it('rejects invalid underscores', () => {
	expect(() => extractValue(mkctx('_10'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('10_'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('1__0'), undefined)).toThrow(TomlError)

	expect(() => extractValue(mkctx('+_10'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('0x_10'), undefined)).toThrow(TomlError)
})

it('parses floats', () => {
	expect(extractValue(mkctx('+1.0'), undefined)).toBe(1)
	expect(extractValue(mkctx('3.1415'), undefined)).toBe(3.1415)
	expect(extractValue(mkctx('-0.01'), undefined)).toBe(-0.01)

	expect(extractValue(mkctx('5e+22'), undefined)).toBe(5e22)
	expect(extractValue(mkctx('1e06'), undefined)).toBe(1e6)
	expect(extractValue(mkctx('-2E-2'), undefined)).toBe(-2e-2)

	expect(extractValue(mkctx('6.626e-34'), undefined)).toBe(6.626e-34)
})

it('rejects invalid floats', () => {
	expect(() => extractValue(mkctx('.7'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('7.'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('3.e+20'), undefined)).toThrow(TomlError)
})

it('parses floats with underscores', () => {
	expect(extractValue(mkctx('224_617.445_991_228'), undefined)).toBe(224617.445991228)
})

it('handles signed zero floating-point TOML values', () => {
	expect(extractValue(mkctx('+0.0'), undefined)).toBe(+0)
	expect(extractValue(mkctx('-0.0'), undefined)).toBe(-0)
})

it('handles signed zero integer TOML values', () => {
	expect(extractValue(mkctx('+0'), undefined)).toBe(extractValue(mkctx('-0'), undefined))
	expect(extractValue(mkctx('+0', { bigint: true }), undefined)).toBe(extractValue(mkctx('-0', { bigint: true }), undefined))
})

it('parses infinity', () => {
	expect(extractValue(mkctx('inf'), undefined)).toBe(Infinity)
	expect(extractValue(mkctx('+inf'), undefined)).toBe(Infinity)
	expect(extractValue(mkctx('-inf'), undefined)).toBe(-Infinity)

	expect(() => extractValue(mkctx('Inf'), undefined)).toThrow(TomlError)
	expect(() => extractValue(mkctx('Infinity'), undefined)).toThrow(TomlError)
})

it('parses not a number', () => {
	expect(extractValue(mkctx('nan'), undefined)).toBe(NaN)
	expect(extractValue(mkctx('+nan'), undefined)).toBe(NaN)
	expect(extractValue(mkctx('-nan'), undefined)).toBe(NaN)

	expect(() => extractValue(mkctx('NaN'), undefined)).toThrow(TomlError)
})

describe('legacy TomlDate', () => {
	it('parses datetimes', () => {
		expect(extractValue(mkctx('1979-05-27T07:32:00', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
		expect(extractValue(mkctx('1979-05-27T00:32:00.999999', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999'))
		expect(extractValue(mkctx('1979-05-27T07:32:00Z', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
		expect(extractValue(mkctx('1979-05-27T00:32:00-07:00', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
		expect(extractValue(mkctx('1979-05-27T00:32:00.999999-07:00', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999-07:00'))
		expect(extractValue(mkctx('1979-05-27T07:32', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
		expect(extractValue(mkctx('1979-05-27T07:32Z', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
		expect(extractValue(mkctx('1979-05-27T00:32-07:00', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
	})

	it('parses datetimes with a space instead of T', () => {
		expect(extractValue(mkctx('1979-05-27 07:32:00Z', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	})

	it('parses datetimes with lowercase T', () => {
		expect(extractValue(mkctx('1979-05-27t07:32:00Z', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	})

	it('parses dates', () => {
		expect(extractValue(mkctx('1979-05-27', { date: true }), undefined)).toStrictEqual(new TomlDate('1979-05-27'))
	})

	it('parses times', () => {
		expect(extractValue(mkctx('07:32:00', { date: true }), undefined)).toStrictEqual(new TomlDate('07:32:00'))
		expect(extractValue(mkctx('00:32:00.999999', { date: true }), undefined)).toStrictEqual(new TomlDate('00:32:00.999999'))
		expect(extractValue(mkctx('07:32', { date: true }), undefined)).toStrictEqual(new TomlDate('07:32:00'))
	})

	it('rejects invalid dates', () => {
		expect(() => extractValue(mkctx('07:3:00', { date: true }), undefined)).toThrow(TomlError)
		expect(() => extractValue(mkctx('27-05-1979', { date: true }), undefined)).toThrow(TomlError)
	})

	it('handles extreme datetimes', () => {
		expect(extractValue(mkctx('0001-01-01 00:00:00Z', { date: true }), undefined)).toStrictEqual(new TomlDate('0001-01-01T00:00:00Z'))
		expect(extractValue(mkctx('0001-01-01 00:00:00', { date: true }), undefined)).toStrictEqual(new TomlDate('0001-01-01T00:00:00'))
		expect(extractValue(mkctx('0001-01-01 00:00Z', { date: true }), undefined)).toStrictEqual(new TomlDate('0001-01-01T00:00:00Z'))
		expect(extractValue(mkctx('0001-01-01 00:00', { date: true }), undefined)).toStrictEqual(new TomlDate('0001-01-01T00:00:00'))
		expect(extractValue(mkctx('0001-01-01', { date: true }), undefined)).toStrictEqual(new TomlDate('0001-01-01'))

		expect(extractValue(mkctx('9999-12-31 23:59:59Z', { date: true }), undefined)).toStrictEqual(new TomlDate('9999-12-31T23:59:59Z'))
		expect(extractValue(mkctx('9999-12-31 23:59:59', { date: true }), undefined)).toStrictEqual(new TomlDate('9999-12-31T23:59:59'))
		expect(extractValue(mkctx('9999-12-31', { date: true  }), undefined)).toStrictEqual(new TomlDate('9999-12-31'))
	})
})



describe.skipIf(!globalThis.Temporal)('Temporal', () => {
	it('parses datetimes', () => {
		expect(extractValue(mkctx('1979-05-27T07:32:00', { date: false }), undefined)).toStrictEqual(Temporal.PlainDateTime.from('1979-05-27T07:32:00'))
		expect(extractValue(mkctx('1979-05-27T00:32:00.999999', { date: false }), undefined)).toStrictEqual(Temporal.PlainDateTime.from('1979-05-27T00:32:00.999999'))
		expect(extractValue(mkctx('1979-05-27T07:32:00Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00Z[+00:00]'))
		expect(extractValue(mkctx('1979-05-27T00:32:00-07:00', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T00:32:00-07:00[-07:00]'))
		expect(extractValue(mkctx('1979-05-27T00:32:00.999999-07:00', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T00:32:00.999999-07:00[-07:00]'))
		expect(extractValue(mkctx('1979-05-27T07:32', { date: false }), undefined)).toStrictEqual(Temporal.PlainDateTime.from('1979-05-27T07:32:00'))
		expect(extractValue(mkctx('1979-05-27T07:32Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00Z[+00:00]'))
		expect(extractValue(mkctx('1979-05-27T00:32-07:00', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T00:32:00-07:00[-07:00]'))
	})

	it('parses datetimes with a space instead of T', () => {
		expect(extractValue(mkctx('1979-05-27 07:32:00Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00Z[+00:00]'))
	})

	it('parses datetimes with lowercase T', () => {
		expect(extractValue(mkctx('1979-05-27t07:32:00Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('1979-05-27T07:32:00Z[+00:00]'))
	})

	it('parses dates', () => {
		expect(extractValue(mkctx('1979-05-27', { date: false }), undefined)).toStrictEqual(Temporal.PlainDate.from('1979-05-27'))
	})

	it('parses times', () => {
		expect(extractValue(mkctx('07:32:00', { date: false }), undefined)).toStrictEqual(Temporal.PlainTime.from('07:32:00'))
		expect(extractValue(mkctx('00:32:00.999999', { date: false }), undefined)).toStrictEqual(Temporal.PlainTime.from('00:32:00.999999'))
		expect(extractValue(mkctx('07:32', { date: false }), undefined)).toStrictEqual(Temporal.PlainTime.from('07:32:00'))
	})

	it('rejects invalid dates', () => {
		expect(() => extractValue(mkctx('07:3:00', { date: false }), undefined)).toThrow(TomlError)
		expect(() => extractValue(mkctx('27-05-1979', { date: false }), undefined)).toThrow(TomlError)
	})

	it('handles extreme datetimes', () => {
		expect(extractValue(mkctx('0001-01-01 00:00:00Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('0001-01-01 00:00:00Z[+00:00]'))
		expect(extractValue(mkctx('0001-01-01 00:00:00', { date: false }), undefined)).toStrictEqual(Temporal.PlainDateTime.from('0001-01-01 00:00:00'))
		expect(extractValue(mkctx('0001-01-01 00:00Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('0001-01-01 00:00:00Z[+00:00]'))
		expect(extractValue(mkctx('0001-01-01 00:00', { date: false }), undefined)).toStrictEqual(Temporal.PlainDateTime.from('0001-01-01 00:00:00'))
		expect(extractValue(mkctx('0001-01-01', { date: false }), undefined)).toStrictEqual(Temporal.PlainDate.from('0001-01-01'))

		expect(extractValue(mkctx('9999-12-31 23:59:59Z', { date: false }), undefined)).toStrictEqual(Temporal.ZonedDateTime.from('9999-12-31 23:59:59Z[+00:00]'))
		expect(extractValue(mkctx('9999-12-31 23:59:59', { date: false }), undefined)).toStrictEqual(Temporal.PlainDateTime.from('9999-12-31 23:59:59'))
		expect(extractValue(mkctx('9999-12-31', { date: false }), undefined)).toStrictEqual(Temporal.PlainDate.from('9999-12-31'))
	})
})

it('extracts value of correct type', () => {
	{
		const ctx = mkctx('[ 1, 2 ]', { ptr: 2 })
		expect(extractValue(ctx, 0x5d /* ] */)).toStrictEqual(1)
		expect(ctx.p).toBe(3)
	}
	{
		const ctx = mkctx('[ "uwu", 2 ]', { ptr: 2 })
		expect(extractValue(ctx, 0x5d /* ] */)).toStrictEqual('uwu')
		expect(ctx.p).toBe(7)
	}
	{
		const ctx = mkctx('[ {}, 2 ]', { ptr: 2 })
		expect(extractValue(ctx, 0x5d /* ] */)).toStrictEqual({ __proto__: null })
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = mkctx('[ 2 ]', { ptr: 2 })
		expect(extractValue(ctx, 0x5d /* ] */)).toStrictEqual(2)
		expect(ctx.p).toBe(3)
	}
	{
		const ctx = mkctx('2\n')
		expect(extractValue(ctx, undefined)).toStrictEqual(2)
		expect(ctx.p).toBe(1)
	}

	{
		const ctx = mkctx('"""uwu"""\n')
		expect(extractValue(ctx, undefined)).toStrictEqual('uwu')
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = mkctx('"""this is a "multiline string""""\n')
		expect(extractValue(ctx, undefined)).toStrictEqual('this is a "multiline string"')
		expect(ctx.p).toBe(34)
	}
	{
		const ctx = mkctx('"""this is a "multiline string"""""\n')
		expect(extractValue(ctx, undefined)).toStrictEqual('this is a "multiline string""')
		expect(ctx.p).toBe(35)
	}
	{
		const ctx = mkctx('"uwu""\n')
		expect(extractValue(ctx, undefined)).toStrictEqual('uwu')
		expect(ctx.p).toBe(5)
	}

	{
		const ctx = mkctx('"\\\\"\n')
		expect(extractValue(ctx, undefined)).toStrictEqual('\\')
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = mkctx("'uwu\\'")
		expect(extractValue(ctx, undefined)).toStrictEqual('uwu\\')
		expect(ctx.p).toBe(6)
	}
})
