# smol-toml
A small, fast, and correct TOML parser. smol-toml is (almost) fully spec-compliant with TOML v1.0.0.

Why yet another TOML parser? Well, the ecosystem of TOML parsers in JavaScript is quite lame, most likely due to a
lack of interest. With most parsers being outdated, unmaintained, non-compliant, or a combination of these, a new
parser didn't feel too out of place.

[insert xkcd 927]

smol-toml only fails to comply with the spec in 2 (minor) ways:
- comments are not validated (absence of control characters)
- integers can only be between -9_007_199_254_740_991 and 9_007_199_254_740_991 instead of the recommended full 64-bit range
	- integers outside of this range do raise an error, complying with the specification on this regard

## Installation
TODO

## Performance
TODO

(spoiler: it's fast)
