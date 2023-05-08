# smol-toml
[![License](https://img.shields.io/github/license/squirrelchat/smol-toml.svg?style=flat-square)](https://github.com/squirrelchat/smol-toml/blob/mistress/LICENSE)
[![npm](https://img.shields.io/npm/v/smol-toml?style=flat-square)](https://npm.im/smol-toml)

A small, fast, and correct TOML parser. smol-toml is fully spec-compliant with TOML v1.0.0.

Why yet another TOML parser? Well, the ecosystem of TOML parsers in JavaScript is quite underwhelming, most likely due
to a lack of interest. With most parsers being outdated, unmaintained, non-compliant, or a combination of these, a new
parser didn't feel too out of place.

*[insert xkcd 927]*

smol-toml produces valid results (or errors) for all the test TOML files in https://github.com/iarna/toml-spec-tests.

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
| Spec example   | **37,009.05 op/s**  | 29,203.53 op/s    | 16,225.50 op/s | 23,886.25 op/s |
| ~5MB test file | **4.6007 op/s**     | *DNF*             | 2.4919 op/s    | 2.5952 op/s    |

<details>
<summary>Detailed benchmark data</summary>

Tests ran using Vitest v0.31.0 on commit bd69ffb52920ee6f2843356dff3325fc2e868821

CPU: Intel Core i7 7700K (4.2GHz)

```
✓ bench/parse.bench.ts (7) 17780ms
   ✓ TOML spec example (4) 17778ms
     name                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · smol-toml    37,009.05  0.0231  4.1194  0.0270  0.0260  0.0445  0.0500  0.0622  ±2.88%    18505   fastest
   · @iarna/toml  29,203.53  0.0308  2.1478  0.0342  0.0325  0.0687  0.0714  0.2747  ±1.08%    14602
   · @ltd/j-toml  16,225.50  0.0519  2.8481  0.0616  0.0545  0.1015  0.1193  1.9987  ±3.20%     8113   slowest
   · fast-toml    23,886.25  0.0366  1.7331  0.0419  0.0391  0.0758  0.0818  1.1500  ±1.84%    11944
   ✓ 5MB of TOML (all structures) (3) 17268ms
     name             hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · smol-toml    4.6007  208.19  238.94  217.36  229.56  238.94  238.94  238.94  ±4.10%       10   fastest
   · @ltd/j-toml  2.4919  379.85  428.13  401.31  416.64  428.13  428.13  428.13  ±2.82%       10   slowest
   · fast-toml    2.5952  375.28  416.15  385.33  393.15  416.15  416.15  416.15  ±2.60%       10
```
</details>
