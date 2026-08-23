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
import { parseKey } from '../src/struct.ts'
import { TomlError } from '../src/error.ts'
import { mkctx } from './_testutils.ts'

it('parses simple keys', () => {
	{
		const ctx = mkctx('key =')
		expect(parseKey(ctx)).toStrictEqual(['key'])
		expect(ctx.p).toBe(5)
	}
	{
		const ctx = mkctx('bare_key =')
		expect(parseKey(ctx)).toStrictEqual(['bare_key'])
		expect(ctx.p).toBe(10)
	}
	{
		const ctx = mkctx('bare-key =')
		expect(parseKey(ctx)).toStrictEqual(['bare-key'])
		expect(ctx.p).toBe(10)
	}
	{
		const ctx = mkctx('1234 =')
		expect(parseKey(ctx)).toStrictEqual(['1234'])
		expect(ctx.p).toBe(6)
	}

	{
		const ctx = mkctx('key=')
		expect(parseKey(ctx)).toStrictEqual(['key'])
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = mkctx('bare_key=')
		expect(parseKey(ctx)).toStrictEqual(['bare_key'])
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = mkctx('bare-key=')
		expect(parseKey(ctx)).toStrictEqual(['bare-key'])
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = mkctx('1234=')
		expect(parseKey(ctx)).toStrictEqual(['1234'])
		expect(ctx.p).toBe(5)
	}
})

it('parses quoted keys', () => {
	expect(parseKey(mkctx('"127.0.0.1" ='))).toStrictEqual(['127.0.0.1'])
	expect(parseKey(mkctx('"character encoding" ='))).toStrictEqual(['character encoding'])
	expect(parseKey(mkctx('"ʎǝʞ" ='))).toStrictEqual(['ʎǝʞ'])
	expect(parseKey(mkctx("'key2' ="))).toStrictEqual(['key2'])
	expect(parseKey(mkctx('\'quoted "value"\' ='))).toStrictEqual(['quoted "value"'])
})

it('parses empty keys', () => {
	expect(() => parseKey(mkctx(' ='))).toThrow(TomlError)
	expect(parseKey(mkctx('"" ='))).toStrictEqual([''])
	expect(parseKey(mkctx("'' ="))).toStrictEqual([''])
})

it('parses dotted keys', () => {
	expect(parseKey(mkctx('physical.color ='))).toStrictEqual(['physical', 'color'])
	expect(parseKey(mkctx('physical.shape ='))).toStrictEqual(['physical', 'shape'])
	expect(parseKey(mkctx('site."google.com" ='))).toStrictEqual(['site', 'google.com'])
})

it('ignores whitespace', () => {
	expect(parseKey(mkctx('fruit.name ='))).toStrictEqual(['fruit', 'name'])
	expect(parseKey(mkctx('fruit. color ='))).toStrictEqual(['fruit', 'color'])
	expect(parseKey(mkctx('fruit . flavor ='))).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey(mkctx('fruit . "flavor" ='))).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey(mkctx('"fruit" . flavor ='))).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey(mkctx('"fruit"\t.\tflavor ='))).toStrictEqual(['fruit', 'flavor'])
})

it('rejects invalid keys', () => {
	expect(() => parseKey(mkctx('"uwu"\n ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('uwu. ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('éwé ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('uwu..owo ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('uwu.\nowo ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('uwu\n.owo ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('"uwu"\n.owo ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('uwu\n ='))).toThrow(TomlError)
	expect(() => parseKey(mkctx('"uwu ='))).toThrow(TomlError)

	expect(() => parseKey(mkctx('uwu."owo"hehe ='))).toThrow(TomlError)

	expect(() => parseKey(mkctx('uwu hehe ='))).toThrow(TomlError)

	expect(() => parseKey(mkctx('"""long\nkey""" = 1'))).toThrow(TomlError)
})
