/**
 * Implementing a simple synchronous promise interface as PhantomJS doesn't support / implement the es6 Promise as used by fetch
 */
function SimpleSyncPromise(executor) {
    var _self = this;
    var _state = "pending";
    var _settledValue = null;
    var _queue = [];
    _self.then = function (onResolved, onRejected) {
        return new SimpleSyncPromise(function (resolve, reject) {
            // Queue the new promise returned to be resolved or rejected
            // when this promise settles.
            _enqueue(onResolved, onRejected, resolve, reject);
        });
    };
    _self["catch"] = function (onRejected) {
        // Just return an empty promise as this doesn't support rejection
        return _self.then(null, onRejected);
    }
    function _enqueue(onResolved, onRejected, resolve, reject) {
        _queue.push(function () {
            var value;
            try {
                if (_state === "resolved") {
                    value = typeof onResolved === "function" ? onResolved(_settledValue) : _settledValue;
                } else {
                    value = typeof onRejected === "function" ? onRejected(_settledValue) : _settledValue;
                }
    
                if (value instanceof SimpleSyncPromise) {
                    // The called handlers returned a new promise, so the chained promise
                    // will follow the state of this promise.
                    value.then(resolve, reject);
                } else if (_state === "rejected" && typeof onRejected !== "function") {
                    // If there wasn't an onRejected handler and this promise is rejected, then
                    // the chained promise also rejects with the same reason.
                    reject(value);
                } else {
                    // If this promise is fulfilled, then the chained promise is also fulfilled
                    // with either the settled value of this promise (if no onFulfilled handler
                    // was available) or the return value of the handler. If this promise is
                    // rejected and there was an onRejected handler, then the chained promise is
                    // fulfilled with the return value of the handler.
                    resolve(value);
                }
            } catch (e) {
                reject(e);
            }
        });
        if (_state !== "pending") {
            _processQueue();
        }
    }

    function _processQueue() {
        if (_queue.length > 0) {
            var pending = _queue.slice();
            _queue = [];
            for (var i = 0, len = pending.length; i < len; ++i) {
                pending[i]();
            }
        }
    }

    function _resolve(value) {
        if (_state === "pending") {
            _settledValue = value;
            _state = "resolved";
            _processQueue();
        }
    }

    function _reject(reason) {
        if (_state === "pending") {
            _settledValue = reason;
            _state = "rejected";
            _processQueue();
        }
    }

    (function _initialize() {
        try {
            executor(_resolve, _reject);
        } catch (e) {
            _reject(e);
        }
    })();
}
