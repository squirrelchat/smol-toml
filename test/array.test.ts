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
import { parseArray } from '../src/struct.ts'
import { TomlError } from '../src/error.ts'

it('parses arrays', () => {
	{
		const ctx = { s: '[ 1, 2, 3 ]', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([1, 2, 3])
		expect(ctx.p).toBe(11)
	}

	{
		const ctx = { s: '[1,2,3]', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([1, 2, 3])
		expect(ctx.p).toBe(7)
	}

	expect(parseArray({ s: '[ "red", "yellow", "green" ]', p: 0, d: 10 }, false, false)).toStrictEqual(['red', 'yellow', 'green'])
	expect(parseArray({ s: '[ "all", \'strings\', """are the same""", \'\'\'type\'\'\' ]', p: 0, d: 10 }, false, false)).toStrictEqual(['all', 'strings', 'are the same', 'type'])
})

it('parses arrays of mixed types', () => {
	expect(parseArray({ s: '[ 0.1, 0.2, 0.5, 1, 2, 5 ]', p: 0, d: 10 }, false, false)).toStrictEqual([0.1, 0.2, 0.5, 1, 2, 5])
	expect(parseArray({ s: '[ 10, "red", false ]', p: 0, d: 10 }, false, false)).toStrictEqual([10, 'red', false])
})

it('parses nested arrays', () => {
	expect(parseArray({ s: '[ [ 1, 2 ], [3, 4, 5] ]', p: 0, d: 10 }, false, false)).toStrictEqual([
		[1, 2],
		[3, 4, 5],
	])
	expect(parseArray({ s: '[ [ 1, 2 ], ["a", "b", "c"] ]', p: 0, d: 10 }, false, false)).toStrictEqual([
		[1, 2],
		['a', 'b', 'c'],
	])
})

it('parses inline table values', () => {
	expect(parseArray({ s: '[ { a = "uwu", b = 1, c = false } ]', p: 0, d: 10 }, false, false)).toStrictEqual([{ a: 'uwu', b: 1, c: false }])
})

it('handles multiline arrays', () => {
	expect(parseArray({ s: '[\n  1, 2, 3\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2, 3])
	expect(parseArray({ s: '[\n  1,\n  2\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2])

	expect(parseArray({ s: '[\r\n  1, 2, 3\r\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2, 3])
	expect(parseArray({ s: '[\r\n  1,\r\n  2\r\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2])
})

it('tolerates trailing commas', () => {
	expect(parseArray({ s: '[ 1, 2, 3, ]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2, 3])
	expect(parseArray({ s: '[\n  1,\n  2,\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2])

	expect(parseArray({ s: '[\r\n  1,\r\n  2,\r\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2])
})

it('is not bothered by comments', () => {
	expect(parseArray({ s: '[\n  1,\n  2, # uwu\n  # hehe 3,\n  4,\n  # owo\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2, 4])
	expect(parseArray({ s: '[\r\n  1,\r\n  2, # uwu\r\n  # hehe 3,\r\n  4,\r\n  # owo\r\n]', p: 0, d: 10 }, false, false)).toStrictEqual([1, 2, 4])

	{
		const ctx = { s: '[ 1,# 9, 9,\n2#,9\n,#9\n3#]\n,4]', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([1, 2, 3, 4])
		expect(ctx.p).toBe(28)
	}

	{
		const ctx = { s: '[ 1,# 9, 9,\n2#,9\n]', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([1, 2])
		expect(ctx.p).toBe(18)
	}

	{
		const ctx = { s: '[[[[#["#"],\n["#"]]]]#]\n]', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([[[[['#']]]]])
		expect(ctx.p).toBe(24)
	}
})

it('rejects invalid arrays', () => {
	expect(() => parseArray({ s: '[ 1,, 2]', p: 0, d: 10 }, false, false)).toThrow(TomlError)
	expect(() => parseArray({ s: '[ 1, 2, 3 ', p: 0, d: 10 }, false, false)).toThrow(TomlError)
	expect(() => parseArray({ s: '[ 1, "2" a, 3 ]', p: 0, d: 10 }, false, false)).toThrow(TomlError)
})

it('consumes only an array and aborts', () => {
	{
		const ctx = { s: '[ 1, 2, 3 ]\nnext-value = 10', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([1, 2, 3])
		expect(ctx.p).toBe(11)
	}

	{
		const ctx = { s: '[ { a = "uwu", b = 1, c = false, d = [ 1 ] } ]\nnext-value = 10', p: 0, d: 10 }
		expect(parseArray(ctx, false, false)).toStrictEqual([{ a: 'uwu', b: 1, c: false, d: [1] }])
		expect(ctx.p).toBe(46)
	}
})
