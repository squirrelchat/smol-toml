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

import { expect, it } from 'vitest'
import { stringify } from '../src/stringify.js'
import { TomlDate } from '../src/date.js'
import 'temporal-polyfill/global'

it('stringifies a basic object', () => {
	const expected = `
a = 1
b = "test"
c = false
d = 1.1
`.trimStart()

	expect(stringify({ a: 1, b: 'test', c: false, d: 1.1 })).toBe(expected)
})

it('stringifies bigints as integers', () => {
	const expected = `
a = 100
`.trimStart()

	expect(stringify({ a: 100n })).toBe(expected)
})

it('stringifies integers as integers', () => {
	const expected = `
a = 100
`.trimStart()

	expect(stringify({ a: 100 })).toBe(expected)
})

it('stringifies integers as floats', () => {
	const expected = `
a = 100.0
`.trimStart()

	expect(stringify({ a: 100 }, { numbersAsFloat: true })).toBe(expected)
})

it('stringifies floats as floats', () => {
	const expected = `
a = 100.146
`.trimStart()

	expect(stringify({ a: 100.146 })).toBe(expected)
	expect(stringify({ a: 100.146 }, { numbersAsFloat: true })).toBe(expected)
})

it('stringifies special float values', () => {
	const expected = `
inf = inf
ninf = -inf
nan = nan
`.trimStart()

	const obj = {
		inf: Infinity,
		ninf: -Infinity,
		nan: NaN,
	}

	expect(stringify(obj)).toBe(expected)
	expect(stringify(obj, { numbersAsFloat: true })).toBe(expected)
})

it('stringifies dates properly', () => {
	const expected = `
date1 = 1979-05-27T07:32:00.000-08:00
date2 = 1979-05-27T07:32:00.000
date3 = 1979-05-27
date4 = 07:32:00.000
date5 = 1979-05-27T15:32:00.000Z
`.trimStart()

	const obj = {
		date1: new TomlDate('1979-05-27T07:32:00-08:00'),
		date2: new TomlDate('1979-05-27T07:32:00'),
		date3: new TomlDate('1979-05-27'),
		date4: new TomlDate('07:32:00'),
		date5: new Date('1979-05-27T07:32:00-08:00'),
	}

	expect(stringify(obj)).toBe(expected)
})

it('stringifies Temporal values properly', () => {
	const expected = `
zonedDateTime = 1979-05-27T07:32:00-08:00
offsetDateTime = 1979-05-27T07:32:00-08:00
localDateTime = 1979-05-27T07:32:00
localDate = 1979-05-27
localTime = 07:32:00
instant = 1979-05-27T15:32:00Z
`.trimStart()

	const obj = {
		zonedDateTime: Temporal.ZonedDateTime.from({
			year: 1979, month: 5, day: 27,
			hour: 7, minute: 32, second: 0,
			timeZone: "America/Yakutat",
		}),
		offsetDateTime: Temporal.ZonedDateTime.from("1979-05-27T07:32:00[-08:00]"),
		localDateTime: Temporal.PlainDateTime.from("1979-05-27T07:32:00"),
		localDate: Temporal.PlainDate.from("1979-05-27"),
		localTime: Temporal.PlainTime.from("07:32:00"),
		instant: Temporal.Instant.from("1979-05-27T07:32:00-08:00"),
	}

	expect(stringify(obj)).toBe(expected)
})

it('stringifies arrays', () => {
	const expected = `
a = [ 10, 20, "30", false ]
`.trimStart()

	expect(stringify({ a: [ 10, 20n, '30', false ] })).toBe(expected)
})

it('stringifies empty arrays', () => {
	const expected = `
a = []

[[e]]
a = []

[[e]]
`.trimStart()

	expect(stringify({ a: [], e: [ { a: [] }, {} ] })).toBe(expected)
})

it('stringifies tables', () => {
	const expected = `
[a]
b = 1
c = 2
`.trimStart()

	expect(stringify({ a: { b: 1, c: 2 } })).toBe(expected)
})

it('stringifies tables and handles top-level keys', () => {
	const expected = `
d = 3

[a]
b = 1
c = 2
`.trimStart()

	expect(stringify({ a: { b: 1, c: 2 }, d: 3 })).toBe(expected)
})

it('stringifies nested tables and handles top-level keys', () => {
	const expected = `
d = 3

[a.b]
b = 1
c = 2
`.trimStart()

	expect(stringify({ a: { b: { b: 1, c: 2 } }, d: 3 })).toBe(expected)
})

it('stringifies empty tables with no gaps', () => {
	const expected = `
[animal]
[fruit.apple]
[fruit.orange]
`.trimStart()

	expect(
		stringify({
			animal: {},
			fruit: {
				apple: {},
				orange: {},
			},
		}),
	).toBe(expected)
})


it('stringifies empty tables with consistent newlines', () => {
	const expected = `
[animal]
[fruit.apple]
[fruit.orange]
key = "value"

[language.french]
tag = "fr"

[language.english]
tag = "en"

[country]
[planet]
[[books]]
title = "an amazing book"

[[books]]
title = "another amazing book"
`.trimStart()

	expect(
		stringify({
			animal: {},
			fruit: {
				apple: {},
				orange: {
					key: 'value',
				},
			},
			language: {
				french: { tag: 'fr' },
				english: { tag: 'en' },
			},
			country: {},
			planet: {},
			books: [
				{ title: "an amazing book" },
				{ title: "another amazing book" },
			]
		}),
	).toBe(expected)
})

it('stringifies tables contained in arrays', () => {
	const expected = `
a = [ 1, { b = 2, c = 3 }, 4 ]
`.trimStart()

	expect(stringify({ a: [ 1, { b: 2, c: 3 }, 4 ] })).toBe(expected)
})

it('stringifies arrays of tables', () => {
	const expected = `
[[a]]
b = 1
c = 2

[[a]]
b = 3
c = 4
`.trimStart()

	expect(stringify({ a: [ { b: 1, c: 2 }, { b: 3, c: 4 } ] })).toBe(expected)
})

it('stringifies nested arrays of tables', () => {
	const expected = `
[[a.b]]
b = 1
c = 2

[[a.b]]
b = 3
c = 4
`.trimStart()

	expect(
		stringify({
			a: {
				b: [
					{ b: 1, c: 2 },
					{ b: 3, c: 4 },
				],
			},
		}),
	).toBe(expected)
})

it('stringifies nested arrays of tables with top level keys', () => {
	const expected = `
key = "hello"

[a]
key = "hello"

[[a.b]]
b = 1
c = 2

[[a.b]]
b = 3
c = 4
`.trimStart()

	expect(
		stringify({
			key: 'hello',
			a: {
				key: 'hello',
				b: [
					{ b: 1, c: 2 },
					{ b: 3, c: 4 },
				],
			},
		}),
	).toBe(expected)
})

it('does not produce invalid keys', () => {
	const expected = `
test-key123_ = 1
"test key 123" = 2
"testkey@" = 3
`.trimStart()

	expect(stringify({ 'test-key123_': 1, 'test key 123': 2, 'testkey@': 3 })).toBe(expected)
})

it('does not produce invalid keys (table keys)', () => {
	const expected = `
[test-key123_]
a = 1

["test key 123"]
a = 2

["testkey@"]
a = 3
`.trimStart()

	expect(stringify({
		'test-key123_': { a: 1 },
		'test key 123': { a: 2 },
		'testkey@': { a: 3 },
	})).toBe(expected)
})

it('does not produce invalid strings', () => {
	const testObj = {
		str1: 'test\n',
		str2: 'test\x00',
		str3: 'test"',
		str4: 'test\\',
		str5: 'test\x7f',
	}

	const stringified = stringify(testObj)
	expect(stringified).not.toContain('\n"')
	expect(stringified).not.toContain('\x00')
	expect(stringified).toContain('\\"')
	expect(stringified).toContain('\\\\')
	expect(stringified).not.toContain('\x7f')
})

it('rejects invalid inputs', () => {
	expect(() => stringify('test')).toThrow(TypeError)
})

it('ignores null and undefined on objects', () => {
	const testObj = {
		a: null,
		b: void 0,
		c: 1,
	}

	expect(stringify(testObj)).toBe('c = 1\n')
})


it('rejects null and undefined in arrays', () => {
	expect(() => stringify({ a: [ 1, null, 2 ] })).toThrow(TypeError)
	expect(() => stringify({ a: [ 1, void 0, 2 ] })).toThrow(TypeError)
})

it('rejects functions and symbols', () => {
	expect(() => stringify({ a: () => void 0 })).toThrow(TypeError)
	expect(() => stringify({ a: Symbol() })).toThrow(TypeError)
})

it('rejects invalid dates', () => {
	expect(() => stringify({ a: new Date('Invalid Date') })).toThrow(TypeError)
})
