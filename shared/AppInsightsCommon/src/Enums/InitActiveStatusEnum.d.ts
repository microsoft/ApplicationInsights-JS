export declare const enum eActiveStatus {
    NONE = 0,
    /**
     * inactive status means there might be rejected ikey/endpoint promises or ikey/endpoint resolved is not valid
     */
    INACTIVE = 1,
    /**
     * active mean ikey/endpoint promises is resolved and initializing with ikey/endpoint is successful
     */
    ACTIVE = 2,
    /**
     * Waiting for promises to be resolved
     * NOTE: if status is set to be pending, incoming changes will be dropped until pending status is removed
     */
    PENDING = 3
}
export declare const ActiveStatus: import("./EnumHelperFuncs").EnumValue<typeof eActiveStatus>;
export type ActiveStatus = number | eActiveStatus;
