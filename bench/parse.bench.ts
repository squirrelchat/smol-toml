import { beforeAll, describe, bench } from 'vitest'
import { readFile } from 'fs/promises'
import { parse as smolTomlParse } from '../src/index.js'
import { parse as iarnaTomlParse } from '@iarna/toml'
import { parse as ltdJTomlParse } from '@ltd/j-toml'
import fastTomlParse from 'fast-toml'

describe('TOML spec example', async () => {
	let toml = await readFile(new URL('./testfiles/toml-spec-example.toml', import.meta.url), 'utf8')

	bench('smol-toml', () => {
		smolTomlParse(toml)
	})

	bench('@iarna/toml', () => {
		iarnaTomlParse(toml)
	})

	bench('@ltd/j-toml', () => {
		ltdJTomlParse(toml)
	})

	bench('fast-toml', () => {
		fastTomlParse(toml)
	})
})

describe('5MB of TOML (all structures)', async () => {
	let toml = await readFile(new URL('./testfiles/5mb-mixed.toml', import.meta.url), 'utf8')

	bench('smol-toml', () => {
		smolTomlParse(toml)
	})

	// DNF
	// bench('@iarna/toml', () => {
	// 	iarnaTomlParse(toml)
	// })

	bench('@ltd/j-toml', () => {
		ltdJTomlParse(toml, { joiner: '\n' })
	})

	bench('fast-toml', () => {
		fastTomlParse(toml)
	})
})
