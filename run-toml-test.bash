#!/usr/bin/env bash
# Requires toml-test from https://github.com/toml-lang/toml-test, commit 291644c or newer (Apr 2025).

node_ver=$(node --version)
echo "Node.js" $node_ver

skip_decode=(
	# Invalid UTF-8 strings are not rejected
	-skip='invalid/encoding/bad-utf8-*'
	-skip='invalid/encoding/bad-codepoint'
)

skip_temporal=()

if [[ $node_ver != v26.* ]]; then
	echo
	echo 'NOTE: Skipping tests that only work with Temporal support.'
	echo

	skip_temporal=(
		-skip='invalid/local-date/feb-29'
		-skip='invalid/local-datetime/feb-29'
		-skip='invalid/datetime/feb-29'
		-skip='invalid/local-date/feb-30'
		-skip='invalid/local-datetime/feb-30'
		-skip='invalid/datetime/feb-30'
		-skip='invalid/datetime/offset-overflow-hour'
	)
fi

toml-test test -toml=1.1 ${skip_decode[@]} ${skip_temporal[@]} \
	-decoder="node ./toml-test-parse.mjs" \
	-encoder="node ./toml-test-encode.mjs"
