import { it, expect } from 'vitest'
import { indexOfNewline, skipVoid, skipUntil } from '../src/util.js'

it('gives the index of next line', () => {
	expect(indexOfNewline('test\n')).toBe(4)
	expect(indexOfNewline('test\r\n')).toBe(4)
	expect(indexOfNewline('test\ruwu\n')).toBe(4)
	expect(indexOfNewline('test\ruwu\n', 5)).toBe(8)
	expect(indexOfNewline('test')).toBe(-1)
})

it('skips whitespace', () => {
	expect(skipVoid('    uwu', 0)).toBe(4)
	expect(skipVoid('    uwu', 2)).toBe(4)
	expect(skipVoid('\t uwu', 0)).toBe(2)
	expect(skipVoid('uwu', 0)).toBe(0)
	expect(skipVoid('\r\nuwu', 0)).toBe(2)
})

it('skips whitespace but not newlines', () => {
	expect(skipVoid('    uwu', 0, true)).toBe(4)
	expect(skipVoid('\r\nuwu', 0, true)).toBe(0)
})

it('skips comments', () => {
	expect(skipVoid('    # this is a comment\n   uwu', 0)).toBe(27)
	expect(skipVoid('    # this is a comment\n   uwu', 0, true)).toBe(23)
})

it('skips until the next valuable token', () => {
	expect(skipUntil('[ 3, 4, ]', 1, ']')).toBe(4)
	expect(skipUntil('[ 3, 4, ]', 4, ']')).toBe(7)
	expect(skipUntil('[ 3, 4, ]', 7, ']')).toBe(8)

	expect(skipUntil('[ [ 1, 2 ], [ 3, 4 ] ]', 6, ']')).toBe(9)
})

it('requires the presence of the final token', () => {
	expect(() => skipUntil('[ 3, 4, ', 1, ']')).toThrow()
	expect(() => skipUntil('[ [ 3 ], 4, ', 8, ']')).toThrow()
})
