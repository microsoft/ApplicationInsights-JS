/**
* RetryPolicy.ts
* @author Abhilash Panwar (abpanwar)
* @copyright Microsoft 2018
*/
const RandomizationLowerThreshold = 0.8;
const RandomizationUpperThreshold = 1.2;
const BaseBackoff = 3000;
const MaxBackoff = 600000;

/**
 * Determine if the request should be retried for the given status code.
 * The below expression reads that we should only retry for:
 *      - HttpStatusCodes that are smaller than 300.
 *      - HttpStatusCodes greater or equal to 500 (except for 501-NotImplement
 *        and 505-HttpVersionNotSupport).
 *      - HttpStatusCode 408-RequestTimeout.
 *      - HttpStatusCode 429.
 * This is based on Microsoft.WindowsAzure.Storage.RetryPolicies.ExponentialRetry class
 * @param httpStatusCode - The status code returned for the request.
 * @returns True if request should be retried, false otherwise.
 */
export function retryPolicyShouldRetryForStatus(httpStatusCode: number): boolean {
    /* tslint:disable:triple-equals */
    // Disabling triple-equals rule to avoid httpOverrides from failing because they are returning a string value
    return !((httpStatusCode >= 300 && httpStatusCode < 500 && httpStatusCode != 408 && httpStatusCode != 429)
        || (httpStatusCode == 501)
        || (httpStatusCode == 505));
    /* tslint:enable:triple-equals */
}

/**
 * Gets the number of milliseconds to back off before retrying the request. The
 * back off duration is exponentially scaled based on the number of retries already
 * done for the request.
 * @param retriesSoFar - The number of times the request has already been retried.
 * @returns The back off duration for the request before it can be retried.
 */
export function retryPolicyGetMillisToBackoffForRetry(retriesSoFar: number): number {
    let waitDuration = 0;
    let minBackoff = BaseBackoff * RandomizationLowerThreshold;
    let maxBackoff = BaseBackoff * RandomizationUpperThreshold;
    let randomBackoff = Math.floor(Math.random() * (maxBackoff - minBackoff)) + minBackoff;
    waitDuration = Math.pow(2, retriesSoFar) * randomBackoff;
    return Math.min(waitDuration, MaxBackoff);
}
