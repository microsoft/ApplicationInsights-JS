// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface INoopProxyProp<T> {
    /**
     * The INoopConfig for the Proxy Object that is returned for this property
     */
    cfg?: INoopProxyConfig<T>;

    /**
     * If the property should be enumerable (defaults to true)
     */
    e?: boolean;

    /**
     * The value of the property
     */
    v?: T;

    /**
     * A function that returns the value of the property
     * @returns The value to return
     */
    g?: () => T;

    /**
     * If the property should be treated as deleted
     */
    del?: boolean;
}

export type NoopProxyProps<T> = { readonly [key in keyof T extends string | number | symbol ? keyof T : never]: INoopProxyProp<key extends string | number | symbol ? T[key] : key> };

export interface INoopProxyConfig<T> {
    /**
     * The property names and the default values that should be returned by the no-op proxy
     */
    props?: NoopProxyProps<T>;
}