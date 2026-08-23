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
 * SERVICES LOSS OF USE, DATA, OR PROFITS OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
