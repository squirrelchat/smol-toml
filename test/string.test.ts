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

import { it, expect } from 'vitest'
import { parseString as _parseString } from '../src/primitive.ts'
import { TomlError } from '../src/error.ts'

function parseString(str: string, ptr: number) {
	const ctx = { s: str, p: ptr, d: 10 }
	const res = _parseString(ctx)
	return [res, ctx.p]
}

it('parses a string', () => {
	expect(parseString('"this is a string"', 0)).toStrictEqual(['this is a string', 18])
	expect(parseString("'this is a string'", 0)).toStrictEqual(['this is a string', 18])
})

it('handles escapes in strings', () => {
	expect(parseString('"uwu \\b uwu"', 0)).toStrictEqual(['uwu \b uwu', 12])
	expect(parseString('"uwu \\t uwu"', 0)).toStrictEqual(['uwu \t uwu', 12])
	expect(parseString('"uwu \\n uwu"', 0)).toStrictEqual(['uwu \n uwu', 12])
	expect(parseString('"uwu \\f uwu"', 0)).toStrictEqual(['uwu \f uwu', 12])
	expect(parseString('"uwu \\r uwu"', 0)).toStrictEqual(['uwu \r uwu', 12])
	expect(parseString('"uwu \\e uwu"', 0)).toStrictEqual(['uwu \x1b uwu', 12])
	expect(parseString('"uwu \\" uwu"', 0)).toStrictEqual(['uwu " uwu', 12])
	expect(parseString('"uwu \\\\ uwu"', 0)).toStrictEqual(['uwu \\ uwu', 12])
	expect(parseString('"uwu \\x61 uwu"', 0)).toStrictEqual(['uwu a uwu', 14])
	expect(parseString('"uwu \\u2764 uwu"', 0)).toStrictEqual(['uwu ❤ uwu', 16])
	expect(parseString('"uwu \\U0001F43F uwu"', 0)).toStrictEqual(['uwu 🐿 uwu', 20])
})

it('ignores escapes in literal strings', () => {
	expect(parseString("'uwu \\ uwu'", 0)).toStrictEqual(['uwu \\ uwu', 11])
})

it('rejects invalid escapes', () => {
	expect(() => parseString('"uwu \\x uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\\' uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\\n uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\ uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"""uwu \\ uwu"""', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\UFFFFFFFF uwu"', 0)).toThrow(TomlError)

	expect(() => parseString('"uwu \\u276 uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\U0001F43 uwu"', 0)).toThrow(TomlError)

	expect(() => parseString('"uwu \\\\\\ uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\\\\\ uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\\\\\\\\\ uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \\\\\\\\\\ uwu"', 0)).toThrow(TomlError)
})

it('rejects control characters', () => {
	expect(() => parseString('"uwu \x00 uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \b uwu"', 0)).toThrow(TomlError)
	expect(() => parseString('"uwu \x1f uwu"', 0)).toThrow(TomlError)
})

it('parses multiline strings', () => {
	expect(parseString('"""this is a\nmultiline string"""', 0)).toStrictEqual(['this is a\nmultiline string', 32])
	expect(parseString("'''this is a\nmultiline string'''", 0)).toStrictEqual(['this is a\nmultiline string', 32])

	expect(parseString('"""this is a "multiline string""""', 0)).toStrictEqual(['this is a "multiline string"', 34])
	expect(parseString("'''this is a 'multiline string''''", 0)).toStrictEqual(["this is a 'multiline string'", 34])
})

it('handles escaped line returns in multiline', () => {
	expect(parseString('"""this is a \\\nmultiline string that has no real linebreak"""', 0)).toStrictEqual(['this is a multiline string that has no real linebreak', 61])
	expect(parseString('"""this is a \\\n\n\n   multiline string that has no real linebreak"""', 0)).toStrictEqual(['this is a multiline string that has no real linebreak', 66])

	expect(parseString('"""this is a \\\r\nmultiline string that has no real linebreak"""', 0)).toStrictEqual(['this is a multiline string that has no real linebreak', 62])
	expect(parseString('"""this is a \\\r\n\r\n\r\n   multiline string that has no real linebreak"""', 0)).toStrictEqual(['this is a multiline string that has no real linebreak', 69])
	expect(parseString('"""this is a \\    \nmultiline string that has no real linebreak"""', 0)).toStrictEqual(['this is a multiline string that has no real linebreak', 65])
})

it('trims initial whitespace in multiline strings', () => {
	expect(parseString('"""\nuwu"""', 0)).toStrictEqual(['uwu', 10])
	expect(parseString('"""\r\nuwu"""', 0)).toStrictEqual(['uwu', 11])

	expect(parseString('"""\nuwu\n"""', 0)).toStrictEqual(['uwu\n', 11])
	expect(() => parseString('"""\ruwu"""', 0)).toThrow()
})
