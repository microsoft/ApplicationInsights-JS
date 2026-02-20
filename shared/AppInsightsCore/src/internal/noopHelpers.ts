// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * A simple function that does nothing and returns the current this (if any).
 * @returns
 */
export function _noopThis<T>(this: T): T {
    return this;
}

/**
 * A simple function that does nothing and returns undefined.
 */
export function _noopVoid<T>(this: T): void {
}