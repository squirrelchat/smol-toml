# smol-toml
[![TOML 1.1.0](https://img.shields.io/badge/TOML-1.1.0-9c4221?style=flat-square)](https://toml.io/en/v1.1.0)
[![License](https://img.shields.io/github/license/squirrelchat/smol-toml.svg?style=flat-square)](https://github.com/squirrelchat/smol-toml/blob/mistress/LICENSE)
[![npm](https://img.shields.io/npm/v/smol-toml?style=flat-square)](https://npm.im/smol-toml)
[![Build](https://img.shields.io/github/actions/workflow/status/squirrelchat/smol-toml/build.yaml?style=flat-square&logo=github)](https://github.com/squirrelchat/smol-toml/actions/workflows/build.yaml)

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-support%20me-EA4AAA?style=flat-square)](https://github.com/sponsors/cyyynthia)
[![Weekly downloads](https://img.shields.io/npm/dw/smol-toml?style=flat-square)](https://npm.im/smol-toml)
[![Monthly downloads](https://img.shields.io/npm/dm/smol-toml?style=flat-square)](https://npm.im/smol-toml)

A small, fast, and correct TOML parser and serializer. smol-toml is fully(ish) spec-compliant with TOML v1.1.0.

Why yet another TOML parser? Well, the ecosystem of TOML parsers in JavaScript is quite underwhelming, most likely due
to a lack of interest. With most parsers being outdated, unmaintained, non-compliant, or a combination of these, a new
parser didn't feel too out of place.

*[insert xkcd 927]*

Nowadays, smol-toml is the most downloaded TOML parser on npm thanks to its quality. From frameworks to tooling, it
has been battle-tested and is actively used in production systems.

smol-toml passes most of the tests from the [`toml-test` suite](https://github.com/toml-lang/toml-test); use the
`run-toml-test.bash` script to run the tests. Due to the nature of JavaScript and the limits of the language,
it doesn't pass certain tests, namely:
- Invalid UTF-8 strings (and comments) are not rejected
- Certain invalid dates are not rejected
  - For instance, `2023-02-30` would be accepted and parsed as `2023-03-02`. While additional checks could be performed
	to reject these, they've not been added for performance reasons.

Please also note that by default, the behavior regarding integers doesn't preserve type information, nor does it allow
deserializing integers larger than 53 bits. See [Integers](#integers).

You can see a list of all tests smol-toml fails (and the reason why it fails these) in the list of skipped tests in
`run-toml-test.bash`. Note that some failures are *not* specification violations per-se. For instance, the TOML spec
does not require 64-bit integer range support or sub-millisecond time precision, but are included in the `toml-test`
suite. See https://github.com/toml-lang/toml-test/issues/154 and https://github.com/toml-lang/toml-test/issues/155

## Installation
```
[pnpm | yarn | npm] i smol-toml
```

## Usage
```js
import { parse, stringify } from 'smol-toml'

const doc = '...'
const parsed = parse(doc)
console.log(parsed)

const toml = stringify(parsed)
console.log(toml)
```

Alternatively, if you prefer something similar to the JSON global, you can import the library as follows
```js
import TOML from 'smol-toml'

TOML.stringify({ ... })
```

A few notes on the `stringify` function:
- `undefined` and `null` values on objects are ignored (does not produce a key/value).
- `undefined` and `null` values in arrays are **rejected**.
- Functions, classes and symbols are **rejected**.
- By default, floats will be serialized as integers if they don't have a decimal part. See [Integers](#integers)
  - `stringify(parse('a = 1.0')) === 'a = 1'`
- JS `Date` will be serialized as Offset Date Time
  - Use the [`TomlDate` object](#dates) for representing other types.

### Integers
When parsing, both integers and floats are read as plain JavaScript numbers, which essentially are floats. This means
loss of type information, and makes it impossible to safely represent integers beyond 53 bits.

When serializing, numbers without a decimal part are serialized as integers (except if they're outside of the safe
range; i.e. they cannot be represented as a signed 53-bit integer). This allows in most cases to preserve
whether a number is an integer or not, but fails to preserve type information for numbers like `1.0`.

#### Enabling BigInt support and type preservation
To parse integers beyond 53 bits, it's possible to tell the parser to return all integers as BigInt. This will
therefore preserve the type information at the cost of using a slightly more expensive container.

```js
import { parse } from 'smol-toml'

const doc = '...'
const parsed = parse(doc, { integersAsBigInt: true })
```

If you want to keep numbers for integers that can safely be represented as a JavaScript number, you can pass
`"asNeeded"` instead.

To get end-to-end type preservation, you can tell the serializer to always treat numbers as floating point numbers.
Then, only BigInts will be serialized as integers and numbers without a decimal part will still be serialized as float.

```js
import { stringify } from 'smol-toml'

const obj =  { ... }
const toml = stringify(obj, { numbersAsFloat: true })
```

### Dates
`smol-toml` uses an extended `Date` object to represent all types of TOML Dates. In the future, `smol-toml` will use
objects from the Temporal proposal, but for now we're stuck with the legacy Date object.

```js
import { TomlDate } from 'smol-toml'

// Offset Date Time
const date = new TomlDate('1979-05-27T07:32:00.000-08:00')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> true, false, false, false
console.log(date.toISOString()) // ~> 1979-05-27T07:32:00.000-08:00

// Local Date Time
const date = new TomlDate('1979-05-27T07:32:00.000')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> true, false, false, true
console.log(date.toISOString()) // ~> 1979-05-27T07:32:00.000

// Local Date
const date = new TomlDate('1979-05-27')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> false, true, false, true
console.log(date.toISOString()) // ~> 1979-05-27

// Local Time
const date = new TomlDate('07:32:00')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> false, false, true, true
console.log(date.toISOString()) // ~> 07:32:00.000
```

You can also wrap a native `Date` object and specify using different methods depending on the type of date you wish
to represent:

```js
import { TomlDate } from 'smol-toml'

const jsDate = new Date()

const offsetDateTime = TomlDate.wrapAsOffsetDateTime(jsDate)
const localDateTime = TomlDate.wrapAsLocalDateTime(jsDate)
const localDate = TomlDate.wrapAsLocalDate(jsDate)
const localTime = TomlDate.wrapAsLocalTime(jsDate)
```

## Performance
The benchmark is ran using [mitata](https://github.com/evanwashere/mitata).

Parsers and serializers are tested in 2 scenarios: using the example from TOML's homepage and specification, and
using a ~5MB randomly generated[^generator] file.

[^generator]: The TOML generator used can be found [here](https://gist.github.com/cyyynthia/e77c744cb6494dabe37d0182506526b9)

While `fast-toml` is included as it's a challenging candidate, it takes a lot of shortcuts that makes it very fast,
but at the expense of correctness (it has significant defects and does not pass the TOML test suite). `smol-toml` is
almost as fast, without sacrificing correctness. 😎

| **Parse**      | smol-toml@1.7.0    | @iarna/toml@3.0.0 | @ltd/j-toml@1.38.0 | fast-toml@0.5.4 | @std/toml@1.0.11 | toml@4.1.1     | js-toml@1.1.2  | @decimalturn/toml-patch@2.0.0 |
|----------------|--------------------|-------------------|--------------------|-----------------|------------------|----------------|----------------|-------------------------------|
| Spec example   | **4.90 µs/iter**   | 12.36 µs/iter     | 33.17 µs/iter      | *4.80 µs/iter*  | 22.94 µs/iter    | 29.86 µs/iter  | 23.67 µs/iter  | 17.81 µs/iter                 |
| ~5MB test file | **116.74 ms/iter** | *DNF*             | 198.57 ms/iter     | *93.51 ms/iter* | 429.91 ms/iter   | 415.92 ms/iter | 361.89 ms/iter | 176.94 ms/iter                |

| **Stringify**  | smol-toml@1.7.0    | @iarna/toml@3.0.0 | @ltd/j-toml@1.38.0 | fast-toml@0.5.4 | @std/toml@1.0.11 | toml@4.1.1     | js-toml@1.1.2  | @decimalturn/toml-patch@2.0.0 |
|----------------|--------------------|-------------------|--------------------|-----------------|------------------|----------------|----------------|-------------------------------|
| Spec example   | **2.24 µs/iter**   | 8.68 µs/iter      | 89.89 µs/iter      | N/A             | 3.86 µs/iter     | N/A            | 3.53 µs/iter   | N/A[^toml-patch-note]         |
| ~5MB test file | **42.34 ms/iter**  | 132.74 ms/iter    | 921.98 ms/iter     | N/A             | 68.37 ms/iter    | N/A            | 106.14 ms/iter | N/A[^toml-patch-note]         |

[^toml-patch-note]: Stringify performance is not included here, as the library is not meant to be fast, but rather
capable of doing precise non-destructive edits that preserve the entire document's shape and format. Putting it here
wouldn't be fair.

<details>
<summary>Detailed benchmark data</summary>

```
node --expose-gc bench/parse.bench.ts
clk: ~5.47 GHz
cpu: AMD Ryzen 9 9950X3D 16-Core Processor
runtime: node 26.3.1 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
• spec document
------------------------------------------- -------------------------------
smol-toml                      4.90 µs/iter   4.85 µs  █
                       (4.72 µs … 96.03 µs)   6.13 µs  █▅
                    (  2.09 kb … 325.14 kb)  12.96 kb ▁██▄▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   4.01 ipc ( 99.63% cache)   21.59 branch misses
         27.50k cycles 110.19k instructions   4.09k c-refs   15.27 c-misses

@iarna/toml                   12.36 µs/iter  12.19 µs  █
                     (11.86 µs … 131.24 µs)  16.53 µs  █
                    (176.00  b … 360.27 kb)  24.00 kb ▅█▅▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.97 ipc ( 99.71% cache)   60.52 branch misses
         68.38k cycles 271.17k instructions  12.01k c-refs   35.06 c-misses

@ltd/j-toml                   33.17 µs/iter  32.50 µs     ▇█
                       (31.03 µs … 1.10 ms)  36.36 µs    ███▆
                    ( 40.00  b … 537.94 kb)  27.61 kb ▁▃▇████▆▂▁▁▂▂▁▁▁▁▁▁▁▁
                   3.15 ipc ( 99.50% cache)  305.47 branch misses
        183.96k cycles 579.46k instructions  32.33k c-refs  160.93 c-misses

fast-toml                      4.80 µs/iter   4.77 µs   █
                       (4.61 µs … 96.44 µs)   5.58 µs   █▃
                    (256.00  b … 329.85 kb)  12.55 kb ▁▆██▅▄▃▂▂▁▁▁▁▁▁▁▁▁▁▁▁
                   4.61 ipc ( 99.61% cache)   18.02 branch misses
         26.90k cycles 123.90k instructions   3.73k c-refs   14.45 c-misses

deno's @std/toml              22.94 µs/iter  22.84 µs     █
                     (21.43 µs … 183.90 µs)  27.22 µs     ██
                    (800.00  b … 619.62 kb)  64.88 kb ▁▄▄▆██▅▂▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.73 ipc ( 99.67% cache)  106.77 branch misses
        126.43k cycles 472.03k instructions  23.79k c-refs   79.52 c-misses

node-toml                     29.86 µs/iter  29.51 µs  █
                     (28.17 µs … 200.95 µs)  42.50 µs  █▇
                    (976.00  b … 785.96 kb) 104.23 kb ▄██▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   4.01 ipc ( 99.36% cache)  146.79 branch misses
        163.80k cycles 657.50k instructions  27.26k c-refs  174.37 c-misses

js-toml                       23.67 µs/iter  23.31 µs  █▃
                     (22.10 µs … 196.26 µs)  34.04 µs  ██
                    (  2.55 kb … 678.23 kb)  96.06 kb ▃██▄▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   4.14 ipc ( 98.56% cache)  141.38 branch misses
        129.53k cycles 536.67k instructions  18.52k c-refs  266.18 c-misses

@decimalturn/toml-patch       17.81 µs/iter  17.68 µs  █▇
                     (16.82 µs … 159.63 µs)  23.01 µs  ██▅
                    (264.00  b … 651.59 kb)  56.03 kb ▃███▄▂▂▂▂▂▁▁▁▁▁▁▁▁▁▁▁
                   3.60 ipc ( 99.55% cache)   73.51 branch misses
         98.49k cycles 354.88k instructions  20.21k c-refs   90.93 c-misses

summary
  fast-toml
   1.02x faster than smol-toml
   2.57x faster than @iarna/toml
   3.71x faster than @decimalturn/toml-patch
   4.77x faster than deno's @std/toml
   4.93x faster than js-toml
   6.22x faster than node-toml
   6.9x faster than @ltd/j-toml                                                                                   (nice)

• 5MB document
------------------------------------------- -------------------------------
smol-toml                    116.74 ms/iter 118.39 ms █      █
                    (110.52 ms … 127.54 ms) 123.91 ms █ ▅ ▅  █ ▅ ▅▅  ▅    ▅
                    ( 32.98 mb …  49.20 mb)  42.93 mb █▁█▁█▁▁█▁█▁██▁▁█▁▁▁▁█
                   2.48 ipc ( 98.45% cache)   3.17M branch misses
        629.10M cycles   1.56G instructions 101.49M c-refs   1.58M c-misses

@iarna/toml                  error: Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z at row 5, col 45, pos 569:
4: NfF6LuAerfn5mDPI7Cp 2qsrB4vGmJTyb5jNubOIBYYWrWlAsrw PX93S57gjb5GEhR8qOU5blDQmwfVJTA YvmJ9cE3cUZU NAJQgAbIdpZLhc4lOs4ZhMEWehhZqXCsVD1YP1vN2GEoM2WX''', 1986-05-27T18:36:13Z, -5460, "2ZAV3fYlb23hf7r7QoftVlicWE2iuwp", 4790.2253 ]
5> SzeC4Me8T = [ 5928.9340, 1991-04-28 19:24:24, 7807, -782.4516, 0b1000011111, "YvXRZKBGle9d51sqE90t8hP" ]
                                               ^
6: SLMvBirT.pmpX1D.9PivpfFBo = 2010-09-29



@ltd/j-toml                  198.57 ms/iter 196.77 ms    █
                    (181.11 ms … 291.66 ms) 209.47 ms   ██
                    (  8.55 mb …  55.95 mb)  35.95 mb ████▁▁▁▁▁█▁█▁▁▁█▁▁▁▁█
                   2.32 ipc ( 97.82% cache)   3.98M branch misses
          1.08G cycles   2.50G instructions 166.94M c-refs   3.63M c-misses

fast-toml                     93.51 ms/iter  95.06 ms         █
                      (89.98 ms … 96.83 ms)  95.74 ms ▅   ▅ ▅ █▅     ▅▅ ▅▅▅
                    ( 13.30 mb …  34.88 mb)  24.04 mb █▁▁▁█▁█▁██▁▁▁▁▁██▁███
                   2.83 ipc ( 98.14% cache)   2.36M branch misses
        507.32M cycles   1.44G instructions  66.44M c-refs   1.23M c-misses

deno's @std/toml             429.91 ms/iter 436.58 ms                     █
                    (419.32 ms … 441.05 ms) 437.63 ms ▅ ▅▅▅  ▅ ▅     ▅ ▅ ▅█
                    (180.32 mb … 204.05 mb) 191.51 mb █▁███▁▁█▁█▁▁▁▁▁█▁█▁██
                   3.15 ipc ( 97.05% cache)   6.63M branch misses
          2.36G cycles   7.45G instructions 255.14M c-refs   7.54M c-misses

node-toml                    415.92 ms/iter 413.57 ms ██
                    (404.84 ms … 448.96 ms) 438.33 ms ██                  █
                    ( 45.80 mb …  78.18 mb)  50.13 mb ████▁█▁▁▁▁▁▁▁▁▁▁▁▁▁▁█
                   4.26 ipc ( 97.29% cache)   6.53M branch misses
          2.25G cycles   9.59G instructions 194.56M c-refs   5.27M c-misses

js-toml                      361.89 ms/iter 369.39 ms  █
                    (346.05 ms … 406.77 ms) 394.74 ms ▅█ ▅
                    (249.62 mb … 282.33 mb) 265.65 mb ██▁█▁▁▁▁▁▁▇▁▁▁▇▁▁▁▁▁▇
                   2.55 ipc ( 94.91% cache)   5.64M branch misses
          1.73G cycles   4.43G instructions 112.66M c-refs   5.74M c-misses

@decimalturn/toml-patch      176.94 ms/iter 174.86 ms    █
                    (172.74 ms … 197.94 ms) 182.08 ms █ ██
                    ( 27.14 mb …  38.55 mb)  28.81 mb █▁████▁▁▁▁▁█▁▁▁▁▁▁▁▁█
                   3.18 ipc ( 97.69% cache)   3.58M branch misses
        947.48M cycles   3.02G instructions 130.37M c-refs   3.01M c-misses

summary
  fast-toml
   1.25x faster than smol-toml
   1.89x faster than @decimalturn/toml-patch
   2.12x faster than @ltd/j-toml
   3.87x faster than js-toml
   4.45x faster than node-toml
   4.6x faster than deno's @std/toml


node --expose-gc bench/stringify.bench.ts
clk: ~5.48 GHz
cpu: AMD Ryzen 9 9950X3D 16-Core Processor
runtime: node 26.3.1 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
• spec document
------------------------------------------- -------------------------------
smol-toml                      2.24 µs/iter   2.24 µs  ▄       █
                        (2.22 µs … 2.27 µs)   2.27 µs  █▃   ▅▆ █▃
                    (  4.60 kb …   4.71 kb)   4.61 kb ▅███▃██████▃▇▃▃▅▃▁▁▃▅
                   4.62 ipc ( 99.64% cache)    5.08 branch misses
         12.21k cycles  56.44k instructions   1.12k c-refs    4.08 c-misses

@iarna/toml                    8.68 µs/iter   8.67 µs   █
                        (8.65 µs … 8.89 µs)   8.73 µs  ▅█▅  ▅
                    (654.88  b …   1.53 kb) 720.60  b ▇███▇▁█▁▁▁▁▁▇▇▁▁▁▁▁▁▇
                   4.00 ipc ( 99.49% cache)   23.53 branch misses
         47.95k cycles 191.80k instructions   7.11k c-refs   36.09 c-misses

@ltd/j-toml                   89.89 µs/iter  90.21 µs                █
                     (69.82 µs … 209.14 µs)  95.93 µs                █
                    (  4.04 kb … 389.75 kb)  37.49 kb ▁▁▁▁▁▁▁▂▁▁▁▁▁▁▁█▄▄▃▂▂
                   4.20 ipc ( 99.76% cache)  544.09 branch misses
        490.58k cycles   2.06M instructions  35.22k c-refs   82.84 c-misses

deno's @std/toml               3.86 µs/iter   3.86 µs            █
                        (3.83 µs … 4.24 µs)   3.88 µs ▅ ▅    █▅▅██▅
                    (836.05  b …   4.28 kb)   0.98 kb █▁██▅█▅████████▁▁▁▁▁▅
                   4.00 ipc ( 99.60% cache)    6.22 branch misses
         21.36k cycles  85.36k instructions   3.32k c-refs   13.27 c-misses

js-toml                        3.53 µs/iter   3.54 µs    █▂▄
                        (3.52 µs … 3.58 µs)   3.58 µs   ▆███
                    (  5.76 kb …   7.29 kb)   6.98 kb ▃▇████▃▅▁▃▁▃▁▁▁▁▁▁▁▁▃
                   4.37 ipc ( 99.11% cache)   10.24 branch misses
         19.45k cycles  84.99k instructions   2.10k c-refs   18.67 c-misses

@decimalturn/toml-patch       81.54 µs/iter  81.22 µs  █
                     (78.63 µs … 341.24 µs) 103.14 µs  █▂
                    (872.00  b … 831.95 kb) 113.00 kb ▃██▅▃▂▁▂▁▁▁▁▁▁▁▁▁▁▁▁▁
                   4.56 ipc ( 99.28% cache)  567.51 branch misses
        443.97k cycles   2.02M instructions  52.63k c-refs  381.28 c-misses

summary
  smol-toml
   1.58x faster than js-toml
   1.73x faster than deno's @std/toml
   3.88x faster than @iarna/toml
   36.44x faster than @decimalturn/toml-patch
   40.18x faster than @ltd/j-toml

• 5MB document
------------------------------------------- -------------------------------
smol-toml                     42.34 ms/iter  43.06 ms █                   █
                      (40.50 ms … 45.33 ms)  43.51 ms █    ▅▅▅▅   ▅  ▅▅▅  █
                    (  9.46 mb …  35.74 mb)  12.91 mb █▁▁▁▁████▁▁▁█▁▁███▁▁█
                   2.12 ipc ( 95.19% cache)   1.59M branch misses
        217.80M cycles 462.56M instructions  14.99M c-refs 720.67k c-misses

@iarna/toml                  132.74 ms/iter 134.02 ms                █
                    (125.91 ms … 138.18 ms) 137.02 ms              █ █
                    ( 27.35 mb …  54.08 mb)  41.53 mb █▁▁█▁▁▁▁█▁▁█▁███▁▁▁▁█
                   2.56 ipc ( 97.08% cache)   4.44M branch misses
        704.85M cycles   1.80G instructions  85.83M c-refs   2.50M c-misses

@ltd/j-toml                  921.98 ms/iter 927.58 ms               █  ██ █
                    (889.05 ms … 937.02 ms) 929.09 ms ▅             █ ▅██▅█
                    (  4.20 mb …  33.46 mb)  18.59 mb █▁▁▁▁▁▁▁▁▁▁▁▁▁█▁█████
                   4.06 ipc ( 99.42% cache)   6.75M branch misses
          5.04G cycles  20.45G instructions 243.67M c-refs   1.41M c-misses

deno's @std/toml              68.37 ms/iter  69.68 ms    █      █
                      (61.79 ms … 78.19 ms)  77.23 ms ▅ ▅█▅  ▅ ▅█ ▅       ▅
                    ( 29.04 mb …  62.29 mb)  33.86 mb █▁███▁▁█▁██▁█▁▁▁▁▁▁▁█
                   2.21 ipc ( 95.21% cache)   1.74M branch misses
        332.33M cycles 732.79M instructions  30.06M c-refs   1.44M c-misses

js-toml                      106.14 ms/iter 107.44 ms  █
                    (102.35 ms … 117.91 ms) 108.69 ms ▅█  ▅▅  ▅ ▅▅    ▅  ▅▅
                    ( 34.03 mb …  62.21 mb)  44.13 mb ██▁▁██▁▁█▁██▁▁▁▁█▁▁██
                   2.39 ipc ( 96.23% cache)   3.05M branch misses
        570.22M cycles   1.36G instructions  50.24M c-refs   1.90M c-misses

@decimalturn/toml-patch         1.07 s/iter    1.08 s █       █     █
                          (1.05 s … 1.14 s)    1.09 s █▅ ▅▅   █     █  ▅  ▅
                    (116.61 mb … 147.62 mb) 121.20 mb ██▁██▁▁▁█▁▁▁▁▁█▁▁█▁▁█
                   3.67 ipc ( 93.69% cache)  12.18M branch misses
          5.77G cycles  21.17G instructions 780.26M c-refs  49.26M c-misses

summary
  smol-toml
   1.61x faster than deno's @std/toml
   2.51x faster than js-toml
   3.13x faster than @iarna/toml
   21.77x faster than @ltd/j-toml
   25.29x faster than @decimalturn/toml-patch
```

</details>
