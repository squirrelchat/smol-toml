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
import { extractValue } from './extract.js'
import { type TomlPrimitive, skipVoid } from './util.js'
import TomlError from './error.js'

const enum Type { DOTTED, EXPLICIT, ARRAY }

type MetaState = { t: Type, d: boolean, i: number, c: MetaRecord }
type MetaRecord = { [k: string]: MetaState }
type PeekResult = [ string, Record<string, TomlPrimitive>, MetaRecord ] | null

function peekTable (key: string[], table: Record<string, TomlPrimitive>, meta: MetaRecord, type: Type): PeekResult {
	let t: any = table
	let m = meta
	let k: string
	let hasOwn = false
	let state: MetaState

	for (let i = 0; i < key.length; i++) {
		if (i) {
			t = hasOwn! ? t[k!] : (t[k!] = {})
			m = (state = m[k!]!).c

			if (type === Type.DOTTED && state.t === Type.EXPLICIT) {
				return null
			}

			if (state.t === Type.ARRAY) {
				let l = t.length - 1
				t = t[l]
				m = m[l]!.c
			}
		}

		k = key[i]!
		if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === Type.DOTTED && m[k]?.d) {
			return null
		}

		if (!hasOwn) {
			if (k === '__proto__') {
				Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true })
				Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true })
			}

			m[k] = {
				t: i < key.length - 1 && type === Type.ARRAY
					? Type.DOTTED
					: type,
				d: false,
				i: 0,
				c: {},
			}
		}
	}

	state = m[k!]!
	if (state.t !== type) {
		// Bad key type!
		return null
	}

	if (type === Type.ARRAY) {
		if (!state.d) {
			state.d = true
			t[k!] = []
		}

		t[k!].push(t = {})
		state.c[state.i++] = (state = { t: Type.EXPLICIT, d: false, i: 0, c: {} })
	}

	if (state.d) {
		// Redefining a table!
		return null
	}

	state.d = true
	if (type === Type.EXPLICIT) {
		t = hasOwn ? t[k!] : (t[k!] = {})
	} else if (type === Type.DOTTED && hasOwn) {
		return null
	}

	return [ k!, t, state.c ]
}

export function parse (toml: string): Record<string, TomlPrimitive> {
	let res = {}
	let meta = {}

	let tbl = res
	let m = meta

	for (let ptr = skipVoid(toml, 0); ptr < toml.length;) {
		if (toml[ptr] === '[') {
			let isTableArray = toml[++ptr] === '['
			let k = parseKey(toml, ptr += +isTableArray, ']')

			if (isTableArray) {
				if (toml[k[1] - 1] !== ']') {
					throw new TomlError('expected end of table declaration', {
						toml: toml,
						ptr: k[1] - 1,
					})
				}

				k[1]++
			}

			let p = peekTable(k[0], res, meta, isTableArray ? Type.ARRAY : Type.EXPLICIT)
			if (!p) {
				throw new TomlError('trying to redefine an already defined table or value', {
					toml: toml,
					ptr: ptr,
				})
			}

			m = p[2]
			tbl = p[1]
			ptr = k[1]
		} else {
			let k = parseKey(toml, ptr)
			let p = peekTable(k[0], tbl, m, Type.DOTTED)
			if (!p) {
				throw new TomlError('trying to redefine an already defined table or value', {
					toml: toml,
					ptr: ptr,
				})
			}

			let v = extractValue(toml, k[1])
			p[1][p[0]] = v[0]
			ptr = v[1]
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
