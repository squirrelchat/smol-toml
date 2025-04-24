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

import { expect, it } from 'vitest'
import { TomlDate } from '../src/date.js'

it('does properly handle date offsets', () => {
	expect(new TomlDate('1979-05-27T07:32:00-08:00')).toEqual(new Date('1979-05-27T07:32:00-08:00'))
	expect(new TomlDate('1979-05-27T07:32:00-08:00')).toEqual(new TomlDate('1979-05-27T08:32:00-07:00'))
	expect(new TomlDate('1979-05-27T07:32:00-08:00')).toEqual(new Date('1979-05-27T08:32:00-07:00'))
	expect(new TomlDate('1979-05-27T07:32:00-08:00')).not.toEqual(new Date('1979-05-27T07:32:00-07:00'))
})

it('handles extreme datetimes', () => {
	expect(new TomlDate('0001-01-01 00:00:00Z').toISOString()).toBe('0001-01-01T00:00:00.000Z')
	expect(new TomlDate('0001-01-01 00:00:00').toISOString()).toBe('0001-01-01T00:00:00.000')
	expect(new TomlDate('0001-01-01').toISOString()).toBe('0001-01-01')

	expect(new TomlDate('9999-12-31 23:59:59Z').toISOString()).toBe('9999-12-31T23:59:59.000Z')
	expect(new TomlDate('9999-12-31 23:59:59').toISOString()).toBe('9999-12-31T23:59:59.000')
	expect(new TomlDate('9999-12-31').toISOString()).toBe('9999-12-31')
})
