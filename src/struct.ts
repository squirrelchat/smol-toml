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

import { parseString } from './primitive.js'
import { extractValue, extractKeyValue } from './parse.js'
import { type TomlPrimitive, indexOfNewline, skipComment } from './util.js'
import TomlError from './error.js'

let KEY_PART_RE = /^[a-zA-Z0-9-_ \t]+$/

export function parseKey (str: string, startPtr = 0, endPtr = str.length): string[] {
	let ptr
	let dot = -1
	let parsed = []

	let key = str.slice(startPtr, endPtr)

	do {
		let c = key[ptr = ++dot]
		// If it's whitespace, ignore
		if (c !== ' ' && c !== '\t') {
			// If it's a string
			if (c === '"' || c === "'") {
				let eos = key.indexOf(c, ptr + 1) + 1
				if (!eos) {
					throw new TomlError('unfinished string encountered', {
						toml: str,
						ptr: ptr
					})
				}

				dot = key.indexOf('.', eos)
				let end = key.slice(eos, dot < 0 ? void 0 : dot)

				let newLine = indexOfNewline(end)
				if (newLine > -1) {
					throw new TomlError('newlines are not allowed in keys', {
						toml: str,
						ptr: ptr + dot + newLine
					})
				}

				if (end.trimStart()) {
					throw new TomlError('found extra tokens after the string part', {
						toml: str,
						ptr: eos
					})
				}

				parsed.push(parseString(key, ptr, eos))
			} else {
				// Normal raw key part consumption and validation
				dot = key.indexOf('.', ptr)
				let part = key.slice(ptr, dot < 0 ? void 0 : dot)
				if (!KEY_PART_RE.test(part)) {
					throw new TomlError('only letter, numbers, dashes and underscores are allowed in keys', {
						toml: str,
						ptr: ptr
					})
				}

				parsed.push(part.trimEnd())
			}
		}
		// Until there's no more dot
	} while (dot + 1)

	return parsed
}

export function parseInlineTable (str: string, ptr: number): [ Record<string, TomlPrimitive>, number ] {
	let res: Record<string, TomlPrimitive> = {}
	let seen = new Set()
	let c: string
	let comma = 0

	ptr++
	while ((c = str[ptr++]!) !== '}' && c) {
		if (c === '\n' || c === '\r') {
			throw new TomlError('newlines are not allowed in inline tables', {
				toml: str,
				ptr: ptr - 1
			})
		}
		else if (c === '#') {
			throw new TomlError('inline tables cannot contain comments', {
				toml: str,
				ptr: ptr - 1
			})
		}
		else if (c === ',') {
			throw new TomlError('expected key-value, found comma', {
				toml: str,
				ptr: ptr - 1
			})
		}
		else if (c !== ' ' && c !== '\t') {
			ptr = extractKeyValue(str, ptr - 1, res, seen, true)
			comma = str[ptr - 1] === ',' ? ptr - 1 : 0
		}
	}

	if (comma) {
		throw new TomlError('trailing commas are not allowed in inline tables', {
			toml: str,
			ptr: comma
		})
	}

	if (!c) {
		throw new TomlError('unfinished table encountered', {
			toml: str,
			ptr: ptr
		})
	}

	return [ res, ptr ]
}

export function parseArray (str: string, ptr: number): [ TomlPrimitive[], number ] {
	let res: TomlPrimitive[] = []
	let c

	ptr++
	while((c = str[ptr++]) !== ']' && c) {
		if (c === ',') {
			throw new TomlError('expected value, found comma', {
				toml: str,
				ptr: ptr - 1
			})
		}

		else if (c === '#') ptr = skipComment(str, ptr)
		else if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') {
			let e = extractValue(str, ptr - 1, ']')
			res.push(e[0])
			ptr = e[1]
		}
	}

	if (!c) {
		throw new TomlError('unfinished array encountered', {
			toml: str,
			ptr: ptr
		})
	}

	return [ res, ptr ]
}
