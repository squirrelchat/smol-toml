import { it, expect } from 'vitest'
import { parseArray } from '../src/struct.js'

it('parses arrays', () => {
	expect(parseArray('[ 1, 2, 3 ]', 0)).toStrictEqual([ [ 1, 2, 3 ], 11 ])
	expect(parseArray('[1,2,3]', 0)).toStrictEqual([ [ 1, 2, 3 ], 7 ])
	expect(parseArray('[ "red", "yellow", "green" ]', 0)[0]).toStrictEqual([ 'red', 'yellow', 'green' ])
	expect(parseArray('[ "all", \'strings\', """are the same""", \'\'\'type\'\'\' ]', 0)[0])
		.toStrictEqual([ 'all', 'strings', 'are the same', 'type' ])
})

it('parses arrays of mixed types', () => {
	expect(parseArray('[ 0.1, 0.2, 0.5, 1, 2, 5 ]', 0)[0]).toStrictEqual([ 0.1, 0.2, 0.5, 1, 2, 5 ])
	expect(parseArray('[ 10, "red", false ]', 0)[0]).toStrictEqual([ 10, "red", false ])
})

it('parses nested arrays', () => {
	expect(parseArray('[ [ 1, 2 ], [3, 4, 5] ]', 0)[0]).toStrictEqual([ [ 1, 2 ], [ 3, 4, 5 ] ])
	expect(parseArray('[ [ 1, 2 ], ["a", "b", "c"] ]', 0)[0]).toStrictEqual([ [ 1, 2 ], [ 'a', 'b', 'c' ] ])
})

it('parses inline table values', () => {
	expect(parseArray('[ { a = "uwu", b = 1, c = false } ]', 0)[0]).toStrictEqual([ { a: 'uwu', b: 1, c: false } ])
})

it('handles multiline arrays', () => {
	expect(parseArray('[\n  1, 2, 3\n]', 0)[0]).toStrictEqual([ 1, 2, 3 ])
	expect(parseArray('[\n  1,\n  2\n]', 0)[0]).toStrictEqual([ 1, 2 ])

	expect(parseArray('[\r\n  1, 2, 3\r\n]', 0)[0]).toStrictEqual([ 1, 2, 3 ])
	expect(parseArray('[\r\n  1,\r\n  2\r\n]', 0)[0]).toStrictEqual([ 1, 2 ])
})

it('tolerates trailing commas', () => {
	expect(parseArray('[ 1, 2, 3, ]', 0)[0]).toStrictEqual([ 1, 2, 3 ])
	expect(parseArray('[\n  1,\n  2,\n]', 0)[0]).toStrictEqual([ 1, 2 ])

	expect(parseArray('[\r\n  1,\r\n  2,\r\n]', 0)[0]).toStrictEqual([ 1, 2 ])
})

it('is not bothered by comments', () => {
	expect(parseArray('[\n  1,\n  2, # uwu\n  # hehe 3,\n  4,\n  # owo\n]', 0)[0]).toStrictEqual([ 1, 2, 4 ])
	expect(parseArray('[\r\n  1,\r\n  2, # uwu\r\n  # hehe 3,\r\n  4,\r\n  # owo\r\n]', 0)[0]).toStrictEqual([ 1, 2, 4 ])
})

it('rejects invalid arrays', () => {
	expect(() => parseArray('[ 1,, 2]', 0)).toThrow()
	expect(() => parseArray('[ 1, 2, 3 ', 0)).toThrow()
})

it('consumes only an array and aborts', () => {
	expect(parseArray('[ 1, 2, 3 ]\nnext-value = 10', 0)).toStrictEqual([ [ 1, 2, 3 ], 11 ])
	expect(parseArray('[ { a = "uwu", b = 1, c = false, d = [ 1 ] } ]\nnext-value = 10', 0))
		.toStrictEqual([ [ { a: 'uwu', b: 1, c: false, d: [ 1 ] } ], 46 ])
})
