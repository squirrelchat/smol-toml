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
