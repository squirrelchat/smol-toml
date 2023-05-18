# smol-toml
[![TOML 1.0.0](https://img.shields.io/badge/TOML-1.0.0-9c4221?style=flat-square)](https://toml.io/en/v1.0.0)
[![License](https://img.shields.io/github/license/squirrelchat/smol-toml.svg?style=flat-square)](https://github.com/squirrelchat/smol-toml/blob/mistress/LICENSE)
[![npm](https://img.shields.io/npm/v/smol-toml?style=flat-square)](https://npm.im/smol-toml)

A small, fast, and correct TOML parser. smol-toml is fully(ish) spec-compliant with TOML v1.0.0.

Why yet another TOML parser? Well, the ecosystem of TOML parsers in JavaScript is quite underwhelming, most likely due
to a lack of interest. With most parsers being outdated, unmaintained, non-compliant, or a combination of these, a new
parser didn't feel too out of place.

*[insert xkcd 927]*

smol-toml passes most of the tests from [BurntSushi's `toml-test` suite](https://github.com/BurntSushi/toml-test).
However, due to the nature of JavaScript and the limits of the language, it doesn't pass certain tests, namely:
- Invalid UTF-8 strings are not rejected
- Certain invalid UTF-8 codepoints are not rejected
- smol-toml doesn't preserve type information between integers and floats (in JS, everything is a float)
- smol-toml doesn't support the whole 64-bit range for integers (but does throw an appropriate error)
  - As all numbers are floats in JS, the safe range is `2**53 - 1` <=> `-(2**53 - 1)`.

smol-toml also passes all of the tests in https://github.com/iarna/toml-spec-tests.

<details>
<summary>List of failed `toml-test` cases</summary>
These tests were done by modifying `primitive.ts` and make the implementation return bigints for integers. This allows
verifying the parser correctly intents a number to be an integer or a float.

*Ideally, this becomes an option of the library, but for now...*

The following tests are failing:
- invalid/encoding/bad-utf8-in-comment
- invalid/encoding/bad-utf8-in-multiline-literal
- invalid/encoding/bad-utf8-in-multiline
- invalid/encoding/bad-utf8-in-string-literal
- invalid/encoding/bad-utf8-in-string
- invalid/string/bad-codepoint
</details>

## Installation
```
[pnpm | yarn | npm] i smol-toml
```

## Usage
```js
import { parse } from 'smol-toml'

const doc = '...'
const parsed = parse(doc)
console.log(parsed)
```

## Performance
A note on these performance numbers: in some highly synthetic tests, other parsers such as `fast-toml` greatly
outperform other parsers, mostly due to their lack of compliance with the spec. For example, to parse a string,
`fast-toml` skips the entire string while `smol-toml` does validate the string, costing a fair chair of performance.

The ~5MB test file used for benchmark here is filled with random data which attempts to be close-ish to reality. The
idea is to have a file relatively close to a real-world application.

The large TOML generator can be found [here](https://gist.github.com/cyyynthia/e77c744cb6494dabe37d0182506526b9)

|                | smol-toml           | @iarna/toml@3.0.0 | @ltd/j-toml    | fast-toml      |
|----------------|---------------------|-------------------|----------------|----------------|
| Spec example   | **71,356.51 op/s**  | 33,629.31 op/s    | 16,433.86 op/s | 29,421.60 op/s |
| ~5MB test file | **3.8091 op/s**     | *DNF*             | 2.4369 op/s    | 2.6078 op/s    |

<details>
<summary>Detailed benchmark data</summary>

Tests ran using Vitest v0.31.0 on commit 04d233e351f9ae719222154ee2217aea8b95dbab

CPU: Intel Core i7 7700K (4.2GHz)

```
 RUN  v0.31.0

 ✓ bench/parseSpecExample.bench.ts (4) 2462ms
     name                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · smol-toml    71,356.51  0.0132  0.2633  0.0140  0.0137  0.0219  0.0266  0.1135  ±0.37%    35679   fastest
   · @iarna/toml  33,629.31  0.0272  0.2629  0.0297  0.0287  0.0571  0.0650  0.1593  ±0.45%    16815
   · @ltd/j-toml  16,433.86  0.0523  1.3088  0.0608  0.0550  0.1140  0.1525  0.7348  ±1.47%     8217   slowest
   · fast-toml    29,421.60  0.0305  0.2995  0.0340  0.0312  0.0618  0.0640  0.1553  ±0.47%    14711
 ✓ bench/parseLargeMixed.bench.ts (3) 16062ms
     name             hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · smol-toml    3.8091  239.60  287.30  262.53  274.17  287.30  287.30  287.30  ±3.66%       10   fastest
   · @ltd/j-toml  2.4369  376.73  493.49  410.35  442.58  493.49  493.49  493.49  ±7.08%       10   slowest
   · fast-toml    2.6078  373.88  412.79  383.47  388.62  412.79  412.79  412.79  ±2.72%       10


 BENCH  Summary

  smol-toml - bench/parseLargeMixed.bench.ts >
    1.46x faster than fast-toml
    1.56x faster than @ltd/j-toml

  smol-toml - bench/parseSpecExample.bench.ts >
    2.12x faster than @iarna/toml
    2.43x faster than fast-toml
    4.34x faster than @ltd/j-toml
```

---
Additional notes:

I initially tried to benchmark `toml-nodejs`, but the 0.3.0 package is broken.
I initially reported this to the library author, but the author decided to
- a) advise to use a custom loader (via *experimental* flag) to circumvent the invalid imports.
  - Said flag, `--experimental-specifier-resolution`, has been removed in Node v20.
- b) [delete the issue](https://github.com/huan231/toml-nodejs/issues/12) when pointed out links to the NodeJS
documentation about the flag removal and standard resolution algorithm.

For the reference anyways, `toml-nodejs` (with proper imports) is ~8x slower on both benchmark with:
- spec example: 7,543.47 op/s
- 5mb mixed: 0.7006 op/s
</details>
