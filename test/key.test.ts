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
import TomlError from '../src/error.js'

it('parses simple keys', () => {
	expect(parseKey('key =', 0)).toStrictEqual([['key'], 5])
	expect(parseKey('bare_key =', 0)).toStrictEqual([['bare_key'], 10])
	expect(parseKey('bare-key =', 0)).toStrictEqual([['bare-key'], 10])
	expect(parseKey('1234 =', 0)).toStrictEqual([['1234'], 6])

	expect(parseKey('key=', 0)).toStrictEqual([['key'], 4])
	expect(parseKey('bare_key=', 0)).toStrictEqual([['bare_key'], 9])
	expect(parseKey('bare-key=', 0)).toStrictEqual([['bare-key'], 9])
	expect(parseKey('1234=', 0)).toStrictEqual([['1234'], 5])
})

it('parses quoted keys', () => {
	expect(parseKey('"127.0.0.1" =', 0)[0]).toStrictEqual(['127.0.0.1'])
	expect(parseKey('"character encoding" =', 0)[0]).toStrictEqual([
		'character encoding',
	])
	expect(parseKey('"ʎǝʞ" =', 0)[0]).toStrictEqual(['ʎǝʞ'])
	expect(parseKey("'key2' =", 0)[0]).toStrictEqual(['key2'])
	expect(parseKey('\'quoted "value"\' =', 0)[0]).toStrictEqual([
		'quoted "value"',
	])
})

it('parses empty keys', () => {
	expect(() => parseKey(' =', 0)).toThrowError(TomlError)
	expect(parseKey('"" =', 0)[0]).toStrictEqual([''])
	expect(parseKey("'' =", 0)[0]).toStrictEqual([''])
})

it('parses dotted keys', () => {
	expect(parseKey('physical.color =', 0)[0]).toStrictEqual([
		'physical',
		'color',
	])
	expect(parseKey('physical.shape =', 0)[0]).toStrictEqual([
		'physical',
		'shape',
	])
	expect(parseKey('site."google.com" =', 0)[0]).toStrictEqual([
		'site',
		'google.com',
	])
})

it('ignores whitespace', () => {
	expect(parseKey('fruit.name =', 0)[0]).toStrictEqual(['fruit', 'name'])
	expect(parseKey('fruit. color =', 0)[0]).toStrictEqual(['fruit', 'color'])
	expect(parseKey('fruit . flavor =', 0)[0]).toStrictEqual(['fruit', 'flavor'])
	expect(parseKey('fruit . "flavor" =', 0)[0]).toStrictEqual([
		'fruit',
		'flavor',
	])
	expect(parseKey('"fruit" . flavor =', 0)[0]).toStrictEqual([
		'fruit',
		'flavor',
	])
	expect(parseKey('"fruit"\t.\tflavor =', 0)[0]).toStrictEqual([
		'fruit',
		'flavor',
	])
})

it('rejects invalid keys', () => {
	expect(() => parseKey('"uwu"\n =', 0)).toThrowError(TomlError)
	expect(() => parseKey('uwu. =', 0)).toThrowError(TomlError)
	expect(() => parseKey('éwé =', 0)).toThrowError(TomlError)
	expect(() => parseKey('uwu..owo =', 0)).toThrowError(TomlError)
	expect(() => parseKey('uwu.\nowo =', 0)).toThrowError(TomlError)
	expect(() => parseKey('uwu\n.owo =', 0)).toThrowError(TomlError)
	expect(() => parseKey('"uwu"\n.owo =', 0)).toThrowError(TomlError)
	expect(() => parseKey('uwu\n =', 0)).toThrowError(TomlError)
	expect(() => parseKey('"uwu =', 0)).toThrowError(TomlError)

	expect(() => parseKey('uwu."owo"hehe =', 0)).toThrowError(TomlError)

	expect(() => parseKey('uwu hehe =', 0)).toThrowError(TomlError)

	expect(() => parseKey('"""long\nkey""" = 1', 0)).toThrowError(TomlError)
})
