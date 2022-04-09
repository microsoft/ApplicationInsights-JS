// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EnumValue } from "../JavaScriptSDK.Enums/EnumHelperFuncs";

export type ConfigDefault = number | string | boolean | string[] | RegExp[] | object;
export type ConfigValue = ConfigDefault | Function;

export type ConfigFieldValidator = (this: IMappedConfig, value: ConfigValue) => ConfigValue;
export type ConfigDefaults<N extends EnumValue> = { [key in keyof N]+?: ConfigDefault | ConfigFieldValidator }

export interface IMappedConfig {
    /**
     * The original passed in config which will be used when updating/merging the configuration
     */
    readonly _orgCfg: any;

     /**
     * The current resolved internal configuration
     */
    cfg: any;

    /**
     * Set the defaults for the config object can also be used to validate the values. The defaults and validation by be applied immediately
     * or only when requested (lazy).
     * @param cfgDefaults - The configuration default map
     * @param applyNow - Should the default be applied to the config now or lazily
     */
    setDefaults: <N extends EnumValue>(cfgDefaults: ConfigDefaults<N>, applyNow?: boolean) => void;

    /**
     * Get the mapped configuration name from the field value
     */
    getName: <N extends EnumValue>(field: keyof N | N[keyof N] | number) => string;

    /**
     * Add some additional name lookups, the enum values should NOT overlap
     */
    addNames: <N extends EnumValue>(extraNames: N) => void;
}
