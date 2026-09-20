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

import { TomlDate, parse } from './dist/index.js'

function tagObject(obj) {
	if (typeof obj === 'string') {
		return { type: 'string', value: obj }
	}

	if (typeof obj === 'boolean') {
		return { type: 'bool', value: obj.toString() }
	}

	if (typeof obj === 'number') {
		if (isNaN(obj)) obj = 'nan'
		if (obj === Infinity) obj = 'inf'
		if (obj === -Infinity) obj = '-inf'
		return { type: 'float', value: obj.toString() }
	}

	if (typeof obj === 'bigint') {
		return { type: 'integer', value: obj.toString() }
	}

	if (obj instanceof TomlDate) {
		let type = obj.isDateTime() ? 'datetime' : obj.isDate() ? 'date' : 'time'
		if (obj.isLocal()) type += '-local'

		return { type: type, value: obj.toISOString() }
	}

	if (obj instanceof Temporal.ZonedDateTime) {
		return { type: 'datetime', value: obj.toString({ calendarName: 'never', timeZoneName: 'never' }) }
	}

	if (obj instanceof Temporal.PlainDateTime) {
		return { type: 'datetime-local', value: obj.toString({ calendarName: 'never', timeZoneName: 'never' }) }
	}

	if (obj instanceof Temporal.PlainDate) {
		return { type: 'date-local', value: obj.toString({ calendarName: 'never', timeZoneName: 'never' }) }
	}

	if (obj instanceof Temporal.PlainTime) {
		return { type: 'time-local', value: obj.toString({ calendarName: 'never', timeZoneName: 'never' }) }
	}

	if (Array.isArray(obj)) {
		return obj.map((e) => tagObject(e))
	}

	let tagged = {}
	for (const k in obj) tagged[k] = tagObject(obj[k])
	return tagged
}

let toml = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (t) => (toml += t))
process.stdin.on('end', () => {
	const parsed = parse(toml, { integersAsBigInt: true, useLegacyDate: false })
	const tagged = tagObject(parsed)
	console.log(JSON.stringify(tagged, null, 2))
})
