// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Identifies the popup configuration values that are stored in local storage to remember
 * the last size of the popup window.
 */
export interface IPopupSettings {
    /**
     * The width of the popup window, this will be used when opening a new popup, the maximum size
     * will be restricted by the current screen size and a predefined internal minimum.
     */
    width?: number;

    /**
     * The height of the popup window, this will be used when opening a new popup, the maximum size
     * will be restricted by the current screen size and a predefined internal minimum.
     */
     height?: number;
}