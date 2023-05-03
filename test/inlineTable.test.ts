import { it, expect } from 'vitest'
import { parseInlineTable } from '../src/struct.js'

it('parses inline tables', () => {
	expect(parseInlineTable('{ first = "Tom", last = "Preston-Werner" }', 0))
		.toStrictEqual([ { first: 'Tom', last: 'Preston-Werner' }, 42 ])
	expect(parseInlineTable('{ x = 1, y = 2 }', 0))
		.toStrictEqual([ { x: 1, y: 2 }, 16 ])
	expect(parseInlineTable('{ type.name = "pug", "hehe.owo" = "uwu" }', 0))
		.toStrictEqual([ { type: { name: 'pug' }, 'hehe.owo': 'uwu' }, 41 ])
	expect(parseInlineTable('{}', 0))
		.toStrictEqual([ {}, 2 ])
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
	expect(() => parseInlineTable('{ uwu = false, uwu = true }', 0)).toThrow()
	expect(() => parseInlineTable('{ uwu.hehe = "owo", uwu = false }', 0)).toThrow()
	expect(() => parseInlineTable('{ uwu = "owo", uwu.hehe = false }', 0)).toThrow()
})

it('rejects multiline tables', () => {
	expect(() => parseInlineTable('{ first = "Tom", last = "Preston-Werner"\n}', 0)).toThrow()
	expect(() => parseInlineTable('{\n  first = "Tom",\n  last = "Preston-Werner"\n}', 0)).toThrow()
	expect(() => parseInlineTable('{ first = "Tom", last = \n "Preston-Werner" }', 0)).toThrow()
	expect(() => parseInlineTable('{ first = "Tom" \n, last = "Preston-Werner" }', 0)).toThrow()
	expect(() => parseInlineTable('{ first = "Tom",  last  \n = "Preston-Werner" }', 0)).toThrow()
	expect(() => parseInlineTable('{ test = 0 \n  }', 0)).toThrow()
	expect(() => parseInlineTable('{ test = {} \n  }', 0)).toThrow()
	expect(() => parseInlineTable('{ test = [] \n  }', 0)).toThrow()
})

it('rejects tables that are not finished', () => {
	expect(() => parseInlineTable('{ first = "Tom", last = "Preston-Werner"\n', 0)).toThrow()
	expect(() => parseInlineTable('{', 0)).toThrow()
})

it('rejects invalid tables', () => {
	expect(() => parseInlineTable('{ first = "Tom",, last = "Preston-Werner" }', 0)).toThrow()
	expect(() => parseInlineTable('{ first = "Tom", # }', 0)).toThrow()
	expect(() => parseInlineTable('{ first = "Tom", }', 0)).toThrow()
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
