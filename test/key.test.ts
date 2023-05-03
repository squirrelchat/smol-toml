import { it, expect } from 'vitest'
import { parseKey } from '../src/struct.js'

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
	expect(() => parseKey('')).toThrow()
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
	expect(() => parseKey('uwu.')).toThrow()
	expect(() => parseKey('éwé')).toThrow()
	expect(() => parseKey('uwu..owo')).toThrow()
	expect(() => parseKey('uwu.\nowo')).toThrow()
	expect(() => parseKey('uwu\n.owo')).toThrow()
	expect(() => parseKey('"uwu"\n.owo')).toThrow()
	expect(() => parseKey('uwu\n')).toThrow()
	expect(() => parseKey('"uwu')).toThrow()

	expect(() => parseKey('uwu."owo"hehe')).toThrow()
})
