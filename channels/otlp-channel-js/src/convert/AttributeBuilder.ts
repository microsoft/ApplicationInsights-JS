// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, isArray, isBoolean, isNullOrUndefined, isNumber, isString, mathFloor, objForEachKey } from "@nevware21/ts-utils";
import { OtlpPiiMode } from "../Interfaces/IOtlpChannelConfig";
import { IOtlpAnyValue, IOtlpKeyValue } from "../Interfaces/IOtlpTypes";
import { MS_PREFIX } from "../InternalConstants";

/**
 * The largest integer that can be represented exactly by a JavaScript number.
 * `Number.MAX_SAFE_INTEGER` is ES2015 so the value is inlined for ES5 environments.
 */
const MAX_SAFE_INT = 9007199254740991;

/**
 * Options that control how values are converted into attributes.
 */
export interface IAttrOptions {
    /**
     * How values that the Common Schema marks as PII or customer content are handled.
     */
    piiMode: OtlpPiiMode;
}

/**
 * Accumulates the attributes for a single record.
 *
 * @remarks
 * A duplicated key has undefined behaviour in OTLP, so the writer tracks the keys it has already
 * emitted. When a key is written more than once the later value replaces the earlier one (keeping
 * the original position), which implements the precedence where the more specific source wins. This
 * matters in practice because Application Insights copies the same custom properties into both
 * `baseData.properties` and the Part C data of an item.
 */
export interface IAttributeWriter {
    /**
     * The attributes written so far.
     */
    attrs: IOtlpKeyValue[];

    /**
     * A map of each attribute key to its index within {@link IAttributeWriter.attrs}.
     */
    keys: { [key: string]: number };

    options: IAttrOptions;
}

/**
 * Creates an attribute writer.
 * @param options - The options controlling how values are converted.
 * @returns The new writer.
 */
export function createAttributeWriter(options?: IAttrOptions): IAttributeWriter {
    return {
        attrs: [],
        keys: {},
        options: options || { piiMode: "drop" }
    };
}

/**
 * Converts a single JavaScript value into the OTLP `AnyValue` representation.
 *
 * @remarks
 * Integers are emitted as `intValue` (a decimal string) only when they can be represented exactly,
 * everything else that is numeric is emitted as a `doubleValue`. Values that are not directly
 * representable (functions, symbols, cyclic objects) fall back to a string representation so that a
 * single unusual property can never fail the conversion of an entire batch.
 *
 * @param value - The value to convert.
 * @returns The OTLP `AnyValue` for the supplied value.
 */
export function toAnyValue(value: any): IOtlpAnyValue {
    if (isString(value)) {
        return { stringValue: value };
    }

    if (isBoolean(value)) {
        return { boolValue: value };
    }

    if (isNumber(value)) {
        if (isNaN(value) || !isFinite(value)) {
            // Neither NaN nor +/-Infinity are representable in JSON, preserve them as strings
            return { stringValue: "" + value };
        }

        if (mathFloor(value) === value && value <= MAX_SAFE_INT && value >= -MAX_SAFE_INT) {
            return { intValue: "" + value };
        }

        return { doubleValue: value };
    }

    if (isArray(value)) {
        let values: IOtlpAnyValue[] = [];
        arrForEach(value, (entry) => {
            values.push(toAnyValue(entry));
        });

        return { arrayValue: { values: values } };
    }

    if (isNullOrUndefined(value)) {
        // An AnyValue with no member set represents an empty value
        return {};
    }

    // Dates are far more useful as an ISO string than as an opaque key / value list
    if ((value as Date).toISOString && (value as Date).getTime) {
        return { stringValue: (value as Date).toISOString() };
    }

    if (typeof value === "object") {
        try {
            let values: IOtlpKeyValue[] = [];
            objForEachKey(value, (key, entry) => {
                values.push({ key: key, value: toAnyValue(entry) });
            });

            return { kvlistValue: { values: values } };
        } catch (e) {
            // Fall through to the string representation below
        }
    }

    return { stringValue: safeStringify(value) };
}

/**
 * Recursively strips or replaces any nested Common Schema PII marked value.
 *
 * @remarks
 * A property value can itself be an object containing `IEventProperty` members. Those never pass
 * through the top level resolver, so without this they would be serialized verbatim by
 * {@link toAnyValue} and a PII marked value nested one level down would leak even in `drop` mode.
 *
 * @param value - The value to sanitize.
 * @param options - The attribute options carrying the PII mode.
 * @param depth - Guards against a pathologically deep or cyclic object.
 * @returns The sanitized value, or `undefined` when the whole value must be dropped.
 */
export function sanitizeNested(value: any, options: IAttrOptions, depth?: number): any {
    let level = depth || 0;
    if (level > 8 || !value || typeof value !== "object") {
        return value;
    }

    if (isArray(value)) {
        let result: any[] = [];
        arrForEach(value, (entry) => {
            let sanitized = sanitizeNested(entry, options, level + 1);
            if (!isNullOrUndefined(sanitized)) {
                result.push(sanitized);
            }
        });

        return result;
    }

    // An IEventProperty nested inside another value
    if (!isNullOrUndefined(value.value) && isNumber(value.kind)) {
        if (value.kind <= 0) {
            return sanitizeNested(value.value, options, level + 1);
        }

        if (value.kind === PII_DROP_VALUE || options.piiMode === "drop") {
            return undefined;
        }

        if (options.piiMode === "hash") {
            return hashValue(value.value);
        }

        return sanitizeNested(value.value, options, level + 1);
    }

    let result: any = {};
    objForEachKey(value, (key, entry) => {
        let sanitized = sanitizeNested(entry, options, level + 1);
        if (!isNullOrUndefined(sanitized)) {
            result[key] = sanitized;
        }
    });

    return result;
}

/**
 * Serializes the supplied value, falling back to its string representation when it cannot be
 * serialized (for example when it is cyclic).
 * @param value - The value to serialize.
 * @returns The serialized value.
 */
export function safeStringify(value: any): string {
    try {
        let result = JSON.stringify(value);
        return isNullOrUndefined(result) ? "" + value : result;
    } catch (e) {
        return "" + value;
    }
}

/**
 * Produces a stable, non reversible hash of the supplied value.
 * @remarks
 * This is a fast 32bit hash used only to replace a value that must not be exported verbatim while
 * still allowing occurrences of the same value to be correlated. It is explicitly NOT a
 * cryptographic hash and must not be relied on as one.
 * @param value - The value to hash.
 * @returns The hash as a hex string.
 */
export function hashValue(value: any): string {
    let str = isString(value) ? value : safeStringify(value);
    let hash = 0;

    for (let lp = 0; lp < str.length; lp++) {
        // hash * 31 + char, kept within 32 bits
        hash = ((hash << 5) - hash) + str.charCodeAt(lp);
        hash = hash | 0;
    }

    return (hash >>> 0).toString(16);
}

/**
 * The Common Schema `eEventPropertyType` values.
 */
const enum ePropertyType {
    Unspecified = 0,
    String = 1,
    Int32 = 2,
    UInt32 = 3,
    Int64 = 4,
    UInt64 = 5,
    Double = 6,
    Bool = 7,
    Guid = 8,
    DateTime = 9
}

/**
 * Converts a value using the type that the Common Schema declared for it.
 *
 * @remarks
 * A Common Schema property may declare its type separately from its value -- an `Int64` for example
 * is commonly carried as a string so that it does not lose precision in JavaScript. Ignoring the
 * declared type would silently turn such a value into an OTLP `stringValue`, losing the fact that it
 * is a number.
 *
 * @param value - The raw value.
 * @param propertyType - The declared `eEventPropertyType`.
 * @returns The OTLP `AnyValue`, or `null` when the declared type does not apply.
 */
export function toTypedAnyValue(value: any, propertyType: number): IOtlpAnyValue {
    if (isNullOrUndefined(propertyType) || propertyType === ePropertyType.Unspecified) {
        return null;
    }

    switch (propertyType) {
    case ePropertyType.Int32:
    case ePropertyType.UInt32:
    case ePropertyType.Int64:
    case ePropertyType.UInt64: {
        // An integer is represented in OTLP as a decimal string, which is exactly how a Common Schema
        // Int64 already arrives, so a string value is passed through rather than parsed (parsing
        // would lose precision for values beyond 2^53).
        if (isString(value) && /^-?[0-9]+$/.test(value)) {
            return { intValue: value };
        }

        if (isNumber(value) && mathFloor(value) === value) {
            return { intValue: "" + value };
        }

        break;
    }
    case ePropertyType.Double: {
        let numeric = isNumber(value) ? value : parseFloat(value);
        if (!isNaN(numeric) && isFinite(numeric)) {
            return { doubleValue: numeric };
        }

        break;
    }
    case ePropertyType.Bool: {
        if (isBoolean(value)) {
            return { boolValue: value };
        }

        if (value === "true" || value === "false") {
            return { boolValue: value === "true" };
        }

        break;
    }
    case ePropertyType.String:
    case ePropertyType.Guid:
    case ePropertyType.DateTime: {
        // A guid and a datetime have no dedicated OTLP representation, they stay strings
        if (isString(value)) {
            return { stringValue: value };
        }

        if ((value as Date) && (value as Date).toISOString) {
            return { stringValue: (value as Date).toISOString() };
        }

        break;
    }
    }

    return null;
}

/**
 * Writes an already converted `AnyValue`, replacing any earlier value written for the same key.
 */
function _write(writer: IAttributeWriter, key: string, value: IOtlpAnyValue): void {
    let existing = writer.keys[key];
    if (isNullOrUndefined(existing)) {
        writer.keys[key] = writer.attrs.length;
        writer.attrs.push({ key: key, value: value });
    } else {
        // The later value wins, but the original position is retained so that the more meaningful
        // ordering (the semantic convention attributes first) is preserved.
        writer.attrs[existing].value = value;
    }
}

/**
 * The result of resolving a raw value: the value to emit plus any Common Schema declared type.
 */
interface IResolvedValue {
    v: any;
    t?: number;
}

/**
 * The `eValueKind` value that means the value must be removed entirely rather than hashed.
 */
const PII_DROP_VALUE = 15;

/**
 * Applies the PII policy to a value that carries a Common Schema value kind.
 * @returns The value to emit, or `undefined` when it must be dropped.
 */
function _applyPiiPolicy(writer: IAttributeWriter, key: string, kind: number, inner: any): any {
    // `Pii_DropValue` documents itself as "Drops the value altogether, rather than hashing", so it
    // overrides the configured mode -- keeping or hashing it would violate the marker's contract.
    if (kind === PII_DROP_VALUE) {
        return undefined;
    }

    let piiMode = writer.options.piiMode;
    if (piiMode === "keep") {
        _write(writer, MS_PREFIX + "pii." + key, { intValue: "" + kind });
        return inner;
    }

    if (piiMode === "hash") {
        return hashValue(inner);
    }

    return undefined;
}

/**
 * Unwraps a Common Schema `IEventProperty` style value, applying the configured PII policy.
 *
 * @remarks
 * The Common Schema carries per field PII and customer content markers (`kind`) which have no OTLP
 * equivalent, so a marked value must either be removed, replaced or explicitly flagged. It also
 * carries a declared `propertyType`, which is returned so that the declared type is not lost.
 *
 * @returns The resolved value, or `null` when the value must be dropped entirely.
 */
function _resolveValue(writer: IAttributeWriter, key: string, value: any): IResolvedValue | null {
    if (!value || typeof value !== "object" || isArray(value) || isNullOrUndefined(value.value)) {
        return { v: value };
    }

    let kind = value.kind;
    let propertyType = value.propertyType;
    let hasKind = isNumber(kind);
    if (!hasKind && isNullOrUndefined(propertyType)) {
        // Not an IEventProperty, treat it as a plain object value
        return { v: value };
    }

    let inner = value.value;
    if (!hasKind || kind <= 0) {
        return { v: inner, t: propertyType };
    }

    let resolved = _applyPiiPolicy(writer, key, kind, inner);
    if (isNullOrUndefined(resolved)) {
        return null;
    }

    // A hashed value is a string regardless of the declared type
    return { v: resolved, t: resolved === inner ? propertyType : undefined };
}

/**
 * Writes a single attribute, ignoring values that carry no information.
 * @param writer - The attribute writer.
 * @param key - The attribute key.
 * @param value - The attribute value.
 * @returns `true` when the attribute was written.
 */
export function addAttribute(writer: IAttributeWriter, key: string, value: any): boolean {
    if (!key || isNullOrUndefined(value) || value === "") {
        return false;
    }

    let resolved = _resolveValue(writer, key, value);
    if (!resolved || isNullOrUndefined(resolved.v) || resolved.v === "") {
        return false;
    }

    // A nested object may itself contain PII marked members, which the top level resolver never sees
    let emit = typeof resolved.v === "object" ? sanitizeNested(resolved.v, writer.options) : resolved.v;
    if (isNullOrUndefined(emit)) {
        return false;
    }

    // Honour the Common Schema declared type where there is one, otherwise infer from the value
    let anyValue = isNullOrUndefined(resolved.t) ? null : toTypedAnyValue(emit, resolved.t);
    _write(writer, key, anyValue || toAnyValue(emit));

    return true;
}

/**
 * Writes every own property of the supplied map.
 * @param writer - The attribute writer.
 * @param values - The map of values to write, may be null.
 * @param prefix - An optional prefix applied to every key.
 * @param exclude - An optional map of keys (without the prefix applied) that should be skipped.
 */
export function addAttributes(writer: IAttributeWriter, values: { [key: string]: any },
        prefix?: string, exclude?: { [key: string]: number }): void {
    if (!values) {
        return;
    }

    objForEachKey(values, (key, value) => {
        if (exclude && exclude[key]) {
            return;
        }

        addAttribute(writer, prefix ? prefix + key : key, value);
    });
}
