#!/usr/bin/env -S just --justfile

set lazy
set guards

export PATH := join(justfile_directory(), "node_modules", ".bin") + ":" + env('PATH')

build:
	tsc
	esbuild dist/index.js --bundle --platform=node --target=node18 --format=cjs --outfile=dist/index.cjs
	node test/package/package-test.mjs

publish: build
	pnpm publish --provenance --access public --no-git-checks

bench: build
	node --expose-gc bench/parse.bench.ts
	node --expose-gc bench/stringify.bench.ts

bench-parse: build
	node --expose-gc bench/parse.bench.ts

bench-stringify: build
	node --expose-gc bench/stringify.bench.ts
