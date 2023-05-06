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

export function indexOfNewline (str: string, start = 0) {
	for (let i = start; i < str.length; i++) {
		if (str[i] === '\n' || str[i] === '\r')
			return i
	}

	return -1
}

export function skipVoid (str: string, ptr: number, banNewLines?: boolean, banComments?: true): number {
	let c
	while ((c = str[ptr]) === ' ' || c === '\t' || (!banNewLines && (c === '\n' || c === '\r'))) ptr++

	if (banComments || c !== '#') return ptr

	ptr = indexOfNewline(str, ptr)
	return ptr < 0 ? str.length : skipVoid(str, ptr, banNewLines)
}

export function skipUntil (str: string, ptr: number, end?: string) {
	if (!end) {
		ptr = indexOfNewline(str, ptr)
		return ptr < 0 ? str.length : ptr
	}

	let nextEnd = str.indexOf(end, ptr)
	// TODO: point to start of structure instead?
	if (nextEnd < 0) throw [ ptr, `cannot find end of structure "${end}"` ]

	let nextSep = str.indexOf(',', ptr) + 1
	return !nextSep || nextEnd < nextSep ? nextEnd : nextSep
}

let DESCRIPTOR = { enumerable: true, configurable: true, writable: true }
export function peekTable (table: Record<string, any>, key: string[], seen: Set<any>, ptr = 0, allowSuper?: boolean): [ string, Record<string, any> ] {
	let k = ''
	let v
	let hasOwn
	let hadOwn
	for (let i = 0; i < key.length; i++) {
		if (i) {
			if (!(hadOwn = hasOwn)) {
				if (k === '__proto__') Object.defineProperty(table, k, DESCRIPTOR)
				table[k] = {}
			}

			table = table[k]
			if (Array.isArray(table)) table = table[table.length - 1]
		}

		k = key[i]!
		hasOwn = Object.hasOwn(table, k)
		v = hasOwn ? table[k] : void 0
		if (typeof v === 'object' && seen.has(v)) {
			throw [ ptr, 'attempting to set value of an immutable structure' ]
		}
	}

	if (hasOwn && (!allowSuper || (hadOwn && !Array.isArray(v)))) {
		throw [ ptr, 'attempting to override an already defined value' ]
	}

	if (!hasOwn && k === '__proto__') Object.defineProperty(table, k, DESCRIPTOR)
	return [ k, table ]
}
