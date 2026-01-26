// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const enum FeatureOptInMode {
    /**
     * not set, completely depends on cdn cfg
     */
    none = 1,
    /**
     * try to not apply config from cdn
     */
    disable = 2,
    /**
     * try to apply config from cdn
     */
    enable = 3
}

export const enum CdnFeatureMode {
    /**
     * not set, user defined/config defaults value will be used
     */
    none = 1,
    /**
     * config from cdn will Not be applied
     */
    disable = 2,
    /**
     * try to apply config from cdn
     */
    enable = 3,
     /**
     * force enable
     */
    forceOn = 4,
     /**
      * force disable
      */
    forceOff = 5
}
