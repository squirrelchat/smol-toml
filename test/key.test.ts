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
	expect(parseKey('key')).toStrictEqual([ 'key' ])
	expect(parseKey('bare_key')).toStrictEqual([ 'bare_key' ])
	expect(parseKey('bare-key')).toStrictEqual([ 'bare-key' ])
	expect(parseKey('1234')).toStrictEqual([ '1234' ])
})

it('parses quoted keys', () => {
	expect(parseKey('"127.0.0.1"')).toStrictEqual([ '127.0.0.1' ])
	expect(parseKey('"character encoding"')).toStrictEqual([ 'character encoding' ])
	expect(parseKey('"ʎǝʞ"')).toStrictEqual([ 'ʎǝʞ' ])
	expect(parseKey("'key2'")).toStrictEqual([ 'key2' ])
	expect(parseKey("'quoted \"value\"'")).toStrictEqual([ 'quoted "value"' ])
})

it('parses empty keys', () => {
	expect(() => parseKey('')).toThrowError(TomlError)
	expect(parseKey('""')).toStrictEqual([ '' ])
	expect(parseKey("''")).toStrictEqual([ '' ])
})

it('parses dotted keys', () => {
	expect(parseKey('physical.color')).toStrictEqual([ 'physical', 'color' ])
	expect(parseKey('physical.shape')).toStrictEqual([ 'physical', 'shape' ])
	expect(parseKey('site."google.com"')).toStrictEqual([ 'site', 'google.com' ])
})

it('ignores whitespace', () => {
	expect(parseKey('fruit.name')).toStrictEqual([ 'fruit', 'name' ])
	expect(parseKey('fruit. color')).toStrictEqual([ 'fruit', 'color' ])
	expect(parseKey('fruit . flavor')).toStrictEqual([ 'fruit', 'flavor' ])
	expect(parseKey('fruit . "flavor"')).toStrictEqual([ 'fruit', 'flavor' ])
	expect(parseKey('"fruit" . flavor')).toStrictEqual([ 'fruit', 'flavor' ])
	expect(parseKey('"fruit"\t.\tflavor')).toStrictEqual([ 'fruit', 'flavor' ])
})

it('rejects invalid keys', () => {
	expect(() => parseKey('"uwu"\n')).toThrowError(TomlError)
	expect(() => parseKey('uwu.')).toThrowError(TomlError)
	expect(() => parseKey('éwé')).toThrowError(TomlError)
	expect(() => parseKey('uwu..owo')).toThrowError(TomlError)
	expect(() => parseKey('uwu.\nowo')).toThrowError(TomlError)
	expect(() => parseKey('uwu\n.owo')).toThrowError(TomlError)
	expect(() => parseKey('"uwu"\n.owo')).toThrowError(TomlError)
	expect(() => parseKey('uwu\n')).toThrowError(TomlError)
	expect(() => parseKey('"uwu')).toThrowError(TomlError)

	expect(() => parseKey('uwu."owo"hehe')).toThrowError(TomlError)
})
