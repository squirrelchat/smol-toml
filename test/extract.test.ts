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
import { extractValue } from '../src/extract.js'

it('extracts value of correct type', () => {
	expect(extractValue('[ 1, 2 ]', 2, ']')).toStrictEqual([ 1, 4 ])
	expect(extractValue('[ "uwu", 2 ]', 2, ']')).toStrictEqual([ 'uwu', 8 ])
	expect(extractValue('[ {}, 2 ]', 2, ']')).toStrictEqual([ {}, 5 ])
	expect(extractValue('[ 2 ]', 2, ']')).toStrictEqual([ 2, 4 ])
	expect(extractValue('2\n', 0)).toStrictEqual([ 2, 1 ])

	expect(extractValue('"""uwu"""\n', 0)).toStrictEqual([ 'uwu', 9 ])
	expect(extractValue('"""this is a "multiline string""""\n', 0)).toStrictEqual([ 'this is a "multiline string"', 34 ])
	expect(extractValue('"""this is a "multiline string"""""\n', 0)).toStrictEqual([ 'this is a "multiline string""', 35 ])
	expect(extractValue('"uwu""\n', 0)).toStrictEqual([ 'uwu', 5 ])

	expect(extractValue('"\\\\"\n', 0)).toStrictEqual([ '\\', 4 ])
	expect(extractValue("'uwu\\'", 0)).toStrictEqual([ 'uwu\\', 6 ])
})
