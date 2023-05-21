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

function stringifyString (s: string) {
	return JSON.stringify(s).replace(/\x7f/g, '\\u007f')
}

function isArrayOfTables (obj: any[]) {
	for (let i = 0; i < obj.length; i++) {
		if (typeof obj[i] !== 'object' || Array.isArray(obj[i]) || obj[i] instanceof Date)
			return false
	}

	return true
}

function stringifyValue (val: any) {
	let type = typeof val
	if (type === 'number') {
		if (isNaN(val)) return 'nan'
		if (val === Infinity) return 'inf'
		if (val === -Infinity) return '-inf'
		return val.toExponential()
	}

	if (type === 'bigint' || type === 'boolean') {
		return val.toString()
	}

	if (type === 'string') {
		return stringifyString(val)
	}

	if (val instanceof Date) {
		return val.toISOString()
	}

	throw new Error(`cannot serialize value of type ${type}`)
}

function stringifyInlineTable (obj: any) {
	let res = '{ '

	let keys = Object.keys(obj)
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i]!
		if (i) res += ', '

		res += BARE_KEY.test(k) ? k : stringifyString(k)
		res += ' = '
		res += typeof obj[k] === 'object' && !(obj[k] instanceof Date)
			? Array.isArray(obj[k])
				? stringifyArray(obj[k])
				: stringifyInlineTable(obj[k])
			: stringifyValue(obj[k])
	}

	return res + ' }'
}

function stringifyArray (array: any[]) {
	let res = '[ '
	for (let i = 0; i < array.length; i++) {
		if (i) res += ', '
		res += typeof array[i] === 'object' && !(array[i] instanceof Date)
			? Array.isArray(array[i])
				? stringifyArray(array[i])
				: stringifyInlineTable(array[i])
			: stringifyValue(array[i])
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
		let key = BARE_KEY.test(k) ? k : JSON.stringify(k)

		if (typeof obj[k] === 'object' && !(obj[k] instanceof Date)) {
			let tblKey = prefix ? `${prefix}.${key}` : key

			if (Array.isArray(obj[k])) {
				if (isArrayOfTables(obj[k])) {
					tables += stringifyArrayTable(obj[k], tblKey)
				} else {
					preamble += key
					preamble += ' = '
					preamble += stringifyArray(obj[k])
				}
			} else {
				tables += `[${tblKey}]\n`
				tables += stringifyTable(obj[k], tblKey)
				tables += '\n\n'
			}
		} else {
			preamble += key
			preamble += ' = '
			preamble += stringifyValue(obj[k])
		}

		preamble += '\n'
	}

	return `${preamble}\n${tables}`.trim()
}

export function stringify (obj: any) {
	if (typeof obj !== 'object' || Array.isArray(obj)) {
		throw new TypeError('stringify can only be called with an object')
	}

	return stringifyTable(obj)
}
