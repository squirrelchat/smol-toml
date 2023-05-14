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

import { parseString, parseValue } from './primitive.js'
import { parseKey, parseArray, parseInlineTable } from './struct.js'
import { type TomlPrimitive, peekTable, indexOfNewline, skipVoid, skipUntil, skipComment, getStringEnd } from './util.js'
import TomlError from './error.js'

function sliceAndTrimEndOf (str: string, startPtr: number, endPtr: number, allowNewLines?: boolean): [ string, number ] {
	let value = str.slice(startPtr, endPtr)

	let newlineIdx
	let commentIdx = value.indexOf('#')
	if (commentIdx > -1) {
		skipComment(str, commentIdx)
		value = value.slice(0, commentIdx)
	}

	let trimmed = value.trimEnd()

	if (!allowNewLines) {
		let s = '\n'
		newlineIdx = value.lastIndexOf('\n')
		if (newlineIdx < 0) newlineIdx = value.lastIndexOf(s = '\r')
		if (trimmed.lastIndexOf(s) !== newlineIdx) {
			throw new TomlError('newlines are not allowed in inline tables', {
				toml: str,
				ptr: startPtr + newlineIdx
			})
		}
	}

	return [ trimmed, commentIdx ]
}

export function extractValue (str: string, ptr: number, end?: string): [ TomlPrimitive, number ] {
	let c = str[ptr]
	if (c === '[' || c === '{') {
		let [ value, endPtr ] = c === '['
			? parseArray(str, ptr)
			: parseInlineTable(str, ptr)

		let newPtr = skipUntil(str, endPtr, ',', end)
		if (end === '}') {
			let nextNewLine = indexOfNewline(str, endPtr, newPtr)
			if (nextNewLine > -1) {
				throw new TomlError('newlines are not allowed in inline tables', {
					toml: str,
					ptr: nextNewLine
				})
			}
		}

		return [ value, newPtr ]
	}

	let endPtr
	if (c === '"' || c === "'") {
		endPtr = getStringEnd(str, ptr)
		return [ parseString(str, ptr, endPtr), endPtr + +(!!end && str[endPtr] === ',') ]
	}

	endPtr = skipUntil(str, ptr, ',', end)
	let slice = sliceAndTrimEndOf(str, ptr, endPtr - (+(str[endPtr - 1] === ',')), end === ']')
	if (!slice[0]) {
		throw new TomlError('incomplete key-value declaration: no value specified', {
			toml: str,
			ptr: ptr
		})
	}

	if (end && slice[1] > -1) {
		endPtr = skipVoid(str, ptr + slice[1])
		endPtr += +(str[endPtr] === ',')
	}

	return [
		parseValue(slice[0], str, ptr),
		endPtr,
	]
}

export function extractKeyValue (str: string, ptr: number, table: Record<string, TomlPrimitive>, seen: Set<any>, isInline?: boolean) {
	// KEY
	let k = parseKey(str, ptr)

	// TABLE
	let t = peekTable(table, k[0], seen)
	if (!t) {
		throw new TomlError('trying to redefine an already defined value', {
			toml: str,
			ptr: k[1]
		})
	}

	// VALUE
	let e = extractValue(str, k[1], isInline ? '}' : void 0)
	t[1][t[0]] = e[0]
	seen.add(e[0])
	return e[1]
}
