#!/usr/bin/env bash
# Requires toml-test from https://github.com/toml-lang/toml-test, commit 291644c or newer (Apr 2025).

skip_decode=(
	# Invalid UTF-8 strings are not rejected
	-skip='invalid/encoding/bad-utf8-*'

	# Certain invalid UTF-8 codepoints are not rejected
	-skip='invalid/encoding/bad-codepoint'
	-skip='invalid/string/bad-uni-esc-6'
	-skip='invalid/string/bad-uni-esc-06'
	-skip='invalid/string/bad-uni-esc-ml-6'

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

e=0
# -int-as-float as there is no way to distinguish between them at this time.
# For the encoder, distinction is made between floats and integers using JS bigint, however
# due to the lack of option to always serialize plain numbers as floats, some tests fail (and are therefore skipped)
toml-test -int-as-float          ${skip_decode[@]} ./toml-test-parse.mjs  || e=1
toml-test -int-as-float -encoder                   ./toml-test-encode.mjs || e=1
exit $e
