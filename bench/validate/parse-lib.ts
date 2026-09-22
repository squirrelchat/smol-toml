/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: 0BSD
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import type { TomlDocument } from '@decimalturn/toml-patch'
import { parseDocument } from '@decimalturn/toml-patch'
import { TomlDate } from '../../dist/date.js'

type BlockItem = TomlDocument['cst'][number]
type RowItem = Extract<BlockItem, { items: unknown[] }>['items'][number]
type ValueItem = Extract<BlockItem, { value: unknown }>['value']

type DocItem = BlockItem | RowItem | ValueItem
type DocItemType = DocItem['type']

type Location = BlockItem['loc']

type DfnRecord = { key: string, loc: Location }
type ValRecord = { [VAL]: true, str: string, val: unknown, loc: Location }

const VAL = Symbol()
const DEF = Symbol()

function isItemType<T extends DocItemType>(item: DocItem, ...types: `${T}`[]): item is (DocItem & { type: T }) {
	return types.includes(item.type as any)
}

function createObject(dfn: DfnRecord, val?: any) {
	val ??= Object.create(null)
	Object.defineProperty(val, DEF, { enumerable: true, configurable: true, writable: true, value: dfn })
	return val
}

function pull(obj: any, key: string[], dfn: DfnRecord): [any, string] {
	const lkey = key.pop()!
	for (const k of key) {
		obj = (obj[k] ??= createObject(dfn))
		if (Array.isArray(obj)) obj = obj[obj.length - 1]
	}

	return [obj, lkey]
}

// SPDX-SnippetBegin
// SPDX-License-Identifier: MIT
// SPDX-SnippetCopyrightText: Copyright (c) 2019–2025 Tim Hall
// SPDX-SnippetCopyrightText: Copyright (c) 2025 Martin Leduc
import { LocalDate, LocalTime, LocalDateTime, OffsetDateTime } from '@decimalturn/toml-patch'

function decodeDate(value: Date) {
	if (value instanceof LocalDate) {
		return Temporal.PlainDate.from(value.toISOString());
	}
	// LocalTime → Temporal.PlainTime
	if (value instanceof LocalTime) {
		return Temporal.PlainTime.from(value.toISOString());
	}
	// LocalDateTime → Temporal.PlainDateTime
	if (value instanceof LocalDateTime) {
		// toISOString() uses a space separator when the original TOML did
		// (useSpaceSeparator flag). Temporal.from() requires T.
		return Temporal.PlainDateTime.from(value.toISOString().replace(' ', 'T'));
	}

	// OffsetDateTime → Temporal.ZonedDateTime
	if (value instanceof OffsetDateTime) {
		// Same: toISOString() uses a space separator when the original TOML did.
		// Normalize to T before extracting the offset and calling .from().
		const iso = value.toISOString().replace(' ', 'T');
		const offsetMatch = iso.match(/([+-]\d{2}:\d{2}|Z)$/);
		const offset = offsetMatch ? offsetMatch[1] : 'Z';
		const plainIso = iso.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
		const tz = offset === 'Z' ? '+00:00' : offset;
		return Temporal.ZonedDateTime.from(`${plainIso}${offset}[${tz}]`);
	}

	// Fallback: native Date or unrecognized Date subclass → Temporal.PlainDateTime
	return Temporal.PlainDate.from(value.toISOString().replace('Z', ''));
}
// SPDX-SnippetEnd

function decodeValue(block: ValueItem): any {
	if (isItemType(block, 'Boolean', 'String', 'Integer', 'Float')) {
		return {
			[VAL]: true,
			loc: block.loc,
			str: 'raw' in block ? block.raw : `${block.value}`,
			val: block.value
		}
	}

	if (isItemType(block, 'DateTime')) {
		return {
			[VAL]: true,
			loc: block.loc,
			str: block.raw,
			val: decodeDate(block.value),
		}
	}

	if (isItemType(block, 'InlineArray')) {
		const ret = []
		for (const item of block.items) {
			// Typed as `TreeNode`, doesn't seem to be anything other than `ValueItem`
			ret.push(decodeValue(item.item as any))
		}
		return ret
	}

	if (isItemType(block, 'InlineTable')) {
		const ret = Object.create(null)
		for (const item of block.items) {
			const [obj, k] = pull(ret, item.item.key.value, { key: item.item.key.raw, loc: item.item.key.loc })
			obj[k] = decodeValue(item.item.value)
		}
		return ret
	}

	throw new Error('unhandled node value: ' + (block as any).type)
}

function documentToTokens(blocks: BlockItem[], result: any = Object.create(null)) {
	let curr = result
	for (const block of blocks) {
		if (isItemType(block, 'Table')) {
			const dfn = { key: block.key.item.raw, loc: block.key.loc }
			const [obj, k] = pull(result, block.key.item.value, dfn)
			documentToTokens(block.items, (obj[k] ??= createObject(dfn)))
		}

		else if (isItemType(block, 'TableArray')) {
			const dfn = { key: block.key.item.raw, loc: block.key.loc }
			const [obj, k] = pull(result, block.key.item.value, dfn)
			const arr = (obj[k] ??= [])
			arr.push(documentToTokens(block.items, createObject(dfn)))
		}

		else if (isItemType(block, 'KeyValue')) {
			const [obj, key] = pull(curr, block.key.value, { key: block.key.raw, loc: block.key.loc })
			obj[key] = decodeValue(block.value)
		}
	}

	return result
}

export function parseAsTokenMap(toml: string) {
	const doc = parseDocument(toml, { temporal: true })
	return documentToTokens(doc.cst)
}

type AnyTemporal = Date | Temporal.ZonedDateTime | Temporal.PlainDateTime | Temporal.PlainDate | Temporal.PlainTime | Temporal.Instant
function isDateTime(val: any): val is AnyTemporal {
	return val instanceof Date ||
		val instanceof Temporal.ZonedDateTime ||
		val instanceof Temporal.PlainDateTime ||
		val instanceof Temporal.PlainDate ||
		val instanceof Temporal.PlainTime ||
		val instanceof Temporal.Instant
}



function compareDateTime(a: Date | AnyTemporal, b: AnyTemporal, lax = false) {
	if (b instanceof Date) throw new Error('internal error: expected map must not use date???')

	if (a instanceof Temporal.ZonedDateTime) a = a.withTimeZone('UTC')
	if (a instanceof Temporal.Instant) a = a.toZonedDateTimeISO('UTC')
	if (b instanceof Temporal.ZonedDateTime) b = b.withTimeZone('UTC')
	if (b instanceof Temporal.Instant) b = b.toZonedDateTimeISO('UTC')

	if (a instanceof Date) {
		// Accept Local Date Time that have been translated to the local timezone.
		if (lax) a.setTime(a.getTime() - (a.getTimezoneOffset() * 60e3))
		let ok = true

		if (!(b instanceof Temporal.PlainTime)) {
			ok &&=
				(a.getUTCFullYear || a.getFullYear).call(a) === b.year &&
				(a.getUTCMonth || a.getMonth).call(a) + 1 === b.month &&
				(a.getUTCDate || a.getDate).call(a) === b.day
		}

		if (!(b instanceof Temporal.PlainDate)) {
			ok &&=
				(a.getUTCHours || a.getHours).call(a) === b.hour &&
				(a.getUTCMinutes || a.getMinutes).call(a) === b.minute &&
				(a.getUTCSeconds || a.getSeconds).call(a) === b.second &&
				(a.getUTCMilliseconds || a.getMilliseconds).call(a) === b.millisecond
		}

		if (!ok && !lax && b instanceof Temporal.PlainDateTime) return compareDateTime(a, b, true)
		return ok
	}

	return (
		(
			(a instanceof Temporal.ZonedDateTime && b instanceof Temporal.ZonedDateTime) ||
			(a instanceof Temporal.PlainDateTime && b instanceof Temporal.PlainDateTime) ||
			(a instanceof Temporal.PlainDate && b instanceof Temporal.PlainDate) ||
			(a instanceof Temporal.PlainTime && b instanceof Temporal.PlainTime)
		) &&
		a.equals(b as any)
	)
}

export function validate(obj: any, map: any, err: unknown[] = []) {
	if (map[VAL]) {
		map = map as ValRecord

		if (obj === map.val) return err
		if (typeof obj === 'number' && typeof map.val === 'number' && isNaN(obj) && isNaN(map.val)) return err
		if (typeof obj === 'bigint' && Number.isInteger(map.val) && obj === BigInt(map.val)) return err

		if (isDateTime(map.val)) {
			// Deno returns local time as string; let it slide
			if (typeof obj === 'string' && /^\d\d:\d\d:\d\d(\.\d+)?$/.test(obj)) obj = new TomlDate(obj)
			if (compareDateTime(obj, map.val)) return err
		}

		const expected = isDateTime(map.val) ? map.val.toString() : typeof map.val === 'string' ? map.val : map.val
		const actual = isDateTime(obj) ? obj instanceof Date ? obj.toISOString() : obj.toString() : typeof obj === 'string' ? obj : obj
		err.push(['\tBad value: expected %o, got %o (for %o at L%d:%d)', expected, actual, map.str, map.loc.start.line, map.loc.start.column])
		return err
	}

	if (!obj || typeof obj !== 'object') {
		console.log('O??')
		return err
	}

	let kObj = Object.keys(obj)
	let kMap = Object.keys(map)
	if (kObj.length !== kMap.length || kObj.find((k) => !kMap.includes(k)) !== undefined) {
		throw new Error('todo: implement report of bad keys')
	}

	for (var prop in obj) {
		validate(obj[prop], map[prop], err)
	}

	return err
}
