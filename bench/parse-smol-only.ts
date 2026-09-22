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

// To be used with --inspect-brk

import { bench, do_not_optimize, run, summary } from 'mitata'

import { readFile } from 'fs/promises'
import { parse } from '../dist/index.js'

const toml5MB = await readFile(new URL('./testfiles/5mb-mixed.toml', import.meta.url), 'utf8')

summary(() => {
	bench('smol-toml', function* () {
		yield {
			[0]() {
				return toml5MB
			},
			bench(toml: string) {
				return do_not_optimize(parse(toml, { useLegacyDate: false }))
			},
		}
	})
})

await run()

await new Promise(() => {
	setInterval(() => {}, 1e6)
})
