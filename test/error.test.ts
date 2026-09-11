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

import { it, describe, expect } from 'vitest'
import { TomlError } from '../src/error.ts'

function tomlWithPtrAt(toml: string, search: string, offset = 0) {
	return { toml, ptr: toml.indexOf(search) + offset }
}

it('correctly converts pointer to line/column', () => {
	const err1 = new TomlError(
		'unexpected woof!!',
		tomlWithPtrAt('meow meow woof meow', 'woof')
	)

	const err2 = new TomlError(
		'unexpected woof!!',
		tomlWithPtrAt('nya\nmeow meow woof meow', 'woof')
	)

	const err3 = new TomlError(
		'unexpected newline in meowing!!',
		tomlWithPtrAt('meow meow\nmeow meow', '\n')
	)

	const err4 = new TomlError(
		'unexpected newline in meowing!!',
		tomlWithPtrAt('meow meow\nmeow meow', '\n', 1)
	)

	const err5 = new TomlError(
		'unexpected newline in meowing!!',
		tomlWithPtrAt('meow meow\r\nmeow meow', '\r')
	)

	const err6 = new TomlError(
		'unexpected newline in meowing!!',
		tomlWithPtrAt('meow meow\r\nmeow meow', '\r', 1)
	)

	const err7 = new TomlError(
		'unexpected newline in meowing!!',
		tomlWithPtrAt('meow meow\r\nmeow meow', '\r', 2)
	)

	expect(err1.line).toBe(1)
	expect(err1.column).toBe(11)
	expect(err2.line).toBe(2)
	expect(err2.column).toBe(11)

	expect(err3.line).toBe(1)
	expect(err3.column).toBe(10)
	expect(err4.line).toBe(2)
	expect(err4.column).toBe(1)

	expect(err5.line).toBe(1)
	expect(err5.column).toBe(10)
	expect(err6.line).toBe(1)
	expect(err6.column).toBe(11)
	expect(err7.line).toBe(2)
	expect(err7.column).toBe(1)
})

describe('codeblock', () => {
	describe.for(['\n', '\r\n'])('%j newline', (nl) => {
		it('generates properly for 1 line', () => {
			const err = new TomlError(
				'unexpected woof!!',
				tomlWithPtrAt(
					`meow meow woof meow`,
					'woof'
				)
			)

			expect(err.codeblock).toBe('1:  meow meow woof meow\n              ^\n')
		})

		it('generates properly for 2 line (err on line 1)', () => {
			const err = new TomlError(
				'unexpected woof!!',
				tomlWithPtrAt(
					`meow meow woof meow${nl}meow meow meow meow`,
					'woof'
				)
			)

			expect(err.codeblock).toBe('1:  meow meow woof meow\n              ^\n2:  meow meow meow meow\n')
		})

		it('generates properly for 2 line (err on line 2)', () => {
			const err = new TomlError(
				'unexpected woof!!',
				tomlWithPtrAt(
					`meow meow meow meow${nl}meow meow woof meow`,
					'woof'
				)
			)

			expect(err.codeblock).toBe('1:  meow meow meow meow\n2:  meow meow woof meow\n              ^\n')
		})

		it('generates properly for 2 line (err on newline sequence)', () => {
			const err = new TomlError(
				'unexpected newline!!',
				tomlWithPtrAt(
					`meow meow meow meow${nl}meow meow meow meow`,
					nl
				)
			)

			expect(err.codeblock).toBe(`1:  meow meow meow meow\n                       ^\n2:  meow meow meow meow\n`)
		})

		it('generates properly for 2 line (err on newline, \\n specifically)', () => {
			const err = new TomlError(
				'unexpected newline!!',
				tomlWithPtrAt(
					`meow meow meow meow${nl}meow meow meow meow`,
					'\n'
				)
			)

			const nlb = ' '.repeat(nl.length)
			expect(err.codeblock).toBe(`1:  meow meow meow meow\n                      ${nlb}^\n2:  meow meow meow meow\n`)
		})

		it('generates properly for 5 line (err on line 3)', () => {
			const err = new TomlError(
				'unexpected woof!!',
				tomlWithPtrAt(
					`meow meow meow meow${nl}meow meow meow meow${nl}meow meow woof meow${nl}meow meow meow meow${nl}meow meow meow meow`,
					'woof'
				)
			)

			expect(err.codeblock).toBe('2:  meow meow meow meow\n3:  meow meow woof meow\n              ^\n4:  meow meow meow meow\n')
		})

		it('generates properly for 5 line (err on line 1)', () => {
			const err = new TomlError(
				'unexpected woof!!',
				tomlWithPtrAt(
					`meow meow woof meow${nl}meow meow meow meow${nl}meow meow meow meow${nl}meow meow meow meow${nl}meow meow meow meow`,
					'woof'
				)
			)

			expect(err.codeblock).toBe('1:  meow meow woof meow\n              ^\n2:  meow meow meow meow\n')
		})

		it('generates properly for 5 line (err on line 5)', () => {
			const err = new TomlError(
				'unexpected woof!!',
				tomlWithPtrAt(
					`meow meow meow meow${nl}meow meow meow meow${nl}meow meow meow meow${nl}meow meow meow meow${nl}meow meow woof meow`,
					'woof'
				)
			)

			expect(err.codeblock).toBe('4:  meow meow meow meow\n5:  meow meow woof meow\n              ^\n')
		})
	})
})
