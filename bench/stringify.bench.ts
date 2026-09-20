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

import { readFile } from 'fs/promises'
import { stringify as smolTomlStringify, parse } from '../dist/index.js'
import { stringify as iarnaTomlStringify } from '@iarna/toml'
import { stringify as ltdJTomlStringify } from '@ltd/j-toml'
import { stringify as denoStdStringify } from '@std/toml'
import { dump as jsTomlStringify } from 'js-toml'
import { stringify as dtTomlPatchStringify } from '@decimalturn/toml-patch'

const tomlSpec = parse(await readFile(new URL('./testfiles/toml-spec-example.toml', import.meta.url), 'utf8'), { useLegacyDate: true })
const toml5MB = parse(await readFile(new URL('./testfiles/5mb-mixed.toml', import.meta.url), 'utf8'), { useLegacyDate: true })

summary(() => {
	for (const [name, toml] of [['spec document', tomlSpec], ['5MB document', toml5MB]] as const) {
		group(name, () => {
			bench('smol-toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: any) {
						return do_not_optimize(smolTomlStringify(toml))
					},
				}
			})

			bench('@iarna/toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: any) {
						return do_not_optimize(iarnaTomlStringify(toml))
					},
				}
			})

			bench('@ltd/j-toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: any) {
						return do_not_optimize(ltdJTomlStringify(toml))
					},
				}
			})

			bench("deno's @std/toml", function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: any) {
						return do_not_optimize(denoStdStringify(toml))
					},
				}
			})

			bench('js-toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: any) {
						return do_not_optimize(jsTomlStringify(toml))
					},
				}
			})

			bench('@decimalturn/toml-patch', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: any) {
						return do_not_optimize(dtTomlPatchStringify(toml))
					},
				}
			})
		})
	}
})

await run()
