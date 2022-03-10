// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPageViewData } from "./IPageViewData";

/**
 * An instance of PageViewPerf represents: a page view with no performance data, a page view with performance data, or just the performance data of an earlier page request.
 */
export interface IPageViewPerfData extends IPageViewData {

    /**
     * Performance total in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    perfTotal: string;

    /**
     * Network connection time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    networkConnect: string;

    /**
     * Sent request time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    sentRequest: string;

    /**
     * Received response time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    receivedResponse: string;

    /**
     * DOM processing time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    domProcessing: string;
}
