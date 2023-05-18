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

import { describe, it, expect } from 'vitest'
import { parse } from '../src/index.js'
import TomlError from '../src/error.js'

it('parses a simple key-value', () => {
	expect(parse('key = "value"')).toStrictEqual({ key: 'value' })
	expect(parse('key = "value"\nother = 1')).toStrictEqual({ key: 'value', other: 1 })
	expect(parse('key = "value"\r\nother = 1')).toStrictEqual({ key: 'value', other: 1 })
})

it('parses dotted key-values', () => {
	expect(parse('fruit.apple.color = "red"\nfruit.apple.taste.sweet = true'))
		.toStrictEqual({ fruit: { apple: { color: 'red', taste: { sweet: true } } } })
})

it('handles comments', () => {
	const doc = `
# This is a full-line comment
key = "value"  # This is a comment at the end of a line
another = "# This is not a comment"
`.trim()

	expect(parse(doc)).toStrictEqual({ key: 'value', another: '# This is not a comment' })
})

it('rejects unspecified values', () => {
	expect(() => parse('key = # INVALID')).toThrowError(TomlError)
})

it('rejects invalid keys', () => {
	expect(() => parse('key."uwu"owo = test')).toThrowError(TomlError)
})

it('rejects multiple key-values on a single line', () => {
	expect(() => parse('first = "Tom" last = "Preston-Werner" # INVALID')).toThrowError(TomlError)
})

it('rejects invalid strings', () => {
	expect(() => parse('first = "To\nm"')).toThrowError(TomlError)
})

it('parses docs with tables', () => {
	const doc = `
[table-1]
key1 = "some string"
key2 = 123

[table-2]
key1 = "another string"
key2 = 456
`.trim()

	expect(parse(doc)).toStrictEqual({
		'table-1': { key1: 'some string', key2: 123 },
		'table-2': { key1: 'another string', key2: 456 },
	})
})

it('rejects unfinished tables', () => {
	expect(() => parse('[test\nuwu = test')).toThrowError(TomlError)
})

it('rejects invalid tables', () => {
	expect(() => parse('[key."uwu"owo]')).toThrowError(TomlError)
})

it('parses docs with dotted table and dotted keys', () => {
	const doc = `
[dog."tater.man"]
type.name = "pug"
`.trim()

	expect(parse(doc)).toStrictEqual({ dog: { 'tater.man': { type: { name: 'pug' } } } })
})

it('ignores spaces in keys', () => {
	const doc = `
[a.b.c]            # this is best practice
uwu = "owo"

[ d.e.f ]          # same as [d.e.f]
uwu = "owo"

[ g .  h  . i ]    # same as [g.h.i]
uwu = "owo"

	[ j . "ʞ" . 'l' ]  # same as [j."ʞ".'l']
	uwu = "owo"
`.trim()

	expect(parse(doc)).toStrictEqual({
		a: { b: { c: { uwu: 'owo' } } },
		d: { e: { f: { uwu: 'owo' } } },
		g: { h: { i: { uwu: 'owo' } } },
		j: { 'ʞ': { l: { uwu: 'owo' } } },
	})
})

it('handles empty tables', () => {
	expect(parse('[uwu]\n')).toStrictEqual({ uwu: {} })
})

it('lets super table be defined afterwards', () => {
	const doc = `
[x.y.z.w]
a = 0

[x]
b = 0
`.trim()

	expect(parse(doc)).toStrictEqual({
		x: { b: 0, y: { z: { w: { a: 0 } } } }
	})
})

it('allows adding sub-tables', () => {
	const doc = `[fruit]
apple.color = "red"
apple.taste.sweet = true

[fruit.apple.texture]  # you can add sub-tables
smooth = true
`.trim()

	expect(parse(doc)).toStrictEqual({
		fruit: { apple: { color: 'red', taste: { sweet: true }, texture: { smooth: true } } }
	})
})

it('rejects tables overriding a defined value', () => {
	const doc = `
[fruit]
apple = "red"

[fruit.apple]
texture = "smooth"
`.trim()

	expect(() => parse(doc)).toThrowError(TomlError)
})

it('parses arrays of tables', () => {
	const doc = `
[[products]]
name = "Hammer"
sku = 738594937

[[products]]  # empty table within the array

[[products]]
name = "Nail"
sku = 284758393

color = "gray"
`.trim()

	expect(parse(doc)).toStrictEqual({
		products: [
			{ name: 'Hammer', sku: 738594937 },
			{},
			{ name: 'Nail', sku: 284758393, color: 'gray' },
		]
	})
})

it('rejects invalid arrays of table', () => {
	expect(() => parse('[[uwu] ]')).toThrowError(TomlError)
})

it('parses arrays of tables with subtables', () => {
	const doc = `
[[fruits]]
name = "apple"

[fruits.physical]  # subtable
color = "red"
shape = "round"

[fruits.physical.cute]  # subtable
uwu = true

[[fruits.varieties]]  # nested array of tables
name = "red delicious"

[[fruits.varieties]]
name = "granny smith"


[[fruits]]
name = "banana"

[[fruits.varieties]]
name = "plantain"
`.trim()

	expect(parse(doc)).toStrictEqual({
		fruits: [
		  {
			name: 'apple',
			physical: {
			  color: 'red',
			  shape: 'round',
			  cute: { uwu: true },
			},
			varieties: [
			  { name: 'red delicious' },
			  { name: 'granny smith' },
			]
		  },
		  {
			name: 'banana',
			varieties: [
			  { name: 'plantain' },
			],
		  },
		],
	  })
})

it('rejects subtables of an array of tables if order is reversed', () => {
	const doc = `
[fruit.physical]
color = "red"
shape = "round"

[[fruit]]
name = "apple"
`.trim()

	expect(() => parse(doc)).toThrowError(TomlError)
})

it('does not allow redefining a statically defined array', () => {
	const doc = `
fruits = []

[[fruits]]
`.trim()

	expect(() => parse(doc)).toThrowError(TomlError)
})

it('rejects conflicts between arrays of tables and normal tables (array then simple)', () => {
	const doc = `
[[fruits]]
name = "apple"

[[fruits.varieties]]
name = "red delicious"

[fruits.varieties]
name = "granny smith"
`.trim()

	expect(() => parse(doc)).toThrowError(TomlError)
})

it('rejects conflicts between arrays of tables and normal tables (simple then array)', () => {
	const doc = `
[[fruits]]
name = "apple"

[fruits.physical]
color = "red"
shape = "round"

[[fruits.physical]]
color = "green"
`.trim()

	expect(() => parse(doc)).toThrowError(TomlError)
})

describe('table clashes', () => {
	it('does not allow redefining a table', () => {
		const doc = `
[fruit]
apple = "red"

[fruit]
orange = "orange"
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('does not allow dotted keys to redefine tables', () => {
		const doc = `
[a.b.c]
  z = 9
[a]
  b.c.t = 9
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('does not allow redefining tables with [table]', () => {
		const doc = `
[fruit]
apple.color = "red"

[fruit.apple]
kind = "granny smith"
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('does not allow clashes between [[table]] and [table]', () => {
		const doc = `
[[uwu]]
[uwu]
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('does not allow clashes between [table] and [[table]]', () => {
		const doc = `
[uwu]
[[uwu]]
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('rejects tables overriding a defined value (inline table)', () => {
		const doc = `
[fruit]
apple = { uwu = "owo" }

[fruit.apple]
texture = "smooth"
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('rejects tables overriding a defined value (inline table inner)', () => {
		const doc = `
[fruit]
apple = { uwu = "owo" }

[fruit.apple.hehe]
texture = "smooth"
`.trim()

		expect(() => parse(doc)).toThrowError(TomlError)
	})

	it('does NOT reject duplicate [tables] for arrays of tables', () => {
		const doc = `
[[uwu]]
[uwu.owo]
hehe = true

[[uwu]]
[uwu.owo]
hehe = true
`.trim()

		expect(parse(doc)).toStrictEqual({
			uwu: [
				{ owo: { hehe: true } },
				{ owo: { hehe: true } },
			]
		})
	})
})
