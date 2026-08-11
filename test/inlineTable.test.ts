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
import { parseInlineTable } from '../src/struct.ts'
import { TomlError } from '../src/error.ts'

it('parses inline tables', () => {
	{
		const ctx = { s: '{ first = "Tom", last = "Preston-Werner" }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(42)
	}
	{
		const ctx = { s: '{ x = 1, y = 2 }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ x: 1, y: 2 })
		expect(ctx.p).toBe(16)
	}
	{
		const ctx = { s: '{ type.name = "pug", type.value = 1, "hehe.owo" = "uwu" }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ type: { name: 'pug', value: 1 }, 'hehe.owo': 'uwu' })
		expect(ctx.p).toBe(57)
	}
	{
		const ctx = { s: '{}', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({})
		expect(ctx.p).toBe(2)
	}
})

it('parse inline tables with non traditional spaces', () => {
	{
		const ctx = { s: '{ first = "Tom" ,last = "Preston-Werner" }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(42)
	}
	{
		const ctx = { s: '{ first = "Tom" , last = "Preston-Werner" }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(43)
	}
	{
		const ctx = { s: '{first="Tom",last="Preston-Werner"}', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(35)
	}
	{
		const ctx = { s: '{	first="Tom"    ,	last="Preston-Werner"}', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(41)
	}
})

it('parses multiline tables', () => {
	{
		const ctx = { s: '{ first = "Tom", last = "Preston-Werner"\n}', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(42)
	}
	{
		const ctx = { s: '{\n  first = "Tom",\n  last = "Preston-Werner"\n}', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(46)
	}
	{
		// No longer an error in TOML 1.1.0
		const ctx = { s: '{ first = "Tom" \n, last = "Preston-Werner" }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(44)
	}

	expect(() => parseInlineTable({ s: '{ first = "Tom", last = \n "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ first = "Tom",  last  \n = "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)

	{
		const ctx = { s: '{ test = """Multiline\nstrings\nare\nvalid""" }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ test: 'Multiline\nstrings\nare\nvalid' })
		expect(ctx.p).toBe(44)
	}
})

it('parses nested structures', () => {
	{
		const ctx = { s: '{ uwu = { owo = true, cute = true, mean = false } }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ uwu: { owo: true, cute: true, mean: false } })
		expect(ctx.p).toBe(51)
	}
	{
		const ctx = { s: '{ uwu = [ "meow", "nya", "hehe", ] }', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ uwu: ['meow', 'nya', 'hehe'] })
		expect(ctx.p).toBe(36)
	}
})

it('parses multiline nested structures', () => {
	{
		const ctx = { s: '{\n\ta = {\n\t\tb = 1,\n\t\tc = [\n\t\t\t0,\n\t\t\t1,\n\t\t],\n\t\t},\n\td = "wow"\n}', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ a: { b: 1, c: [0, 1] }, d: 'wow' })
		expect(ctx.p).toBe(60)
	}
})

it('rejects duplicate keys', () => {
	expect(() => parseInlineTable({ s: '{ uwu = false, uwu = true }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ uwu.hehe = "owo", uwu = false }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ uwu = "owo", uwu.hehe = false }', p: 0, d: 10 }, false)).toThrow(TomlError)
})

it('rejects tables that are not finished', () => {
	expect(() => parseInlineTable({ s: '{ first = "Tom", last = "Preston-Werner"\n', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{', p: 0, d: 10 }, false)).toThrow(TomlError)
})

it('rejects invalid tables', () => {
	expect(() => parseInlineTable({ s: '{ first = "Tom",, last = "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ first = "Tom" last = "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ first = "Tom" \n last = "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ first = {} last = "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ first = [] last = "Preston-Werner" }', p: 0, d: 10 }, false)).toThrow(TomlError)
	expect(() => parseInlineTable({ s: '{ first = "Tom", # }', p: 0, d: 10 }, false)).toThrow(TomlError)
})

it('handles JS quirks', () => {
	expect(parseInlineTable({ s: '{ __proto__ = 3 }', p: 0, d: 10 }, false)).toStrictEqual(JSON.parse('{"__proto__":3}'))
	expect(parseInlineTable({ s: '{ __proto__ = { uwu = "owo" } }', p: 0, d: 10 }, false)).toStrictEqual(JSON.parse('{"__proto__":{"uwu":"owo"}}'))
	expect(parseInlineTable({ s: '{ prototype = false }', p: 0, d: 10 }, false)).toStrictEqual(JSON.parse('{"prototype":false}'))
	expect(parseInlineTable({ s: '{ hasOwnProperty = false }', p: 0, d: 10 }, false)).toStrictEqual(JSON.parse('{"hasOwnProperty":false}'))
})

it('consumes only a table and stops', () => {
	{
		const ctx = { s: '{ uwu = 1 }\nnext-value = 10', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ uwu: 1 })
		expect(ctx.p).toBe(11)
	}
	{
		const ctx = { s: '{ a = [ "uwu" ], b = 1, c = false, d = { hehe = 1 } }\nnext-value = 10', p: 0, d: 10 }
		expect(parseInlineTable(ctx, false)).toStrictEqual({ a: ['uwu'], b: 1, c: false, d: { hehe: 1 } })
		expect(ctx.p).toBe(53)
	}
})

it('respects inner immutability', () => {
	expect(() => parseInlineTable({ s: '{ type = { name = "pug", value = 1 }, type.owo = "uwu" }', p: 0, d: 10 }, false)).toThrow(TomlError)
})
