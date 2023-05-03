import { it, expect } from 'vitest'
import { parseString } from '../src/primitive.js'

it('parses a string', () => {
	expect(parseString('"this is a string"')).toBe('this is a string')
	expect(parseString("'this is a string'")).toBe('this is a string')
})

it('handles escapes in strings', () => {
	expect(parseString('"uwu \\b uwu"')).toBe('uwu \b uwu')
	expect(parseString('"uwu \\t uwu"')).toBe('uwu \t uwu')
	expect(parseString('"uwu \\n uwu"')).toBe('uwu \n uwu')
	expect(parseString('"uwu \\f uwu"')).toBe('uwu \f uwu')
	expect(parseString('"uwu \\r uwu"')).toBe('uwu \r uwu')
	expect(parseString('"uwu \\" uwu"')).toBe('uwu " uwu')
	expect(parseString('"uwu \\\\ uwu"')).toBe('uwu \\ uwu')
	expect(parseString('"uwu \\u00e9 uwu"')).toBe('uwu é uwu')
	expect(parseString('"uwu \\U0001F427 uwu"')).toBe('uwu 🐧 uwu')
})

it('ignores escapes in literal strings', () => {
	expect(parseString("'uwu \\ uwu'")).toBe('uwu \\ uwu')
})

it('rejects invalid escapes', () => {
	expect(() => parseString('"uwu \\x uwu"')).toThrow()
	expect(() => parseString('"uwu \\\' uwu"')).toThrow()
	expect(() => parseString('"uwu \\\n uwu"')).toThrow()
	expect(() => parseString('"uwu \\ uwu"')).toThrow()
	expect(() => parseString('"""uwu \\ uwu"""')).toThrow()
	expect(() => parseString('"uwu \\UFFFFFFFF uwu"')).toThrow()

	expect(() => parseString('"uwu \\u00e uwu"')).toThrow()
	expect(() => parseString('"uwu \\U0001F42 uwu"')).toThrow()
})

it('rejects control characters', () => {
	expect(() => parseString('"uwu \x00 uwu')).toThrow()
	expect(() => parseString('"uwu \b uwu"')).toThrow()
	expect(() => parseString('"uwu \x1f uwu"')).toThrow()
})

it('parses multiline strings', () => {
	expect(parseString('"""this is a\nmultiline string"""')).toBe('this is a\nmultiline string')
	expect(parseString("'''this is a\nmultiline string'''")).toBe('this is a\nmultiline string')

	expect(parseString('"""this is a "multiline string""""')).toBe('this is a "multiline string"')
})

it('handles escaped line returns in multiline', () => {
	expect(parseString('"""this is a \\\nmultiline string that has no real linebreak"""')).toBe('this is a multiline string that has no real linebreak')
	expect(parseString('"""this is a \\\n\n\n   multiline string that has no real linebreak"""')).toBe('this is a multiline string that has no real linebreak')

	expect(parseString('"""this is a \\\r\nmultiline string that has no real linebreak"""')).toBe('this is a multiline string that has no real linebreak')
	expect(parseString('"""this is a \\\r\n\r\n\r\n   multiline string that has no real linebreak"""')).toBe('this is a multiline string that has no real linebreak')
	expect(parseString('"""this is a \\    \nmultiline string that has no real linebreak"""')).toBe('this is a multiline string that has no real linebreak')
})

it('trims initial whitespace in multiline strings', () => {
	expect(parseString('"""\nuwu"""')).toBe('uwu')
	expect(parseString('"""\ruwu"""')).toBe('uwu')
	expect(parseString('"""\r\nuwu"""')).toBe('uwu')

	expect(parseString('"""\nuwu\n"""')).toBe('uwu\n')
})
