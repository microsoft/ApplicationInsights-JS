// make sure we send things immediately for tests, we don't want batching
appInsights.maxBatchInterval = 0;

// hook the send method of XHLHttpRequest so that we can validate that errors are logged
var originalSend = window.XMLHttpRequest.prototype.send;
window.XMLHttpRequest.prototype.send = function (data) { // don't use typescript lambda
    top.postMessage(data, "*");
    return originalSend.apply(this, arguments);
};

// don't break snippet tests
window['queueTest'] = function () { };