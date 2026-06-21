#!/usr/bin/env -S just --justfile

set lazy
set guards

export PATH := join(justfile_directory(), "node_modules", ".bin") + ":" + env('PATH')

build:
	tsc
	rolldown src/index.ts -p node -f cjs -o dist/index.cjs -s --sourcemap-exclude-sources --strict --exports named --no-comments.legal --banner "`head -n27 src/index.ts`"
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

toml-test: build
	mise exec go@latest go:github.com/toml-lang/toml-test/v2/cmd/toml-test@latest -- bash run-toml-test.bash
