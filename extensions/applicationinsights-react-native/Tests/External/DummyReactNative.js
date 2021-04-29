(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.ReactNative = global.ReactNative || {})));
}(this, (function (exports) { 'use strict';

// This provides a bare bones support for the react-native-device-info module to support browser based testing
exports.NativeModules = {
    RNDeviceInfo: 1
};

function dummyEmitter() {

}

exports.NativeEventEmitter = function () {
    emit: dummyEmitter
};

Object.defineProperty(exports, '__esModule', { value: true });

// Need to define so the device-info loads
window.exports = window.exports || exports || {};

})));
