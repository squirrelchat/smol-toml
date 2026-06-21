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
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { bench, do_not_optimize, group, run, summary } from 'mitata'

import { readFile } from 'fs/promises'
import { stringify as smolTomlStringify, parse } from '../dist/index.js'
import { stringify as iarnaTomlStringify } from '@iarna/toml'
import { stringify as ltdJTomlStringify } from '@ltd/j-toml'
import { stringify as denoStdStringify } from '@std/toml'
import { dump as jsTomlStringify } from 'js-toml'
import { stringify as dtTomlPatchStringify } from '@decimalturn/toml-patch'

const tomlSpec = parse(await readFile(new URL('./testfiles/toml-spec-example.toml', import.meta.url), 'utf8'))
const toml5MB = parse(await readFile(new URL('./testfiles/5mb-mixed.toml', import.meta.url), 'utf8'))

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
