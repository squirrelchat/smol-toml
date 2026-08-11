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
import { extractValue } from '../src/extract.ts'
import { TomlError } from '../src/error.ts'

it('parses booleans', () => {
	expect(extractValue({ s: 'true', p: 0, d: 0 }, undefined, false)).toBe(true)
	expect(extractValue({ s: 'false', p: 0, d: 0 }, undefined, false)).toBe(false)

	expect(() => extractValue({ s: 'True', p: 0, d: 0 }, undefined, false)).toThrow(TomlError)
})

it('extracts value of correct type', () => {
	{
		const ctx = { s: '[ 1, 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual(1)
		expect(ctx.p).toBe(3)
	}
	{
		const ctx = { s: '[ "uwu", 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual('uwu')
		expect(ctx.p).toBe(7)
	}
	{
		const ctx = { s: '[ {}, 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual({})
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = { s: '[ 2 ]', p: 2, d: 10 }
		expect(extractValue(ctx, 0x5d /* ] */, false)).toStrictEqual(2)
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = { s: '2\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual(2)
		expect(ctx.p).toBe(1)
	}

	{
		const ctx = { s: '"""uwu"""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('uwu')
		expect(ctx.p).toBe(9)
	}
	{
		const ctx = { s: '"""this is a "multiline string""""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('this is a "multiline string"')
		expect(ctx.p).toBe(34)
	}
	{
		const ctx = { s: '"""this is a "multiline string"""""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('this is a "multiline string""')
		expect(ctx.p).toBe(35)
	}
	{
		const ctx = { s: '"uwu""\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('uwu')
		expect(ctx.p).toBe(5)
	}

	{
		const ctx = { s: '"\\\\"\n', p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('\\')
		expect(ctx.p).toBe(4)
	}
	{
		const ctx = { s: "'uwu\\'", p: 0, d: 10 }
		expect(extractValue(ctx, undefined, false)).toStrictEqual('uwu\\')
		expect(ctx.p).toBe(6)
	}
})
