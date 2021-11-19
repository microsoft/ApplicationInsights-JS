// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DataEventType } from "../dataSources/IDataEvent";

/**
 * This identifies the filter settings that the user can apply (via the optionsbar), these values
 * are persisted to local storage.
 */
export interface IFilterSettings {
    /**
     * A flag indicating whether the filter should also search the event/message, when searching the message/event
     * the value is case-sensitive.
     */
    filterContent: boolean;

    /**
     * The text entered by the user to search to table details and optionally the content.
     * When searching the table details the value is case-insensitive, but the event/message search is exact
     * case-sensitive match.
     */
    filterText: string;

    /**
     * Identifies whether to filter based on a specific type (DataEventType) of message (warning, error, perf, etc.)
     */
    filterByType: DataEventType | undefined;

    /**
     * Should the details panel so the full raw event/message or the "condensed" version (some specific fields removed.)
     */
    showCondensedDetails: boolean;

    /**
     * Should the extension capture and add events originating from a web request
     */
    listenNetwork: boolean;

    /**
     * Should the extension capture and add events originating via the pageHelper SDK hooks.
     */
    listenSdk: boolean;
}
