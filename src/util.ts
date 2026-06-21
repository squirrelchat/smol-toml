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

import type { TomlDate } from './date.js'
import { TomlError } from './error.js'

export type TomlPrimitive = string | number | bigint | boolean | TomlDate
export type TomlTable = { [key: string]: TomlValue }
export type TomlValue = TomlPrimitive | TomlValue[] | TomlTable

export type TomlTableWithoutBigInt = { [key: string]: TomlValueWithoutBigInt }
export type TomlValueWithoutBigInt = Exclude<TomlPrimitive, bigint> | TomlValueWithoutBigInt[] | TomlTableWithoutBigInt

export function indexOfNewline(str: string, start = 0, end = str.length) {
	let idx = str.indexOf('\n', start)
	if (str[idx - 1] === '\r') idx--
	return idx <= end ? idx : -1
}

export function skipComment(str: string, ptr: number) {
	for (let i = ptr; i < str.length; i++) {
		let c = str[i]!
		if (c === '\n')
			return i

		if (c === '\r' && str[i + 1] === '\n')
			return i + 1

		if ((c < '\x20' && c !== '\t') || c === '\x7f') {
			throw new TomlError('control characters are not allowed in comments', {
				toml: str,
				ptr: ptr,
			})
		}
	}

	return str.length
}

export function skipVoid(str: string, ptr: number, banNewLines?: boolean, banComments?: boolean): number {
	let c
	while (1) {
		while ((c = str[ptr]) === ' ' || c === '\t' || (!banNewLines && (c === '\n' || (c === '\r' && str[ptr + 1] === '\n')))) ptr++

		// Tucking the return statement here would save 5 characters >:)
		// But TypeScript fails to detect there is no way to exit the loop so it complains about the lack of final return
		if (banComments || c !== '#') break

		ptr = skipComment(str, ptr)
	}

	return ptr
}

export function skipUntil(str: string, ptr: number, sep: string, end?: string, banNewLines: boolean = false) {
	if (!end) {
		ptr = indexOfNewline(str, ptr)
		return ptr < 0 ? str.length : ptr
	}

	for (let i = ptr; i < str.length; i++) {
		let c = str[i]
		if (c === '#') {
			i = indexOfNewline(str, i)
		} else if (c === sep) {
			return i + 1
		} else if (c === end || (banNewLines && (c === '\n' || (c === '\r' && str[i + 1] === '\n')))) {
			return i
		}
	}

	throw new TomlError('cannot find end of structure', {
		toml: str,
		ptr: ptr,
	})
}
