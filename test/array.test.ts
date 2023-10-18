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
import { parseArray } from '../src/struct.js'
import TomlError from '../src/error.js'

it('parses arrays', () => {
	expect(parseArray('[ 1, 2, 3 ]', 0)).toStrictEqual([ [ 1, 2, 3 ], 11 ])
	expect(parseArray('[1,2,3]', 0)).toStrictEqual([ [ 1, 2, 3 ], 7 ])
	expect(parseArray('[ "red", "yellow", "green" ]', 0)[0]).toStrictEqual([ 'red', 'yellow', 'green' ])
	expect(parseArray('[ "all", \'strings\', """are the same""", \'\'\'type\'\'\' ]', 0)[0])
		.toStrictEqual([ 'all', 'strings', 'are the same', 'type' ])
})

it('parses arrays of mixed types', () => {
	expect(parseArray('[ 0.1, 0.2, 0.5, 1, 2, 5 ]', 0)[0]).toStrictEqual([ 0.1, 0.2, 0.5, 1, 2, 5 ])
	expect(parseArray('[ 10, "red", false ]', 0)[0]).toStrictEqual([ 10, "red", false ])
})

it('parses nested arrays', () => {
	expect(parseArray('[ [ 1, 2 ], [3, 4, 5] ]', 0)[0]).toStrictEqual([ [ 1, 2 ], [ 3, 4, 5 ] ])
	expect(parseArray('[ [ 1, 2 ], ["a", "b", "c"] ]', 0)[0]).toStrictEqual([ [ 1, 2 ], [ 'a', 'b', 'c' ] ])
})

it('parses inline table values', () => {
	expect(parseArray('[ { a = "uwu", b = 1, c = false } ]', 0)[0]).toStrictEqual([ { a: 'uwu', b: 1, c: false } ])
})

it('handles multiline arrays', () => {
	expect(parseArray('[\n  1, 2, 3\n]', 0)[0]).toStrictEqual([ 1, 2, 3 ])
	expect(parseArray('[\n  1,\n  2\n]', 0)[0]).toStrictEqual([ 1, 2 ])

	expect(parseArray('[\r\n  1, 2, 3\r\n]', 0)[0]).toStrictEqual([ 1, 2, 3 ])
	expect(parseArray('[\r\n  1,\r\n  2\r\n]', 0)[0]).toStrictEqual([ 1, 2 ])
})

it('tolerates trailing commas', () => {
	expect(parseArray('[ 1, 2, 3, ]', 0)[0]).toStrictEqual([ 1, 2, 3 ])
	expect(parseArray('[\n  1,\n  2,\n]', 0)[0]).toStrictEqual([ 1, 2 ])

	expect(parseArray('[\r\n  1,\r\n  2,\r\n]', 0)[0]).toStrictEqual([ 1, 2 ])
})

it('is not bothered by comments', () => {
	expect(parseArray('[\n  1,\n  2, # uwu\n  # hehe 3,\n  4,\n  # owo\n]', 0)[0]).toStrictEqual([ 1, 2, 4 ])
	expect(parseArray('[\r\n  1,\r\n  2, # uwu\r\n  # hehe 3,\r\n  4,\r\n  # owo\r\n]', 0)[0]).toStrictEqual([ 1, 2, 4 ])

	expect(parseArray('[ 1,# 9, 9,\n2#,9\n,#9\n3#]\n,4]', 0)).toStrictEqual([ [ 1, 2, 3, 4 ], 28 ])
	expect(parseArray('[ 1,# 9, 9,\n2#,9\n]', 0)).toStrictEqual([ [ 1, 2 ], 18 ])
	expect(parseArray('[[[[#["#"],\n["#"]]]]#]\n]', 0)).toStrictEqual([ [ [ [ [ [ "#" ] ] ] ] ], 24 ])
})

it('rejects invalid arrays', () => {
	expect(() => parseArray('[ 1,, 2]', 0)).toThrowError(TomlError)
	expect(() => parseArray('[ 1, 2, 3 ', 0)).toThrowError(TomlError)
	expect(() => parseArray('[ 1, "2" a, 3 ]', 0)).toThrowError(TomlError)
})

it('consumes only an array and aborts', () => {
	expect(parseArray('[ 1, 2, 3 ]\nnext-value = 10', 0)).toStrictEqual([ [ 1, 2, 3 ], 11 ])
	expect(parseArray('[ { a = "uwu", b = 1, c = false, d = [ 1 ] } ]\nnext-value = 10', 0))
		.toStrictEqual([ [ { a: 'uwu', b: 1, c: false, d: [ 1 ] } ], 46 ])
})
