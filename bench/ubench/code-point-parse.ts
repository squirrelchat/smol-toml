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

import { bench, group, do_not_optimize, run, summary } from 'mitata'

const ESCAPE_REGEX = /^[0-9a-f]{2,8}$/i

function generateCodePoint(len: number) {
	let val
	do val = ((Math.random() * 0x110000) | 0)
	while (val >= 0xd800 && val <= 0xdfff)
	return val.toString(16).padStart(8, '0').slice(0, len)
}

summary(() => {
	for (const len of [2, 4, 8])
		group(len.toString(), () => {
			bench('parseInt(code, 16)', function* () {
				yield {
					[0]: () => generateCodePoint(len),
					bench(code: any) {
						if (!ESCAPE_REGEX.test(code)) throw new Error()
						try {
							return do_not_optimize(String.fromCodePoint(parseInt(code, 16)))
						} catch {
							throw new Error()
						}
					},
				}
			})

			bench('"0x" + code', function* () {
				yield {
					[0]: () => generateCodePoint(len),
					bench(code: any) {
						if (!ESCAPE_REGEX.test(code)) throw new Error()
						try {
							return do_not_optimize(String.fromCodePoint(('0x' + code) as never))
						} catch {
							throw new Error()
						}
					},
				}
			})

			bench('manual decode', function* () {
				yield {
					[0]: () => generateCodePoint(len),
					bench(code: any) {
						let value = 0
						for (let j = 0; j < len; j++) {
							let hex = code.charCodeAt(j)
							let digit =
								/* 0-9 */ hex >= 0x30 && hex <= 0x39 ? hex - 0x30 :
								/* A-F */ hex >= 0x41 && hex <= 0x46 ? hex - 0x41 + 10 :
								/* a-f */ hex >= 0x61 && hex <= 0x66 ? hex - 0x61 + 10 : -1

							if (digit < 0) throw new Error(`bad hex ${hex} at index ${j}`)
							value = (value << 4) | digit
						}

						// Because JS does bitwise on signed 32bit integers, all 0xfzzzzzzz values are actually seen as negative
						if (value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
							throw new Error(`bad code point 0x${value.toString(16)}`)
						}

						return do_not_optimize(String.fromCodePoint(value))
					},
				}
			})
		})
})

await run()
