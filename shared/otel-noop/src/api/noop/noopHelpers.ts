import { createSyncRejectedPromise, createSyncResolvedPromise } from "@nevware21/ts-async";

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

/**
 * Return a function that returns a resolved promise with the provided value when called.
 * @param value - The value to resolve the promise with.
 * @returns A function that returns a resolved promise with the provided value when called.
 */
export function _noopResolvedPromise<T>(value?: T) {
    return function (): Promise<T> {
        return createSyncResolvedPromise<T>(value);
    }
}

/**
 * Return a function that returns a rejected promise with the provided error when called.
 * @param error - The error to reject the promise with.
 * @returns A function that returns a rejected promise with the provided error when called.
 */
export function _noopRejectedPromise<T>(error: any) {
    return function (): Promise<T> {
        return createSyncRejectedPromise(error);
    }
}
