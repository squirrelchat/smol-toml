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

import { inspect } from 'node:util'
import { describe, it, expect } from 'vitest'
import { parse } from '../src/parse.ts'
import { TomlError } from '../src/error.ts'

it('parses a simple key-value', () => {
	expect(parse('key = "value"'))
		.toStrictEqual({ __proto__: null, key: 'value' })

	expect(parse('key = "value"\nother = 1'))
		.toStrictEqual({ __proto__: null, key: 'value', other: 1 })

	expect(parse('key = "value"\r\nother = 1'))
		.toStrictEqual({ __proto__: null,  key: 'value', other: 1 })
})

it('parses dotted key-values', () => {
	expect(parse('fruit.apple.color = "red"\nfruit.apple.taste.sweet = true')).toStrictEqual({
		__proto__: null,
		fruit: {
			__proto__: null,
			apple: {
				__proto__: null,
				color: 'red',
				taste: {
					__proto__: null,
					sweet: true,
				},
			},
		},
	})
})

it('handles comments', () => {
	const doc = `
# This is a full-line comment
key = "value"  # This is a comment at the end of a line
another = "# This is not a comment"
`.trim()

	expect(parse(doc)).toStrictEqual({ __proto__: null, key: 'value', another: '# This is not a comment' })
})

it('handles escapes in strings', () => {
	expect(parse('key = "value \\" value"')).toStrictEqual({ __proto__: null, key: 'value " value' })

	// Reference: https://github.com/squirrelchat/smol-toml/issues/37
	expect(parse('key = "value \\\\\\" value"')).toStrictEqual({ __proto__: null, key: 'value \\" value' })
	expect(parse('key = "value \\\\\\\\\\" value"')).toStrictEqual({ __proto__: null, key: 'value \\\\" value' })

	// Reference: https://github.com/squirrelchat/smol-toml/issues/45
	expect(parse('key = "\\\\"')).toStrictEqual({ __proto__: null, key: '\\' })
	expect(parse('key = "\\\\\\\\"')).toStrictEqual({ __proto__: null, key: '\\\\' })
	expect(parse('key = "\\\\\\\\\\\\"')).toStrictEqual({ __proto__: null, key: '\\\\\\' })

	expect(parse('key = ["\\\\"]')).toStrictEqual({ __proto__: null, key: ['\\'] })
	expect(parse('key = ["\\\\\\\\"]')).toStrictEqual({ __proto__: null, key: ['\\\\'] })
	expect(parse('key = ["\\\\\\\\\\\\"]')).toStrictEqual({ __proto__: null, key: ['\\\\\\'] })
})

it('rejects unspecified values', () => {
	expect(() => parse('key = # INVALID')).toThrow(TomlError)
})

it('rejects invalid keys', () => {
	expect(() => parse('key."uwu"owo = test')).toThrow(TomlError)
})

it('rejects multiple key-values on a single line', () => {
	expect(() => parse('first = "Tom" last = "Preston-Werner" # INVALID')).toThrow(/each key-value declaration must be followed by an end-of-line/)
	expect(() => parse('first = "Tom" \rlast = "Preston-Werner" # INVALID')).toThrow(/each key-value declaration must be followed by an end-of-line/)
	expect(() => parse('a = [] b = 0 # INVALID')).toThrow(/each key-value declaration must be followed by an end-of-line/)
	expect(() => parse('a = {} b = 0 # INVALID')).toThrow(/each key-value declaration must be followed by an end-of-line/)
})

it('rejects invalid strings', () => {
	expect(() => parse('first = "To\nm"')).toThrow(TomlError)
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
		__proto__: null,
		'table-1': { __proto__: null, key1: 'some string', key2: 123 },
		'table-2': { __proto__: null, key1: 'another string', key2: 456 },
	})

	expect(parse('[uwu]\nx = 1')).toStrictEqual({ __proto__: null, uwu: { __proto__: null, x: 1 } })
	expect(parse('[uwu]  \nx = 1')).toStrictEqual({ __proto__: null, uwu: { __proto__: null, x: 1 } })
})

it('rejects unfinished tables', () => {
	expect(() => parse('[test\nuwu = test')).toThrow(TomlError)
})

it('rejects invalid tables', () => {
	expect(() => parse('[key."uwu"owo]')).toThrow(TomlError)
})

it('parses docs with dotted table and dotted keys', () => {
	const doc = `
[dog."tater.man"]
type.name = "pug"
`.trim()

	expect(parse(doc)).toStrictEqual({ __proto__: null, dog: { __proto__: null, 'tater.man': { __proto__: null, type: { __proto__: null, name: 'pug' } } } })
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
		__proto__: null,
		a: { __proto__: null, b: { __proto__: null, c: { __proto__: null, uwu: 'owo' } } },
		d: { __proto__: null, e: { __proto__: null, f: { __proto__: null, uwu: 'owo' } } },
		g: { __proto__: null, h: { __proto__: null, i: { __proto__: null, uwu: 'owo' } } },
		j: { __proto__: null, ʞ: { __proto__: null, l: { __proto__: null, uwu: 'owo' } } },
	})
})

it('handles empty tables', () => {
	expect(parse('[uwu]\n')).toStrictEqual({ __proto__: null, uwu: { __proto__: null } })
})

it('lets super table be defined afterwards', () => {
	const doc = `
[x.y.z.w]
a = 0

[x]
b = 0
`.trim()

	expect(parse(doc)).toStrictEqual({
		__proto__: null,
		x: {
			__proto__: null,
			b: 0,
			y: {
				__proto__: null,
				z: {
					__proto__: null,
					w: { __proto__: null, a: 0 },
				},
			},
		},
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
		__proto__: null,
		fruit: {
			__proto__: null,
			apple: {
				__proto__: null,
				color: 'red',
				taste: {
					__proto__: null,
					sweet: true,
				},
				texture: {
					__proto__: null,
					smooth: true,
				},
			},
		},
	})
})

it('rejects tables overriding a defined value', () => {
	const doc = `
[fruit]
apple = "red"

[fruit.apple]
texture = "smooth"
`.trim()

	expect(() => parse(doc)).toThrow(TomlError)
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
		__proto__: null,
		products: [
			{ __proto__: null, name: 'Hammer', sku: 738594937 },
			{ __proto__: null },
			{ __proto__: null, name: 'Nail', sku: 284758393, color: 'gray' },
		],
	})

	expect(parse('[[uwu]]\nx = 1')).toStrictEqual({ __proto__: null, uwu: [{ __proto__: null, x: 1 }] })
	expect(parse('[[uwu]]  \nx = 1')).toStrictEqual({ __proto__: null, uwu: [{ __proto__: null, x: 1 }] })
})

it('rejects invalid arrays of table', () => {
	expect(() => parse('[[uwu]\nx = 1')).toThrow(/expected end of table array declaration/)
	expect(() => parse('[[uwu] ]\nx = 1')).toThrow(/expected end of table array declaration/)
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
		__proto__: null,
		fruits: [
			{
				__proto__: null,
				name: 'apple',
				physical: {
					__proto__: null,
					color: 'red',
					shape: 'round',
					cute: { __proto__: null, uwu: true },
				},
				varieties: [{ __proto__: null, name: 'red delicious' }, { __proto__: null, name: 'granny smith' }],
			},
			{
				__proto__: null,
				name: 'banana',
				varieties: [{ __proto__: null, name: 'plantain' }],
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

	expect(() => parse(doc)).toThrow(TomlError)
})

it('does not allow redefining a statically defined array', () => {
	const doc = `
fruits = []

[[fruits]]
`.trim()

	expect(() => parse(doc)).toThrow(TomlError)
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

	expect(() => parse(doc)).toThrow(TomlError)
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

	expect(() => parse(doc)).toThrow(TomlError)
})

describe('table clashes', () => {
	it('does not allow redefining a table', () => {
		const doc = `
[fruit]
apple = "red"

[fruit]
orange = "orange"
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('does not allow dotted keys to redefine tables', () => {
		const doc = `
[a.b.c]
  z = 9
[a]
  b.c.t = 9
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('does not allow redefining tables with [table]', () => {
		const doc = `
[fruit]
apple.color = "red"

[fruit.apple]
kind = "granny smith"
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('does not allow clashes between [[table]] and [table]', () => {
		const doc = `
[[uwu]]
[uwu]
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('does not allow clashes between [[table.a]] and a dotted key within [table]', () => {
		const doc = `
[[uwu.owo]]

[uwu]
owo.hehe = "meow!"
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('does not allow clashes between [table] and [[table]]', () => {
		const doc = `
[uwu]
[[uwu]]
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('rejects tables overriding a defined value (inline table)', () => {
		const doc = `
[fruit]
apple = { uwu = "owo" }

[fruit.apple]
texture = "smooth"
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
	})

	it('rejects tables overriding a defined value (inline table inner)', () => {
		const doc = `
[fruit]
apple = { uwu = "owo" }

[fruit.apple.hehe]
texture = "smooth"
`.trim()

		expect(() => parse(doc)).toThrow(TomlError)
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
			__proto__: null,
			uwu: [{ __proto__: null, owo: { __proto__: null, hehe: true } }, { __proto__: null, owo: { __proto__: null, hehe: true } }],
		})
	})

	it('does NOT reject duplicate [tables] when the table was originally defined as an array', () => {
		const doc = `
[[uwu.owo]]
hehe = true

[[uwu.owo]]
hehe = false

[uwu]
meow = "nya"
`.trim()

		expect(parse(doc)).toStrictEqual({
			__proto__: null,
			uwu: {
				__proto__: null,
				owo: [{ __proto__: null, hehe: true }, { __proto__: null, hehe: false }],
				meow: 'nya',
			},
		})
	})
})

describe('JS\'s quirky props', () => {
	const nullproto = (obj: any) => {
		Object.setPrototypeOf(obj, null)
		for (const v of Object.values(obj))
			if (typeof v === 'object' && !Array.isArray(obj))
				nullproto(v)
		return obj
	}

	const mkobj = (json: string) => nullproto(JSON.parse(json))

	it('assigns special JS props properly', () => {
		expect(parse('a = 1\n__proto__ = 3', { unsafeKeyBehaviour: 'keep' })).toStrictEqual(mkobj('{"a":1,"__proto__":3}'))
		expect(parse('a = 1\n__proto__.uwu = "owo"', { unsafeKeyBehaviour: 'keep' })).toStrictEqual(mkobj('{"a":1,"__proto__":{"uwu":"owo"}}'))
		expect(parse('a = 1\nconstructor = false', { unsafeKeyBehaviour: 'keep' })).toStrictEqual(mkobj('{"a":1,"constructor":false}'))
		expect(parse('a = 1\nprototype = false', { unsafeKeyBehaviour: 'keep' })).toStrictEqual(mkobj('{"a":1,"prototype":false}'))
		expect(parse('a = 1\nhasOwnProperty = false', { unsafeKeyBehaviour: 'keep' })).toStrictEqual(mkobj('{"a":1,"hasOwnProperty":false}'))

		const doc = `
[t1.__proto__]
a = 1

[t2.constructor]
a = 1

[t3.a]
__proto__ = 1

[t4.a]
constructor = 1

[t5]
t5-1 = { __proto__ = { a = 1, b = 2 }, c = 3 }
t5-2 = { constructor = { a = 1, b = 2 }, c = 3 }
t5-3 = { a = { __proto__ = 1, b = 2 }, c = 3 }
t5-4 = { a = { constructor = 1, b = 2 }, c = 3 }
`.trim()

		const expected = `
{
	"t1": { "__proto__": { "a": 1 } },
	"t2": { "constructor": { "a": 1 } },
	"t3": { "a": { "__proto__": 1 } },
	"t4": { "a": { "constructor": 1 } },
	"t5": {
		"t5-1": { "__proto__": { "a": 1, "b": 2 }, "c": 3 },
		"t5-2": { "constructor": { "a": 1, "b": 2 }, "c": 3 },
		"t5-3": { "a": { "__proto__": 1, "b": 2 }, "c": 3 },
		"t5-4": { "a": { "constructor": 1, "b": 2 }, "c": 3 }
	}
}
`.trim()

		// toStrictEqual itself is getting confused at our whack object lmao
		// expect(parse(doc, { unsafeKeyBehaviour: 'keep' })).toStrictEqual(mkobj(expected))
		const expectedInspect = inspect(parse(doc, { unsafeKeyBehaviour: 'keep' }))
		const actualInspect = inspect(mkobj(expected))
		expect(actualInspect).toBe(expectedInspect)
	})

	it('drops special JS props', () => {
		expect(parse('a = 1\n__proto__ = 3', { unsafeKeyBehaviour: 'drop' })).toStrictEqual(mkobj('{"a":1}'))
		expect(parse('a = 1\n__proto__.uwu = "owo"', { unsafeKeyBehaviour: 'drop' })).toStrictEqual(mkobj('{"a":1}'))
		expect(parse('a = 1\nconstructor = false', { unsafeKeyBehaviour: 'drop' })).toStrictEqual(mkobj('{"a":1}'))
		expect(parse('a = 1\nprototype = false', { unsafeKeyBehaviour: 'drop' })).toStrictEqual(mkobj('{"a":1,"prototype":false}'))
		expect(parse('a = 1\nhasOwnProperty = false', { unsafeKeyBehaviour: 'drop' })).toStrictEqual(mkobj('{"a":1,"hasOwnProperty":false}'))

		const doc = `
[t1.__proto__]
a = 1

[t2.constructor]
a = 1

[t3.a]
__proto__ = 1

[t4.a]
constructor = 1

[t5]
t5-1 = { __proto__ = { a = 1, b = 2 }, c = 3 }
t5-2 = { constructor = { a = 1, b = 2 }, c = 3 }
t5-3 = { a = { __proto__ = 1, b = 2 }, c = 3 }
t5-4 = { a = { constructor = 1, b = 2 }, c = 3 }
`.trim()

		const expected = `
{
	"t1": {},
	"t2": {},
	"t3": { "a": {} },
	"t4": { "a": {} },
	"t5": {
		"t5-1": { "c": 3 },
		"t5-2": { "c": 3 },
		"t5-3": { "a": { "b": 2 }, "c": 3 },
		"t5-4": { "a": { "b": 2 }, "c": 3 }
	}
}
`.trim()

		expect(parse(doc, { unsafeKeyBehaviour: 'drop' })).toStrictEqual(mkobj(expected))
	})

	it('rejects special JS props', () => {
		expect(() => parse('a = 1\n__proto__ = 3', { unsafeKeyBehaviour: 'throw' })).toThrow(TomlError)
		expect(() => parse('a = 1\n__proto__.uwu = "owo"', { unsafeKeyBehaviour: 'throw' })).toThrow(TomlError)
		expect(() => parse('a = 1\nconstructor = false', { unsafeKeyBehaviour: 'throw' })).toThrow(TomlError)
		expect(parse('a = 1\nprototype = false', { unsafeKeyBehaviour: 'throw' })).toStrictEqual(mkobj('{"a":1,"prototype":false}'))
		expect(parse('a = 1\nhasOwnProperty = false', { unsafeKeyBehaviour: 'throw' })).toStrictEqual(mkobj('{"a":1,"hasOwnProperty":false}'))

		const doc = `
[t1.__proto__]
a = 1

[t2.constructor]
a = 1

[t3.a]
__proto__ = 1

[t4.a]
constructor = 1

[t5]
t5-1 = { __proto__ = { a = 1, b = 2 }, c = 3 }
t5-2 = { constructor = { a = 1, b = 2 }, c = 3 }
t5-3 = { a = { __proto__ = 1, b = 2 }, c = 3 }
t5-4 = { a = { constructor = 1, b = 2 }, c = 3 }
`.trim()

		expect(() => parse(doc, { unsafeKeyBehaviour: 'throw' })).toThrow(TomlError)
	})
})
