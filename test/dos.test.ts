import { it, expect } from 'vitest'
import { parse } from '../src/parse.js'
import { stringify } from '../src/stringify.js'
import { TomlError } from '../src/error.js'

const EVIL_STRING = 'e=' + '{e='.repeat(9999) + '{}' + '}'.repeat(9999)
const EVIL_OBJECT = JSON.parse('{"e":' + '{"e":'.repeat(9999) + '{}}' + '}'.repeat(9999))

it('should gracefully abort with a proper TomlError when parsing very deep documents', () => {
	expect(() => parse(EVIL_STRING)).toThrow(TomlError)
})

it('should gracefully abort with a proper error when stringifying very deep objects', () => {
	expect(() => stringify(EVIL_OBJECT)).toThrow('Could not stringify the object')
})
