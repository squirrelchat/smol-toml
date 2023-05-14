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
import { indexOfNewline, skipVoid, skipUntil } from '../src/util.js'
import TomlError from '../src/error.js'

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
	expect(skipUntil('[ 3, 4, ]', 1, ',', ']')).toBe(4)
	expect(skipUntil('[ 3, 4, ]', 4, ',', ']')).toBe(7)
	expect(skipUntil('[ 3, 4, ]', 7, ',', ']')).toBe(8)

	expect(skipUntil('[ [ 1, 2 ], [ 3, 4 ] ]', 6, ',', ']')).toBe(9)
})
