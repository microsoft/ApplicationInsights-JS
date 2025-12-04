// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IAppInsightsCore } from "../../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IReadableSpan } from "./IReadableSpan";

/**
 * Represents the execution scope for a span, combining the core instance and the active span.
 * This interface is used as the context for executing functions within a span's scope.
 * 
 * @since 3.4.0
 */
export interface ISpanScope<C extends IAppInsightsCore = IAppInsightsCore> {
    /**
     * The Application Insights core instance.
     */
    readonly core: C;

    /**
     * The active span for this execution scope.
     */
    readonly span: IReadableSpan;

    /**
     * The previously active span before this scope was created, if any.
     */
    readonly prvSpan?: IReadableSpan;

    /**
     * Restores the previous active span in the core instance.
     */
    restore(): void;
}
