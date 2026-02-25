// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ISession } from "./ISession";

/**
 * An interface that identifies the automatic session manager
 * @since 3.0.3
 */
export interface ISessionManager {

    /**
     * The automatic Session which has been initialized from the automatic SDK cookies and storage
     */
    automaticSession: ISession;

    /**
     * Update the automatic session cookie if required
     * @returns
     */
    update: () => void;

    /**
     *  Record the current state of the automatic session and store it in our cookie string format
     *  into the browser's local storage. This is used to restore the session data when the cookie
     *  expires.
     */
    backup: () => void;
}
