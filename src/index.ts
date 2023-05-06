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
import { skipVoid, peekTable } from './util.js'

export function parse (toml: string): unknown {
	let res = {}
	let tbl = res
	let seenTables = new Set()
	let seenValues = new Set()

	toml = toml.trim()
	try {
		for (let ptr = skipVoid(toml, 0); ptr < toml.length;) {
			// console.log(res)
			// console.dir(toml.slice(ptr))
			if (toml[ptr] === '[') {
				let isTableArray = toml[ptr + 1] === '['
				let end = toml.indexOf(']', ptr)
				if (end === -1)
					throw [ ptr, 'unfinished table declaration' ]

				let k = parseKey(toml.slice(ptr += +isTableArray + 1, end++), ptr)

				let strKey = k.join('"."')
				if (!isTableArray && seenTables.has(strKey))
					throw [ ptr - 1, 'this table has already been declared' ]

				seenTables.add(strKey)
				let r = peekTable(res, k, seenValues, ptr, true)
				let v = r[1][r[0]]

				if (!v) {
					r[1][r[0]] = (v = isTableArray ? [] : {})
				} else if (isTableArray && !Array.isArray(v)) {
					throw [ ptr - 2, 'this table has already been declared as a normal table' ]
				}

				tbl = v
				if (isTableArray) v.push(tbl = {})

				ptr = end + +isTableArray
			} else {
				ptr = extractKeyValue(toml, ptr, tbl, seenValues)
			}

			ptr = skipVoid(toml, ptr, true)
			if (toml[ptr] && toml[ptr] !== '\n' && toml[ptr] !== '\r') throw [ ptr, 'expected newline' ]
			ptr = skipVoid(toml, ptr)
		}
	} catch (e) {
		if (Array.isArray(e)) {
			let lines = toml.slice(0, e[0]).split(/\r\n|\n|\r/g)
			throw new Error(`Invalid TOML document: ${e[1]} at line ${lines.length + 1}:${lines.pop()!.length + 1}`)
			/* c8 ignore next 3 */
		}
		throw e
	}

	// console.log(res)
	return res
}
