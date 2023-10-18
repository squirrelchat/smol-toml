#!/usr/bin/env bash
#
# Requires toml-test from https://github.com/toml-lang/toml-test, commit 78f8c61
# or newer (Oct 2023).

skip=(
	# Invalid UTF-8 strings are not rejected
	-skip='invalid/encoding/bad-utf8-*'

	# Certain invalid UTF-8 codepoints are not rejected
	-skip='invalid/encoding/bad-codepoint'

	# JS uses floats for numbers
	-skip='valid/integer/long'
)

e=0
toml-test -int-as-float          ${skip[@]} ./toml-test-parse.js  || e=1
toml-test -int-as-float -encoder ${skip[@]} ./toml-test-encode.js || e=1
exit $e
