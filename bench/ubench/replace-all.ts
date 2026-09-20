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

summary(() => {
	bench('replace(/-/g, "")', function*() {
		yield {
			[0]() {
				return randomUUID()
			},
			bench(str: string) {
				return do_not_optimize(str.replace(/-/g, ''))
			},
		}
	})

	bench('replaceAll("-", "")', function*() {
		yield {
			[0]() {
				return randomUUID()
			},
			bench(str: string) {
				return do_not_optimize(str.replaceAll('-', ''))
			},
		}
	})
})

await run()
