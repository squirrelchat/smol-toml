#!/usr/bin/env node
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: 0BSD
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

// Script for https://github.com/toml-lang/toml-test

import { TomlDate, stringify } from './dist/index.js'

function untagObject(obj) {
	if (Array.isArray(obj)) return obj.map((o) => untagObject(o))

	const res = {}
	if (Object.keys(obj).length === 2 && 'type' in obj && 'value' in obj) {
		switch (obj.type) {
			case 'string':
				return obj.value
			case 'bool':
				return obj.value === 'true'
			case 'integer':
				return BigInt(obj.value)
			case 'float':
				if (obj.value === 'nan') return NaN
				if (obj.value === '+nan') return NaN
				if (obj.value === '-nan') return NaN
				if (obj.value === 'inf') return Infinity
				if (obj.value === '+inf') return Infinity
				if (obj.value === '-inf') return -Infinity
				return Number(obj.value)
			case 'datetime':
				return Temporal.ZonedDateTime.from(
					obj.value[obj.value.length - 1].toUpperCase() === 'Z'
						? obj.value + '[+00:00]'
						: obj.value + '[' + obj.value.slice(obj.value.length - 6) + ']'
				)
			case 'datetime-local':
				return Temporal.PlainDateTime.from(obj.value)
			case 'date-local':
				return Temporal.PlainDate.from(obj.value)
			case 'time-local':
				return Temporal.PlainTime.from(obj.value)
		}

		throw new Error('cannot untag object')
	}

	for (const k in obj) {
		res[k] = untagObject(obj[k])
	}
	return res
}

let json = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (j) => (json += j))
process.stdin.on('end', () => {
	const tagged = JSON.parse(json)
	const obj = untagObject(tagged)
	console.log(stringify(obj, { numbersAsFloat: true }))
})
