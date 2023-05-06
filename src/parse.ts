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
import { peekTable, indexOfNewline, skipUntil, skipVoid } from './util.js'

function getStringEnd (str: string, seek: number) {
	let first = str[seek]!
	let target = first === str[seek + 1] && str[seek + 1] === str[seek + 2]
		? str.slice(seek, seek + 3)
		: first

	do seek = str.indexOf(target, ++seek)
	while (seek > -1 && first !== "'" && str[seek - 1] === '\\' && str[seek - 2] !== '\\')

	seek += target.length
	if (target.length > 1) {
		if (str[seek] === first) seek++
		if (str[seek] === first) seek++
	}

	return seek
}

function trimEndOf (value: string, at: number, allowNewLines?: boolean) {
	let newlineIdx
	let commentIdx = value.indexOf('#', at)
	if (commentIdx > -1) {
		value = value.slice(0, commentIdx)
	}

	let trimmed = value.trimEnd()

	if (!allowNewLines) {
		let s = '\n'
		newlineIdx = value.lastIndexOf('\n')
		if (newlineIdx < 0) newlineIdx = value.lastIndexOf(s = '\r')
		if (trimmed.lastIndexOf(s) !== newlineIdx) throw [ newlineIdx, 'unexpected newline' ]
	}

	return trimmed
}

export function extractValue (str: string, ptr: number, end?: string, allowNewLines?: boolean): [ any, number ] {
	let c = str[ptr], offset
	if (c === '[' || c === '{') {
		let [ value, endPtr ] = c === '['
			? parseArray(str, ptr)
			: parseInlineTable(str, ptr)

		let newPtr = skipUntil(str, endPtr, end)
		if (end && !allowNewLines) {
			let nextNewLine = indexOfNewline(str, ptr)
			if (nextNewLine > endPtr && nextNewLine < newPtr) throw [ nextNewLine, 'unexpected newline' ]
		}

		return [ value, newPtr ]
	}

	let endPtr
	if (c === '"' || c === "'") {
		endPtr = getStringEnd(str, ptr)
		offset = !!end && str[endPtr] === ','
		return [ parseString(str, ptr, endPtr), endPtr + +offset ]
	}

	endPtr = skipUntil(str, ptr, end)
	let valStr = trimEndOf(str.slice(ptr, endPtr - (+(str[endPtr - 1] === ','))), 0, allowNewLines)
	if (!valStr) throw [ ptr, 'expected value' ]

	return [
		parseValue(valStr, ptr),
		endPtr
	]
}

export function extractKeyValue (str: string, ptr: number, table: Record<string, any>, seen: Set<any>, isInline?: boolean) {
	let equalIdx = str.indexOf('=', ptr)
	if (equalIdx < 0) throw [ ptr, 'expected to find equals after the key' ]

	// KEY
	let t = peekTable(table, parseKey(str.slice(ptr, equalIdx)), seen, ptr)

	// VALUE
	ptr = skipVoid(str, equalIdx + 1, true, true)
	if (str[ptr] === '\n' || str[ptr] === '\r') {
		throw [ ptr, 'unexpected newline' ]
	}

	let e = extractValue(str, ptr, isInline ? '}' : void 0)
	t[1][t[0]] = e[0]
	seen.add(e[0])
	return e[1]
}
