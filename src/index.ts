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

import { parseKey } from './struct.js'
import { extractKeyValue } from './parse.js'
import { type TomlPrimitive, skipVoid, peekTable } from './util.js'
import TomlError from './error.js'

export { default as TomlDate } from './date.js'

export function parse (toml: string): Record<string, TomlPrimitive> {
	let res = {}
	let tbl = res
	let seenTables = new Set()
	let seenValues = new Set()

	for (let ptr = skipVoid(toml, 0); ptr < toml.length;) {
		if (toml[ptr] === '[') {
			let isTableArray = toml[ptr + 1] === '['
			let end = toml.indexOf(']', ptr)
			if (end === -1)
				throw new TomlError('unfinished table encountered', {
					toml: toml,
					ptr: ptr
				})

			let k = parseKey(toml, ptr += +isTableArray + 1, end++)

			let strKey = k.join('"."')
			if (!isTableArray && seenTables.has(strKey))
				throw new TomlError('trying to redefine an already defined table', {
					toml: toml,
					ptr: ptr - 1
				})

			seenTables.add(strKey)
			let r = peekTable(res, k, seenValues, true)
			if (!r) {
				throw new TomlError('trying to redefine an already defined value', {
					toml: toml,
					ptr: ptr - 1
				})
			}

			let v = r[1][r[0]]

			if (!v) {
				r[1][r[0]] = (v = isTableArray ? [] : {})
			} else if (isTableArray && !Array.isArray(v)) {
				throw new TomlError('trying to define an array of tables, but a table already exists for this identifier', {
					toml: toml,
					ptr: ptr - 2
				})
			}

			tbl = v
			if (isTableArray) v.push(tbl = {})

			ptr = end + +isTableArray
		} else {
			ptr = extractKeyValue(toml, ptr, tbl, seenValues)
		}

		ptr = skipVoid(toml, ptr, true)
		if (toml[ptr] && toml[ptr] !== '\n' && toml[ptr] !== '\r') {
			throw new TomlError('each key-value declaration must be followed by an end-of-line', {
				toml: toml,
				ptr: ptr
			})
		}
		ptr = skipVoid(toml, ptr)
	}

	return res
}
