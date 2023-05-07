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
import TomlError from '../src/error.js'

it('correctly converts pointer to line/column', () => {
	const err1 = new TomlError('unexpected woof!!', {
		toml: 'meow meow woof meow',
		ptr: 'meow meow woof meow'.indexOf('woof'),
	})

	const err2 = new TomlError('unexpected woof!!', {
		toml: 'nya\nmeow meow woof meow',
		ptr: 'nya\nmeow meow woof meow'.indexOf('woof'),
	})

	const err3 = new TomlError('unexpected newline in meowing!!', {
		toml: 'meow meow\nmeow meow',
		ptr: 'meow meow\nmeow meow'.indexOf('\n'),
	})

	expect(err1.line).toBe(1)
	expect(err1.column).toBe(11)
	expect(err2.line).toBe(2)
	expect(err2.column).toBe(11)
	expect(err3.line).toBe(1)
	expect(err3.column).toBe(10)
})

describe('codeblock', () => {
	it('generates properly for 1 line', () => {
		const err = new TomlError('unexpected woof!!', {
			toml: 'meow meow woof meow',
			ptr: 'meow meow woof meow'.indexOf('woof'),
		})

		expect(err.codeblock).toBe('1:  meow meow woof meow\n              ^\n')
	})

	it('generates properly for 2 line (err on line 1)', () => {
		const err = new TomlError('unexpected woof!!', {
			toml: 'meow meow woof meow\nmeow meow meow meow',
			ptr: 'meow meow woof meow\nmeow meow meow meow'.indexOf('woof'),
		})

		expect(err.codeblock).toBe('1:  meow meow woof meow\n              ^\n2:  meow meow meow meow\n')
	})

	it('generates properly for 2 line (err on line 2)', () => {
		const err = new TomlError('unexpected woof!!', {
			toml: 'meow meow meow meow\nmeow meow woof meow',
			ptr: 'meow meow meow meow\nmeow meow woof meow'.indexOf('woof'),
		})

		expect(err.codeblock).toBe('1:  meow meow meow meow\n2:  meow meow woof meow\n              ^\n')
	})

	it('generates properly for 5 line (err on line 3)', () => {
		const err = new TomlError('unexpected woof!!', {
			toml: 'meow meow meow meow\nmeow meow meow meow\nmeow meow woof meow\nmeow meow meow meow\nmeow meow meow meow',
			ptr: 'meow meow meow meow\nmeow meow meow meow\nmeow meow woof meow\nmeow meow meow meow\nmeow meow meow meow'.indexOf('woof'),
		})

		expect(err.codeblock).toBe('2:  meow meow meow meow\n3:  meow meow woof meow\n              ^\n4:  meow meow meow meow\n')
	})

	it('generates properly for 5 line (err on line 1)', () => {
		const err = new TomlError('unexpected woof!!', {
			toml: 'meow meow woof meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow meow meow',
			ptr: 'meow meow woof meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow meow meow'.indexOf('woof'),
		})

		expect(err.codeblock).toBe('1:  meow meow woof meow\n              ^\n2:  meow meow meow meow\n')
	})

	it('generates properly for 5 line (err on line 5)', () => {
		const err = new TomlError('unexpected woof!!', {
			toml: 'meow meow meow meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow woof meow',
			ptr: 'meow meow meow meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow meow meow\nmeow meow woof meow'.indexOf('woof'),
		})

		expect(err.codeblock).toBe('4:  meow meow meow meow\n5:  meow meow woof meow\n              ^\n')
	})
})
