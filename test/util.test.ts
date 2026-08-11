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

it('gives the index of next line', () => {
	expect(indexOfNewline('test\n')).toBe(4)
	expect(indexOfNewline('test\r\n')).toBe(4)
	expect(indexOfNewline('test\ruwu\n')).toBe(8)
	expect(indexOfNewline('test')).toBe(-1)
})

it('skips whitespace', () => {
	{
		const ctx = { s: '    uwu', p: 0, d: 10 }
		skipVoid(ctx)
		expect(ctx.p).toBe(4)
	}

	{
		const ctx = { s: '    uwu', p: 2, d: 10 }
		skipVoid(ctx)
		expect(ctx.p).toBe(4)
	}

	{
		const ctx = { s: '\t uwu', p: 0, d: 10 }
		skipVoid(ctx)
		expect(ctx.p).toBe(2)
	}

	{
		const ctx = { s: 'uwu', p: 0, d: 10 }
		skipVoid(ctx)
		expect(ctx.p).toBe(0)
	}

	{
		const ctx = { s: '\r\nuwu', p: 0, d: 10 }
		skipVoid(ctx)
		expect(ctx.p).toBe(2)
	}
})

it('skips whitespace but not newlines', () => {
	{
		const ctx = { s: '    uwu', p: 0, d: 10 }
		skipVoid(ctx, true)
		expect(ctx.p).toBe(4)
	}

	{
		const ctx = { s: '\r\nuwu', p: 0, d: 10 }
		skipVoid(ctx, true)
		expect(ctx.p).toBe(0)
	}
})

it('skips comments', () => {
	{
		const ctx = { s: '    # this is a comment\n   uwu', p: 0, d: 10 }
		skipVoid(ctx)
		expect(ctx.p).toBe(27)
	}

	{
		const ctx = { s: '    # this is a comment\n   uwu', p: 0, d: 10 }
		skipVoid(ctx, true)
		expect(ctx.p).toBe(23)
	}
})

it('skips until the next valuable token', () => {
	{
		const ctx = { s: '[ 3, 4, ]', p: 1, d: 10 }
		skipUntil(ctx, 0x2c /* , */, 0x5d /* ] */)
		expect(ctx.p).toBe(3)
	}

	{
		const ctx = { s: '[ 3, 4, ]', p: 4, d: 10 }
		skipUntil(ctx, 0x2c /* , */, 0x5d /* ] */)
		expect(ctx.p).toBe(6)
	}

	{
		const ctx = { s: '[ 3, 4, ]', p: 7, d: 10 }
		skipUntil(ctx, 0x2c /* , */, 0x5d /* ] */)
		expect(ctx.p).toBe(8)
	}

	{
		const ctx = { s: '[ [ 1, 2 ], [ 3, 4 ] ]', p: 6, d: 10 }
		skipUntil(ctx, 0x2c /* , */, 0x5d /* ] */)
		expect(ctx.p).toBe(9)
	}
})
