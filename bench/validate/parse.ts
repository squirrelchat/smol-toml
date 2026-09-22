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

import { readFile } from 'fs/promises'
import { parse as smolTomlParse } from '../../dist/index.js'
import { parse as iarnaTomlParse } from '@iarna/toml'
import { parse as ltdJTomlParse } from '@ltd/j-toml'
import { parse as denoStdParse } from '@std/toml'
import { parse as nodeTomlParse } from 'toml'
import { load as jsTomlParse } from 'js-toml'
import fastTomlParse from 'fast-toml'
import { parseAsTokenMap, validate } from './parse-lib.ts';

const tomlSpec = await readFile(new URL('../testfiles/toml-spec-example.toml', import.meta.url), 'utf8')
const toml5MB = await readFile(new URL('../testfiles/5mb-mixed.toml', import.meta.url), 'utf8')

const OK = '\x1b[1;32mOK\x1b[0m'
const KO = '\x1b[1;31mKO\x1b[0m'
const DNF = '\x1b[1;31mDNF\x1b[0m'

const x = <T>(fn: (() => T)): T | null => {
	try {
		return fn()
	} catch {
		return null
	}
}

for (const [name, toml] of [['spec document', tomlSpec], ['5MB document', toml5MB]] as const) {
	const expected = parseAsTokenMap(toml)

	const results = [
		['smol-toml', x(() => smolTomlParse(toml))],
		['@iarna/toml', x(() => iarnaTomlParse(toml))],
		['@ltd/j-toml', x(() => ltdJTomlParse(toml, { joiner: '\n' }))],
		['fast-toml', x(() => fastTomlParse(toml))],
		["deno's @std/toml", x(() => denoStdParse(toml))],
		['node-toml', x(() => nodeTomlParse(toml, { useTemporal: true }))],
		['js-toml', x(() => jsTomlParse(toml))],
	] as const

	console.log('-----------')
	console.log(name)
	console.log('---')
	const libNameLen = results.reduce((acc, [n]) => Math.max(acc, n.length), 0)
	for (const [lib, actual] of results) {
		const errors = validate(actual, expected)
		console.log('%s\t%s', lib.padEnd(libNameLen), actual ? errors.length ? KO : OK : DNF)
		if (errors) {
			for (const err of errors) console.log.apply(console, err as any)
		}
	}
}
