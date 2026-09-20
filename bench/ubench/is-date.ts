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

import { bench, do_not_optimize, run, summary } from 'mitata'

summary(() => {
	bench('instanceof without gate', function* () {
		yield {
			[0]() {
				return {}
			},
			bench(val: any) {
				return do_not_optimize(
					val instanceof Date,
				)
			},
		}
	})

	bench('instanceof with gate (truthy)', function* () {
		yield {
			[0]() {
				return {}
			},
			bench(val: any) {
				return do_not_optimize(
					val.getUTCDate && val instanceof Date,
				)
			},
		}
	})

	bench('instanceof with gate (typeof is function)', function* () {
		yield {
			[0]() {
				return {}
			},
			bench(val: any) {
				return do_not_optimize(
					typeof val.getUTCDate === 'function' && val instanceof Date,
				)
			},
		}
	})

	bench('instanceof with gate (in)', function* () {
		yield {
			[0]() {
				return {}
			},
			bench(val: any) {
				return do_not_optimize(
					'getUTCDate' in val && val instanceof Date,
				)
			},
		}
	})
})

await run()
