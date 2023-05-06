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
	expect(parseString('"uwu \\u2764 uwu"')).toBe('uwu ❤ uwu')
	expect(parseString('"uwu \\U0001F43F uwu"')).toBe('uwu 🐿 uwu')
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

	expect(() => parseString('"uwu \\u276 uwu"')).toThrow()
	expect(() => parseString('"uwu \\U0001F43 uwu"')).toThrow()
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
