#!/usr/bin/env node
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

// Script for https://github.com/toml-lang/toml-test

import { TomlDate, stringify } from './dist/index.js'

function untagObject (obj) {
	if (Array.isArray(obj)) return obj.map((o) => untagObject(o))

	const res = {}
	if (Object.keys(obj).length === 2 && 'type' in obj && 'value' in obj) {
		switch (obj.type) {
			case 'string':
				return obj.value
			case 'bool':
				return obj.value === 'true'
			case 'integer':
				return BigInt(obj.value)
			case 'float':
				if (obj.value === 'nan') return NaN
				if (obj.value === '+nan') return NaN
				if (obj.value === '-nan') return NaN
				if (obj.value === 'inf') return Infinity
				if (obj.value === '+inf') return Infinity
				if (obj.value === '-inf') return -Infinity

				if (obj.value === 'Inf') return Infinity
				if (obj.value === '+Inf') return Infinity
				if (obj.value === '-Inf') return -Infinity
				return Number(obj.value)
			case 'datetime':
			case 'datetime-local':
			case 'date-local':
			case 'time-local':
				return new TomlDate(obj.value)
		}

		throw new Error('cannot untag object')
	}

	for (const k in obj) {
		res[k] = untagObject(obj[k])
	}
	return res
}

let json = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (j) => json += j)
process.stdin.on('end', () => {
	const tagged = JSON.parse(json)
	const obj = untagObject(tagged)
	console.log(stringify(obj))
})
