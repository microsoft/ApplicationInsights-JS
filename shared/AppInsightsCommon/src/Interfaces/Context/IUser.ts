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
}

export interface IUserContext {
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean);
    clearAuthenticatedUserContext();
}