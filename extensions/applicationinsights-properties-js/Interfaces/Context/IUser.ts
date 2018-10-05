export interface IUser {
    /**
    * The telemetry configuration.
    */
    config: any;

    /**
     * The user ID.
     */
    id: string;

    /**
     * Authenticated user id
     */
    authenticatedId: string;

    /**
     * The account ID.
     */
    accountId: string;

    /**
     * The account acquisition date.
     */
    accountAcquisitionDate: string;

    /**
     * The user agent string.
     */
    agent: string;

    /**
     * The store region.
     */
    storeRegion: string;
}

export interface IUserContextPlugin {
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean);
    clearAuthenticatedUserContext();
}
