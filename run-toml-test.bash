#!/usr/bin/env bash
# Requires toml-test from https://github.com/toml-lang/toml-test, commit 291644c or newer (Apr 2025).

skip_decode=(
	# Invalid UTF-8 strings are not rejected
	-skip='invalid/encoding/bad-utf8-*'
	-skip='invalid/encoding/bad-codepoint'

	# JS* doesn't reject invalid dates, but interprets extra days such as "Feb 30 2023" as "Feb 28 2023 +2d" gracefully.
	#
	# *This is true for V8, SpiderMonkey, and JavaScriptCore. Note that this behavior is implementation specific and
	# certain flavors of engines may behave differently.
	#
	# While smol-toml could implement additional checks, this has not been done for performance reasons
	-skip='invalid/local-date/feb-29'
	-skip='invalid/local-datetime/feb-29'
	-skip='invalid/datetime/feb-29'
	-skip='invalid/local-date/feb-30'
	-skip='invalid/local-datetime/feb-30'
	-skip='invalid/datetime/feb-30'
	-skip='invalid/datetime/offset-overflow-hour'
)

toml-test test -toml=1.1 ${skip_decode[@]} \
	-decoder="node ./toml-test-parse.mjs" \
	-encoder="node ./toml-test-encode.mjs"
