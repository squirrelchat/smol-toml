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

import { group, bench, do_not_optimize, run, summary } from 'mitata'

class A { }
class B extends A { }
class C extends B { }
class D extends C { }
class E extends D { }
class F extends E { }
class G extends F { }

const TEST_VALUES = [
	['plain object', {}],
	['class instance with deep proto chain', new G()],
	['Temporal.Instant', Temporal.Instant.from('2001-09-21T10:17:00+02:00')],
	['Temporal.ZonedDateTime', Temporal.ZonedDateTime.from('2001-09-21T10:17:00+02:00[Europe/Paris]')],
	['Temporal.PlainDateTime', Temporal.PlainDateTime.from('2001-09-21T10:17:00')],
	['Temporal.PlainDate', Temporal.PlainDate.from('2001-09-21')],
	['Temporal.PlainTime', Temporal.PlainTime.from('10:17:00')],
	['Temporal.Duration', Temporal.Duration.from('PT3H54M')],
	['Temporal.PlainMonthDay', Temporal.PlainMonthDay.from('09-21')],
	['Temporal.PlainYearMonth', Temporal.PlainYearMonth.from('2001-09')],
] as const

summary(() => {
	for (const [name, value] of TEST_VALUES) {
		group(name, () => {
			function instanceofDumb(obj: any) {
				if (
					obj instanceof Temporal.Instant ||
					obj instanceof Temporal.ZonedDateTime ||
					obj instanceof Temporal.PlainDateTime ||
					obj instanceof Temporal.PlainDate ||
					obj instanceof Temporal.PlainTime ||
					obj instanceof Temporal.PlainMonthDay ||
					obj instanceof Temporal.PlainYearMonth ||
					obj instanceof Temporal.Duration
				) return 'temporal'
				return 'object'
			}

			bench('simple instanceof chain', function* () {
				yield {
					[0]() {
						return value
					},
					bench(val: any) {
						return do_not_optimize(instanceofDumb(val))
					},
				}
			})

			function instanceofGateTruthy(obj: any) {
				if (
					(obj.since && (
						obj instanceof Temporal.Instant ||
						obj instanceof Temporal.ZonedDateTime ||
						obj instanceof Temporal.PlainDateTime ||
						obj instanceof Temporal.PlainDate ||
						obj instanceof Temporal.PlainTime ||
						obj instanceof Temporal.PlainMonthDay ||
						obj instanceof Temporal.PlainYearMonth
					)) ||
					(obj.negated && obj instanceof Temporal.Duration)
				) return 'temporal'
				return 'object'
			}

			bench('truthy gate', function* () {
				yield {
					[0]() {
						return value
					},
					bench(val: any) {
						return do_not_optimize(instanceofGateTruthy(val))
					},
				}
			})

			function instanceofGateTypeof(obj: any) {
				if (
					(typeof obj.since === 'function' && (
						obj instanceof Temporal.Instant ||
						obj instanceof Temporal.ZonedDateTime ||
						obj instanceof Temporal.PlainDateTime ||
						obj instanceof Temporal.PlainDate ||
						obj instanceof Temporal.PlainTime ||
						obj instanceof Temporal.PlainMonthDay ||
						obj instanceof Temporal.PlainYearMonth
					)) ||
					(typeof obj.negated === 'function' && obj instanceof Temporal.Duration)
				) return 'temporal'
				return 'object'
			}

			bench('typeof gate', function* () {
				yield {
					[0]() {
						return value
					},
					bench(val: any) {
						return do_not_optimize(instanceofGateTypeof(val))
					},
				}
			})

			function instanceofGateIn(obj: any) {
				if (
					('since' in obj && (
						obj instanceof Temporal.Instant ||
						obj instanceof Temporal.ZonedDateTime ||
						obj instanceof Temporal.PlainDateTime ||
						obj instanceof Temporal.PlainDate ||
						obj instanceof Temporal.PlainTime ||
						obj instanceof Temporal.PlainMonthDay ||
						obj instanceof Temporal.PlainYearMonth
					)) ||
					('negated' in obj && obj instanceof Temporal.Duration)
				) return 'temporal'
				return 'object'
			}

			bench('in gate', function* () {
				yield {
					[0]() {
						return value
					},
					bench(val: any) {
						return do_not_optimize(instanceofGateIn(val))
					},
				}
			})
		})
	}
})

await run()
