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
A note on these performance numbers: in some highly synthetic tests, other parsers such as `fast-toml` greatly
outperform other parsers, mostly due to their lack of compliance with the spec. For example, to parse a string,
`fast-toml` skips the entire string while `smol-toml` does validate the string, costing a fair chair of performance.

The ~5MB test file used for benchmark here is filled with random data which attempts to be close-ish to reality. The
idea is to have a file relatively close to a real-world application.

The large TOML generator can be found [here](https://gist.github.com/cyyynthia/e77c744cb6494dabe37d0182506526b9)

|                | smol-toml           | @iarna/toml@3.0.0 | @ltd/j-toml    | fast-toml      |
|----------------|---------------------|-------------------|----------------|----------------|
| Spec example   | **34,928.57 op/s**  | 21,322.81 op/s    | 12,472.90 op/s | 28,358.79 op/s |
| ~5MB test file | **4.1308 op/s**     | *DNF*             | 2.1595 op/s    | 2.2635 op/s    |
