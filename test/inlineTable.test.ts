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
import { parseInlineTable } from '../src/struct.js'
import TomlError from '../src/error.js'

it('parses inline tables', () => {
	expect(parseInlineTable('{ first = "Tom", last = "Preston-Werner" }', 0))
		.toStrictEqual([ { first: 'Tom', last: 'Preston-Werner' }, 42 ])
	expect(parseInlineTable('{ x = 1, y = 2 }', 0))
		.toStrictEqual([ { x: 1, y: 2 }, 16 ])
	expect(parseInlineTable('{ type.name = "pug", type.value = 1, "hehe.owo" = "uwu" }', 0))
		.toStrictEqual([ { type: { name: 'pug', value: 1 }, 'hehe.owo': 'uwu' }, 57 ])
	expect(parseInlineTable('{}', 0))
		.toStrictEqual([ {}, 2 ])
})
it('parse inline tables with non traditional spaces',()=>{
	expect(parseInlineTable('{ first = "Tom" ,last = "Preston-Werner" }', 0))
		.toStrictEqual([ { first: 'Tom', last: 'Preston-Werner' }, 42 ])
	expect(parseInlineTable('{ first = "Tom" , last = "Preston-Werner" }', 0))
		.toStrictEqual([ { first: 'Tom', last: 'Preston-Werner' }, 43 ])
	expect(parseInlineTable('{first="Tom",last="Preston-Werner"}', 0))
		.toStrictEqual([ { first: 'Tom', last: 'Preston-Werner' }, 35 ])
	expect(parseInlineTable('{	first="Tom"    ,	last="Preston-Werner"}', 0))
		.toStrictEqual([ { first: 'Tom', last: 'Preston-Werner' }, 41 ])
})

it('parses valid multiline tables', () => {
	expect(parseInlineTable('{ test = """Multiline\nstrings\nare\nvalid""" }', 0))
		.toStrictEqual([ { test: 'Multiline\nstrings\nare\nvalid' }, 44 ])
})

it('parses nested structures', () => {
	expect(parseInlineTable('{ uwu = { owo = true, cute = true, mean = false } }', 0))
		.toStrictEqual([ { uwu: { owo: true, cute: true, mean: false } }, 51 ])
	expect(parseInlineTable('{ uwu = [ "meow", "nya", "hehe", ] }', 0))
		.toStrictEqual([ { uwu: [ 'meow', 'nya', 'hehe' ] }, 36 ])
})

it('rejects duplicate keys', () => {
	expect(() => parseInlineTable('{ uwu = false, uwu = true }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ uwu.hehe = "owo", uwu = false }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ uwu = "owo", uwu.hehe = false }', 0)).toThrowError(TomlError)
})

it('rejects multiline tables', () => {
	expect(() => parseInlineTable('{ first = "Tom", last = "Preston-Werner"\n}', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{\n  first = "Tom",\n  last = "Preston-Werner"\n}', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ first = "Tom", last = \n "Preston-Werner" }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ first = "Tom" \n, last = "Preston-Werner" }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ first = "Tom",  last  \n = "Preston-Werner" }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ test = 0 \n  }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ test = {} \n  }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ test = [] \n  }', 0)).toThrowError(TomlError)
})

it('rejects tables that are not finished', () => {
	expect(() => parseInlineTable('{ first = "Tom", last = "Preston-Werner"\n', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{', 0)).toThrowError(TomlError)
})

it('rejects invalid tables', () => {
	expect(() => parseInlineTable('{ first = "Tom",, last = "Preston-Werner" }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ first = "Tom", # }', 0)).toThrowError(TomlError)
	expect(() => parseInlineTable('{ first = "Tom", }', 0)).toThrowError(TomlError)
})

it('handles JS quirks', () => {
	expect(parseInlineTable('{ __proto__ = 3 }', 0)[0])
		.toStrictEqual(JSON.parse('{"__proto__":3}'))
	expect(parseInlineTable('{ __proto__ = { uwu = "owo" } }', 0)[0])
		.toStrictEqual(JSON.parse('{"__proto__":{"uwu":"owo"}}'))
	expect(parseInlineTable('{ prototype = false }', 0)[0])
		.toStrictEqual(JSON.parse('{"prototype":false}'))
	expect(parseInlineTable('{ hasOwnProperty = false }', 0)[0])
		.toStrictEqual(JSON.parse('{"hasOwnProperty":false}'))
})

it('consumes only a table and aborts', () => {
	expect(parseInlineTable('{ uwu = 1 }\nnext-value = 10', 0)).toStrictEqual([ { uwu: 1 }, 11 ])
	expect(parseInlineTable('{ a = [ "uwu" ], b = 1, c = false, d = { hehe = 1 } }\nnext-value = 10', 0))
		.toStrictEqual([ { a: [ 'uwu' ], b: 1, c: false, d: { hehe: 1 } }, 53 ])
})

it('respects inner immutability', () => {
	expect(() => parseInlineTable('{ type = { name = "pug", value = 1 }, type.owo = "uwu" }', 0)).toThrowError(TomlError)
})
