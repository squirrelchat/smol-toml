import { it, expect } from 'vitest'
import { parse } from '../src/index.js'

it('parses a simple key-value', () => {
	expect(parse('key = "value"')).toStrictEqual({ key: 'value' })
	expect(parse('key = "value"\nother = 1')).toStrictEqual({ key: 'value', other: 1 })
	expect(parse('key = "value"\r\nother = 1')).toStrictEqual({ key: 'value', other: 1 })
	expect(parse('key = "value"\rother = 1')).toStrictEqual({ key: 'value', other: 1 })
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
	expect(() => parse('key = # INVALID')).toThrow()
})

it('rejects invalid keys', () => {
	expect(() => parse('key."uwu"owo = test')).toThrow()
})

it('rejects multiple key-values on a single line', () => {
	expect(() => parse('first = "Tom" last = "Preston-Werner" # INVALID')).toThrow()
})

it('rejects invalid strings', () => {
	expect(() => parse('first = "To\nm"')).toThrow()
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
	expect(() => parse('[test\nuwu = test')).toThrow()
})

it('rejects invalid tables', () => {
	expect(() => parse('[key."uwu"owo]')).toThrow()
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

[x]
`.trim()

	expect(parse(doc)).toStrictEqual({
		x: { y: { z: { w: {} } } }
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

it('rejects duplicate tables', () => {
	const doc = `
[fruit]
apple = "red"

[fruit]
orange = "orange"
`.trim()

	expect(() => parse(doc)).toThrow()
})

it('rejects duplicate tables (dotted keys)', () => {
	const doc = `
[fruit]
apple.color = "red"

[fruit.apple]
kind = "granny smith"
`.trim()

	expect(() => parse(doc)).toThrow()
})

it('rejects tables overriding a defined value', () => {
	const doc = `
[fruit]
apple = "red"

[fruit.apple]
texture = "smooth"
`.trim()

	expect(() => parse(doc)).toThrow()
})

it('rejects tables overriding a defined value (inline table)', () => {
	const doc = `
[fruit]
apple = { uwu = "owo" }

[fruit.apple]
texture = "smooth"
`.trim()

	expect(() => parse(doc)).toThrow()
})


it('rejects tables overriding a defined value (inline table inner)', () => {
	const doc = `
[fruit]
apple = { uwu = "owo" }

[fruit.apple.hehe]
texture = "smooth"
`.trim()

	expect(() => parse(doc)).toThrow()
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

	expect(() => parse(doc)).toThrow()
})

it('does not allow redefining a statically defined array', () => {
	const doc = `
fruits = []

[[fruits]]
`.trim()

	expect(() => parse(doc)).toThrow()
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

	expect(() => parse(doc)).toThrow()
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

	expect(() => parse(doc)).toThrow()
})
