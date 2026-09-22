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
import { parse as smolTomlParse } from '../dist/index.js'
import { parse as iarnaTomlParse } from '@iarna/toml'
import { parse as ltdJTomlParse } from '@ltd/j-toml'
import { parse as denoStdParse } from '@std/toml'
import { parse as nodeTomlParse } from 'toml'
import { load as jsTomlParse } from 'js-toml'
import { parse as dtTomlPatchParse } from '@decimalturn/toml-patch'
import fastTomlParse from 'fast-toml'

const tomlSpec = await readFile(new URL('./testfiles/toml-spec-example.toml', import.meta.url), 'utf8')
const toml5MB = await readFile(new URL('./testfiles/5mb-mixed.toml', import.meta.url), 'utf8')

summary(() => {
	for (const [name, toml] of [['spec document', tomlSpec], ['5MB document', toml5MB]] as const) {
		group(name, () => {
			bench('smol-toml (Date)', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(smolTomlParse(toml, { useLegacyDate: true }))
					},
				}
			})

			bench('smol-toml (Temporal)', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(smolTomlParse(toml, { useLegacyDate: false }))
					},
				}
			})

			bench('@iarna/toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(iarnaTomlParse(toml))
					},
				}
			})

			bench('@ltd/j-toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(ltdJTomlParse(toml, { bigint: false, joiner: '\n' }))
					},
				}
			})

			bench('fast-toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(fastTomlParse(toml))
					},
				}
			})

			bench('@std/toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(denoStdParse(toml))
					},
				}
			})

			bench('toml (Date/string)', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(nodeTomlParse(toml, { useTemporal: false }))
					},
				}
			})

			bench('toml (Temporal)', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(nodeTomlParse(toml, { useTemporal: true }))
					},
				}
			})

			bench('js-toml', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(jsTomlParse(toml))
					},
				}
			})

			bench('@decimalturn/toml-patch (Date)', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(dtTomlPatchParse(toml, { temporal: false }))
					},
				}
			})

			bench('@decimalturn/toml-patch (Temporal)', function* () {
				yield {
					[0]() {
						return toml
					},
					bench(toml: string) {
						return do_not_optimize(dtTomlPatchParse(toml, { temporal: true }))
					},
				}
			})
		})
	}
})

await run()
