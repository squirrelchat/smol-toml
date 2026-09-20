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

import { randomUUID } from 'node:crypto'
import { bench, do_not_optimize, run, summary } from 'mitata'

function createTestString() {
	const year = (Math.floor(Math.random() * 9500)) + 500
	const month = (Math.floor(Math.random() * 12)) + 1
	const day = (Math.floor(Math.random() * 28)) + 1 // Avoid 28+ to always generate valid DTs
	const hours = (Math.floor(Math.random() * 24))
	const minutes = (Math.floor(Math.random() * 60))
	const seconds = (Math.floor(Math.random() * 60))
	const offset = (Math.floor(Math.random() * 12))
	const sign = Math.random() < 0.5 ? '-' : '+'

	const _sep = Math.random()
	const separator = _sep < 0.33 ? 'T' : _sep < 0.66 ? ' ' : 't'

	const str = randomUUID() +
		year.toString().padStart(4, '0') + '-' +
		month.toString().padStart(2, '0') + '-' +
		day.toString().padStart(2, '0') + separator +
		hours.toString().padStart(2, '0') + ':' +
		minutes.toString().padStart(2, '0') + ':' +
		seconds.toString().padStart(2, '0') +
		sign + offset.toString().padStart(2, '0') + ':00' +
		randomUUID()

	// `str` is a concatenated string (ConsString), referencing all the separate string components in a tree-like structure.
	// `JSON.stringify |> JSON.parse` give us a sequential string (SeqString) that is more true to what `smol-toml` will be given.
	// Since we'll slice the string and potentially re-allocate one, this is important to get right to have accurate numbers.
	return JSON.parse(JSON.stringify(str))
}

summary(() => {
	bench('ZonedDateTime.from(), concat zone offset', function*() {
		yield {
			[0]() {
				return createTestString()
			},
			[1]() {
				return 36
			},
			[2]() {
				return 55
			},
			[3]() {
				return 61
			},
			bench(str: string, dt_start: number, dt_offset_start: number, dt_end: number) {
				return do_not_optimize(
					Temporal.ZonedDateTime.from(
						str.slice(dt_start, dt_end) + '[' + str.slice(dt_offset_start, dt_end) + ']'
					)
				)
			},
		}
	})

	bench('Instant.from().toZonedDateTime()', function*() {
		yield {
			[0]() {
				return createTestString()
			},
			[1]() {
				return 36
			},
			[2]() {
				return 55
			},
			[3]() {
				return 61
			},
			bench(str: string, dt_start: number, dt_offset_start: number, dt_end: number) {
				return do_not_optimize(
					Temporal.Instant.from(str.slice(dt_start, dt_end))
						.toZonedDateTimeISO(str.slice(dt_offset_start, dt_end))
				)
			},
		}
	})
})

await run()
