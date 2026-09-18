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
import { mkctx } from './_testutils.ts'

it('parses inline tables', () => {
	{
		const ctx = mkctx('{ first = "Tom", last = "Preston-Werner" }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(42)
	}
	{
		const ctx = mkctx('{ x = 1, y = 2 }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, x: 1, y: 2 })
		expect(ctx.p).toBe(16)
	}
	{
		const ctx = mkctx('{ type.name = "pug", type.value = 1, "hehe.owo" = "uwu" }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, type: { __proto__: null, name: 'pug', value: 1 }, 'hehe.owo': 'uwu' })
		expect(ctx.p).toBe(57)
	}
	{
		const ctx = mkctx('{}')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null })
		expect(ctx.p).toBe(2)
	}
})

it('parse inline tables with non traditional spaces', () => {
	{
		const ctx = mkctx('{ first = "Tom" ,last = "Preston-Werner" }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(42)
	}
	{
		const ctx = mkctx('{ first = "Tom" , last = "Preston-Werner" }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(43)
	}
	{
		const ctx = mkctx('{first="Tom",last="Preston-Werner"}')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(35)
	}
	{
		const ctx = mkctx('{	first="Tom"    ,	last="Preston-Werner"}')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(41)
	}
})

it('parses multiline tables', () => {
	{
		const ctx = mkctx('{ first = "Tom", last = "Preston-Werner"\n}')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(42)
	}
	{
		const ctx = mkctx('{\n  first = "Tom",\n  last = "Preston-Werner"\n}')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(46)
	}
	{
		// No longer an error in TOML 1.1.0
		const ctx = mkctx('{ first = "Tom" \n, last = "Preston-Werner" }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, first: 'Tom', last: 'Preston-Werner' })
		expect(ctx.p).toBe(44)
	}

	expect(() => parseInlineTable(mkctx('{ first = "Tom", last = \n "Preston-Werner" }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ first = "Tom",  last  \n = "Preston-Werner" }'))).toThrow(TomlError)

	{
		const ctx = mkctx('{ test = """Multiline\nstrings\nare\nvalid""" }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, test: 'Multiline\nstrings\nare\nvalid' })
		expect(ctx.p).toBe(44)
	}
})

it('parses nested structures', () => {
	{
		const ctx = mkctx('{ uwu = { owo = true, cute = true, mean = false } }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, uwu: { __proto__: null, owo: true, cute: true, mean: false } })
		expect(ctx.p).toBe(51)
	}
	{
		const ctx = mkctx('{ uwu = [ "meow", "nya", "hehe", ] }')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, uwu: ['meow', 'nya', 'hehe'] })
		expect(ctx.p).toBe(36)
	}
})

it('parses multiline nested structures', () => {
	{
		const ctx = mkctx('{\n\ta = {\n\t\tb = 1,\n\t\tc = [\n\t\t\t0,\n\t\t\t1,\n\t\t],\n\t\t},\n\td = "wow"\n}')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, a: { __proto__: null, b: 1, c: [0, 1] }, d: 'wow' })
		expect(ctx.p).toBe(60)
	}
})

it('rejects duplicate keys', () => {
	expect(() => parseInlineTable(mkctx('{ uwu = false, uwu = true }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ uwu.hehe = "owo", uwu = false }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ uwu = "owo", uwu.hehe = false }'))).toThrow(TomlError)
})

it('rejects tables that are not finished', () => {
	expect(() => parseInlineTable(mkctx('{ first = "Tom", last = "Preston-Werner"\n'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{'))).toThrow(TomlError)
})

it('rejects invalid tables', () => {
	expect(() => parseInlineTable(mkctx('{ first = "Tom",, last = "Preston-Werner" }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ first = "Tom" last = "Preston-Werner" }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ first = "Tom" \n last = "Preston-Werner" }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ first = {} last = "Preston-Werner" }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ first = [] last = "Preston-Werner" }'))).toThrow(TomlError)
	expect(() => parseInlineTable(mkctx('{ first = "Tom", # }'))).toThrow(TomlError)
})

it('handles JS quirks', () => {
	const nullproto = (obj: any) => {
		Object.setPrototypeOf(obj, null)
		for (const v of Object.values(obj))
			if (typeof v === 'object' && !Array.isArray(obj))
				nullproto(v)
		return obj
	}

	const mkobj = (json: string) => nullproto(JSON.parse(json))

	expect(parseInlineTable(mkctx('{ __proto__ = 3 }')))
		.toStrictEqual(mkobj('{"__proto__":3}'))

	expect(parseInlineTable(mkctx('{ __proto__ = { uwu = "owo" } }')))
		.toStrictEqual(mkobj('{"__proto__":{"uwu":"owo"}}'))

	expect(parseInlineTable(mkctx('{ prototype = false }')))
		.toStrictEqual(mkobj('{"prototype":false}'))

	expect(parseInlineTable(mkctx('{ hasOwnProperty = false }')))
		.toStrictEqual(mkobj('{"hasOwnProperty":false}'))
})

it('consumes only a table and stops', () => {
	{
		const ctx = mkctx('{ uwu = 1 }\nnext-value = 10')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, uwu: 1 })
		expect(ctx.p).toBe(11)
	}
	{
		const ctx = mkctx('{ a = [ "uwu" ], b = 1, c = false, d = { hehe = 1 } }\nnext-value = 10')
		expect(parseInlineTable(ctx)).toStrictEqual({ __proto__: null, a: ['uwu'], b: 1, c: false, d: { __proto__: null, hehe: 1 } })
		expect(ctx.p).toBe(53)
	}
})

it('respects inner immutability', () => {
	expect(() => parseInlineTable(mkctx('{ type = { name = "pug", value = 1 }, type.owo = "uwu" }'))).toThrow(TomlError)
})
