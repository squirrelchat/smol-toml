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
import type { IntegersAsBigInt } from '../src/util.ts'
import { parseValue as _parseValue } from '../src/primitive.ts'
import { TomlError } from '../src/error.ts'
import { TomlDate } from '../src/date.ts'

function parseValue(str: string, iab: IntegersAsBigInt) {
	return _parseValue({ s: str, p: 0, d: 0 }, iab, undefined)
}

it('parses datetimes', () => {
	expect(parseValue('1979-05-27T07:32:00', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T00:32:00.999999', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999'))
	expect(parseValue('1979-05-27T07:32:00Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32:00-07:00', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
	expect(parseValue('1979-05-27T00:32:00.999999-07:00', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00.999999-07:00'))
	expect(parseValue('1979-05-27T07:32', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00'))
	expect(parseValue('1979-05-27T07:32Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
	expect(parseValue('1979-05-27T00:32-07:00', false)).toStrictEqual(new TomlDate('1979-05-27T00:32:00-07:00'))
})

it('parses datetimes with a space instead of T', () => {
	expect(parseValue('1979-05-27 07:32:00Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses datetimes with lowercase T', () => {
	expect(parseValue('1979-05-27t07:32:00Z', false)).toStrictEqual(new TomlDate('1979-05-27T07:32:00Z'))
})

it('parses dates', () => {
	expect(parseValue('1979-05-27', false)).toStrictEqual(new TomlDate('1979-05-27'))
})

it('parses times', () => {
	expect(parseValue('07:32:00', false)).toStrictEqual(new TomlDate('07:32:00'))
	expect(parseValue('00:32:00.999999', false)).toStrictEqual(new TomlDate('00:32:00.999999'))
	expect(parseValue('07:32', false)).toStrictEqual(new TomlDate('07:32:00'))
})

it('rejects invalid dates', () => {
	expect(() => parseValue('07:3:00', false)).toThrow(TomlError)
	expect(() => parseValue('27-05-1979', false)).toThrow(TomlError)
})

it('handles extreme datetimes', () => {
	expect(parseValue('0001-01-01 00:00:00Z', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00Z'))
	expect(parseValue('0001-01-01 00:00:00', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01 00:00Z', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01 00:00', false)).toStrictEqual(new TomlDate('0001-01-01 00:00:00'))
	expect(parseValue('0001-01-01', false)).toStrictEqual(new TomlDate('0001-01-01'))

	expect(parseValue('9999-12-31 23:59:59Z', false)).toStrictEqual(new TomlDate('9999-12-31 23:59:59Z'))
	expect(parseValue('9999-12-31 23:59:59', false)).toStrictEqual(new TomlDate('9999-12-31 23:59:59'))
	expect(parseValue('9999-12-31', false)).toStrictEqual(new TomlDate('9999-12-31'))
})
