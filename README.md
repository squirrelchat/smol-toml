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
| Spec example   | **60,733.91 op/s**  | 32,565.20 op/s    | 16,781.03 op/s | 31,336.67 op/s |
| ~5MB test file | **4.2567 op/s**     | *DNF*             | 2.4873 op/s    | 2.5790 op/s    |

<details>
<summary>Detailed benchmark data</summary>

Tests ran using Vitest v0.31.0 on commit 361089f3dbc30d994494bf6ec1e8e2f135531247

CPU: Intel Core i7 7700K (4.2GHz)

```
 RUN  v0.31.0

 ✓ bench/parseSpecExample.bench.ts (4) 2466ms
     name                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · smol-toml    60,733.91  0.0145  0.2580  0.0165  0.0152  0.0319  0.0345  0.1383  ±0.46%    30367   fastest
   · @iarna/toml  32,565.20  0.0268  0.3208  0.0307  0.0284  0.0580  0.0619  0.1699  ±0.54%    16283
   · @ltd/j-toml  16,781.03  0.0505  1.0392  0.0596  0.0540  0.1147  0.1360  0.7657  ±1.52%     8391   slowest
   · fast-toml    31,336.67  0.0298  0.3357  0.0319  0.0305  0.0578  0.0622  0.1580  ±0.41%    15669
 ✓ bench/parseLargeMixed.bench.ts (3) 15752ms
     name             hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · smol-toml    4.2567  225.85  257.42  234.92  242.74  257.42  257.42  257.42  ±3.35%       10   fastest
   · @ltd/j-toml  2.4873  382.66  441.12  402.05  416.25  441.12  441.12  441.12  ±3.40%       10   slowest
   · fast-toml    2.5790  377.86  409.32  387.75  392.90  409.32  409.32  409.32  ±2.07%       10


 BENCH  Summary

  smol-toml - bench/parseLargeMixed.bench.ts >
    1.65x faster than fast-toml
    1.71x faster than @ltd/j-toml

  smol-toml - bench/parseSpecExample.bench.ts >
    1.86x faster than @iarna/toml
    1.94x faster than fast-toml
    3.62x faster than @ltd/j-toml
```
</details>
