import { it, expect } from 'vitest'
import { extractValue, extractKeyValue } from '../src/parse.js'

it('extracts value of correct type', () => {
	expect(extractValue('[ 1, 2 ]', 2, ']')).toStrictEqual([ 1, 4 ])
	expect(extractValue('[ "uwu", 2 ]', 2, ']')).toStrictEqual([ 'uwu', 8 ])
	expect(extractValue('[ {}, 2 ]', 2, ']')).toStrictEqual([ {}, 5 ])
	expect(extractValue('[ 2 ]', 2, ']')).toStrictEqual([ 2, 4 ])
	expect(extractValue('2\n', 0)).toStrictEqual([ 2, 1 ])

	expect(extractValue('"""uwu"""\n', 0)).toStrictEqual([ 'uwu', 9 ])
	expect(extractValue('"""this is a "multiline string""""\n', 0)).toStrictEqual([ 'this is a "multiline string"', 34 ])
	expect(extractValue('"""this is a "multiline string"""""\n', 0)).toStrictEqual([ 'this is a "multiline string""', 35 ])
	expect(extractValue('"uwu""\n', 0)).toStrictEqual([ 'uwu', 5 ])

	expect(extractValue('"\\\\"\n', 0)).toStrictEqual([ '\\', 4 ])
	expect(extractValue("'uwu\\'", 0)).toStrictEqual([ 'uwu\\', 6 ])
})

it('extracts key-value', () => {
	const tbl = {}
	expect(extractKeyValue('key1 = "uwu"\nkey2 = "owo"\n', 0, tbl, new Set())).toBe(12)
	expect(tbl).toStrictEqual({ key1: 'uwu' })

	expect(extractKeyValue('key1 = "uwu"\nkey2 = "owo"\n', 13, tbl, new Set())).toBe(25)
	expect(tbl).toStrictEqual({ key1: 'uwu', key2: 'owo' })

	expect(extractKeyValue('key1 = "uwu"', 0, {}, new Set())).toBe(12)

	expect(extractKeyValue('key1 = [ 1 ]', 0, {}, new Set())).toBe(12)
	expect(extractKeyValue('key1 = [ 1 ]\n', 0, {}, new Set())).toBe(12)
})

it('rejects multi-line key-value', () => {
	expect(() => extractKeyValue('key1 = \n "uwu"', 0, {}, new Set())).toThrow()
	expect(() => extractKeyValue('key1\n= "uwu"', 0, {}, new Set())).toThrow()
	expect(() => extractKeyValue('key1 =\r "uwu"', 0, {}, new Set())).toThrow()
})

it('extracts valid multi-line key-value', () => {
	const tbl = {}
	extractKeyValue('key1 = """uwu\nowo"""', 0, tbl, new Set())
	expect(tbl).toStrictEqual({ key1: 'uwu\nowo' })
})

it('extracts dotted key-value', () => {
	const tbl = {}
	expect(extractKeyValue('key1.subkey1 = "owo"\n', 0, tbl, new Set())).toBe(20)
	expect(extractKeyValue('key1.subkey2 = "uwu"\n', 0, tbl, new Set())).toBe(20)
	expect(tbl).toStrictEqual({ key1: { subkey1: 'owo', subkey2: 'uwu' } })
})

it('handles inline key-value', () => {
	const tbl = {}
	expect(extractKeyValue('{ key1 = "uwu", key2 = "owo" }', 2, tbl, new Set(), true)).toBe(15)
	expect(extractKeyValue('{ key1 = "uwu", key2 = "owo" }', 16, tbl, new Set(), true)).toBe(28)
	expect(tbl).toStrictEqual({ key1: 'uwu', key2: 'owo' })
})

it('rejects duplicate keys', () => {
	const tbl = { uwu: 10, owo: { hehe: 'cute' } }
	expect(() => extractKeyValue('uwu = "owo"\n', 0, tbl, new Set())).toThrow()
	expect(() => extractKeyValue('uwu.test = "uwu"\n', 0, tbl, new Set())).toThrow()
	expect(() => extractKeyValue('owo = "uwu"\n', 0, tbl, new Set())).toThrow()
})

it('handles comments', () => {
	const tbl = {}

	extractKeyValue('key1 = 3 # comment', 0, tbl, new Set())
	extractKeyValue('key2 = false # comment', 0, tbl, new Set())
	extractKeyValue('key3 = "uwu" # comment', 0, tbl, new Set())
	extractKeyValue('key4 = "uw\\"u" # comment', 0, tbl, new Set())
	extractKeyValue('key5 = """uwu""" # comment', 0, tbl, new Set())
	extractKeyValue("key6 = 'uwu' # comment", 0, tbl, new Set())
	extractKeyValue("key7 = '''uwu''' # comment", 0, tbl, new Set())

	expect(tbl).toStrictEqual({ key1: 3, key2: false, key3: 'uwu', key4: 'uw"u', key5: 'uwu', key6: 'uwu', key7: 'uwu' })
})

it('rejects incomplete key-value', () => {
	expect(() => extractKeyValue('uwu', 0, {}, new Set())).toThrow()
	expect(() => extractKeyValue('uwu.test =\n', 0, {}, new Set())).toThrow()
	expect(() => extractKeyValue('owo =', 0, {}, new Set())).toThrow()
})

it('deals with JS quirks', () => {
	const tbl = {}
	extractKeyValue('__proto__ = 3', 0, tbl, new Set())
	extractKeyValue('prototype = false', 0, tbl, new Set())
	extractKeyValue('hasOwnProperty = false', 0, tbl, new Set())

	expect(tbl).toStrictEqual(JSON.parse('{"__proto__":3,"prototype":false,"hasOwnProperty":false}'))
})

it('respects the immutable property of inline tables', () => {
	const tbl = {}
	const seen = new Set()
	extractKeyValue('uwu = { a = 1 }', 0, tbl, seen)
	expect(() => extractKeyValue('uwu.test = "uwu"\n', 0, tbl, seen)).toThrow()
})

it('gracefully handles invalid multiple key-value on the same line', () => {
	const tbl = {}
	expect(extractKeyValue('first = "Tom" last = "Preston-Werner" # INVALID', 0, tbl, new Set())).toBe(13)
	expect(tbl).toStrictEqual({ first: 'Tom' })
})
