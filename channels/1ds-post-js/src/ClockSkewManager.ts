/**
* ClockSkewManager.ts
* @author Abhilash Panwar (abpanwar)
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";

/**
* Class to manage clock skew correction.
*/
export class ClockSkewManager {

    constructor() {
        let _allowRequestSending = true;
        let _shouldAddClockSkewHeaders = true;
        let _isFirstRequest = true;
        let _clockSkewHeaderValue = "use-collector-delta";
        let _clockSkewSet = false;

        dynamicProto(ClockSkewManager, this, (_self) => {
            /**
             * Determine if requests can be sent.
             * @returns True if requests can be sent, false otherwise.
             */
            _self.allowRequestSending = (): boolean => {
                return _allowRequestSending;
            };

            /**
             * Tells the ClockSkewManager that it should assume that the first request has now been sent,
             * If this method had not yet been called AND the clock Skew had not been set this will set
             * allowRequestSending to false until setClockSet() is called.
             */
            _self.firstRequestSent = () => {
                if (_isFirstRequest) {
                    _isFirstRequest = false;
                    if (!_clockSkewSet) {
                        // Block sending until we get the first clock Skew
                        _allowRequestSending = false;
                    }
                }
            };

            /**
             * Determine if clock skew headers should be added to the request.
             * @returns True if clock skew headers should be added, false otherwise.
             */
            _self.shouldAddClockSkewHeaders = (): boolean => {
                return _shouldAddClockSkewHeaders;
            };

            /**
             * Gets the clock skew header value.
             * @returns The clock skew header value.
             */
            _self.getClockSkewHeaderValue = (): string => {
                return _clockSkewHeaderValue;
            };

            /**
             * Sets the clock skew header value. Once clock skew is set this method
             * is no-op.
             * @param timeDeltaInMillis - Time delta to be saved as the clock skew header value.
             */
            _self.setClockSkew = (timeDeltaInMillis?: string) => {
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
            };
        });
    }

    /**
     * Determine if the request can be sent.
     * @returns True if requests can be sent, false otherwise.
     */
    public allowRequestSending(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Tells the ClockSkewManager that it should assume that the first request has now been sent,
     * If this method had not yet been called AND the clock Skew had not been set this will set
     * allowRequestSending to false until setClockSet() is called.
     */
    public firstRequestSent(): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Determine if clock skew headers should be added to the request.
     * @returns True if clock skew headers should be added, false otherwise.
     */
    public shouldAddClockSkewHeaders(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Gets the clock skew header value.
     * @returns The clock skew header value.
     */
    public getClockSkewHeaderValue(): string {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Sets the clock skew header value. Once clock skew is set this method
     * is no-op.
     * @param timeDeltaInMillis - Time delta to be saved as the clock skew header value.
     */
    public setClockSkew(timeDeltaInMillis?: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }
}
