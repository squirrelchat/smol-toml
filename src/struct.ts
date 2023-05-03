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
import { indexOfNewline } from './util.js'

let KEY_PART_RE = /^[a-zA-Z0-9-_ \t]+$/

export function parseKey (key: string, ptrOffset = 0): string[] {
	let ptr
	let dot = -1
	let parsed = []

	do {
		let c = key[ptr = ++dot]
		// If it's whitespace, ignore
		if (c !== ' ' && c !== '\t') {
			// If it's a string
			if (c === '"' || c === "'") {
				let eos = key.indexOf(c, ptr + 1) + 1
				if (!eos) throw [ ptrOffset + ptr, '' ]

				dot = key.indexOf('.', eos)
				let end = key.slice(eos, dot < 0 ? void 0 : dot)

				let newLine = indexOfNewline(end)
				if (newLine > -1) throw [ ptrOffset + ptr + dot + newLine - 1, 'unexpected newline' ]
				if (end.trimStart()) throw [ ptrOffset + eos, 'unexpected token: expected whitespace or dot' ]

				parsed.push(parseString(key.slice(ptr, eos)))
			} else {
				// Normal raw key part consumption and validation
				dot = key.indexOf('.', ptr)
				let part = key.slice(ptr, dot < 0 ? void 0 : dot)
				if (!KEY_PART_RE.test(part)) throw [ ptrOffset + ptr, 'invalid key part: only letter, numbers, dashes and underscores are allowed' ]
				parsed.push(part.trimEnd())
			}
		}
		// Until there's no more dot
	} while (dot + 1)

	return parsed
}

export function parseInlineTable (tbl: string, ptr: number): [ Record<string, any>, number ] {
	let res: Record<string, any> = {}
	let seen = new Set()
	let c: string
	let comma = 0

	ptr++
	while ((c = tbl[ptr++]!) !== '}' && c) {
		if (c === '\n' || c === '\r') throw [ ptr - 1, 'unexpected newline' ]
		else if (c === '#') throw [ ptr - 1, 'unexpected comment' ]
		else if (c === ',') throw [ ptr - 1, 'unexpected comma' ]
		else if (c !== ' ' && c !== '\t') {
			ptr = extractKeyValue(tbl, ptr - 1, res, seen, true)
			comma = tbl[ptr - 1] === ',' ? ptr - 1 : 0
		}
	}

	if (comma) throw [ comma, 'unexpected trailing comma' ]
	if (!c) throw [ ptr, 'unfinished table' ]
	return [ res, ptr ]
}

export function parseArray (array: string, ptr: number): [ any[], number ] {
	let res: any[] = []
	let c

	ptr++
	while((c = array[ptr++]) !== ']' && c) {
		if (c === ',') throw [ ptr - 1, 'unexpected comma' ]
		else if (c === '#') ptr = indexOfNewline(array, ptr)
		else if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') {
			let e = extractValue(array, ptr - 1, ']', true)
			res.push(e[0])
			ptr = e[1]
		}
	}

	if (!c) throw [ ptr, 'unfinished array' ]
	return [ res, ptr ]
}
