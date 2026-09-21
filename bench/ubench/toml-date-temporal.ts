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

import { bench, do_not_optimize, group, run, summary } from 'mitata'
import { TomlDate } from '../../dist/date.js'

summary(() => {
	group('Baseline test', () => {
		bench('Temporal API (Temporal.Instant)', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00+02:00'
				},
				bench(str: string) {
					return do_not_optimize(Temporal.Instant.from(str))
				},
			}
		})

		bench('Date', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00+02:00'
				},
				bench(str: string) {
					return do_not_optimize(new Date(str))
				},
			}
		})
	})

	group('Offset Date-Time', () => {
		bench('Temporal API (Temporal.ZonedDateTime)', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00+02:00[+02:00]'
				},
				bench(str: string) {
					return do_not_optimize(Temporal.ZonedDateTime.from(str))
				},
			}
		})

		bench('TomlDate', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00+02:00'
				},
				bench(str: string) {
					return do_not_optimize(new TomlDate(str))
				},
			}
		})

		bench('TomlDate (fasttype)', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00+02:00'
				},
				bench(str: string) {
					// @ts-expect-error
					return do_not_optimize(new TomlDate(str, 1))
				},
			}
		})
	})

	group('Plain Date-Time', () => {
		bench('Temporal API (Temporal.PlainDateTime)', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00'
				},
				bench(str: string) {
					return do_not_optimize(Temporal.PlainDateTime.from(str))
				},
			}
		})

		bench('TomlDate', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00'
				},
				bench(str: string) {
					return do_not_optimize(new TomlDate(str))
				},
			}
		})

		bench('TomlDate (fasttype)', function*() {
			yield {
				[0]() {
					return '2001-09-21T10:17:00'
				},
				bench(str: string) {
					// @ts-expect-error
					return do_not_optimize(new TomlDate(str, 2))
				},
			}
		})
	})

	group('Plain Date', () => {
		bench('Temporal API (Temporal.PlainDate)', function*() {
			yield {
				[0]() {
					return '2001-09-21'
				},
				bench(str: string) {
					return do_not_optimize(Temporal.PlainDate.from(str))
				},
			}
		})

		bench('TomlDate', function*() {
			yield {
				[0]() {
					return '2001-09-21'
				},
				bench(str: string) {
					return do_not_optimize(new TomlDate(str))
				},
			}
		})

		bench('TomlDate (fasttype)', function*() {
			yield {
				[0]() {
					return '2001-09-21'
				},
				bench(str: string) {
					// @ts-expect-error
					return do_not_optimize(new TomlDate(str, 3))
				},
			}
		})
	})

	group('Plain Time', () => {
		bench('Temporal API (Temporal.PlainTime)', function*() {
			yield {
				[0]() {
					return '10:17:00'
				},
				bench(str: string) {
					return do_not_optimize(Temporal.PlainTime.from(str))
				},
			}
		})

		bench('TomlDate', function*() {
			yield {
				[0]() {
					return '10:17:00'
				},
				bench(str: string) {
					return do_not_optimize(new TomlDate(str))
				},
			}
		})

		bench('TomlDate (fasttype)', function*() {
			yield {
				[0]() {
					return '10:17:00'
				},
				bench(str: string) {
					// @ts-expect-error
					return do_not_optimize(new TomlDate(str, 4))
				},
			}
		})
	})
})

await run()
