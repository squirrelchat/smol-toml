/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { bench, do_not_optimize, run, summary } from 'mitata'

summary(() => {
	bench('instanceof without gate', function* () {
		yield {
			[0]() {
				return 'test value' + Math.random()
			},
			bench(val: any) {
				return do_not_optimize(
					val instanceof Temporal.Instant ||
						val instanceof Temporal.PlainDate ||
						val instanceof Temporal.PlainDateTime ||
						val instanceof Temporal.PlainTime ||
						val instanceof Temporal.ZonedDateTime,
				);
			},
		};
	});

	bench('instanceof with gate (truthy)', function* () {
		yield {
			[0]() {
				return 'test value' + Math.random()
			},
			bench(val: any) {
				return do_not_optimize(
					val.since && (
						val instanceof Temporal.Instant ||
						val instanceof Temporal.PlainDate ||
						val instanceof Temporal.PlainDateTime ||
						val instanceof Temporal.PlainTime ||
						val instanceof Temporal.ZonedDateTime
					),
				);
			},
		};
	});

	bench('instanceof with gate (typeof is function)', function* () {
		yield {
			[0]() {
				return 'test value' + Math.random()
			},
			bench(val: any) {
				return do_not_optimize(
					typeof val.since === 'function' && (
						val instanceof Temporal.Instant ||
						val instanceof Temporal.PlainDate ||
						val instanceof Temporal.PlainDateTime ||
						val instanceof Temporal.PlainTime ||
						val instanceof Temporal.ZonedDateTime
					),
				);
			},
		};
	});
});

await run();
