// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, IPayloadData, IXHROverride, OnCompleteCallback, SendRequestReason, SenderPostManager, TransportType,
    _ISendPostMgrConfig, _eInternalMessageId, _throwInternal, eLoggingSeverity, prependTransports
} from "@microsoft/applicationinsights-core-js";
import { isNumber, isString, mathMax, mathMin, objForEachKey, strTrim } from "@nevware21/ts-utils";
import { eOtlpSignal } from "./Enums";
import { IOtlpChannelConfig } from "./Interfaces/IOtlpChannelConfig";
import { PATH_LOGS, PATH_TRACES } from "./InternalConstants";
import { IOtlpBatch, buildPayload } from "./OtlpBatcher";

/**
 * The status codes that indicate the request may succeed if it is tried again. Everything else is
 * treated as a permanent failure and the batch is dropped.
 */
const RETRYABLE_STATUS: { [status: number]: number } = {
    401: 1, 403: 1, 408: 1, 429: 1, 500: 1, 502: 1, 503: 1, 504: 1
};

const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 60000;

/**
 * Describes the outcome of attempting to send a batch.
 */
export interface IOtlpSendResult {
    /**
     * `true` when the collector accepted the batch.
     */
    success: boolean;

    /**
     * `true` when the batch should be retried after {@link IOtlpSendResult.retryAfterMs}.
     */
    retry: boolean;

    /**
     * The number of milliseconds to wait before the batch is retried.
     */
    retryAfterMs?: number;

    /**
     * The number of records the collector explicitly rejected. A rejected record must not be retried.
     */
    rejected?: number;

    /**
     * The message reported by the collector alongside a partial success.
     */
    message?: string;

    /**
     * The HTTP status code, `0` when the request did not complete.
     */
    status?: number;
}

/**
 * Resolves the endpoint that a batch for the supplied signal should be posted to.
 * @param config - The channel configuration.
 * @param signal - The signal being exported.
 * @returns The complete url, or an empty string when no endpoint has been configured.
 */
export function getEndpointUrl(config: IOtlpChannelConfig, signal: eOtlpSignal): string {
    let isSpan = signal === eOtlpSignal.Span;
    let explicitUrl = isSpan ? config.tracesEndpointUrl : config.logsEndpointUrl;
    if (explicitUrl) {
        return explicitUrl;
    }

    let baseUrl = config.endpointUrl;
    if (!baseUrl) {
        return "";
    }

    // Trim any trailing separator so that the signal path is not doubled up
    baseUrl = strTrim(baseUrl);
    while (baseUrl.length && baseUrl.charAt(baseUrl.length - 1) === "/") {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    return baseUrl + (isSpan ? PATH_TRACES : PATH_LOGS);
}

/**
 * Parses the body of a `200` response looking for the OTLP partial success information.
 * @remarks
 * A partial success reports records that the collector has permanently rejected, so those records
 * must NOT be retried.
 * @param response - The response body.
 * @returns The number of rejected records and the reported message.
 */
export function parsePartialSuccess(response: string): { rejected: number, message: string } {
    let result = { rejected: 0, message: null as string };
    if (!response || !isString(response)) {
        return result;
    }

    try {
        let parsed = JSON.parse(response);
        let partial = parsed && parsed.partialSuccess;
        if (!partial) {
            return result;
        }

        let rejected = partial.rejectedSpans || partial.rejectedLogRecords || partial.rejectedDataPoints || 0;
        result.rejected = +rejected || 0;
        result.message = partial.errorMessage || null;
    } catch (e) {
        // A non JSON body is not an error, the request itself still succeeded
    }

    return result;
}

/**
 * Calculates the delay before a failed batch is retried, using an exponential backoff with jitter.
 * @param attempts - The number of attempts that have already been made.
 * @param retryAfterHeader - The value of any `Retry-After` response header.
 * @returns The number of milliseconds to wait.
 */
export function getRetryDelay(attempts: number, retryAfterHeader?: string): number {
    if (retryAfterHeader) {
        // Retry-After is either a number of seconds or an HTTP date
        let seconds = +retryAfterHeader;
        if (!isNaN(seconds) && seconds > 0) {
            return mathMin(seconds * 1000, MAX_RETRY_MS);
        }

        let retryDate = Date.parse(retryAfterHeader);
        if (!isNaN(retryDate)) {
            let delta = retryDate - (new Date()).getTime();
            if (delta > 0) {
                return mathMin(delta, MAX_RETRY_MS);
            }
        }
    }

    let backoff = BASE_RETRY_MS * Math.pow(2, mathMax(0, attempts - 1));
    // Add up to 25% jitter so that a fleet of clients does not retry in lock step
    let jitter = backoff * 0.25 * Math.random();

    return mathMin(backoff + jitter, MAX_RETRY_MS);
}

/**
 * Sends OTLP payloads to the configured collector.
 */
export class OtlpHttpSender {

    private _postMgr: SenderPostManager;
    private _asyncSender: IXHROverride;
    private _syncSender: IXHROverride;
    private _config: IOtlpChannelConfig;
    private _logger: IDiagnosticLogger;

    constructor(logger: IDiagnosticLogger) {
        this._logger = logger;
        this._postMgr = null;
        this._asyncSender = null;
        this._syncSender = null;
        this._config = null;
    }

    /**
     * Applies (or re-applies) the channel configuration, re-resolving the transports to use.
     * @param config - The channel configuration.
     */
    public setConfig(config: IOtlpChannelConfig): void {
        this._config = config;

        let postConfig: _ISendPostMgrConfig = {
            enableSendPromise: false,
            isOneDs: false,
            disableCredentials: false,
            disableXhr: false,
            disableBeacon: false,
            disableBeaconSync: false,
            disableFetchKeepAlive: !!config.disableFetchKeepAlive,
            fetchCredentials: config.fetchCredentials
        };

        if (!this._postMgr) {
            this._postMgr = new SenderPostManager();
            this._postMgr.initialize(postConfig, this._logger);
        } else {
            this._postMgr.SetConfig(postConfig);
        }

        // An OTLP payload is JSON with (potentially) custom headers, which `sendBeacon` cannot carry,
        // so it is only used as a last resort during unload.
        let asyncTransports = prependTransports([TransportType.Fetch, TransportType.Xhr], config.transports);
        this._asyncSender = this._postMgr.getSenderInst(asyncTransports, false);

        let syncTransports = prependTransports([TransportType.Fetch, TransportType.Xhr, TransportType.Beacon],
            config.unloadTransports);
        this._syncSender = this._postMgr.getSenderInst(syncTransports, true);

        let custom = config.httpXHROverride;
        if (custom && custom.sendPOST) {
            this._asyncSender = custom;
            this._syncSender = custom;
        }

        if (!this._asyncSender) {
            this._asyncSender = this._postMgr.getFallbackInst();
        }

        if (!this._syncSender) {
            this._syncSender = this._asyncSender;
        }
    }

    /**
     * Builds the payload for the supplied batch.
     * @param batch - The batch to build the payload for.
     * @param sendReason - The reason the payload is being sent.
     * @returns The payload data, or `null` when no endpoint has been configured.
     */
    public createPayload(batch: IOtlpBatch, sendReason?: SendRequestReason): IPayloadData {
        let config = this._config;
        let url = getEndpointUrl(config, batch.signal);
        if (!url) {
            return null;
        }

        let headers: { [key: string]: string } = { "Content-Type": "application/json" };
        if (config.headers) {
            objForEachKey(config.headers, (key, value) => {
                headers[key] = value;
            });
        }

        let payload: IPayloadData = {
            urlString: url,
            data: buildPayload(batch),
            headers: headers,
            disableXhrSync: !!config.disableXhrSync,
            disableFetchKeepAlive: !!config.disableFetchKeepAlive,
            sendReason: sendReason
        };

        if (isNumber(config.xhrTimeout)) {
            payload.timeout = config.xhrTimeout;
        }

        return payload;
    }

    /**
     * Sends a batch to the collector.
     * @param batch - The batch to send.
     * @param isAsync - `false` to send synchronously, used during page unload.
     * @param onComplete - Invoked with the outcome once the request completes.
     * @param sendReason - The reason the batch is being sent.
     * @returns `true` when the request was started.
     */
    public send(batch: IOtlpBatch, isAsync: boolean, onComplete: (result: IOtlpSendResult) => void,
            sendReason?: SendRequestReason): boolean {
        let sender = isAsync ? this._asyncSender : this._syncSender;
        if (!sender || !sender.sendPOST) {
            return false;
        }

        let payload = this.createPayload(batch, sendReason);
        if (!payload) {
            _throwInternal(this._logger, eLoggingSeverity.WARNING, _eInternalMessageId.InvalidBackendResponse,
                "No OTLP endpoint configured, telemetry cannot be exported");
            return false;
        }

        batch.attempts++;

        let completeCallback: OnCompleteCallback = (status, headers, response) => {
            onComplete(this._getResult(batch, status, headers, response));
        };

        try {
            sender.sendPOST(payload, completeCallback, !isAsync);
        } catch (e) {
            onComplete({ success: false, retry: true, retryAfterMs: getRetryDelay(batch.attempts), status: 0 });
        }

        return true;
    }

    /**
     * Releases any resources held by the sender.
     */
    public teardown(): void {
        this._asyncSender = null;
        this._syncSender = null;
        this._postMgr = null;
    }

    private _getResult(batch: IOtlpBatch, status: number, headers: { [name: string]: string },
            response: string): IOtlpSendResult {
        let config = this._config;

        if (status >= 200 && status < 300) {
            let partial = parsePartialSuccess(response);
            if (partial.rejected) {
                _throwInternal(this._logger, eLoggingSeverity.WARNING, _eInternalMessageId.InvalidBackendResponse,
                    "The OTLP collector rejected " + partial.rejected + " record(s)" +
                    (partial.message ? ": " + partial.message : ""));
            }

            return {
                success: true,
                retry: false,
                rejected: partial.rejected,
                message: partial.message,
                status: status
            };
        }

        // A status of 0 indicates the request never completed (offline, DNS failure, CORS), which is
        // worth retrying.
        let canRetry = status === 0 || !!RETRYABLE_STATUS[status];
        let maxAttempts = config.maxRetryAttempts;
        if (batch.attempts >= maxAttempts) {
            canRetry = false;
        }

        return {
            success: false,
            retry: canRetry,
            retryAfterMs: canRetry ? getRetryDelay(batch.attempts, headers ? headers["Retry-After"] : null) : 0,
            status: status
        };
    }
}
