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

const BARE_KEY = /^[a-z0-9-_]+$/i

function extendedTypeOf (obj: any) {
	let type = typeof obj
	if (type === 'object') {
		if (Array.isArray(obj)) return 'array'
		if (obj instanceof Date) return 'date'
	}

	return type
}

function isArrayOfTables (obj: any[]) {
	for (let i = 0; i < obj.length; i++) {
		if (extendedTypeOf(obj[i]) !== 'object') return false
	}

	return true
}

function formatString (s: string) {
	return JSON.stringify(s).replace(/\x7f/g, '\\u007f')
}

function stringifyValue (val: any, type = extendedTypeOf(val)) {
	if (type === 'number') {
		if (isNaN(val)) return 'nan'
		if (val === Infinity) return 'inf'
		if (val === -Infinity) return '-inf'
		return val.toString()
	}

	if (type === 'bigint' || type === 'boolean') {
		return val.toString()
	}

	if (type === 'string') {
		return formatString(val)
	}

	if (type === 'date') {
		return val.toISOString()
	}

	if (type === 'object') {
		return stringifyInlineTable(val)
	}

	if (type === 'array') {
		return stringifyArray(val)
	}
}

function stringifyInlineTable (obj: any) {
	let res = '{ '

	let keys = Object.keys(obj)
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i]!
		if (i) res += ', '

		res += BARE_KEY.test(k) ? k : formatString(k)
		res += ' = '
		res += stringifyValue(obj[k])
	}

	return res + ' }'
}

function stringifyArray (array: any[]) {
	let res = '[ '
	for (let i = 0; i < array.length; i++) {
		if (i) res += ', '
		res += stringifyValue(array[i])
	}

	return res + ' ]'
}

function stringifyArrayTable (array: any[], key: string) {
	let res = ''
	for (let i = 0; i < array.length; i++) {
		res += `[[${key}]]\n`
		res += stringifyTable(array[i], key)
		res += '\n\n'
	}

	return res
}

function stringifyTable (obj: any, prefix = '') {
	let preamble = ''
	let tables = ''

	let keys = Object.keys(obj)
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i]!
		if (obj[k] !== null && obj[k] !== void 0) {
			let type = extendedTypeOf(obj[k])
			if (type === 'symbol' || type === 'function') {
				throw new Error(`cannot serialize values of type '${type}'.`)
			}

			let key = BARE_KEY.test(k) ? k : formatString(k)

			if (type === 'array' && isArrayOfTables(obj[k])) {
				tables += stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key)
			} else if (type === 'object') {
				let tblKey = prefix ? `${prefix}.${key}` : key
				tables += `[${tblKey}]\n`
				tables += stringifyTable(obj[k], tblKey)
				tables += '\n\n'
			} else {
				preamble += key
				preamble += ' = '
				preamble += stringifyValue(obj[k], type)
				preamble += '\n'
			}
		}
	}

	return `${preamble}\n${tables}`.trim()
}

export function stringify (obj: any) {
	if (extendedTypeOf(obj) !== 'object') {
		throw new TypeError('stringify can only be called with an object')
	}

	return stringifyTable(obj)
}
