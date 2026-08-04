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
import { parseKey } from '../src/struct.js'
import { TomlError } from '../src/error.js'

it('parses simple keys', () => {
	{
		const ctx = { s: 'key =', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['key'])
		expect(ctx.p).toBe(5)
	}
	{
		const ctx = { s: 'bare_key =', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['bare_key'])
		expect(ctx.p).toBe(10)
	}
	{
		const ctx = { s: 'bare-key =', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['bare-key'])
		expect(ctx.p).toBe(10)
	}
	{
		const ctx = { s: '1234 =', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['1234'])
		expect(ctx.p).toBe(6)
	}

	{
		const ctx = { s: 'key=', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['key'])
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = { s: 'bare_key=', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['bare_key'])
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = { s: 'bare-key=', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['bare-key'])
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = { s: '1234=', p: 0, d: 10 }
		expect(parseKey(ctx)).toStrictEqual(['1234'])
		expect(ctx.p).toBe(5)
	}
})

it('parses quoted keys', () => {
	expect(parseKey({ s: '"127.0.0.1" =', p: 0, d: 10 })).toStrictEqual(['127.0.0.1'])
	expect(parseKey({ s: '"character encoding" =', p: 0, d: 10 })).toStrictEqual(['character encoding'])
	expect(parseKey({ s: '"ʎǝʞ" =', p: 0, d: 10 })).toStrictEqual(['ʎǝʞ'])
	expect(parseKey({ s: "'key2' =", p: 0, d: 10 })).toStrictEqual(['key2'])
	expect(parseKey({ s: '\'quoted "value"\' =', p: 0, d: 10 })).toStrictEqual(['quoted "value"'])
})

it('parses empty keys', () => {
	expect(() => parseKey({ s: ' =', p: 0, d: 10 })).toThrow(TomlError)
	expect(parseKey({ s: '"" =', p: 0, d: 10 })).toStrictEqual([''])
	expect(parseKey({ s: "'' =", p: 0, d: 10 })).toStrictEqual([''])
})

it('parses dotted keys', () => {
	expect(parseKey({ s: 'physical.color =', p: 0, d: 10 })).toStrictEqual(['physical', 'color'])
	expect(parseKey({ s: 'physical.shape =', p: 0, d: 10 })).toStrictEqual(['physical', 'shape'])
	expect(parseKey({ s: 'site."google.com" =', p: 0, d: 10 })).toStrictEqual(['site', 'google.com'])
})

it('ignores whitespace', () => {
	expect(parseKey({ s: 'fruit.name =', p: 0, d: 10 })).toStrictEqual(['fruit', 'name'])
	expect(parseKey({ s: 'fruit. color =', p: 0, d: 10 })).toStrictEqual(['fruit', 'color'])
	expect(parseKey({ s: 'fruit . flavor =', p: 0, d: 10 })).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey({ s: 'fruit . "flavor" =', p: 0, d: 10 })).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey({ s: '"fruit" . flavor =', p: 0, d: 10 })).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey({ s: '"fruit"\t.\tflavor =', p: 0, d: 10 })).toStrictEqual(['fruit', 'flavor'])
})

it('rejects invalid keys', () => {
	expect(() => parseKey({ s: '"uwu"\n =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: 'uwu. =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: 'éwé =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: 'uwu..owo =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: 'uwu.\nowo =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: 'uwu\n.owo =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: '"uwu"\n.owo =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: 'uwu\n =', p: 0, d: 10 })).toThrow(TomlError)
	expect(() => parseKey({ s: '"uwu =', p: 0, d: 10 })).toThrow(TomlError)

	expect(() => parseKey({ s: 'uwu."owo"hehe =', p: 0, d: 10 })).toThrow(TomlError)

	expect(() => parseKey({ s: 'uwu hehe =', p: 0, d: 10 })).toThrow(TomlError)

	expect(() => parseKey({ s: '"""long\nkey""" = 1', p: 0, d: 10 })).toThrow(TomlError)
})
