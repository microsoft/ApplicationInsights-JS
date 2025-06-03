// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
     * The localId
     */
    localId: string;

    /**
     * A flag indicating whether this represents a new user
     */
    isNewUser?: boolean;

    /**
     * A flag indicating whether the user cookie has been set
     */
    isUserCookieSet?: boolean;
}

export interface IUserContext extends IUser {
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): void;
    clearAuthenticatedUserContext(): void;
    update (userId?: string): void;
}