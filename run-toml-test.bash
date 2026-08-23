#!/usr/bin/env bash
# Requires toml-test from https://github.com/toml-lang/toml-test, commit 291644c or newer (Apr 2025).

skip_decode=(
	# Invalid UTF-8 strings are not rejected
	-skip='invalid/encoding/bad-utf8-*'
	-skip='invalid/encoding/bad-codepoint'
)

toml-test test -toml=1.1 ${skip_decode[@]} \
	-decoder="node ./toml-test-parse.mjs" \
	-encoder="node ./toml-test-encode.mjs"
