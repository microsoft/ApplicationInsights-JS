/**
* ClockSkewManager.ts
* @author Abhilash Panwar (abpanwar)
* @copyright Microsoft 2018
*/

/**
 * Internal interface to manage clock skew correction.
 * @internal
 */
export interface IClockSkewManager {
    /**
     * Determine if the request can be sent.
     * @returns True if requests can be sent, false otherwise.
     */
    allowRequestSending(): boolean;

    /**
     * Tells the ClockSkewManager that it should assume that the first request has now been sent,
     * If this method had not yet been called AND the clock Skew had not been set this will set
     * allowRequestSending to false until setClockSet() is called.
     */
    firstRequestSent(): void;

    /**
     * Determine if clock skew headers should be added to the request.
     * @returns True if clock skew headers should be added, false otherwise.
     */
    shouldAddClockSkewHeaders(): boolean;

    /**
     * Gets the clock skew header value.
     * @returns The clock skew header value.
     */
    getClockSkewHeaderValue(): string;

    /**
     * Sets the clock skew header value. Once clock skew is set this method
     * is no-op.
     * @param timeDeltaInMillis - Time delta to be saved as the clock skew header value.
     */
    setClockSkew(timeDeltaInMillis?: string): void;
}

/**
 * Factory function to create a ClockSkewManager instance.
 * @returns A new IClockSkewManager instance.
 * @internal
 */
export function createClockSkewManager(): IClockSkewManager {
    let _allowRequestSending = true;
    let _shouldAddClockSkewHeaders = true;
    let _isFirstRequest = true;
    let _clockSkewHeaderValue = "use-collector-delta";
    let _clockSkewSet = false;

    return {
        /**
         * Determine if requests can be sent.
         * @returns True if requests can be sent, false otherwise.
         */
        allowRequestSending: (): boolean => {
            return _allowRequestSending;
        },

        /**
         * Tells the ClockSkewManager that it should assume that the first request has now been sent,
         * If this method had not yet been called AND the clock Skew had not been set this will set
         * allowRequestSending to false until setClockSet() is called.
         */
        firstRequestSent: () => {
            if (_isFirstRequest) {
                _isFirstRequest = false;
                if (!_clockSkewSet) {
                    // Block sending until we get the first clock Skew
                    _allowRequestSending = false;
                }
            }
        },

        /**
         * Determine if clock skew headers should be added to the request.
         * @returns True if clock skew headers should be added, false otherwise.
         */
        shouldAddClockSkewHeaders: (): boolean => {
            return _shouldAddClockSkewHeaders;
        },

        /**
         * Gets the clock skew header value.
         * @returns The clock skew header value.
         */
        getClockSkewHeaderValue: (): string => {
            return _clockSkewHeaderValue;
        },

        /**
         * Sets the clock skew header value. Once clock skew is set this method
         * is no-op.
         * @param timeDeltaInMillis - Time delta to be saved as the clock skew header value.
         */
        setClockSkew: (timeDeltaInMillis?: string) => {
            if (!_clockSkewSet) {
                if (timeDeltaInMillis) {
                    _clockSkewHeaderValue = timeDeltaInMillis;
                    _shouldAddClockSkewHeaders = true;
                    _clockSkewSet = true;
                } else {
                    _shouldAddClockSkewHeaders = false;
                }

                // Unblock sending
                _allowRequestSending = true;
            }
        }
    };
}
