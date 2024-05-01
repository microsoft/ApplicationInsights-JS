/*!
 * Application Insights JavaScript SDK - Web, 2.8.9
 * Copyright (c) Microsoft and contributors. All rights reserved.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.Microsoft = global.Microsoft || {}, global.Microsoft.ApplicationInsights = global.Microsoft.ApplicationInsights || {})));
})(this, (function (exports) { 'use strict';

    var strShimFunction = "function";
    var strShimObject = "object";
    var strShimUndefined = "undefined";
    var strShimPrototype = "prototype";
    var strShimHasOwnProperty = "hasOwnProperty";
    var ObjClass = Object;
    var ObjProto = ObjClass[strShimPrototype];
    var ObjAssign = ObjClass["assign"];
    var ObjCreate = ObjClass["create"];
    var ObjDefineProperty = ObjClass["defineProperty"];
    var ObjHasOwnProperty = ObjProto[strShimHasOwnProperty];

    var _cachedGlobal = null;
    function getGlobal(useCached) {
        if (useCached === void 0) { useCached = true; }
        var result = useCached === false ? null : _cachedGlobal;
        if (!result) {
            if (typeof globalThis !== strShimUndefined) {
                result = globalThis;
            }
            if (!result && typeof self !== strShimUndefined) {
                result = self;
            }
            if (!result && typeof window !== strShimUndefined) {
                result = window;
            }
            if (!result && typeof global !== strShimUndefined) {
                result = global;
            }
            _cachedGlobal = result;
        }
        return result;
    }
    function throwTypeError(message) {
        throw new TypeError(message);
    }
    function objCreateFn(obj) {
        var func = ObjCreate;
        if (func) {
            return func(obj);
        }
        if (obj == null) {
            return {};
        }
        var type = typeof obj;
        if (type !== strShimObject && type !== strShimFunction) {
            throwTypeError("Object prototype may only be an Object:" + obj);
        }
        function tmpFunc() { }
        tmpFunc[strShimPrototype] = obj;
        return new tmpFunc();
    }

    (getGlobal() || {})["Symbol"];
    (getGlobal() || {})["Reflect"];
    var __objAssignFnImpl = function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) {
                if (ObjProto[strShimHasOwnProperty].call(s, p)) {
                    t[p] = s[p];
                }
            }
        }
        return t;
    };
    var __assignFn = ObjAssign || __objAssignFnImpl;
    var extendStaticsFn = function (d, b) {
        extendStaticsFn = ObjClass["setPrototypeOf"] ||
            ({ __proto__: [] } instanceof Array && function (d, b) {
                d.__proto__ = b;
            }) ||
            function (d, b) {
                for (var p in b) {
                    if (b[strShimHasOwnProperty](p)) {
                        d[p] = b[p];
                    }
                }
            };
        return extendStaticsFn(d, b);
    };
    function __extendsFn(d, b) {
        if (typeof b !== strShimFunction && b !== null) {
            throwTypeError("Class extends value " + String(b) + " is not a constructor or null");
        }
        extendStaticsFn(d, b);
        function __() {
            this.constructor = d;
        }
        d[strShimPrototype] = b === null ? objCreateFn(b) : (__[strShimPrototype] = b[strShimPrototype], new __());
    }
    function __spreadArrayFn(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++) {
            to[j] = from[i];
        }
        return to;
    }

    var _DYN_INITIALIZE = "initialize";
    var _DYN_NAME$3 = "name";
    var _DYN_GET_NOTIFY_MGR = "getNotifyMgr";
    var _DYN_IDENTIFIER = "identifier";
    var _DYN_PUSH$2 = "push";
    var _DYN_IS_INITIALIZED = "isInitialized";
    var _DYN_CONFIG$2 = "config";
    var _DYN_INSTRUMENTATION_KEY$2 = "instrumentationKey";
    var _DYN_LOGGER = "logger";
    var _DYN_LENGTH$5 = "length";
    var _DYN_TIME = "time";
    var _DYN_PROCESS_NEXT = "processNext";
    var _DYN_GET_PROCESS_TEL_CONT0 = "getProcessTelContext";
    var _DYN_ADD_NOTIFICATION_LIS1 = "addNotificationListener";
    var _DYN_REMOVE_NOTIFICATION_2 = "removeNotificationListener";
    var _DYN_STOP_POLLING_INTERNA3 = "stopPollingInternalLogs";
    var _DYN_ON_COMPLETE = "onComplete";
    var _DYN_GET_PLUGIN = "getPlugin";
    var _DYN_FLUSH = "flush";
    var _DYN__EXTENSIONS = "_extensions";
    var _DYN_SPLICE = "splice";
    var _DYN_TEARDOWN = "teardown";
    var _DYN_MESSAGE_ID = "messageId";
    var _DYN_MESSAGE$2 = "message";
    var _DYN_IS_ASYNC = "isAsync";
    var _DYN__DO_TEARDOWN = "_doTeardown";
    var _DYN_UPDATE$1 = "update";
    var _DYN_GET_NEXT = "getNext";
    var _DYN_DIAG_LOG$2 = "diagLog";
    var _DYN_SET_NEXT_PLUGIN = "setNextPlugin";
    var _DYN_CREATE_NEW = "createNew";
    var _DYN_COOKIE_CFG = "cookieCfg";
    var _DYN_INDEX_OF$2 = "indexOf";
    var _DYN_SUBSTRING$1 = "substring";
    var _DYN_USER_AGENT = "userAgent";
    var _DYN_SPLIT$1 = "split";
    var _DYN_SET_ENABLED = "setEnabled";
    var _DYN_SUBSTR = "substr";
    var _DYN_NODE_TYPE = "nodeType";
    var _DYN_APPLY = "apply";
    var _DYN_REPLACE = "replace";
    var _DYN_ENABLE_DEBUG_EXCEPTI4 = "enableDebugExceptions";
    var _DYN_LOG_INTERNAL_MESSAGE = "logInternalMessage";
    var _DYN_TO_LOWER_CASE$2 = "toLowerCase";
    var _DYN_CALL = "call";
    var _DYN_TYPE = "type";
    var _DYN_HANDLER = "handler";
    var _DYN_LISTENERS = "listeners";
    var _DYN_IS_CHILD_EVT = "isChildEvt";
    var _DYN_GET_CTX = "getCtx";
    var _DYN_SET_CTX = "setCtx";
    var _DYN_COMPLETE = "complete";
    var _DYN_TRACE_ID$2 = "traceId";
    var _DYN_SPAN_ID$1 = "spanId";
    var _DYN_TRACE_FLAGS$1 = "traceFlags";
    var _DYN_VERSION$1 = "version";

    var STR_EMPTY = "";
    var STR_CHANNELS = "channels";
    var STR_CORE = "core";
    var STR_CREATE_PERF_MGR = "createPerfMgr";
    var STR_DISABLED = "disabled";
    var STR_EXTENSION_CONFIG = "extensionConfig";
    var STR_EXTENSIONS = "extensions";
    var STR_PROCESS_TELEMETRY = "processTelemetry";
    var STR_PRIORITY = "priority";
    var STR_EVENTS_SENT = "eventsSent";
    var STR_EVENTS_DISCARDED = "eventsDiscarded";
    var STR_EVENTS_SEND_REQUEST = "eventsSendRequest";
    var STR_PERF_EVENT = "perfEvent";
    var STR_ERROR_TO_CONSOLE = "errorToConsole";
    var STR_WARN_TO_CONSOLE = "warnToConsole";
    var STR_GET_PERF_MGR = "getPerfMgr";

    var strToISOString = "toISOString";
    var cStrEndsWith = "endsWith";
    var strIndexOf = "indexOf";
    var strMap = "map";
    var strReduce = "reduce";
    var cStrTrim = "trim";
    var strToString = "toString";
    var str__Proto$1 = "__proto__";
    var strConstructor = "constructor";
    var _objDefineProperty$1 = ObjDefineProperty;
    var _objFreeze = ObjClass.freeze;
    var _objKeys = ObjClass.keys;
    var StringProto = String[strShimPrototype];
    var _strTrim = StringProto[cStrTrim];
    var _strEndsWith = StringProto[cStrEndsWith];
    var DateProto = Date[strShimPrototype];
    var _dataToISOString = DateProto[strToISOString];
    var _isArray = Array.isArray;
    var _objToString = ObjProto[strToString];
    var _fnToString = ObjHasOwnProperty[strToString];
    var _objFunctionString = _fnToString[_DYN_CALL ](ObjClass);
    var rCamelCase = /-([a-z])/g;
    var rNormalizeInvalid = /([^\w\d_$])/g;
    var rLeadingNumeric = /^(\d+[\w\d_$])/;
    var _objGetPrototypeOf$1 = Object["getPrototypeOf"];
    function _getObjProto$1(target) {
        if (target) {
            if (_objGetPrototypeOf$1) {
                return _objGetPrototypeOf$1(target);
            }
            var newProto = target[str__Proto$1] || target[strShimPrototype] || target[strConstructor];
            if (newProto) {
                return newProto;
            }
        }
        return null;
    }
    function isTypeof(value, theType) {
        return typeof value === theType;
    }
    function isUndefined(value) {
        return value === undefined || typeof value === strShimUndefined;
    }
    function isNullOrUndefined(value) {
        return (value === null || isUndefined(value));
    }
    function isNotNullOrUndefined(value) {
        return !isNullOrUndefined(value);
    }
    function hasOwnProperty(obj, prop) {
        return !!(obj && ObjHasOwnProperty[_DYN_CALL ](obj, prop));
    }
    function isObject(value) {
        return !!(value && typeof value === strShimObject);
    }
    function isFunction(value) {
        return !!(value && typeof value === strShimFunction);
    }
    function normalizeJsName(name) {
        var value = name;
        if (value && isString(value)) {
            value = value[_DYN_REPLACE ](rCamelCase, function (_all, letter) {
                return letter.toUpperCase();
            });
            value = value[_DYN_REPLACE ](rNormalizeInvalid, "_");
            value = value[_DYN_REPLACE ](rLeadingNumeric, function (_all, match) {
                return "_" + match;
            });
        }
        return value;
    }
    function objForEachKey(target, callbackfn) {
        if (target) {
            for (var prop in target) {
                if (ObjHasOwnProperty[_DYN_CALL ](target, prop)) {
                    callbackfn[_DYN_CALL ](target, prop, target[prop]);
                }
            }
        }
    }
    function strEndsWith(value, search) {
        var result = false;
        if (value && search && !(result = value === search)) {
            result = _strEndsWith ? value[cStrEndsWith](search) : _strEndsWithPoly(value, search);
        }
        return result;
    }
    function _strEndsWithPoly(value, search) {
        var result = false;
        var searchLen = search ? search[_DYN_LENGTH$5 ] : 0;
        var valLen = value ? value[_DYN_LENGTH$5 ] : 0;
        if (searchLen && valLen && valLen >= searchLen && !(result = value === search)) {
            var pos = valLen - 1;
            for (var lp = searchLen - 1; lp >= 0; lp--) {
                if (value[pos] != search[lp]) {
                    return false;
                }
                pos--;
            }
            result = true;
        }
        return result;
    }
    function strContains(value, search) {
        if (value && search) {
            return value[_DYN_INDEX_OF$2 ](search) !== -1;
        }
        return false;
    }
    function isDate(obj) {
        return !!(obj && _objToString[_DYN_CALL ](obj) === "[object Date]");
    }
    var isArray = _isArray || _isArrayPoly;
    function _isArrayPoly(obj) {
        return !!(obj && _objToString[_DYN_CALL ](obj) === "[object Array]");
    }
    function isError(obj) {
        return !!(obj && _objToString[_DYN_CALL ](obj) === "[object Error]");
    }
    function isString(value) {
        return typeof value === "string";
    }
    function isNumber(value) {
        return typeof value === "number";
    }
    function isBoolean(value) {
        return typeof value === "boolean";
    }
    function isPlainObject(value) {
        var result = false;
        if (value && typeof value === "object") {
            var proto = _objGetPrototypeOf$1 ? _objGetPrototypeOf$1(value) : _getObjProto$1(value);
            if (!proto) {
                result = true;
            }
            else {
                if (proto[strConstructor] && ObjHasOwnProperty[_DYN_CALL ](proto, strConstructor)) {
                    proto = proto[strConstructor];
                }
                result = typeof proto === strShimFunction && _fnToString[_DYN_CALL ](proto) === _objFunctionString;
            }
        }
        return result;
    }
    function toISOString(date) {
        if (date) {
            return _dataToISOString ? date[strToISOString]() : _toISOStringPoly(date);
        }
    }
    function _toISOStringPoly(date) {
        if (date && date.getUTCFullYear) {
            var pad = function (num) {
                var r = String(num);
                if (r[_DYN_LENGTH$5 ] === 1) {
                    r = "0" + r;
                }
                return r;
            };
            return date.getUTCFullYear()
                + "-" + pad(date.getUTCMonth() + 1)
                + "-" + pad(date.getUTCDate())
                + "T" + pad(date.getUTCHours())
                + ":" + pad(date.getUTCMinutes())
                + ":" + pad(date.getUTCSeconds())
                + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
                + "Z";
        }
    }
    function arrForEach(arr, callbackfn, thisArg) {
        var len = arr[_DYN_LENGTH$5 ];
        try {
            for (var idx = 0; idx < len; idx++) {
                if (idx in arr) {
                    if (callbackfn[_DYN_CALL ](thisArg || arr, arr[idx], idx, arr) === -1) {
                        break;
                    }
                }
            }
        }
        catch (e) {
        }
    }
    function arrIndexOf(arr, searchElement, fromIndex) {
        if (arr) {
            if (arr[strIndexOf]) {
                return arr[strIndexOf](searchElement, fromIndex);
            }
            var len = arr[_DYN_LENGTH$5 ];
            var from = fromIndex || 0;
            try {
                for (var lp = Math.max(from >= 0 ? from : len - Math.abs(from), 0); lp < len; lp++) {
                    if (lp in arr && arr[lp] === searchElement) {
                        return lp;
                    }
                }
            }
            catch (e) {
            }
        }
        return -1;
    }
    function arrMap(arr, callbackfn, thisArg) {
        var results;
        if (arr) {
            if (arr[strMap]) {
                return arr[strMap](callbackfn, thisArg);
            }
            var len = arr[_DYN_LENGTH$5 ];
            var _this = thisArg || arr;
            results = new Array(len);
            try {
                for (var lp = 0; lp < len; lp++) {
                    if (lp in arr) {
                        results[lp] = callbackfn[_DYN_CALL ](_this, arr[lp], arr);
                    }
                }
            }
            catch (e) {
            }
        }
        return results;
    }
    function arrReduce(arr, callbackfn, initialValue) {
        var value;
        if (arr) {
            if (arr[strReduce]) {
                return arr[strReduce](callbackfn, initialValue);
            }
            var len = arr[_DYN_LENGTH$5 ];
            var lp = 0;
            if (arguments[_DYN_LENGTH$5 ] >= 3) {
                value = arguments[2];
            }
            else {
                while (lp < len && !(lp in arr)) {
                    lp++;
                }
                value = arr[lp++];
            }
            while (lp < len) {
                if (lp in arr) {
                    value = callbackfn(value, arr[lp], lp, arr);
                }
                lp++;
            }
        }
        return value;
    }
    function strTrim(str) {
        if (str) {
            str = (_strTrim && str[cStrTrim]) ? str[cStrTrim]() : (str[_DYN_REPLACE ] ? str[_DYN_REPLACE ](/^\s+|(?=\s)\s+$/g, STR_EMPTY) : str);
        }
        return str;
    }
    var _objKeysHasDontEnumBug = !({ toString: null }).propertyIsEnumerable("toString");
    var _objKeysDontEnums = [
        "toString",
        "toLocaleString",
        "valueOf",
        "hasOwnProperty",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "constructor"
    ];
    function objKeys(obj) {
        var objType = typeof obj;
        if (objType !== strShimFunction && (objType !== strShimObject || obj === null)) {
            throwTypeError("objKeys called on non-object");
        }
        if (!_objKeysHasDontEnumBug && _objKeys) {
            return _objKeys(obj);
        }
        var result = [];
        for (var prop in obj) {
            if (obj && ObjHasOwnProperty[_DYN_CALL ](obj, prop)) {
                result[_DYN_PUSH$2 ](prop);
            }
        }
        if (_objKeysHasDontEnumBug) {
            var dontEnumsLength = _objKeysDontEnums[_DYN_LENGTH$5 ];
            for (var lp = 0; lp < dontEnumsLength; lp++) {
                if (obj && ObjHasOwnProperty[_DYN_CALL ](obj, _objKeysDontEnums[lp])) {
                    result[_DYN_PUSH$2 ](_objKeysDontEnums[lp]);
                }
            }
        }
        return result;
    }
    function objDefineAccessors(target, prop, getProp, setProp) {
        if (_objDefineProperty$1) {
            try {
                var descriptor = {
                    enumerable: true,
                    configurable: true
                };
                if (getProp) {
                    descriptor.get = getProp;
                }
                if (setProp) {
                    descriptor.set = setProp;
                }
                _objDefineProperty$1(target, prop, descriptor);
                return true;
            }
            catch (e) {
            }
        }
        return false;
    }
    function _doNothing(value) {
        return value;
    }
    function deepFreeze(obj) {
        if (_objFreeze) {
            objForEachKey(obj, function (name, value) {
                if (isArray(value) || isObject(value)) {
                    _objFreeze(value);
                }
            });
        }
        return objFreeze(obj);
    }
    var objFreeze = _objFreeze || _doNothing;
    function dateNow() {
        var dt = Date;
        return dt.now ? dt.now() : new dt().getTime();
    }
    function getExceptionName(object) {
        if (isError(object)) {
            return object[_DYN_NAME$3 ];
        }
        return STR_EMPTY;
    }
    function setValue(target, field, value, valChk, srcChk) {
        var theValue = value;
        if (target) {
            theValue = target[field];
            if (theValue !== value && (!srcChk || srcChk(theValue)) && (!valChk || valChk(value))) {
                theValue = value;
                target[field] = theValue;
            }
        }
        return theValue;
    }
    function getSetValue(target, field, defValue) {
        var theValue;
        if (target) {
            theValue = target[field];
            if (!theValue && isNullOrUndefined(theValue)) {
                theValue = !isUndefined(defValue) ? defValue : {};
                target[field] = theValue;
            }
        }
        else {
            theValue = !isUndefined(defValue) ? defValue : {};
        }
        return theValue;
    }
    function getCfgValue(theValue, defaultValue) {
        return !isNullOrUndefined(theValue) ? theValue : defaultValue;
    }
    function isTruthy(value) {
        return !!value;
    }
    function throwError(message) {
        throw new Error(message);
    }
    function _createProxyFunction(source, funcName) {
        var srcFunc = null;
        var src = null;
        if (isFunction(source)) {
            srcFunc = source;
        }
        else {
            src = source;
        }
        return function () {
            var originalArguments = arguments;
            if (srcFunc) {
                src = srcFunc();
            }
            if (src) {
                return src[funcName][_DYN_APPLY ](src, originalArguments);
            }
        };
    }
    function proxyAssign(target, source, chkSet) {
        if (target && source && isObject(target) && isObject(source)) {
            var _loop_1 = function (field) {
                if (isString(field)) {
                    var value = source[field];
                    if (isFunction(value)) {
                        if (!chkSet || chkSet(field, true, source, target)) {
                            target[field] = _createProxyFunction(source, field);
                        }
                    }
                    else if (!chkSet || chkSet(field, false, source, target)) {
                        if (hasOwnProperty(target, field)) {
                            delete target[field];
                        }
                        if (!objDefineAccessors(target, field, function () {
                            return source[field];
                        }, function (theValue) {
                            source[field] = theValue;
                        })) {
                            target[field] = value;
                        }
                    }
                }
            };
            for (var field in source) {
                _loop_1(field);
            }
        }
        return target;
    }
    function proxyFunctionAs(target, name, source, theFunc, overwriteTarget) {
        if (target && name && source) {
            if (overwriteTarget !== false || isUndefined(target[name])) {
                target[name] = _createProxyFunction(source, theFunc);
            }
        }
    }
    function proxyFunctions(target, source, functionsToProxy, overwriteTarget) {
        if (target && source && isObject(target) && isArray(functionsToProxy)) {
            arrForEach(functionsToProxy, function (theFuncName) {
                if (isString(theFuncName)) {
                    proxyFunctionAs(target, theFuncName, source, theFuncName, overwriteTarget);
                }
            });
        }
        return target;
    }
    function createClassFromInterface(defaults) {
        return /** @class */ (function () {
            function class_1() {
                var _this_1 = this;
                if (defaults) {
                    objForEachKey(defaults, function (field, value) {
                        _this_1[field] = value;
                    });
                }
            }
            return class_1;
        }());
    }
    function optimizeObject(theObject) {
        if (theObject && ObjAssign) {
            theObject = ObjClass(ObjAssign({}, theObject));
        }
        return theObject;
    }
    function objExtend(obj1, obj2, obj3, obj4, obj5, obj6) {
        var theArgs = arguments;
        var extended = theArgs[0] || {};
        var argLen = theArgs[_DYN_LENGTH$5 ];
        var deep = false;
        var idx = 1;
        if (argLen > 0 && isBoolean(extended)) {
            deep = extended;
            extended = theArgs[idx] || {};
            idx++;
        }
        if (!isObject(extended)) {
            extended = {};
        }
        for (; idx < argLen; idx++) {
            var arg = theArgs[idx];
            var isArgArray = isArray(arg);
            var isArgObj = isObject(arg);
            for (var prop in arg) {
                var propOk = (isArgArray && (prop in arg)) || (isArgObj && (ObjHasOwnProperty[_DYN_CALL ](arg, prop)));
                if (!propOk) {
                    continue;
                }
                var newValue = arg[prop];
                var isNewArray = void 0;
                if (deep && newValue && ((isNewArray = isArray(newValue)) || isPlainObject(newValue))) {
                    var clone = extended[prop];
                    if (isNewArray) {
                        if (!isArray(clone)) {
                            clone = [];
                        }
                    }
                    else if (!isPlainObject(clone)) {
                        clone = {};
                    }
                    newValue = objExtend(deep, clone, newValue);
                }
                if (newValue !== undefined) {
                    extended[prop] = newValue;
                }
            }
        }
        return extended;
    }

    function createEnumStyle(values) {
        var enumClass = {};
        objForEachKey(values, function (field, value) {
            enumClass[field] = value;
            enumClass[value] = field;
        });
        return deepFreeze(enumClass);
    }
    function createValueMap(values) {
        var mapClass = {};
        objForEachKey(values, function (field, value) {
            mapClass[field] = value[1];
            mapClass[value[0]] = value[1];
        });
        return deepFreeze(mapClass);
    }

    /*!
     * Microsoft Dynamic Proto Utility, 1.1.7
     * Copyright (c) Microsoft and contributors. All rights reserved.
     */
    var _a$3;
    var UNDEFINED = "undefined";
    var Constructor = 'constructor';
    var Prototype = 'prototype';
    var strFunction = 'function';
    var DynInstFuncTable = '_dynInstFuncs';
    var DynProxyTag = '_isDynProxy';
    var DynClassName = '_dynClass';
    var DynClassNamePrefix = '_dynCls$';
    var DynInstChkTag = '_dynInstChk';
    var DynAllowInstChkTag = DynInstChkTag;
    var DynProtoDefaultOptions = '_dfOpts';
    var UnknownValue = '_unknown_';
    var str__Proto = "__proto__";
    var DynProtoBaseProto = "_dyn" + str__Proto;
    var DynProtoGlobalSettings = "__dynProto$Gbl";
    var DynProtoCurrent = "_dynInstProto";
    var strUseBaseInst = 'useBaseInst';
    var strSetInstFuncs = 'setInstFuncs';
    var Obj = Object;
    var _objGetPrototypeOf = Obj["getPrototypeOf"];
    var _objGetOwnProps = Obj["getOwnPropertyNames"];
    function _getGlobal() {
        var result;
        if (typeof globalThis !== UNDEFINED) {
            result = globalThis;
        }
        if (!result && typeof self !== UNDEFINED) {
            result = self;
        }
        if (!result && typeof window !== UNDEFINED) {
            result = window;
        }
        if (!result && typeof global !== UNDEFINED) {
            result = global;
        }
        return result || {};
    }
    var _gbl = _getGlobal();
    var _gblInst = _gbl[DynProtoGlobalSettings] || (_gbl[DynProtoGlobalSettings] = {
        o: (_a$3 = {},
            _a$3[strSetInstFuncs] = true,
            _a$3[strUseBaseInst] = true,
            _a$3),
        n: 1000
    });
    function _hasOwnProperty(obj, prop) {
        return obj && Obj[Prototype].hasOwnProperty.call(obj, prop);
    }
    function _isObjectOrArrayPrototype(target) {
        return target && (target === Obj[Prototype] || target === Array[Prototype]);
    }
    function _isObjectArrayOrFunctionPrototype(target) {
        return _isObjectOrArrayPrototype(target) || target === Function[Prototype];
    }
    function _getObjProto(target) {
        var newProto;
        if (target) {
            if (_objGetPrototypeOf) {
                return _objGetPrototypeOf(target);
            }
            var curProto = target[str__Proto] || target[Prototype] || (target[Constructor] ? target[Constructor][Prototype] : null);
            newProto = target[DynProtoBaseProto] || curProto;
            if (!_hasOwnProperty(target, DynProtoBaseProto)) {
                delete target[DynProtoCurrent];
                newProto = target[DynProtoBaseProto] = target[DynProtoCurrent] || target[DynProtoBaseProto];
                target[DynProtoCurrent] = curProto;
            }
        }
        return newProto;
    }
    function _forEachProp(target, func) {
        var props = [];
        if (_objGetOwnProps) {
            props = _objGetOwnProps(target);
        }
        else {
            for (var name_1 in target) {
                if (typeof name_1 === "string" && _hasOwnProperty(target, name_1)) {
                    props.push(name_1);
                }
            }
        }
        if (props && props.length > 0) {
            for (var lp = 0; lp < props.length; lp++) {
                func(props[lp]);
            }
        }
    }
    function _isDynamicCandidate(target, funcName, skipOwn) {
        return (funcName !== Constructor && typeof target[funcName] === strFunction && (skipOwn || _hasOwnProperty(target, funcName)));
    }
    function _throwTypeError(message) {
        throw new TypeError("DynamicProto: " + message);
    }
    function _getInstanceFuncs(thisTarget) {
        var instFuncs = {};
        _forEachProp(thisTarget, function (name) {
            if (!instFuncs[name] && _isDynamicCandidate(thisTarget, name, false)) {
                instFuncs[name] = thisTarget[name];
            }
        });
        return instFuncs;
    }
    function _hasVisited(values, value) {
        for (var lp = values.length - 1; lp >= 0; lp--) {
            if (values[lp] === value) {
                return true;
            }
        }
        return false;
    }
    function _getBaseFuncs(classProto, thisTarget, instFuncs, useBaseInst) {
        function _instFuncProxy(target, funcHost, funcName) {
            var theFunc = funcHost[funcName];
            if (theFunc[DynProxyTag] && useBaseInst) {
                var instFuncTable = target[DynInstFuncTable] || {};
                if (instFuncTable[DynAllowInstChkTag] !== false) {
                    theFunc = (instFuncTable[funcHost[DynClassName]] || {})[funcName] || theFunc;
                }
            }
            return function () {
                return theFunc.apply(target, arguments);
            };
        }
        var baseFuncs = {};
        _forEachProp(instFuncs, function (name) {
            baseFuncs[name] = _instFuncProxy(thisTarget, instFuncs, name);
        });
        var baseProto = _getObjProto(classProto);
        var visited = [];
        while (baseProto && !_isObjectArrayOrFunctionPrototype(baseProto) && !_hasVisited(visited, baseProto)) {
            _forEachProp(baseProto, function (name) {
                if (!baseFuncs[name] && _isDynamicCandidate(baseProto, name, !_objGetPrototypeOf)) {
                    baseFuncs[name] = _instFuncProxy(thisTarget, baseProto, name);
                }
            });
            visited.push(baseProto);
            baseProto = _getObjProto(baseProto);
        }
        return baseFuncs;
    }
    function _getInstFunc(target, funcName, proto, currentDynProtoProxy) {
        var instFunc = null;
        if (target && _hasOwnProperty(proto, DynClassName)) {
            var instFuncTable = target[DynInstFuncTable] || {};
            instFunc = (instFuncTable[proto[DynClassName]] || {})[funcName];
            if (!instFunc) {
                _throwTypeError("Missing [" + funcName + "] " + strFunction);
            }
            if (!instFunc[DynInstChkTag] && instFuncTable[DynAllowInstChkTag] !== false) {
                var canAddInst = !_hasOwnProperty(target, funcName);
                var objProto = _getObjProto(target);
                var visited = [];
                while (canAddInst && objProto && !_isObjectArrayOrFunctionPrototype(objProto) && !_hasVisited(visited, objProto)) {
                    var protoFunc = objProto[funcName];
                    if (protoFunc) {
                        canAddInst = (protoFunc === currentDynProtoProxy);
                        break;
                    }
                    visited.push(objProto);
                    objProto = _getObjProto(objProto);
                }
                try {
                    if (canAddInst) {
                        target[funcName] = instFunc;
                    }
                    instFunc[DynInstChkTag] = 1;
                }
                catch (e) {
                    instFuncTable[DynAllowInstChkTag] = false;
                }
            }
        }
        return instFunc;
    }
    function _getProtoFunc(funcName, proto, currentDynProtoProxy) {
        var protoFunc = proto[funcName];
        if (protoFunc === currentDynProtoProxy) {
            protoFunc = _getObjProto(proto)[funcName];
        }
        if (typeof protoFunc !== strFunction) {
            _throwTypeError("[" + funcName + "] is not a " + strFunction);
        }
        return protoFunc;
    }
    function _populatePrototype(proto, className, target, baseInstFuncs, setInstanceFunc) {
        function _createDynamicPrototype(proto, funcName) {
            var dynProtoProxy = function () {
                var instFunc = _getInstFunc(this, funcName, proto, dynProtoProxy) || _getProtoFunc(funcName, proto, dynProtoProxy);
                return instFunc.apply(this, arguments);
            };
            dynProtoProxy[DynProxyTag] = 1;
            return dynProtoProxy;
        }
        if (!_isObjectOrArrayPrototype(proto)) {
            var instFuncTable = target[DynInstFuncTable] = target[DynInstFuncTable] || {};
            var instFuncs_1 = instFuncTable[className] = (instFuncTable[className] || {});
            if (instFuncTable[DynAllowInstChkTag] !== false) {
                instFuncTable[DynAllowInstChkTag] = !!setInstanceFunc;
            }
            _forEachProp(target, function (name) {
                if (_isDynamicCandidate(target, name, false) && target[name] !== baseInstFuncs[name]) {
                    instFuncs_1[name] = target[name];
                    delete target[name];
                    if (!_hasOwnProperty(proto, name) || (proto[name] && !proto[name][DynProxyTag])) {
                        proto[name] = _createDynamicPrototype(proto, name);
                    }
                }
            });
        }
    }
    function _checkPrototype(classProto, thisTarget) {
        if (_objGetPrototypeOf) {
            var visited = [];
            var thisProto = _getObjProto(thisTarget);
            while (thisProto && !_isObjectArrayOrFunctionPrototype(thisProto) && !_hasVisited(visited, thisProto)) {
                if (thisProto === classProto) {
                    return true;
                }
                visited.push(thisProto);
                thisProto = _getObjProto(thisProto);
            }
            return false;
        }
        return true;
    }
    function _getObjName(target, unknownValue) {
        if (_hasOwnProperty(target, Prototype)) {
            return target.name || unknownValue || UnknownValue;
        }
        return (((target || {})[Constructor]) || {}).name || unknownValue || UnknownValue;
    }
    function dynamicProto(theClass, target, delegateFunc, options) {
        if (!_hasOwnProperty(theClass, Prototype)) {
            _throwTypeError("theClass is an invalid class definition.");
        }
        var classProto = theClass[Prototype];
        if (!_checkPrototype(classProto, target)) {
            _throwTypeError("[" + _getObjName(theClass) + "] not in hierarchy of [" + _getObjName(target) + "]");
        }
        var className = null;
        if (_hasOwnProperty(classProto, DynClassName)) {
            className = classProto[DynClassName];
        }
        else {
            className = DynClassNamePrefix + _getObjName(theClass, "_") + "$" + _gblInst.n;
            _gblInst.n++;
            classProto[DynClassName] = className;
        }
        var perfOptions = dynamicProto[DynProtoDefaultOptions];
        var useBaseInst = !!perfOptions[strUseBaseInst];
        if (useBaseInst && options && options[strUseBaseInst] !== undefined) {
            useBaseInst = !!options[strUseBaseInst];
        }
        var instFuncs = _getInstanceFuncs(target);
        var baseFuncs = _getBaseFuncs(classProto, target, instFuncs, useBaseInst);
        delegateFunc(target, baseFuncs);
        var setInstanceFunc = !!_objGetPrototypeOf && !!perfOptions[strSetInstFuncs];
        if (setInstanceFunc && options) {
            setInstanceFunc = !!options[strSetInstFuncs];
        }
        _populatePrototype(classProto, className, target, instFuncs, setInstanceFunc !== false);
    }
    dynamicProto[DynProtoDefaultOptions] = _gblInst.o;

    var strWindow = "window";
    var strDocument = "document";
    var strDocumentMode = "documentMode";
    var strNavigator = "navigator";
    var strHistory = "history";
    var strLocation = "location";
    var strConsole = "console";
    var strPerformance = "performance";
    var strJSON = "JSON";
    var strCrypto = "crypto";
    var strMsCrypto = "msCrypto";
    var strReactNative = "ReactNative";
    var strMsie = "msie";
    var strTrident = "trident/";
    var strXMLHttpRequest = "XMLHttpRequest";
    var _isTrident = null;
    var _navUserAgentCheck = null;
    var _enableMocks = false;
    var _useXDomainRequest = null;
    var _beaconsSupported = null;
    function _hasProperty(theClass, property) {
        var supported = false;
        if (theClass) {
            try {
                supported = property in theClass;
                if (!supported) {
                    var proto = theClass[strShimPrototype];
                    if (proto) {
                        supported = property in proto;
                    }
                }
            }
            catch (e) {
            }
            if (!supported) {
                try {
                    var tmp = new theClass();
                    supported = !isUndefined(tmp[property]);
                }
                catch (e) {
                }
            }
        }
        return supported;
    }
    function getGlobalInst(name) {
        var gbl = getGlobal();
        if (gbl && gbl[name]) {
            return gbl[name];
        }
        if (name === strWindow && hasWindow()) {
            return window;
        }
        return null;
    }
    function hasWindow() {
        return Boolean(typeof window === strShimObject && window);
    }
    function getWindow() {
        if (hasWindow()) {
            return window;
        }
        return getGlobalInst(strWindow);
    }
    function hasDocument() {
        return Boolean(typeof document === strShimObject && document);
    }
    function getDocument() {
        if (hasDocument()) {
            return document;
        }
        return getGlobalInst(strDocument);
    }
    function hasNavigator() {
        return Boolean(typeof navigator === strShimObject && navigator);
    }
    function getNavigator() {
        if (hasNavigator()) {
            return navigator;
        }
        return getGlobalInst(strNavigator);
    }
    function hasHistory() {
        return Boolean(typeof history === strShimObject && history);
    }
    function getHistory() {
        if (hasHistory()) {
            return history;
        }
        return getGlobalInst(strHistory);
    }
    function getLocation(checkForMock) {
        if (checkForMock && _enableMocks) {
            var mockLocation = getGlobalInst("__mockLocation");
            if (mockLocation) {
                return mockLocation;
            }
        }
        if (typeof location === strShimObject && location) {
            return location;
        }
        return getGlobalInst(strLocation);
    }
    function getConsole() {
        if (typeof console !== strShimUndefined) {
            return console;
        }
        return getGlobalInst(strConsole);
    }
    function getPerformance() {
        return getGlobalInst(strPerformance);
    }
    function hasJSON() {
        return Boolean((typeof JSON === strShimObject && JSON) || getGlobalInst(strJSON) !== null);
    }
    function getJSON() {
        if (hasJSON()) {
            return JSON || getGlobalInst(strJSON);
        }
        return null;
    }
    function getCrypto() {
        return getGlobalInst(strCrypto);
    }
    function getMsCrypto() {
        return getGlobalInst(strMsCrypto);
    }
    function isReactNative() {
        var nav = getNavigator();
        if (nav && nav.product) {
            return nav.product === strReactNative;
        }
        return false;
    }
    function isIE() {
        var nav = getNavigator();
        if (nav && (nav[_DYN_USER_AGENT ] !== _navUserAgentCheck || _isTrident === null)) {
            _navUserAgentCheck = nav[_DYN_USER_AGENT ];
            var userAgent = (_navUserAgentCheck || STR_EMPTY)[_DYN_TO_LOWER_CASE$2 ]();
            _isTrident = (strContains(userAgent, strMsie) || strContains(userAgent, strTrident));
        }
        return _isTrident;
    }
    function getIEVersion(userAgentStr) {
        if (userAgentStr === void 0) { userAgentStr = null; }
        if (!userAgentStr) {
            var navigator_1 = getNavigator() || {};
            userAgentStr = navigator_1 ? (navigator_1[_DYN_USER_AGENT ] || STR_EMPTY)[_DYN_TO_LOWER_CASE$2 ]() : STR_EMPTY;
        }
        var ua = (userAgentStr || STR_EMPTY)[_DYN_TO_LOWER_CASE$2 ]();
        if (strContains(ua, strMsie)) {
            var doc = getDocument() || {};
            return Math.max(parseInt(ua[_DYN_SPLIT$1 ](strMsie)[1]), (doc[strDocumentMode] || 0));
        }
        else if (strContains(ua, strTrident)) {
            var tridentVer = parseInt(ua[_DYN_SPLIT$1 ](strTrident)[1]);
            if (tridentVer) {
                return tridentVer + 4;
            }
        }
        return null;
    }
    function dumpObj(object) {
        var objectTypeDump = Object[strShimPrototype].toString[_DYN_CALL ](object);
        var propertyValueDump = STR_EMPTY;
        if (objectTypeDump === "[object Error]") {
            propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object[_DYN_NAME$3 ] + "'";
        }
        else if (hasJSON()) {
            propertyValueDump = getJSON().stringify(object);
        }
        return objectTypeDump + propertyValueDump;
    }
    function isBeaconsSupported() {
        if (_beaconsSupported === null) {
            _beaconsSupported = hasNavigator() && Boolean(getNavigator().sendBeacon);
        }
        return _beaconsSupported;
    }
    function isFetchSupported(withKeepAlive) {
        var isSupported = false;
        try {
            isSupported = !!getGlobalInst("fetch");
            var request = getGlobalInst("Request");
            if (isSupported && withKeepAlive && request) {
                isSupported = _hasProperty(request, "keepalive");
            }
        }
        catch (e) {
        }
        return isSupported;
    }
    function useXDomainRequest() {
        if (_useXDomainRequest === null) {
            _useXDomainRequest = (typeof XDomainRequest !== strShimUndefined);
            if (_useXDomainRequest && isXhrSupported()) {
                _useXDomainRequest = _useXDomainRequest && !_hasProperty(getGlobalInst(strXMLHttpRequest), "withCredentials");
            }
        }
        return _useXDomainRequest;
    }
    function isXhrSupported() {
        var isSupported = false;
        try {
            var xmlHttpRequest = getGlobalInst(strXMLHttpRequest);
            isSupported = !!xmlHttpRequest;
        }
        catch (e) {
        }
        return isSupported;
    }
    function _getNamedValue(values, name) {
        if (values) {
            for (var i = 0; i < values[_DYN_LENGTH$5 ]; i++) {
                var value = values[i];
                if (value[_DYN_NAME$3 ]) {
                    if (value[_DYN_NAME$3 ] === name) {
                        return value;
                    }
                }
            }
        }
        return {};
    }
    function findMetaTag(name) {
        var doc = getDocument();
        if (doc && name) {
            return _getNamedValue(doc.querySelectorAll("meta"), name).content;
        }
        return null;
    }
    function findNamedServerTiming(name) {
        var value;
        var perf = getPerformance();
        if (perf) {
            var navPerf = perf.getEntriesByType("navigation") || [];
            value = _getNamedValue((navPerf[_DYN_LENGTH$5 ] > 0 ? navPerf[0] : {}).serverTiming, name).description;
        }
        return value;
    }

    var listenerFuncs = ["eventsSent", "eventsDiscarded", "eventsSendRequest", "perfEvent"];
    var _aiNamespace = null;
    var _debugListener;
    function _listenerProxyFunc(name, config) {
        return function () {
            var args = arguments;
            var dbgExt = getDebugExt(config);
            if (dbgExt) {
                var listener = dbgExt.listener;
                if (listener && listener[name]) {
                    listener[name][_DYN_APPLY ](listener, args);
                }
            }
        };
    }
    function _getExtensionNamespace() {
        var target = getGlobalInst("Microsoft");
        if (target) {
            _aiNamespace = target["ApplicationInsights"];
        }
        return _aiNamespace;
    }
    function getDebugExt(config) {
        var ns = _aiNamespace;
        if (!ns && config.disableDbgExt !== true) {
            ns = _aiNamespace || _getExtensionNamespace();
        }
        return ns ? ns["ChromeDbgExt"] : null;
    }
    function getDebugListener(config) {
        if (!_debugListener) {
            _debugListener = {};
            for (var lp = 0; lp < listenerFuncs[_DYN_LENGTH$5 ]; lp++) {
                _debugListener[listenerFuncs[lp]] = _listenerProxyFunc(listenerFuncs[lp], config);
            }
        }
        return _debugListener;
    }

    var AiNonUserActionablePrefix = "AI (Internal): ";
    var AiUserActionablePrefix = "AI: ";
    var AIInternalMessagePrefix = "AITR_";
    function _sanitizeDiagnosticText(text) {
        if (text) {
            return "\"" + text[_DYN_REPLACE ](/\"/g, STR_EMPTY) + "\"";
        }
        return STR_EMPTY;
    }
    function _logToConsole(func, message) {
        var theConsole = getConsole();
        if (!!theConsole) {
            var logFunc = "log";
            if (theConsole[func]) {
                logFunc = func;
            }
            if (isFunction(theConsole[logFunc])) {
                theConsole[logFunc](message);
            }
        }
    }
    var _InternalLogMessage = /** @class */ (function () {
        function _InternalLogMessage(msgId, msg, isUserAct, properties) {
            if (isUserAct === void 0) { isUserAct = false; }
            var _self = this;
            _self[_DYN_MESSAGE_ID ] = msgId;
            _self[_DYN_MESSAGE$2 ] =
                (isUserAct ? AiUserActionablePrefix : AiNonUserActionablePrefix) +
                    msgId;
            var strProps = STR_EMPTY;
            if (hasJSON()) {
                strProps = getJSON().stringify(properties);
            }
            var diagnosticText = (msg ? " message:" + _sanitizeDiagnosticText(msg) : STR_EMPTY) +
                (properties ? " props:" + _sanitizeDiagnosticText(strProps) : STR_EMPTY);
            _self[_DYN_MESSAGE$2 ] += diagnosticText;
        }
        _InternalLogMessage.dataType = "MessageData";
        return _InternalLogMessage;
    }());
    function safeGetLogger(core, config) {
        return (core || {})[_DYN_LOGGER ] || new DiagnosticLogger(config);
    }
    var DiagnosticLogger = /** @class */ (function () {
        function DiagnosticLogger(config) {
            this.identifier = "DiagnosticLogger";
            this.queue = [];
            var _messageCount = 0;
            var _messageLogged = {};
            var _loggingLevelConsole;
            var _loggingLevelTelemetry;
            var _maxInternalMessageLimit;
            var _enableDebugExceptions;
            dynamicProto(DiagnosticLogger, this, function (_self) {
                _setDefaultsFromConfig(config || {});
                _self.consoleLoggingLevel = function () { return _loggingLevelConsole; };
                _self.telemetryLoggingLevel = function () { return _loggingLevelTelemetry; };
                _self.maxInternalMessageLimit = function () { return _maxInternalMessageLimit; };
                _self[_DYN_ENABLE_DEBUG_EXCEPTI4 ] = function () { return _enableDebugExceptions; };
                _self.throwInternal = function (severity, msgId, msg, properties, isUserAct) {
                    if (isUserAct === void 0) { isUserAct = false; }
                    var message = new _InternalLogMessage(msgId, msg, isUserAct, properties);
                    if (_enableDebugExceptions) {
                        throw dumpObj(message);
                    }
                    else {
                        var logFunc = severity === 1  ? STR_ERROR_TO_CONSOLE : STR_WARN_TO_CONSOLE;
                        if (!isUndefined(message[_DYN_MESSAGE$2 ])) {
                            if (isUserAct) {
                                var messageKey = +message[_DYN_MESSAGE_ID ];
                                if (!_messageLogged[messageKey] && _loggingLevelConsole >= severity) {
                                    _self[logFunc](message[_DYN_MESSAGE$2 ]);
                                    _messageLogged[messageKey] = true;
                                }
                            }
                            else {
                                if (_loggingLevelConsole >= severity) {
                                    _self[logFunc](message[_DYN_MESSAGE$2 ]);
                                }
                            }
                            _logInternalMessage(severity, message);
                        }
                        else {
                            _debugExtMsg("throw" + (severity === 1  ? "Critical" : "Warning"), message);
                        }
                    }
                };
                _self[STR_WARN_TO_CONSOLE ] = function (message) {
                    _logToConsole("warn", message);
                    _debugExtMsg("warning", message);
                };
                _self[STR_ERROR_TO_CONSOLE ] = function (message) {
                    _logToConsole("error", message);
                    _debugExtMsg("error", message);
                };
                _self.resetInternalMessageCount = function () {
                    _messageCount = 0;
                    _messageLogged = {};
                };
                _self[_DYN_LOG_INTERNAL_MESSAGE ] = _logInternalMessage;
                function _logInternalMessage(severity, message) {
                    if (_areInternalMessagesThrottled()) {
                        return;
                    }
                    var logMessage = true;
                    var messageKey = AIInternalMessagePrefix + message[_DYN_MESSAGE_ID ];
                    if (_messageLogged[messageKey]) {
                        logMessage = false;
                    }
                    else {
                        _messageLogged[messageKey] = true;
                    }
                    if (logMessage) {
                        if (severity <= _loggingLevelTelemetry) {
                            _self.queue[_DYN_PUSH$2 ](message);
                            _messageCount++;
                            _debugExtMsg((severity === 1  ? "error" : "warn"), message);
                        }
                        if (_messageCount === _maxInternalMessageLimit) {
                            var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                            var throttleMessage = new _InternalLogMessage(23 , throttleLimitMessage, false);
                            _self.queue[_DYN_PUSH$2 ](throttleMessage);
                            if (severity === 1 ) {
                                _self[STR_ERROR_TO_CONSOLE ](throttleLimitMessage);
                            }
                            else {
                                _self[STR_WARN_TO_CONSOLE ](throttleLimitMessage);
                            }
                        }
                    }
                }
                function _setDefaultsFromConfig(config) {
                    _loggingLevelConsole = getCfgValue(config.loggingLevelConsole, 0);
                    _loggingLevelTelemetry = getCfgValue(config.loggingLevelTelemetry, 1);
                    _maxInternalMessageLimit = getCfgValue(config.maxMessageLimit, 25);
                    _enableDebugExceptions = getCfgValue(config[_DYN_ENABLE_DEBUG_EXCEPTI4 ], false);
                }
                function _areInternalMessagesThrottled() {
                    return _messageCount >= _maxInternalMessageLimit;
                }
                function _debugExtMsg(name, data) {
                    var dbgExt = getDebugExt(config || {});
                    if (dbgExt && dbgExt[_DYN_DIAG_LOG$2 ]) {
                        dbgExt[_DYN_DIAG_LOG$2 ](name, data);
                    }
                }
            });
        }
        DiagnosticLogger.__ieDyn=1;
        return DiagnosticLogger;
    }());
    function _getLogger(logger) {
        return (logger || new DiagnosticLogger());
    }
    function _throwInternal(logger, severity, msgId, msg, properties, isUserAct) {
        if (isUserAct === void 0) { isUserAct = false; }
        _getLogger(logger).throwInternal(severity, msgId, msg, properties, isUserAct);
    }
    function _warnToConsole(logger, message) {
        _getLogger(logger)[STR_WARN_TO_CONSOLE ](message);
    }
    function _logInternalMessage(logger, severity, message) {
        _getLogger(logger)[_DYN_LOG_INTERNAL_MESSAGE ](severity, message);
    }

    var strExecutionContextKey = "ctx";
    var strParentContextKey = "ParentContextKey";
    var strChildrenContextKey = "ChildrenContextKey";
    var _defaultPerfManager = null;
    var PerfEvent = /** @class */ (function () {
        function PerfEvent(name, payloadDetails, isAsync) {
            var _self = this;
            var accessorDefined = false;
            _self.start = dateNow();
            _self[_DYN_NAME$3 ] = name;
            _self[_DYN_IS_ASYNC ] = isAsync;
            _self[_DYN_IS_CHILD_EVT ] = function () { return false; };
            if (isFunction(payloadDetails)) {
                var theDetails_1;
                accessorDefined = objDefineAccessors(_self, "payload", function () {
                    if (!theDetails_1 && isFunction(payloadDetails)) {
                        theDetails_1 = payloadDetails();
                        payloadDetails = null;
                    }
                    return theDetails_1;
                });
            }
            _self[_DYN_GET_CTX ] = function (key) {
                if (key) {
                    if (key === PerfEvent[strParentContextKey] || key === PerfEvent[strChildrenContextKey]) {
                        return _self[key];
                    }
                    return (_self[strExecutionContextKey] || {})[key];
                }
                return null;
            };
            _self[_DYN_SET_CTX ] = function (key, value) {
                if (key) {
                    if (key === PerfEvent[strParentContextKey]) {
                        if (!_self[key]) {
                            _self[_DYN_IS_CHILD_EVT ] = function () { return true; };
                        }
                        _self[key] = value;
                    }
                    else if (key === PerfEvent[strChildrenContextKey]) {
                        _self[key] = value;
                    }
                    else {
                        var ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                        ctx[key] = value;
                    }
                }
            };
            _self[_DYN_COMPLETE ] = function () {
                var childTime = 0;
                var childEvts = _self[_DYN_GET_CTX ](PerfEvent[strChildrenContextKey]);
                if (isArray(childEvts)) {
                    for (var lp = 0; lp < childEvts[_DYN_LENGTH$5 ]; lp++) {
                        var childEvt = childEvts[lp];
                        if (childEvt) {
                            childTime += childEvt[_DYN_TIME ];
                        }
                    }
                }
                _self[_DYN_TIME ] = dateNow() - _self.start;
                _self.exTime = _self[_DYN_TIME ] - childTime;
                _self[_DYN_COMPLETE ] = function () { };
                if (!accessorDefined && isFunction(payloadDetails)) {
                    _self.payload = payloadDetails();
                }
            };
        }
        PerfEvent.ParentContextKey = "parent";
        PerfEvent.ChildrenContextKey = "childEvts";
        return PerfEvent;
    }());
    var PerfManager = /** @class */ (function () {
        function PerfManager(manager) {
            this.ctx = {};
            dynamicProto(PerfManager, this, function (_self) {
                _self.create = function (src, payloadDetails, isAsync) {
                    return new PerfEvent(src, payloadDetails, isAsync);
                };
                _self.fire = function (perfEvent) {
                    if (perfEvent) {
                        perfEvent[_DYN_COMPLETE ]();
                        if (manager && isFunction(manager[STR_PERF_EVENT ])) {
                            manager[STR_PERF_EVENT ](perfEvent);
                        }
                    }
                };
                _self[_DYN_SET_CTX ] = function (key, value) {
                    if (key) {
                        var ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                        ctx[key] = value;
                    }
                };
                _self[_DYN_GET_CTX ] = function (key) {
                    return (_self[strExecutionContextKey] || {})[key];
                };
            });
        }
        PerfManager.__ieDyn=1;
        return PerfManager;
    }());
    var doPerfActiveKey = "CoreUtils.doPerf";
    function doPerf(mgrSource, getSource, func, details, isAsync) {
        if (mgrSource) {
            var perfMgr = mgrSource;
            if (perfMgr[STR_GET_PERF_MGR]) {
                perfMgr = perfMgr[STR_GET_PERF_MGR]();
            }
            if (perfMgr) {
                var perfEvt = void 0;
                var currentActive = perfMgr[_DYN_GET_CTX ](doPerfActiveKey);
                try {
                    perfEvt = perfMgr.create(getSource(), details, isAsync);
                    if (perfEvt) {
                        if (currentActive && perfEvt[_DYN_SET_CTX ]) {
                            perfEvt[_DYN_SET_CTX ](PerfEvent[strParentContextKey], currentActive);
                            if (currentActive[_DYN_GET_CTX ] && currentActive[_DYN_SET_CTX ]) {
                                var children = currentActive[_DYN_GET_CTX ](PerfEvent[strChildrenContextKey]);
                                if (!children) {
                                    children = [];
                                    currentActive[_DYN_SET_CTX ](PerfEvent[strChildrenContextKey], children);
                                }
                                children[_DYN_PUSH$2 ](perfEvt);
                            }
                        }
                        perfMgr[_DYN_SET_CTX ](doPerfActiveKey, perfEvt);
                        return func(perfEvt);
                    }
                }
                catch (ex) {
                    if (perfEvt && perfEvt[_DYN_SET_CTX ]) {
                        perfEvt[_DYN_SET_CTX ]("exception", ex);
                    }
                }
                finally {
                    if (perfEvt) {
                        perfMgr.fire(perfEvt);
                    }
                    perfMgr[_DYN_SET_CTX ](doPerfActiveKey, currentActive);
                }
            }
        }
        return func();
    }
    function getGblPerfMgr() {
        return _defaultPerfManager;
    }

    var UInt32Mask = 0x100000000;
    var MaxUInt32 = 0xffffffff;
    var _mwcSeeded = false;
    var _mwcW = 123456789;
    var _mwcZ = 987654321;
    function _mwcSeed(seedValue) {
        if (seedValue < 0) {
            seedValue >>>= 0;
        }
        _mwcW = (123456789 + seedValue) & MaxUInt32;
        _mwcZ = (987654321 - seedValue) & MaxUInt32;
        _mwcSeeded = true;
    }
    function _autoSeedMwc() {
        try {
            var now = dateNow() & 0x7fffffff;
            _mwcSeed(((Math.random() * UInt32Mask) ^ now) + now);
        }
        catch (e) {
        }
    }
    function randomValue(maxValue) {
        if (maxValue > 0) {
            return Math.floor((random32() / MaxUInt32) * (maxValue + 1)) >>> 0;
        }
        return 0;
    }
    function random32(signed) {
        var value = 0;
        var c = getCrypto() || getMsCrypto();
        if (c && c.getRandomValues) {
            value = c.getRandomValues(new Uint32Array(1))[0] & MaxUInt32;
        }
        if (value === 0 && isIE()) {
            if (!_mwcSeeded) {
                _autoSeedMwc();
            }
            value = mwcRandom32() & MaxUInt32;
        }
        if (value === 0) {
            value = Math.floor((UInt32Mask * Math.random()) | 0);
        }
        if (!signed) {
            value >>>= 0;
        }
        return value;
    }
    function mwcRandomSeed(value) {
        if (!value) {
            _autoSeedMwc();
        }
        else {
            _mwcSeed(value);
        }
    }
    function mwcRandom32(signed) {
        _mwcZ = (36969 * (_mwcZ & 0xFFFF) + (_mwcZ >> 16)) & MaxUInt32;
        _mwcW = (18000 * (_mwcW & 0xFFFF) + (_mwcW >> 16)) & MaxUInt32;
        var value = (((_mwcZ << 16) + (_mwcW & 0xFFFF)) >>> 0) & MaxUInt32 | 0;
        if (!signed) {
            value >>>= 0;
        }
        return value;
    }
    function newId(maxLength) {
        if (maxLength === void 0) { maxLength = 22; }
        var base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var number = random32() >>> 0;
        var chars = 0;
        var result = STR_EMPTY;
        while (result[_DYN_LENGTH$5 ] < maxLength) {
            chars++;
            result += base64chars.charAt(number & 0x3F);
            number >>>= 6;
            if (chars === 5) {
                number = (((random32() << 2) & 0xFFFFFFFF) | (number & 0x03)) >>> 0;
                chars = 0;
            }
        }
        return result;
    }

    var _objDefineProperty = ObjDefineProperty;
    var version = '2.8.9';
    var instanceName = "." + newId(6);
    var _dataUid = 0;
    function _createAccessor(target, prop, value) {
        if (_objDefineProperty) {
            try {
                _objDefineProperty(target, prop, {
                    value: value,
                    enumerable: false,
                    configurable: true
                });
                return true;
            }
            catch (e) {
            }
        }
        return false;
    }
    function _canAcceptData(target) {
        return target[_DYN_NODE_TYPE ] === 1 || target[_DYN_NODE_TYPE ] === 9 || !(+target[_DYN_NODE_TYPE ]);
    }
    function _getCache(data, target) {
        var theCache = target[data.id];
        if (!theCache) {
            theCache = {};
            try {
                if (_canAcceptData(target)) {
                    if (!_createAccessor(target, data.id, theCache)) {
                        target[data.id] = theCache;
                    }
                }
            }
            catch (e) {
            }
        }
        return theCache;
    }
    function createUniqueNamespace(name, includeVersion) {
        if (includeVersion === void 0) { includeVersion = false; }
        return normalizeJsName(name + (_dataUid++) + (includeVersion ? "." + version : STR_EMPTY) + instanceName);
    }
    function createElmNodeData(name) {
        var data = {
            id: createUniqueNamespace("_aiData-" + (name || STR_EMPTY) + "." + version),
            accept: function (target) {
                return _canAcceptData(target);
            },
            get: function (target, name, defValue, addDefault) {
                var theCache = target[data.id];
                if (!theCache) {
                    if (addDefault) {
                        theCache = _getCache(data, target);
                        theCache[normalizeJsName(name)] = defValue;
                    }
                    return defValue;
                }
                return theCache[normalizeJsName(name)];
            },
            kill: function (target, name) {
                if (target && target[name]) {
                    try {
                        delete target[name];
                    }
                    catch (e) {
                    }
                }
            }
        };
        return data;
    }

    var strToGMTString = "toGMTString";
    var strToUTCString = "toUTCString";
    var strCookie = "cookie";
    var strExpires = "expires";
    var strEnabled = "enabled";
    var strIsCookieUseDisabled = "isCookieUseDisabled";
    var strDisableCookiesUsage = "disableCookiesUsage";
    var strConfigCookieMgr = "_ckMgr";
    var _supportsCookies = null;
    var _allowUaSameSite = null;
    var _parsedCookieValue = null;
    var _doc = getDocument();
    var _cookieCache = {};
    var _globalCookieConfig = {};
    function _gblCookieMgr(config, logger) {
        var inst = createCookieMgr[strConfigCookieMgr] || _globalCookieConfig[strConfigCookieMgr];
        if (!inst) {
            inst = createCookieMgr[strConfigCookieMgr] = createCookieMgr(config, logger);
            _globalCookieConfig[strConfigCookieMgr] = inst;
        }
        return inst;
    }
    function _isMgrEnabled(cookieMgr) {
        if (cookieMgr) {
            return cookieMgr.isEnabled();
        }
        return true;
    }
    function _createCookieMgrConfig(rootConfig) {
        var cookieMgrCfg = rootConfig[_DYN_COOKIE_CFG ] = rootConfig[_DYN_COOKIE_CFG ] || {};
        setValue(cookieMgrCfg, "domain", rootConfig.cookieDomain, isNotNullOrUndefined, isNullOrUndefined);
        setValue(cookieMgrCfg, "path", rootConfig.cookiePath || "/", null, isNullOrUndefined);
        if (isNullOrUndefined(cookieMgrCfg[strEnabled])) {
            var cookieEnabled = void 0;
            if (!isUndefined(rootConfig[strIsCookieUseDisabled])) {
                cookieEnabled = !rootConfig[strIsCookieUseDisabled];
            }
            if (!isUndefined(rootConfig[strDisableCookiesUsage])) {
                cookieEnabled = !rootConfig[strDisableCookiesUsage];
            }
            cookieMgrCfg[strEnabled] = cookieEnabled;
        }
        return cookieMgrCfg;
    }
    function _isIgnoredCookie(cookieMgrCfg, name) {
        if (name && cookieMgrCfg && isArray(cookieMgrCfg.ignoreCookies)) {
            return cookieMgrCfg.ignoreCookies[_DYN_INDEX_OF$2 ](name) !== -1;
        }
        return false;
    }
    function _isBlockedCookie(cookieMgrCfg, name) {
        if (name && cookieMgrCfg && isArray(cookieMgrCfg.blockedCookies)) {
            if (cookieMgrCfg.blockedCookies[_DYN_INDEX_OF$2 ](name) !== -1) {
                return true;
            }
        }
        return _isIgnoredCookie(cookieMgrCfg, name);
    }
    function safeGetCookieMgr(core, config) {
        var cookieMgr;
        if (core) {
            cookieMgr = core.getCookieMgr();
        }
        else if (config) {
            var cookieCfg = config[_DYN_COOKIE_CFG ];
            if (cookieCfg[strConfigCookieMgr]) {
                cookieMgr = cookieCfg[strConfigCookieMgr];
            }
            else {
                cookieMgr = createCookieMgr(config);
            }
        }
        if (!cookieMgr) {
            cookieMgr = _gblCookieMgr(config, (core || {})[_DYN_LOGGER ]);
        }
        return cookieMgr;
    }
    function createCookieMgr(rootConfig, logger) {
        var _a;
        var cookieMgrConfig = _createCookieMgrConfig(rootConfig || _globalCookieConfig);
        var _path = cookieMgrConfig.path || "/";
        var _domain = cookieMgrConfig.domain;
        var _enabled = cookieMgrConfig[strEnabled] !== false;
        var cookieMgr = (_a = {
                isEnabled: function () {
                    var enabled = _enabled && areCookiesSupported(logger);
                    var gblManager = _globalCookieConfig[strConfigCookieMgr];
                    if (enabled && gblManager && cookieMgr !== gblManager) {
                        enabled = _isMgrEnabled(gblManager);
                    }
                    return enabled;
                }
            },
            _a[_DYN_SET_ENABLED ] = function (value) {
                _enabled = value !== false;
            },
            _a.set = function (name, value, maxAgeSec, domain, path) {
                var result = false;
                if (_isMgrEnabled(cookieMgr) && !_isBlockedCookie(cookieMgrConfig, name)) {
                    var values = {};
                    var theValue = strTrim(value || STR_EMPTY);
                    var idx = theValue[_DYN_INDEX_OF$2 ](";");
                    if (idx !== -1) {
                        theValue = strTrim(value[_DYN_SUBSTRING$1 ](0, idx));
                        values = _extractParts(value[_DYN_SUBSTRING$1 ](idx + 1));
                    }
                    setValue(values, "domain", domain || _domain, isTruthy, isUndefined);
                    if (!isNullOrUndefined(maxAgeSec)) {
                        var _isIE = isIE();
                        if (isUndefined(values[strExpires])) {
                            var nowMs = dateNow();
                            var expireMs = nowMs + (maxAgeSec * 1000);
                            if (expireMs > 0) {
                                var expiry = new Date();
                                expiry.setTime(expireMs);
                                setValue(values, strExpires, _formatDate(expiry, !_isIE ? strToUTCString : strToGMTString) || _formatDate(expiry, _isIE ? strToGMTString : strToUTCString) || STR_EMPTY, isTruthy);
                            }
                        }
                        if (!_isIE) {
                            setValue(values, "max-age", STR_EMPTY + maxAgeSec, null, isUndefined);
                        }
                    }
                    var location_1 = getLocation();
                    if (location_1 && location_1.protocol === "https:") {
                        setValue(values, "secure", null, null, isUndefined);
                        if (_allowUaSameSite === null) {
                            _allowUaSameSite = !uaDisallowsSameSiteNone((getNavigator() || {})[_DYN_USER_AGENT ]);
                        }
                        if (_allowUaSameSite) {
                            setValue(values, "SameSite", "None", null, isUndefined);
                        }
                    }
                    setValue(values, "path", path || _path, null, isUndefined);
                    var setCookieFn = cookieMgrConfig.setCookie || _setCookieValue;
                    setCookieFn(name, _formatCookieValue(theValue, values));
                    result = true;
                }
                return result;
            },
            _a.get = function (name) {
                var value = STR_EMPTY;
                if (_isMgrEnabled(cookieMgr) && !_isIgnoredCookie(cookieMgrConfig, name)) {
                    value = (cookieMgrConfig.getCookie || _getCookieValue)(name);
                }
                return value;
            },
            _a.del = function (name, path) {
                var result = false;
                if (_isMgrEnabled(cookieMgr)) {
                    result = cookieMgr.purge(name, path);
                }
                return result;
            },
            _a.purge = function (name, path) {
                var _a;
                var result = false;
                if (areCookiesSupported(logger)) {
                    var values = (_a = {},
                        _a["path"] = path ? path : "/",
                        _a[strExpires] = "Thu, 01 Jan 1970 00:00:01 GMT",
                        _a);
                    if (!isIE()) {
                        values["max-age"] = "0";
                    }
                    var delCookie = cookieMgrConfig.delCookie || _setCookieValue;
                    delCookie(name, _formatCookieValue(STR_EMPTY, values));
                    result = true;
                }
                return result;
            },
            _a);
        cookieMgr[strConfigCookieMgr] = cookieMgr;
        return cookieMgr;
    }
    function areCookiesSupported(logger) {
        if (_supportsCookies === null) {
            _supportsCookies = false;
            try {
                var doc = _doc || {};
                _supportsCookies = doc[strCookie] !== undefined;
            }
            catch (e) {
                _throwInternal(logger, 2 , 68 , "Cannot access document.cookie - " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return _supportsCookies;
    }
    function _extractParts(theValue) {
        var values = {};
        if (theValue && theValue[_DYN_LENGTH$5 ]) {
            var parts = strTrim(theValue)[_DYN_SPLIT$1 ](";");
            arrForEach(parts, function (thePart) {
                thePart = strTrim(thePart || STR_EMPTY);
                if (thePart) {
                    var idx = thePart[_DYN_INDEX_OF$2 ]("=");
                    if (idx === -1) {
                        values[thePart] = null;
                    }
                    else {
                        values[strTrim(thePart[_DYN_SUBSTRING$1 ](0, idx))] = strTrim(thePart[_DYN_SUBSTRING$1 ](idx + 1));
                    }
                }
            });
        }
        return values;
    }
    function _formatDate(theDate, func) {
        if (isFunction(theDate[func])) {
            return theDate[func]();
        }
        return null;
    }
    function _formatCookieValue(value, values) {
        var cookieValue = value || STR_EMPTY;
        objForEachKey(values, function (name, theValue) {
            cookieValue += "; " + name + (!isNullOrUndefined(theValue) ? "=" + theValue : STR_EMPTY);
        });
        return cookieValue;
    }
    function _getCookieValue(name) {
        var cookieValue = STR_EMPTY;
        if (_doc) {
            var theCookie = _doc[strCookie] || STR_EMPTY;
            if (_parsedCookieValue !== theCookie) {
                _cookieCache = _extractParts(theCookie);
                _parsedCookieValue = theCookie;
            }
            cookieValue = strTrim(_cookieCache[name] || STR_EMPTY);
        }
        return cookieValue;
    }
    function _setCookieValue(name, cookieValue) {
        if (_doc) {
            _doc[strCookie] = name + "=" + cookieValue;
        }
    }
    function uaDisallowsSameSiteNone(userAgent) {
        if (!isString(userAgent)) {
            return false;
        }
        if (strContains(userAgent, "CPU iPhone OS 12") || strContains(userAgent, "iPad; CPU OS 12")) {
            return true;
        }
        if (strContains(userAgent, "Macintosh; Intel Mac OS X 10_14") && strContains(userAgent, "Version/") && strContains(userAgent, "Safari")) {
            return true;
        }
        if (strContains(userAgent, "Macintosh; Intel Mac OS X 10_14") && strEndsWith(userAgent, "AppleWebKit/605.1.15 (KHTML, like Gecko)")) {
            return true;
        }
        if (strContains(userAgent, "Chrome/5") || strContains(userAgent, "Chrome/6")) {
            return true;
        }
        if (strContains(userAgent, "UnrealEngine") && !strContains(userAgent, "Chrome")) {
            return true;
        }
        if (strContains(userAgent, "UCBrowser/12") || strContains(userAgent, "UCBrowser/11")) {
            return true;
        }
        return false;
    }

    var strOnPrefix = "on";
    var strAttachEvent = "attachEvent";
    var strAddEventHelper = "addEventListener";
    var strDetachEvent = "detachEvent";
    var strRemoveEventListener = "removeEventListener";
    var strEvents = "events";
    var strVisibilityChangeEvt = "visibilitychange";
    var strPageHide = "pagehide";
    var strUnload = "unload";
    var strBeforeUnload = "beforeunload";
    var strPageHideNamespace = createUniqueNamespace("aiEvtPageHide");
    createUniqueNamespace("aiEvtPageShow");
    var rRemoveEmptyNs = /\.[\.]+/g;
    var rRemoveTrailingEmptyNs = /[\.]+$/;
    var _guid = 1;
    var elmNodeData = createElmNodeData("events");
    var eventNamespace = /^([^.]*)(?:\.(.+)|)/;
    function _normalizeNamespace(name) {
        if (name && name[_DYN_REPLACE ]) {
            return name[_DYN_REPLACE ](/^[\s\.]+|(?=[\s\.])[\.\s]+$/g, STR_EMPTY);
        }
        return name;
    }
    function _getEvtNamespace(eventName, evtNamespace) {
        var _a;
        if (evtNamespace) {
            var theNamespace_1 = STR_EMPTY;
            if (isArray(evtNamespace)) {
                theNamespace_1 = STR_EMPTY;
                arrForEach(evtNamespace, function (name) {
                    name = _normalizeNamespace(name);
                    if (name) {
                        if (name[0] !== ".") {
                            name = "." + name;
                        }
                        theNamespace_1 += name;
                    }
                });
            }
            else {
                theNamespace_1 = _normalizeNamespace(evtNamespace);
            }
            if (theNamespace_1) {
                if (theNamespace_1[0] !== ".") {
                    theNamespace_1 = "." + theNamespace_1;
                }
                eventName = (eventName || STR_EMPTY) + theNamespace_1;
            }
        }
        var parsedEvent = (eventNamespace.exec(eventName || STR_EMPTY) || []);
        return _a = {},
            _a[_DYN_TYPE ] = parsedEvent[1],
            _a.ns = ((parsedEvent[2] || STR_EMPTY).replace(rRemoveEmptyNs, ".").replace(rRemoveTrailingEmptyNs, STR_EMPTY)[_DYN_SPLIT$1 ](".").sort()).join("."),
            _a;
    }
    function _getRegisteredEvents(target, evtName, addDefault) {
        if (addDefault === void 0) { addDefault = true; }
        var aiEvts = elmNodeData.get(target, strEvents, {}, addDefault);
        var registeredEvents = aiEvts[evtName];
        if (!registeredEvents) {
            registeredEvents = aiEvts[evtName] = [];
        }
        return registeredEvents;
    }
    function _doDetach(obj, evtName, handlerRef, useCapture) {
        if (obj && evtName && evtName[_DYN_TYPE ]) {
            if (obj[strRemoveEventListener]) {
                obj[strRemoveEventListener](evtName[_DYN_TYPE ], handlerRef, useCapture);
            }
            else if (obj[strDetachEvent]) {
                obj[strDetachEvent](strOnPrefix + evtName[_DYN_TYPE ], handlerRef);
            }
        }
    }
    function _doAttach(obj, evtName, handlerRef, useCapture) {
        var result = false;
        if (obj && evtName && evtName[_DYN_TYPE ] && handlerRef) {
            if (obj[strAddEventHelper]) {
                obj[strAddEventHelper](evtName[_DYN_TYPE ], handlerRef, useCapture);
                result = true;
            }
            else if (obj[strAttachEvent]) {
                obj[strAttachEvent](strOnPrefix + evtName[_DYN_TYPE ], handlerRef);
                result = true;
            }
        }
        return result;
    }
    function _doUnregister(target, events, evtName, unRegFn) {
        var idx = events[_DYN_LENGTH$5 ];
        while (idx--) {
            var theEvent = events[idx];
            if (theEvent) {
                if (!evtName.ns || evtName.ns === theEvent.evtName.ns) {
                    if (!unRegFn || unRegFn(theEvent)) {
                        _doDetach(target, theEvent.evtName, theEvent[_DYN_HANDLER ], theEvent.capture);
                        events[_DYN_SPLICE ](idx, 1);
                    }
                }
            }
        }
    }
    function _unregisterEvents(target, evtName, unRegFn) {
        if (evtName[_DYN_TYPE ]) {
            _doUnregister(target, _getRegisteredEvents(target, evtName[_DYN_TYPE ]), evtName, unRegFn);
        }
        else {
            var eventCache = elmNodeData.get(target, strEvents, {});
            objForEachKey(eventCache, function (evtType, events) {
                _doUnregister(target, events, evtName, unRegFn);
            });
            if (objKeys(eventCache)[_DYN_LENGTH$5 ] === 0) {
                elmNodeData.kill(target, strEvents);
            }
        }
    }
    function mergeEvtNamespace(theNamespace, namespaces) {
        var newNamespaces;
        if (namespaces) {
            if (isArray(namespaces)) {
                newNamespaces = [theNamespace].concat(namespaces);
            }
            else {
                newNamespaces = [theNamespace, namespaces];
            }
            newNamespaces = (_getEvtNamespace("xx", newNamespaces).ns)[_DYN_SPLIT$1 ](".");
        }
        else {
            newNamespaces = theNamespace;
        }
        return newNamespaces;
    }
    function eventOn(target, eventName, handlerRef, evtNamespace, useCapture) {
        var _a;
        if (useCapture === void 0) { useCapture = false; }
        var result = false;
        if (target) {
            try {
                var evtName = _getEvtNamespace(eventName, evtNamespace);
                result = _doAttach(target, evtName, handlerRef, useCapture);
                if (result && elmNodeData.accept(target)) {
                    var registeredEvent = (_a = {
                            guid: _guid++,
                            evtName: evtName
                        },
                        _a[_DYN_HANDLER ] = handlerRef,
                        _a.capture = useCapture,
                        _a);
                    _getRegisteredEvents(target, evtName.type)[_DYN_PUSH$2 ](registeredEvent);
                }
            }
            catch (e) {
            }
        }
        return result;
    }
    function eventOff(target, eventName, handlerRef, evtNamespace, useCapture) {
        if (useCapture === void 0) { useCapture = false; }
        if (target) {
            try {
                var evtName_1 = _getEvtNamespace(eventName, evtNamespace);
                var found_1 = false;
                _unregisterEvents(target, evtName_1, function (regEvent) {
                    if ((evtName_1.ns && !handlerRef) || regEvent[_DYN_HANDLER ] === handlerRef) {
                        found_1 = true;
                        return true;
                    }
                    return false;
                });
                if (!found_1) {
                    _doDetach(target, evtName_1, handlerRef, useCapture);
                }
            }
            catch (e) {
            }
        }
    }
    function attachEvent(obj, eventNameWithoutOn, handlerRef, useCapture) {
        if (useCapture === void 0) { useCapture = false; }
        return eventOn(obj, eventNameWithoutOn, handlerRef, null, useCapture);
    }
    function addEventHandler(eventName, callback, evtNamespace) {
        var result = false;
        var w = getWindow();
        if (w) {
            result = eventOn(w, eventName, callback, evtNamespace);
            result = eventOn(w["body"], eventName, callback, evtNamespace) || result;
        }
        var doc = getDocument();
        if (doc) {
            result = eventOn(doc, eventName, callback, evtNamespace) || result;
        }
        return result;
    }
    function removeEventHandler(eventName, callback, evtNamespace) {
        var w = getWindow();
        if (w) {
            eventOff(w, eventName, callback, evtNamespace);
            eventOff(w["body"], eventName, callback, evtNamespace);
        }
        var doc = getDocument();
        if (doc) {
            eventOff(doc, eventName, callback, evtNamespace);
        }
    }
    function _addEventListeners(events, listener, excludeEvents, evtNamespace) {
        var added = false;
        if (listener && events && events[_DYN_LENGTH$5 ] > 0) {
            arrForEach(events, function (name) {
                if (name) {
                    if (!excludeEvents || arrIndexOf(excludeEvents, name) === -1) {
                        added = addEventHandler(name, listener, evtNamespace) || added;
                    }
                }
            });
        }
        return added;
    }
    function addEventListeners(events, listener, excludeEvents, evtNamespace) {
        var added = false;
        if (listener && events && isArray(events)) {
            added = _addEventListeners(events, listener, excludeEvents, evtNamespace);
            if (!added && excludeEvents && excludeEvents[_DYN_LENGTH$5 ] > 0) {
                added = _addEventListeners(events, listener, null, evtNamespace);
            }
        }
        return added;
    }
    function removeEventListeners(events, listener, evtNamespace) {
        if (events && isArray(events)) {
            arrForEach(events, function (name) {
                if (name) {
                    removeEventHandler(name, listener, evtNamespace);
                }
            });
        }
    }
    function addPageUnloadEventListener(listener, excludeEvents, evtNamespace) {
        return addEventListeners([strBeforeUnload, strUnload, strPageHide], listener, excludeEvents, evtNamespace);
    }
    function removePageUnloadEventListener(listener, evtNamespace) {
        removeEventListeners([strBeforeUnload, strUnload, strPageHide], listener, evtNamespace);
    }
    function addPageHideEventListener(listener, excludeEvents, evtNamespace) {
        function _handlePageVisibility(evt) {
            var doc = getDocument();
            if (listener && doc && doc.visibilityState === "hidden") {
                listener(evt);
            }
        }
        var newNamespaces = mergeEvtNamespace(strPageHideNamespace, evtNamespace);
        var pageUnloadAdded = _addEventListeners([strPageHide], listener, excludeEvents, newNamespaces);
        if (!excludeEvents || arrIndexOf(excludeEvents, strVisibilityChangeEvt) === -1) {
            pageUnloadAdded = _addEventListeners([strVisibilityChangeEvt], _handlePageVisibility, excludeEvents, newNamespaces) || pageUnloadAdded;
        }
        if (!pageUnloadAdded && excludeEvents) {
            pageUnloadAdded = addPageHideEventListener(listener, null, evtNamespace);
        }
        return pageUnloadAdded;
    }
    function removePageHideEventListener(listener, evtNamespace) {
        var newNamespaces = mergeEvtNamespace(strPageHideNamespace, evtNamespace);
        removeEventListeners([strPageHide], listener, newNamespaces);
        removeEventListeners([strVisibilityChangeEvt], null, newNamespaces);
    }

    var _cookieMgrs = null;
    var _canUseCookies;
    function newGuid() {
        var uuid = generateW3CId();
        return uuid[_DYN_SUBSTRING$1 ](0, 8) + "-" + uuid[_DYN_SUBSTRING$1 ](8, 12) + "-" + uuid[_DYN_SUBSTRING$1 ](12, 16) + "-" + uuid[_DYN_SUBSTRING$1 ](16, 20) + "-" + uuid[_DYN_SUBSTRING$1 ](20);
    }
    function perfNow() {
        var perf = getPerformance();
        if (perf && perf.now) {
            return perf.now();
        }
        return dateNow();
    }
    function generateW3CId() {
        var hexValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        var oct = STR_EMPTY, tmp;
        for (var a = 0; a < 4; a++) {
            tmp = random32();
            oct +=
                hexValues[tmp & 0xF] +
                    hexValues[tmp >> 4 & 0xF] +
                    hexValues[tmp >> 8 & 0xF] +
                    hexValues[tmp >> 12 & 0xF] +
                    hexValues[tmp >> 16 & 0xF] +
                    hexValues[tmp >> 20 & 0xF] +
                    hexValues[tmp >> 24 & 0xF] +
                    hexValues[tmp >> 28 & 0xF];
        }
        var clockSequenceHi = hexValues[8 + (random32() & 0x03) | 0];
        return oct[_DYN_SUBSTR ](0, 8) + oct[_DYN_SUBSTR ](9, 4) + "4" + oct[_DYN_SUBSTR ](13, 3) + clockSequenceHi + oct[_DYN_SUBSTR ](16, 3) + oct[_DYN_SUBSTR ](19, 12);
    }
    var CoreUtils = {
        _canUseCookies: undefined,
        isTypeof: isTypeof,
        isUndefined: isUndefined,
        isNullOrUndefined: isNullOrUndefined,
        hasOwnProperty: hasOwnProperty,
        isFunction: isFunction,
        isObject: isObject,
        isDate: isDate,
        isArray: isArray,
        isError: isError,
        isString: isString,
        isNumber: isNumber,
        isBoolean: isBoolean,
        toISOString: toISOString,
        arrForEach: arrForEach,
        arrIndexOf: arrIndexOf,
        arrMap: arrMap,
        arrReduce: arrReduce,
        strTrim: strTrim,
        objCreate: objCreateFn,
        objKeys: objKeys,
        objDefineAccessors: objDefineAccessors,
        addEventHandler: addEventHandler,
        dateNow: dateNow,
        isIE: isIE,
        disableCookies: disableCookies,
        newGuid: newGuid,
        perfNow: perfNow,
        newId: newId,
        randomValue: randomValue,
        random32: random32,
        mwcRandomSeed: mwcRandomSeed,
        mwcRandom32: mwcRandom32,
        generateW3CId: generateW3CId
    };
    function _legacyCookieMgr(config, logger) {
        var cookieMgr = _gblCookieMgr(config, logger);
        var legacyCanUseCookies = CoreUtils._canUseCookies;
        if (_cookieMgrs === null) {
            _cookieMgrs = [];
            _canUseCookies = legacyCanUseCookies;
            objDefineAccessors(CoreUtils, "_canUseCookies", function () {
                return _canUseCookies;
            }, function (value) {
                _canUseCookies = value;
                arrForEach(_cookieMgrs, function (mgr) {
                    mgr[_DYN_SET_ENABLED ](value);
                });
            });
        }
        if (arrIndexOf(_cookieMgrs, cookieMgr) === -1) {
            _cookieMgrs[_DYN_PUSH$2 ](cookieMgr);
        }
        if (isBoolean(legacyCanUseCookies)) {
            cookieMgr[_DYN_SET_ENABLED ](legacyCanUseCookies);
        }
        if (isBoolean(_canUseCookies)) {
            cookieMgr[_DYN_SET_ENABLED ](_canUseCookies);
        }
        return cookieMgr;
    }
    function disableCookies() {
        _legacyCookieMgr()[_DYN_SET_ENABLED ](false);
    }
    function canUseCookies(logger) {
        return _legacyCookieMgr(null, logger).isEnabled();
    }
    function getCookie(logger, name) {
        return _legacyCookieMgr(null, logger).get(name);
    }
    function setCookie(logger, name, value, domain) {
        _legacyCookieMgr(null, logger).set(name, value, null, domain);
    }
    function deleteCookie(logger, name) {
        return _legacyCookieMgr(null, logger).del(name);
    }

    var TRACE_PARENT_REGEX = /^([\da-f]{2})-([\da-f]{32})-([\da-f]{16})-([\da-f]{2})(-[^\s]*)?$/;
    var DEFAULT_VERSION = "00";
    var INVALID_VERSION = "ff";
    var INVALID_TRACE_ID = "00000000000000000000000000000000";
    var INVALID_SPAN_ID = "0000000000000000";
    function _isValid(value, len, invalidValue) {
        if (value && value[_DYN_LENGTH$5 ] === len && value !== invalidValue) {
            return !!value.match(/^[\da-f]*$/);
        }
        return false;
    }
    function _formatValue(value, len, defValue) {
        if (_isValid(value, len)) {
            return value;
        }
        return defValue;
    }
    function _formatFlags(value) {
        if (isNaN(value) || value < 0 || value > 255) {
            value = 0x01;
        }
        var result = value.toString(16);
        while (result[_DYN_LENGTH$5 ] < 2) {
            result = "0" + result;
        }
        return result;
    }
    function createTraceParent(traceId, spanId, flags, version) {
        var _a;
        return _a = {},
            _a[_DYN_VERSION$1 ] = _isValid(version, 2, INVALID_VERSION) ? version : DEFAULT_VERSION,
            _a[_DYN_TRACE_ID$2 ] = isValidTraceId(traceId) ? traceId : generateW3CId(),
            _a.spanId = isValidSpanId(spanId) ? spanId : generateW3CId()[_DYN_SUBSTR ](0, 16),
            _a.traceFlags = flags >= 0 && flags <= 0xFF ? flags : 1,
            _a;
    }
    function parseTraceParent(value) {
        var _a;
        if (!value) {
            return null;
        }
        if (isArray(value)) {
            value = value[0] || "";
        }
        if (!value || !isString(value) || value[_DYN_LENGTH$5 ] > 8192) {
            return null;
        }
        var match = TRACE_PARENT_REGEX.exec(strTrim(value));
        if (!match ||
            match[1] === INVALID_VERSION ||
            match[2] === INVALID_TRACE_ID ||
            match[3] === INVALID_SPAN_ID) {
            return null;
        }
        return _a = {},
            _a[_DYN_VERSION$1 ] = match[1],
            _a[_DYN_TRACE_ID$2 ] = match[2],
            _a[_DYN_SPAN_ID$1 ] = match[3],
            _a[_DYN_TRACE_FLAGS$1 ] = parseInt(match[4], 16),
            _a;
    }
    function isValidTraceId(value) {
        return _isValid(value, 32, INVALID_TRACE_ID);
    }
    function isValidSpanId(value) {
        return _isValid(value, 16, INVALID_SPAN_ID);
    }
    function formatTraceParent(value) {
        if (value) {
            var flags = _formatFlags(value[_DYN_TRACE_FLAGS$1 ]);
            if (!_isValid(flags, 2)) {
                flags = "01";
            }
            var version = value[_DYN_VERSION$1 ] || DEFAULT_VERSION;
            if (version !== "00" && version !== "ff") {
                version = DEFAULT_VERSION;
            }
            return "".concat(version, "-").concat(_formatValue(value.traceId, 32, INVALID_TRACE_ID), "-").concat(_formatValue(value.spanId, 16, INVALID_SPAN_ID), "-").concat(flags);
        }
        return "";
    }
    function findW3cTraceParent() {
        var name = "traceparent";
        var traceParent = parseTraceParent(findMetaTag(name));
        if (!traceParent) {
            traceParent = parseTraceParent(findNamedServerTiming(name));
        }
        return traceParent;
    }

    var pluginStateData = createElmNodeData("plugin");
    function _getPluginState(plugin) {
        return pluginStateData.get(plugin, "state", {}, true);
    }
    function initializePlugins(processContext, extensions) {
        var initPlugins = [];
        var lastPlugin = null;
        var proxy = processContext[_DYN_GET_NEXT ]();
        var pluginState;
        while (proxy) {
            var thePlugin = proxy[_DYN_GET_PLUGIN ]();
            if (thePlugin) {
                if (lastPlugin &&
                    isFunction(lastPlugin[_DYN_SET_NEXT_PLUGIN ]) &&
                    isFunction(thePlugin[STR_PROCESS_TELEMETRY ])) {
                    lastPlugin[_DYN_SET_NEXT_PLUGIN ](thePlugin);
                }
                var isInitialized = false;
                if (isFunction(thePlugin[_DYN_IS_INITIALIZED ])) {
                    isInitialized = thePlugin[_DYN_IS_INITIALIZED ]();
                }
                else {
                    pluginState = _getPluginState(thePlugin);
                    isInitialized = pluginState[_DYN_IS_INITIALIZED ];
                }
                if (!isInitialized) {
                    initPlugins[_DYN_PUSH$2 ](thePlugin);
                }
                lastPlugin = thePlugin;
                proxy = proxy[_DYN_GET_NEXT ]();
            }
        }
        arrForEach(initPlugins, function (thePlugin) {
            var core = processContext[STR_CORE]();
            thePlugin[_DYN_INITIALIZE ](processContext.getCfg(), core, extensions, processContext[_DYN_GET_NEXT ]());
            pluginState = _getPluginState(thePlugin);
            if (!thePlugin[STR_CORE] && !pluginState[STR_CORE]) {
                pluginState[STR_CORE] = core;
            }
            pluginState[_DYN_IS_INITIALIZED ] = true;
            delete pluginState[_DYN_TEARDOWN ];
        });
    }
    function sortPlugins(plugins) {
        return plugins.sort(function (extA, extB) {
            var result = 0;
            if (extB) {
                var bHasProcess = isFunction(extB[STR_PROCESS_TELEMETRY]);
                if (isFunction(extA[STR_PROCESS_TELEMETRY])) {
                    result = bHasProcess ? extA[STR_PRIORITY] - extB[STR_PRIORITY] : 1;
                }
                else if (bHasProcess) {
                    result = -1;
                }
            }
            else {
                result = extA ? 1 : -1;
            }
            return result;
        });
    }
    function createDistributedTraceContext(parentCtx) {
        var trace = {};
        return {
            getName: function () {
                return trace[_DYN_NAME$3 ];
            },
            setName: function (newValue) {
                parentCtx && parentCtx.setName(newValue);
                trace[_DYN_NAME$3 ] = newValue;
            },
            getTraceId: function () {
                return trace[_DYN_TRACE_ID$2 ];
            },
            setTraceId: function (newValue) {
                parentCtx && parentCtx.setTraceId(newValue);
                if (isValidTraceId(newValue)) {
                    trace[_DYN_TRACE_ID$2 ] = newValue;
                }
            },
            getSpanId: function () {
                return trace[_DYN_SPAN_ID$1 ];
            },
            setSpanId: function (newValue) {
                parentCtx && parentCtx.setSpanId(newValue);
                if (isValidSpanId(newValue)) {
                    trace[_DYN_SPAN_ID$1 ] = newValue;
                }
            },
            getTraceFlags: function () {
                return trace[_DYN_TRACE_FLAGS$1 ];
            },
            setTraceFlags: function (newTraceFlags) {
                parentCtx && parentCtx.setTraceFlags(newTraceFlags);
                trace[_DYN_TRACE_FLAGS$1 ] = newTraceFlags;
            }
        };
    }

    var strTelemetryPluginChain = "TelemetryPluginChain";
    var strHasRunFlags = "_hasRun";
    var strGetTelCtx = "_getTelCtx";
    var _chainId = 0;
    function _getNextProxyStart(proxy, core, startAt) {
        while (proxy) {
            if (proxy[_DYN_GET_PLUGIN ]() === startAt) {
                return proxy;
            }
            proxy = proxy[_DYN_GET_NEXT ]();
        }
        return createTelemetryProxyChain([startAt], core[_DYN_CONFIG$2 ] || {}, core);
    }
    function _createInternalContext(telemetryChain, config, core, startAt) {
        var _nextProxy = null;
        var _onComplete = [];
        if (startAt !== null) {
            _nextProxy = startAt ? _getNextProxyStart(telemetryChain, core, startAt) : telemetryChain;
        }
        var context = {
            _next: _moveNext,
            ctx: {
                core: function () {
                    return core;
                },
                diagLog: function () {
                    return safeGetLogger(core, config);
                },
                getCfg: function () {
                    return config;
                },
                getExtCfg: _getExtCfg,
                getConfig: _getConfig,
                hasNext: function () {
                    return !!_nextProxy;
                },
                getNext: function () {
                    return _nextProxy;
                },
                setNext: function (nextPlugin) {
                    _nextProxy = nextPlugin;
                },
                iterate: _iterateChain,
                onComplete: _addOnComplete
            }
        };
        function _addOnComplete(onComplete, that) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (onComplete) {
                _onComplete[_DYN_PUSH$2 ]({
                    func: onComplete,
                    self: !isUndefined(that) ? that : context.ctx,
                    args: args
                });
            }
        }
        function _moveNext() {
            var nextProxy = _nextProxy;
            _nextProxy = nextProxy ? nextProxy[_DYN_GET_NEXT ]() : null;
            if (!nextProxy) {
                var onComplete = _onComplete;
                if (onComplete && onComplete[_DYN_LENGTH$5 ] > 0) {
                    arrForEach(onComplete, function (completeDetails) {
                        try {
                            completeDetails.func[_DYN_CALL ](completeDetails.self, completeDetails.args);
                        }
                        catch (e) {
                            _throwInternal(core[_DYN_LOGGER ], 2 , 73 , "Unexpected Exception during onComplete - " + dumpObj(e));
                        }
                    });
                    _onComplete = [];
                }
            }
            return nextProxy;
        }
        function _getExtCfg(identifier, defaultValue, mergeDefault) {
            if (defaultValue === void 0) { defaultValue = {}; }
            if (mergeDefault === void 0) { mergeDefault = 0 ; }
            var theConfig;
            if (config) {
                var extConfig = config[STR_EXTENSION_CONFIG ];
                if (extConfig && identifier) {
                    theConfig = extConfig[identifier];
                }
            }
            if (!theConfig) {
                theConfig = defaultValue;
            }
            else if (isObject(defaultValue)) {
                if (mergeDefault !== 0 ) {
                    var newConfig_1 = objExtend(true, defaultValue, theConfig);
                    if (config && mergeDefault === 2 ) {
                        objForEachKey(defaultValue, function (field) {
                            if (isNullOrUndefined(newConfig_1[field])) {
                                var cfgValue = config[field];
                                if (!isNullOrUndefined(cfgValue)) {
                                    newConfig_1[field] = cfgValue;
                                }
                            }
                        });
                    }
                    theConfig = newConfig_1;
                }
            }
            return theConfig;
        }
        function _getConfig(identifier, field, defaultValue) {
            if (defaultValue === void 0) { defaultValue = false; }
            var theValue;
            var extConfig = _getExtCfg(identifier, null);
            if (extConfig && !isNullOrUndefined(extConfig[field])) {
                theValue = extConfig[field];
            }
            else if (config && !isNullOrUndefined(config[field])) {
                theValue = config[field];
            }
            return !isNullOrUndefined(theValue) ? theValue : defaultValue;
        }
        function _iterateChain(cb) {
            var nextPlugin;
            while (!!(nextPlugin = context._next())) {
                var plugin = nextPlugin[_DYN_GET_PLUGIN ]();
                if (plugin) {
                    cb(plugin);
                }
            }
        }
        return context;
    }
    function createProcessTelemetryContext(telemetryChain, config, core, startAt) {
        var internalContext = _createInternalContext(telemetryChain, config, core, startAt);
        var context = internalContext.ctx;
        function _processNext(env) {
            var nextPlugin = internalContext._next();
            nextPlugin && nextPlugin[STR_PROCESS_TELEMETRY ](env, context);
            return !nextPlugin;
        }
        function _createNew(plugins, startAt) {
            if (plugins === void 0) { plugins = null; }
            if (isArray(plugins)) {
                plugins = createTelemetryProxyChain(plugins, config, core, startAt);
            }
            return createProcessTelemetryContext(plugins || context[_DYN_GET_NEXT ](), config, core, startAt);
        }
        context[_DYN_PROCESS_NEXT ] = _processNext;
        context[_DYN_CREATE_NEW ] = _createNew;
        return context;
    }
    function createProcessTelemetryUnloadContext(telemetryChain, core, startAt) {
        var config = core[_DYN_CONFIG$2 ] || {};
        var internalContext = _createInternalContext(telemetryChain, config, core, startAt);
        var context = internalContext.ctx;
        function _processNext(unloadState) {
            var nextPlugin = internalContext._next();
            nextPlugin && nextPlugin.unload(context, unloadState);
            return !nextPlugin;
        }
        function _createNew(plugins, startAt) {
            if (plugins === void 0) { plugins = null; }
            if (isArray(plugins)) {
                plugins = createTelemetryProxyChain(plugins, config, core, startAt);
            }
            return createProcessTelemetryUnloadContext(plugins || context[_DYN_GET_NEXT ](), core, startAt);
        }
        context[_DYN_PROCESS_NEXT ] = _processNext;
        context[_DYN_CREATE_NEW ] = _createNew;
        return context;
    }
    function createProcessTelemetryUpdateContext(telemetryChain, core, startAt) {
        var config = core[_DYN_CONFIG$2 ] || {};
        var internalContext = _createInternalContext(telemetryChain, config, core, startAt);
        var context = internalContext.ctx;
        function _processNext(updateState) {
            return context.iterate(function (plugin) {
                if (isFunction(plugin[_DYN_UPDATE$1 ])) {
                    plugin[_DYN_UPDATE$1 ](context, updateState);
                }
            });
        }
        function _createNew(plugins, startAt) {
            if (plugins === void 0) { plugins = null; }
            if (isArray(plugins)) {
                plugins = createTelemetryProxyChain(plugins, config, core, startAt);
            }
            return createProcessTelemetryUpdateContext(plugins || context[_DYN_GET_NEXT ](), core, startAt);
        }
        context[_DYN_PROCESS_NEXT ] = _processNext;
        context[_DYN_CREATE_NEW ] = _createNew;
        return context;
    }
    function createTelemetryProxyChain(plugins, config, core, startAt) {
        var firstProxy = null;
        var add = startAt ? false : true;
        if (isArray(plugins) && plugins[_DYN_LENGTH$5 ] > 0) {
            var lastProxy_1 = null;
            arrForEach(plugins, function (thePlugin) {
                if (!add && startAt === thePlugin) {
                    add = true;
                }
                if (add && thePlugin && isFunction(thePlugin[STR_PROCESS_TELEMETRY ])) {
                    var newProxy = createTelemetryPluginProxy(thePlugin, config, core);
                    if (!firstProxy) {
                        firstProxy = newProxy;
                    }
                    if (lastProxy_1) {
                        lastProxy_1._setNext(newProxy);
                    }
                    lastProxy_1 = newProxy;
                }
            });
        }
        if (startAt && !firstProxy) {
            return createTelemetryProxyChain([startAt], config, core);
        }
        return firstProxy;
    }
    function createTelemetryPluginProxy(plugin, config, core) {
        var nextProxy = null;
        var hasProcessTelemetry = isFunction(plugin[STR_PROCESS_TELEMETRY ]);
        var hasSetNext = isFunction(plugin[_DYN_SET_NEXT_PLUGIN ]);
        var chainId;
        if (plugin) {
            chainId = plugin[_DYN_IDENTIFIER ] + "-" + plugin[STR_PRIORITY ] + "-" + _chainId++;
        }
        else {
            chainId = "Unknown-0-" + _chainId++;
        }
        var proxyChain = {
            getPlugin: function () {
                return plugin;
            },
            getNext: function () {
                return nextProxy;
            },
            processTelemetry: _processTelemetry,
            unload: _unloadPlugin,
            update: _updatePlugin,
            _id: chainId,
            _setNext: function (nextPlugin) {
                nextProxy = nextPlugin;
            }
        };
        function _getTelCtx() {
            var itemCtx;
            if (plugin && isFunction(plugin[strGetTelCtx])) {
                itemCtx = plugin[strGetTelCtx]();
            }
            if (!itemCtx) {
                itemCtx = createProcessTelemetryContext(proxyChain, config, core);
            }
            return itemCtx;
        }
        function _processChain(itemCtx, processPluginFn, name, details, isAsync) {
            var hasRun = false;
            var identifier = plugin ? plugin[_DYN_IDENTIFIER ] : strTelemetryPluginChain;
            var hasRunContext = itemCtx[strHasRunFlags];
            if (!hasRunContext) {
                hasRunContext = itemCtx[strHasRunFlags] = {};
            }
            itemCtx.setNext(nextProxy);
            if (plugin) {
                doPerf(itemCtx[STR_CORE ](), function () { return identifier + ":" + name; }, function () {
                    hasRunContext[chainId] = true;
                    try {
                        var nextId = nextProxy ? nextProxy._id : STR_EMPTY;
                        if (nextId) {
                            hasRunContext[nextId] = false;
                        }
                        hasRun = processPluginFn(itemCtx);
                    }
                    catch (error) {
                        var hasNextRun = nextProxy ? hasRunContext[nextProxy._id] : true;
                        if (hasNextRun) {
                            hasRun = true;
                        }
                        if (!nextProxy || !hasNextRun) {
                            _throwInternal(itemCtx[_DYN_DIAG_LOG$2 ](), 1 , 73 , "Plugin [" + identifier + "] failed during " + name + " - " + dumpObj(error) + ", run flags: " + dumpObj(hasRunContext));
                        }
                    }
                }, details, isAsync);
            }
            return hasRun;
        }
        function _processTelemetry(env, itemCtx) {
            itemCtx = itemCtx || _getTelCtx();
            function _callProcessTelemetry(itemCtx) {
                if (!plugin || !hasProcessTelemetry) {
                    return false;
                }
                var pluginState = _getPluginState(plugin);
                if (pluginState[_DYN_TEARDOWN ] || pluginState[STR_DISABLED]) {
                    return false;
                }
                if (hasSetNext) {
                    plugin[_DYN_SET_NEXT_PLUGIN ](nextProxy);
                }
                plugin[STR_PROCESS_TELEMETRY ](env, itemCtx);
                return true;
            }
            if (!_processChain(itemCtx, _callProcessTelemetry, "processTelemetry", function () { return ({ item: env }); }, !(env.sync))) {
                itemCtx[_DYN_PROCESS_NEXT ](env);
            }
        }
        function _unloadPlugin(unloadCtx, unloadState) {
            function _callTeardown() {
                var hasRun = false;
                if (plugin) {
                    var pluginState = _getPluginState(plugin);
                    var pluginCore = plugin[STR_CORE] || pluginState[STR_CORE ];
                    if (plugin && (!pluginCore || pluginCore === unloadCtx.core()) && !pluginState[_DYN_TEARDOWN ]) {
                        pluginState[STR_CORE ] = null;
                        pluginState[_DYN_TEARDOWN ] = true;
                        pluginState[_DYN_IS_INITIALIZED ] = false;
                        if (plugin[_DYN_TEARDOWN ] && plugin[_DYN_TEARDOWN ](unloadCtx, unloadState) === true) {
                            hasRun = true;
                        }
                    }
                }
                return hasRun;
            }
            if (!_processChain(unloadCtx, _callTeardown, "unload", function () { }, unloadState[_DYN_IS_ASYNC ])) {
                unloadCtx[_DYN_PROCESS_NEXT ](unloadState);
            }
        }
        function _updatePlugin(updateCtx, updateState) {
            function _callUpdate() {
                var hasRun = false;
                if (plugin) {
                    var pluginState = _getPluginState(plugin);
                    var pluginCore = plugin[STR_CORE] || pluginState[STR_CORE ];
                    if (plugin && (!pluginCore || pluginCore === updateCtx.core()) && !pluginState[_DYN_TEARDOWN ]) {
                        if (plugin[_DYN_UPDATE$1 ] && plugin[_DYN_UPDATE$1 ](updateCtx, updateState) === true) {
                            hasRun = true;
                        }
                    }
                }
                return hasRun;
            }
            if (!_processChain(updateCtx, _callUpdate, "update", function () { }, false)) {
                updateCtx[_DYN_PROCESS_NEXT ](updateState);
            }
        }
        return objFreeze(proxyChain);
    }

    var ChannelControllerPriority = 500;
    var ChannelValidationMessage = "Channel has invalid priority - ";
    function _addChannelQueue(channelQueue, queue, core) {
        if (queue && isArray(queue) && queue[_DYN_LENGTH$5 ] > 0) {
            queue = queue.sort(function (a, b) {
                return a[STR_PRIORITY ] - b[STR_PRIORITY ];
            });
            arrForEach(queue, function (queueItem) {
                if (queueItem[STR_PRIORITY ] < ChannelControllerPriority) {
                    throwError(ChannelValidationMessage + queueItem[_DYN_IDENTIFIER ]);
                }
            });
            channelQueue[_DYN_PUSH$2 ]({
                queue: objFreeze(queue),
                chain: createTelemetryProxyChain(queue, core[_DYN_CONFIG$2 ], core)
            });
        }
    }
    function createChannelControllerPlugin(channelQueue, core) {
        function _getTelCtx() {
            return createProcessTelemetryContext(null, core[_DYN_CONFIG$2 ], core, null);
        }
        function _processChannelQueue(theChannels, itemCtx, processFn, onComplete) {
            var waiting = theChannels ? (theChannels[_DYN_LENGTH$5 ] + 1) : 1;
            function _runChainOnComplete() {
                waiting--;
                if (waiting === 0) {
                    onComplete && onComplete();
                    onComplete = null;
                }
            }
            if (waiting > 0) {
                arrForEach(theChannels, function (channels) {
                    if (channels && channels.queue[_DYN_LENGTH$5 ] > 0) {
                        var channelChain = channels.chain;
                        var chainCtx = itemCtx[_DYN_CREATE_NEW ](channelChain);
                        chainCtx[_DYN_ON_COMPLETE ](_runChainOnComplete);
                        processFn(chainCtx);
                    }
                    else {
                        waiting--;
                    }
                });
            }
            _runChainOnComplete();
        }
        function _doUpdate(updateCtx, updateState) {
            var theUpdateState = updateState || {
                reason: 0
            };
            _processChannelQueue(channelQueue, updateCtx, function (chainCtx) {
                chainCtx[_DYN_PROCESS_NEXT ](theUpdateState);
            }, function () {
                updateCtx[_DYN_PROCESS_NEXT ](theUpdateState);
            });
            return true;
        }
        function _doTeardown(unloadCtx, unloadState) {
            var theUnloadState = unloadState || {
                reason: 0 ,
                isAsync: false
            };
            _processChannelQueue(channelQueue, unloadCtx, function (chainCtx) {
                chainCtx[_DYN_PROCESS_NEXT ](theUnloadState);
            }, function () {
                unloadCtx[_DYN_PROCESS_NEXT ](theUnloadState);
                isInitialized = false;
            });
            return true;
        }
        function _getChannel(pluginIdentifier) {
            var thePlugin = null;
            if (channelQueue && channelQueue[_DYN_LENGTH$5 ] > 0) {
                arrForEach(channelQueue, function (channels) {
                    if (channels && channels.queue[_DYN_LENGTH$5 ] > 0) {
                        arrForEach(channels.queue, function (ext) {
                            if (ext[_DYN_IDENTIFIER ] === pluginIdentifier) {
                                thePlugin = ext;
                                return -1;
                            }
                        });
                        if (thePlugin) {
                            return -1;
                        }
                    }
                });
            }
            return thePlugin;
        }
        var isInitialized = false;
        var channelController = {
            identifier: "ChannelControllerPlugin",
            priority: ChannelControllerPriority,
            initialize: function (config, core, extensions, pluginChain) {
                isInitialized = true;
                arrForEach(channelQueue, function (channels) {
                    if (channels && channels.queue[_DYN_LENGTH$5 ] > 0) {
                        initializePlugins(createProcessTelemetryContext(channels.chain, config, core), extensions);
                    }
                });
            },
            isInitialized: function () {
                return isInitialized;
            },
            processTelemetry: function (item, itemCtx) {
                _processChannelQueue(channelQueue, itemCtx || _getTelCtx(), function (chainCtx) {
                    chainCtx[_DYN_PROCESS_NEXT ](item);
                }, function () {
                    itemCtx[_DYN_PROCESS_NEXT ](item);
                });
            },
            update: _doUpdate,
            pause: function () {
                _processChannelQueue(channelQueue, _getTelCtx(), function (chainCtx) {
                    chainCtx.iterate(function (plugin) {
                        plugin.pause && plugin.pause();
                    });
                }, null);
            },
            resume: function () {
                _processChannelQueue(channelQueue, _getTelCtx(), function (chainCtx) {
                    chainCtx.iterate(function (plugin) {
                        plugin.resume && plugin.resume();
                    });
                }, null);
            },
            teardown: _doTeardown,
            getChannel: _getChannel,
            flush: function (isAsync, callBack, sendReason, cbTimeout) {
                var waiting = 1;
                var doneIterating = false;
                var cbTimer = null;
                cbTimeout = cbTimeout || 5000;
                function doCallback() {
                    waiting--;
                    if (doneIterating && waiting === 0) {
                        if (cbTimer) {
                            clearTimeout(cbTimer);
                            cbTimer = null;
                        }
                        callBack && callBack(doneIterating);
                        callBack = null;
                    }
                }
                _processChannelQueue(channelQueue, _getTelCtx(), function (chainCtx) {
                    chainCtx.iterate(function (plugin) {
                        if (plugin[_DYN_FLUSH ]) {
                            waiting++;
                            var handled_1 = false;
                            if (!plugin[_DYN_FLUSH ](isAsync, function () {
                                handled_1 = true;
                                doCallback();
                            }, sendReason)) {
                                if (!handled_1) {
                                    if (isAsync && cbTimer == null) {
                                        cbTimer = setTimeout(function () {
                                            cbTimer = null;
                                            doCallback();
                                        }, cbTimeout);
                                    }
                                    else {
                                        doCallback();
                                    }
                                }
                            }
                        }
                    });
                }, function () {
                    doneIterating = true;
                    doCallback();
                });
                return true;
            },
            _setQueue: function (queue) {
                channelQueue = queue;
            }
        };
        return channelController;
    }
    function createChannelQueues(channels, extensions, core) {
        var channelQueue = [];
        if (channels) {
            arrForEach(channels, function (queue) { return _addChannelQueue(channelQueue, queue, core); });
        }
        if (extensions) {
            var extensionQueue_1 = [];
            arrForEach(extensions, function (plugin) {
                if (plugin[STR_PRIORITY ] > ChannelControllerPriority) {
                    extensionQueue_1[_DYN_PUSH$2 ](plugin);
                }
            });
            _addChannelQueue(channelQueue, extensionQueue_1, core);
        }
        return channelQueue;
    }

    function createUnloadHandlerContainer() {
        var handlers = [];
        function _addHandler(handler) {
            if (handler) {
                handlers[_DYN_PUSH$2 ](handler);
            }
        }
        function _runHandlers(unloadCtx, unloadState) {
            arrForEach(handlers, function (handler) {
                try {
                    handler(unloadCtx, unloadState);
                }
                catch (e) {
                    _throwInternal(unloadCtx[_DYN_DIAG_LOG$2 ](), 2 , 73 , "Unexpected error calling unload handler - " + dumpObj(e));
                }
            });
            handlers = [];
        }
        return {
            add: _addHandler,
            run: _runHandlers
        };
    }

    var strGetPlugin = "getPlugin";
    var BaseTelemetryPlugin = /** @class */ (function () {
        function BaseTelemetryPlugin() {
            var _self = this;
            var _isinitialized;
            var _rootCtx;
            var _nextPlugin;
            var _unloadHandlerContainer;
            var _hooks;
            _initDefaults();
            dynamicProto(BaseTelemetryPlugin, _self, function (_self) {
                _self[_DYN_INITIALIZE ] = function (config, core, extensions, pluginChain) {
                    _setDefaults(config, core, pluginChain);
                    _isinitialized = true;
                };
                _self[_DYN_TEARDOWN ] = function (unloadCtx, unloadState) {
                    var _a;
                    var core = _self[STR_CORE ];
                    if (!core || (unloadCtx && core !== unloadCtx[STR_CORE ]())) {
                        return;
                    }
                    var result;
                    var unloadDone = false;
                    var theUnloadCtx = unloadCtx || createProcessTelemetryUnloadContext(null, core, _nextPlugin && _nextPlugin[strGetPlugin] ? _nextPlugin[strGetPlugin]() : _nextPlugin);
                    var theUnloadState = unloadState || (_a = {
                            reason: 0
                        },
                        _a[_DYN_IS_ASYNC ] = false,
                        _a);
                    function _unloadCallback() {
                        if (!unloadDone) {
                            unloadDone = true;
                            _unloadHandlerContainer.run(theUnloadCtx, unloadState);
                            var oldHooks = _hooks;
                            _hooks = [];
                            arrForEach(oldHooks, function (fn) {
                                fn.rm();
                            });
                            if (result === true) {
                                theUnloadCtx[_DYN_PROCESS_NEXT ](theUnloadState);
                            }
                            _initDefaults();
                        }
                    }
                    if (!_self[_DYN__DO_TEARDOWN ] || _self[_DYN__DO_TEARDOWN ](theUnloadCtx, theUnloadState, _unloadCallback) !== true) {
                        _unloadCallback();
                    }
                    else {
                        result = true;
                    }
                    return result;
                };
                _self[_DYN_UPDATE$1 ] = function (updateCtx, updateState) {
                    var core = _self[STR_CORE ];
                    if (!core || (updateCtx && core !== updateCtx[STR_CORE ]())) {
                        return;
                    }
                    var result;
                    var updateDone = false;
                    var theUpdateCtx = updateCtx || createProcessTelemetryUpdateContext(null, core, _nextPlugin && _nextPlugin[strGetPlugin] ? _nextPlugin[strGetPlugin]() : _nextPlugin);
                    var theUpdateState = updateState || {
                        reason: 0
                    };
                    function _updateCallback() {
                        if (!updateDone) {
                            updateDone = true;
                            _setDefaults(theUpdateCtx.getCfg(), theUpdateCtx.core(), theUpdateCtx[_DYN_GET_NEXT ]());
                        }
                    }
                    if (!_self._doUpdate || _self._doUpdate(theUpdateCtx, theUpdateState, _updateCallback) !== true) {
                        _updateCallback();
                    }
                    else {
                        result = true;
                    }
                    return result;
                };
                _self._addHook = function (hooks) {
                    if (hooks) {
                        if (isArray(hooks)) {
                            _hooks = _hooks.concat(hooks);
                        }
                        else {
                            _hooks[_DYN_PUSH$2 ](hooks);
                        }
                    }
                };
                proxyFunctionAs(_self, "_addUnloadCb", function () { return _unloadHandlerContainer; }, "add");
            });
            _self[_DYN_DIAG_LOG$2 ] = function (itemCtx) {
                return _getTelCtx(itemCtx)[_DYN_DIAG_LOG$2 ]();
            };
            _self[_DYN_IS_INITIALIZED ] = function () {
                return _isinitialized;
            };
            _self.setInitialized = function (isInitialized) {
                _isinitialized = isInitialized;
            };
            _self[_DYN_SET_NEXT_PLUGIN ] = function (next) {
                _nextPlugin = next;
            };
            _self[_DYN_PROCESS_NEXT ] = function (env, itemCtx) {
                if (itemCtx) {
                    itemCtx[_DYN_PROCESS_NEXT ](env);
                }
                else if (_nextPlugin && isFunction(_nextPlugin[STR_PROCESS_TELEMETRY ])) {
                    _nextPlugin[STR_PROCESS_TELEMETRY ](env, null);
                }
            };
            _self._getTelCtx = _getTelCtx;
            function _getTelCtx(currentCtx) {
                if (currentCtx === void 0) { currentCtx = null; }
                var itemCtx = currentCtx;
                if (!itemCtx) {
                    var rootCtx = _rootCtx || createProcessTelemetryContext(null, {}, _self[STR_CORE ]);
                    if (_nextPlugin && _nextPlugin[strGetPlugin]) {
                        itemCtx = rootCtx[_DYN_CREATE_NEW ](null, _nextPlugin[strGetPlugin]);
                    }
                    else {
                        itemCtx = rootCtx[_DYN_CREATE_NEW ](null, _nextPlugin);
                    }
                }
                return itemCtx;
            }
            function _setDefaults(config, core, pluginChain) {
                if (config) {
                    setValue(config, STR_EXTENSION_CONFIG, [], null, isNullOrUndefined);
                }
                if (!pluginChain && core) {
                    pluginChain = core[_DYN_GET_PROCESS_TEL_CONT0 ]()[_DYN_GET_NEXT ]();
                }
                var nextPlugin = _nextPlugin;
                if (_nextPlugin && _nextPlugin[strGetPlugin]) {
                    nextPlugin = _nextPlugin[strGetPlugin]();
                }
                _self[STR_CORE ] = core;
                _rootCtx = createProcessTelemetryContext(pluginChain, config, core, nextPlugin);
            }
            function _initDefaults() {
                _isinitialized = false;
                _self[STR_CORE ] = null;
                _rootCtx = null;
                _nextPlugin = null;
                _hooks = [];
                _unloadHandlerContainer = createUnloadHandlerContainer();
            }
        }
        BaseTelemetryPlugin.__ieDyn=1;
        return BaseTelemetryPlugin;
    }());

    var TelemetryInitializerPlugin = /** @class */ (function (_super) {
        __extendsFn(TelemetryInitializerPlugin, _super);
        function TelemetryInitializerPlugin() {
            var _this = _super.call(this) || this;
            _this.identifier = "TelemetryInitializerPlugin";
            _this.priority = 199;
            var _id;
            var _initializers;
            _initDefaults();
            dynamicProto(TelemetryInitializerPlugin, _this, function (_self, _base) {
                _self.addTelemetryInitializer = function (telemetryInitializer) {
                    var theInitializer = {
                        id: _id++,
                        fn: telemetryInitializer
                    };
                    _initializers[_DYN_PUSH$2 ](theInitializer);
                    var handler = {
                        remove: function () {
                            arrForEach(_initializers, function (initializer, idx) {
                                if (initializer.id === theInitializer.id) {
                                    _initializers[_DYN_SPLICE ](idx, 1);
                                    return -1;
                                }
                            });
                        }
                    };
                    return handler;
                };
                _self[STR_PROCESS_TELEMETRY ] = function (item, itemCtx) {
                    var doNotSendItem = false;
                    var telemetryInitializersCount = _initializers[_DYN_LENGTH$5 ];
                    for (var i = 0; i < telemetryInitializersCount; ++i) {
                        var telemetryInitializer = _initializers[i];
                        if (telemetryInitializer) {
                            try {
                                if (telemetryInitializer.fn[_DYN_APPLY ](null, [item]) === false) {
                                    doNotSendItem = true;
                                    break;
                                }
                            }
                            catch (e) {
                                _throwInternal(itemCtx[_DYN_DIAG_LOG$2 ](), 1 , 64 , "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e), { exception: dumpObj(e) }, true);
                            }
                        }
                    }
                    if (!doNotSendItem) {
                        _self[_DYN_PROCESS_NEXT ](item, itemCtx);
                    }
                };
                _self[_DYN__DO_TEARDOWN ] = function () {
                    _initDefaults();
                };
            });
            function _initDefaults() {
                _id = 0;
                _initializers = [];
            }
            return _this;
        }
        TelemetryInitializerPlugin.__ieDyn=1;
        return TelemetryInitializerPlugin;
    }(BaseTelemetryPlugin));

    var strValidationError = "Plugins must provide initialize method";
    var strNotificationManager = "_notificationManager";
    var strSdkUnloadingError = "SDK is still unloading...";
    var strSdkNotInitialized = "SDK is not initialized";
    var defaultInitConfig = {
        loggingLevelConsole: 1
    };
    function _createPerfManager(core, notificationMgr) {
        return new PerfManager(notificationMgr);
    }
    function _validateExtensions(logger, channelPriority, allExtensions) {
        var _a;
        var coreExtensions = [];
        var extPriorities = {};
        arrForEach(allExtensions, function (ext) {
            if (isNullOrUndefined(ext) || isNullOrUndefined(ext[_DYN_INITIALIZE ])) {
                throwError(strValidationError);
            }
            var extPriority = ext[STR_PRIORITY ];
            var identifier = ext[_DYN_IDENTIFIER ];
            if (ext && extPriority) {
                if (!isNullOrUndefined(extPriorities[extPriority])) {
                    _warnToConsole(logger, "Two extensions have same priority #" + extPriority + " - " + extPriorities[extPriority] + ", " + identifier);
                }
                else {
                    extPriorities[extPriority] = identifier;
                }
            }
            if (!extPriority || extPriority < channelPriority) {
                coreExtensions[_DYN_PUSH$2 ](ext);
            }
        });
        return _a = {
                all: allExtensions
            },
            _a[STR_CORE ] = coreExtensions,
            _a;
    }
    function _isPluginPresent(thePlugin, plugins) {
        var exists = false;
        arrForEach(plugins, function (plugin) {
            if (plugin === thePlugin) {
                exists = true;
                return -1;
            }
        });
        return exists;
    }
    function _createDummyNotificationManager() {
        var _a;
        return objCreateFn((_a = {},
            _a[_DYN_ADD_NOTIFICATION_LIS1 ] = function (listener) { },
            _a[_DYN_REMOVE_NOTIFICATION_2 ] = function (listener) { },
            _a[STR_EVENTS_SENT ] = function (events) { },
            _a[STR_EVENTS_DISCARDED ] = function (events, reason) { },
            _a[STR_EVENTS_SEND_REQUEST ] = function (sendReason, isAsync) { },
            _a));
    }
    var BaseCore = /** @class */ (function () {
        function BaseCore() {
            var _config;
            var _isInitialized;
            var _eventQueue;
            var _notificationManager;
            var _perfManager;
            var _cfgPerfManager;
            var _cookieManager;
            var _pluginChain;
            var _configExtensions;
            var _coreExtensions;
            var _channelControl;
            var _channelConfig;
            var _channelQueue;
            var _isUnloading;
            var _telemetryInitializerPlugin;
            var _internalLogsEventName;
            var _evtNamespace;
            var _unloadHandlers;
            var _debugListener;
            var _traceCtx;
            var _internalLogPoller = 0;
            dynamicProto(BaseCore, this, function (_self) {
                _initDefaults();
                _self[_DYN_IS_INITIALIZED ] = function () { return _isInitialized; };
                _self[_DYN_INITIALIZE ] = function (config, extensions, logger, notificationManager) {
                    if (_isUnloading) {
                        throwError(strSdkUnloadingError);
                    }
                    if (_self[_DYN_IS_INITIALIZED ]()) {
                        throwError("Core should not be initialized more than once");
                    }
                    _config = config || {};
                    _self[_DYN_CONFIG$2 ] = _config;
                    if (isNullOrUndefined(config[_DYN_INSTRUMENTATION_KEY$2 ])) {
                        throwError("Please provide instrumentation key");
                    }
                    _notificationManager = notificationManager;
                    _self[strNotificationManager] = notificationManager;
                    _initDebugListener();
                    _initPerfManager();
                    _initExtConfig();
                    if (logger) {
                        _self[_DYN_LOGGER ] = logger;
                    }
                    var cfgExtensions = getSetValue(_config, STR_EXTENSIONS, []);
                    _configExtensions = [];
                    _configExtensions[_DYN_PUSH$2 ].apply(_configExtensions, __spreadArrayFn(__spreadArrayFn([], extensions, false), cfgExtensions));
                    _channelConfig = getSetValue(_config, STR_CHANNELS, []);
                    _initPluginChain(null);
                    if (!_channelQueue || _channelQueue[_DYN_LENGTH$5 ] === 0) {
                        throwError("No " + STR_CHANNELS + " available");
                    }
                    _isInitialized = true;
                    _self.releaseQueue();
                };
                _self.getTransmissionControls = function () {
                    var controls = [];
                    if (_channelQueue) {
                        arrForEach(_channelQueue, function (channels) {
                            controls[_DYN_PUSH$2 ](channels.queue);
                        });
                    }
                    return objFreeze(controls);
                };
                _self.track = function (telemetryItem) {
                    telemetryItem.iKey = telemetryItem.iKey || _config[_DYN_INSTRUMENTATION_KEY$2 ];
                    telemetryItem[_DYN_TIME ] = telemetryItem[_DYN_TIME ] || toISOString(new Date());
                    telemetryItem.ver = telemetryItem.ver || "4.0";
                    if (!_isUnloading && _self[_DYN_IS_INITIALIZED ]()) {
                        _createTelCtx()[_DYN_PROCESS_NEXT ](telemetryItem);
                    }
                    else {
                        _eventQueue[_DYN_PUSH$2 ](telemetryItem);
                    }
                };
                _self[_DYN_GET_PROCESS_TEL_CONT0 ] = _createTelCtx;
                _self[_DYN_GET_NOTIFY_MGR ] = function () {
                    if (!_notificationManager) {
                        _notificationManager = _createDummyNotificationManager();
                        _self[strNotificationManager] = _notificationManager;
                    }
                    return _notificationManager;
                };
                _self[_DYN_ADD_NOTIFICATION_LIS1 ] = function (listener) {
                    if (_notificationManager) {
                        _notificationManager[_DYN_ADD_NOTIFICATION_LIS1 ](listener);
                    }
                };
                _self[_DYN_REMOVE_NOTIFICATION_2 ] = function (listener) {
                    if (_notificationManager) {
                        _notificationManager[_DYN_REMOVE_NOTIFICATION_2 ](listener);
                    }
                };
                _self.getCookieMgr = function () {
                    if (!_cookieManager) {
                        _cookieManager = createCookieMgr(_config, _self[_DYN_LOGGER ]);
                    }
                    return _cookieManager;
                };
                _self.setCookieMgr = function (cookieMgr) {
                    _cookieManager = cookieMgr;
                };
                _self[STR_GET_PERF_MGR ] = function () {
                    if (!_perfManager && !_cfgPerfManager) {
                        if (getCfgValue(_config.enablePerfMgr)) {
                            var createPerfMgr = getCfgValue(_config[STR_CREATE_PERF_MGR ]);
                            if (isFunction(createPerfMgr)) {
                                _cfgPerfManager = createPerfMgr(_self, _self[_DYN_GET_NOTIFY_MGR ]());
                            }
                        }
                    }
                    return _perfManager || _cfgPerfManager || getGblPerfMgr();
                };
                _self.setPerfMgr = function (perfMgr) {
                    _perfManager = perfMgr;
                };
                _self.eventCnt = function () {
                    return _eventQueue[_DYN_LENGTH$5 ];
                };
                _self.releaseQueue = function () {
                    if (_isInitialized && _eventQueue[_DYN_LENGTH$5 ] > 0) {
                        var eventQueue = _eventQueue;
                        _eventQueue = [];
                        arrForEach(eventQueue, function (event) {
                            _createTelCtx()[_DYN_PROCESS_NEXT ](event);
                        });
                    }
                };
                _self.pollInternalLogs = function (eventName) {
                    _internalLogsEventName = eventName || null;
                    var interval = getCfgValue(_config.diagnosticLogInterval);
                    if (!interval || !(interval > 0)) {
                        interval = 10000;
                    }
                    if (_internalLogPoller) {
                        clearInterval(_internalLogPoller);
                    }
                    _internalLogPoller = setInterval(function () {
                        _flushInternalLogs();
                    }, interval);
                    return _internalLogPoller;
                };
                _self[_DYN_STOP_POLLING_INTERNA3 ] = function () {
                    if (_internalLogPoller) {
                        clearInterval(_internalLogPoller);
                        _internalLogPoller = 0;
                        _flushInternalLogs();
                    }
                };
                proxyFunctions(_self, function () { return _telemetryInitializerPlugin; }, ["addTelemetryInitializer"]);
                _self.unload = function (isAsync, unloadComplete, cbTimeout) {
                    var _a;
                    if (isAsync === void 0) { isAsync = true; }
                    if (!_isInitialized) {
                        throwError(strSdkNotInitialized);
                    }
                    if (_isUnloading) {
                        throwError(strSdkUnloadingError);
                    }
                    var unloadState = (_a = {
                            reason: 50
                        },
                        _a[_DYN_IS_ASYNC ] = isAsync,
                        _a.flushComplete = false,
                        _a);
                    var processUnloadCtx = createProcessTelemetryUnloadContext(_getPluginChain(), _self);
                    processUnloadCtx[_DYN_ON_COMPLETE ](function () {
                        _initDefaults();
                        unloadComplete && unloadComplete(unloadState);
                    }, _self);
                    function _doUnload(flushComplete) {
                        unloadState.flushComplete = flushComplete;
                        _isUnloading = true;
                        _unloadHandlers.run(processUnloadCtx, unloadState);
                        _self[_DYN_STOP_POLLING_INTERNA3 ]();
                        processUnloadCtx[_DYN_PROCESS_NEXT ](unloadState);
                    }
                    if (!_flushChannels(isAsync, _doUnload, 6 , cbTimeout)) {
                        _doUnload(false);
                    }
                };
                _self[_DYN_GET_PLUGIN ] = _getPlugin;
                _self.addPlugin = function (plugin, replaceExisting, isAsync, addCb) {
                    if (!plugin) {
                        addCb && addCb(false);
                        _logOrThrowError(strValidationError);
                        return;
                    }
                    var existingPlugin = _getPlugin(plugin[_DYN_IDENTIFIER ]);
                    if (existingPlugin && !replaceExisting) {
                        addCb && addCb(false);
                        _logOrThrowError("Plugin [" + plugin[_DYN_IDENTIFIER ] + "] is already loaded!");
                        return;
                    }
                    var updateState = {
                        reason: 16
                    };
                    function _addPlugin(removed) {
                        _configExtensions[_DYN_PUSH$2 ](plugin);
                        updateState.added = [plugin];
                        _initPluginChain(updateState);
                        addCb && addCb(true);
                    }
                    if (existingPlugin) {
                        var removedPlugins_1 = [existingPlugin.plugin];
                        var unloadState = {
                            reason: 2 ,
                            isAsync: !!isAsync
                        };
                        _removePlugins(removedPlugins_1, unloadState, function (removed) {
                            if (!removed) {
                                addCb && addCb(false);
                            }
                            else {
                                updateState.removed = removedPlugins_1;
                                updateState.reason |= 32 ;
                                _addPlugin();
                            }
                        });
                    }
                    else {
                        _addPlugin();
                    }
                };
                _self.evtNamespace = function () {
                    return _evtNamespace;
                };
                _self[_DYN_FLUSH ] = _flushChannels;
                _self.getTraceCtx = function (createNew) {
                    if (!_traceCtx) {
                        _traceCtx = createDistributedTraceContext();
                    }
                    return _traceCtx;
                };
                _self.setTraceCtx = function (traceCtx) {
                    _traceCtx = traceCtx || null;
                };
                proxyFunctionAs(_self, "addUnloadCb", function () { return _unloadHandlers; }, "add");
                function _initDefaults() {
                    _isInitialized = false;
                    _config = objExtend(true, {}, defaultInitConfig);
                    _self[_DYN_CONFIG$2 ] = _config;
                    _self[_DYN_LOGGER ] = new DiagnosticLogger(_config);
                    _self[_DYN__EXTENSIONS ] = [];
                    _telemetryInitializerPlugin = new TelemetryInitializerPlugin();
                    _eventQueue = [];
                    _notificationManager = null;
                    _perfManager = null;
                    _cfgPerfManager = null;
                    _cookieManager = null;
                    _pluginChain = null;
                    _coreExtensions = null;
                    _configExtensions = [];
                    _channelControl = null;
                    _channelConfig = null;
                    _channelQueue = null;
                    _isUnloading = false;
                    _internalLogsEventName = null;
                    _evtNamespace = createUniqueNamespace("AIBaseCore", true);
                    _unloadHandlers = createUnloadHandlerContainer();
                    _traceCtx = null;
                }
                function _createTelCtx() {
                    return createProcessTelemetryContext(_getPluginChain(), _config, _self);
                }
                function _initPluginChain(updateState) {
                    var theExtensions = _validateExtensions(_self[_DYN_LOGGER ], ChannelControllerPriority, _configExtensions);
                    _coreExtensions = theExtensions[STR_CORE ];
                    _pluginChain = null;
                    var allExtensions = theExtensions.all;
                    _channelQueue = objFreeze(createChannelQueues(_channelConfig, allExtensions, _self));
                    if (_channelControl) {
                        var idx = arrIndexOf(allExtensions, _channelControl);
                        if (idx !== -1) {
                            allExtensions[_DYN_SPLICE ](idx, 1);
                        }
                        idx = arrIndexOf(_coreExtensions, _channelControl);
                        if (idx !== -1) {
                            _coreExtensions[_DYN_SPLICE ](idx, 1);
                        }
                        _channelControl._setQueue(_channelQueue);
                    }
                    else {
                        _channelControl = createChannelControllerPlugin(_channelQueue, _self);
                    }
                    allExtensions[_DYN_PUSH$2 ](_channelControl);
                    _coreExtensions[_DYN_PUSH$2 ](_channelControl);
                    _self[_DYN__EXTENSIONS ] = sortPlugins(allExtensions);
                    _channelControl[_DYN_INITIALIZE ](_config, _self, allExtensions);
                    initializePlugins(_createTelCtx(), allExtensions);
                    _self[_DYN__EXTENSIONS ] = objFreeze(sortPlugins(_coreExtensions || [])).slice();
                    if (updateState) {
                        _doUpdate(updateState);
                    }
                }
                function _getPlugin(pluginIdentifier) {
                    var _a;
                    var theExt = null;
                    var thePlugin = null;
                    arrForEach(_self[_DYN__EXTENSIONS ], function (ext) {
                        if (ext[_DYN_IDENTIFIER ] === pluginIdentifier && ext !== _channelControl && ext !== _telemetryInitializerPlugin) {
                            thePlugin = ext;
                            return -1;
                        }
                    });
                    if (!thePlugin && _channelControl) {
                        thePlugin = _channelControl.getChannel(pluginIdentifier);
                    }
                    if (thePlugin) {
                        theExt = (_a = {
                                plugin: thePlugin
                            },
                            _a[_DYN_SET_ENABLED ] = function (enabled) {
                                _getPluginState(thePlugin)[STR_DISABLED] = !enabled;
                            },
                            _a.isEnabled = function () {
                                var pluginState = _getPluginState(thePlugin);
                                return !pluginState[_DYN_TEARDOWN ] && !pluginState[STR_DISABLED];
                            },
                            _a.remove = function (isAsync, removeCb) {
                                var _a;
                                if (isAsync === void 0) { isAsync = true; }
                                var pluginsToRemove = [thePlugin];
                                var unloadState = (_a = {
                                        reason: 1
                                    },
                                    _a[_DYN_IS_ASYNC ] = isAsync,
                                    _a);
                                _removePlugins(pluginsToRemove, unloadState, function (removed) {
                                    if (removed) {
                                        _initPluginChain({
                                            reason: 32 ,
                                            removed: pluginsToRemove
                                        });
                                    }
                                    removeCb && removeCb(removed);
                                });
                            },
                            _a);
                    }
                    return theExt;
                }
                function _getPluginChain() {
                    if (!_pluginChain) {
                        var extensions = (_coreExtensions || []).slice();
                        if (arrIndexOf(extensions, _telemetryInitializerPlugin) === -1) {
                            extensions[_DYN_PUSH$2 ](_telemetryInitializerPlugin);
                        }
                        _pluginChain = createTelemetryProxyChain(sortPlugins(extensions), _config, _self);
                    }
                    return _pluginChain;
                }
                function _removePlugins(thePlugins, unloadState, removeComplete) {
                    if (thePlugins && thePlugins[_DYN_LENGTH$5 ] > 0) {
                        var unloadChain = createTelemetryProxyChain(thePlugins, _config, _self);
                        var unloadCtx = createProcessTelemetryUnloadContext(unloadChain, _self);
                        unloadCtx[_DYN_ON_COMPLETE ](function () {
                            var removed = false;
                            var newConfigExtensions = [];
                            arrForEach(_configExtensions, function (plugin, idx) {
                                if (!_isPluginPresent(plugin, thePlugins)) {
                                    newConfigExtensions[_DYN_PUSH$2 ](plugin);
                                }
                                else {
                                    removed = true;
                                }
                            });
                            _configExtensions = newConfigExtensions;
                            var newChannelConfig = [];
                            if (_channelConfig) {
                                arrForEach(_channelConfig, function (queue, idx) {
                                    var newQueue = [];
                                    arrForEach(queue, function (channel) {
                                        if (!_isPluginPresent(channel, thePlugins)) {
                                            newQueue[_DYN_PUSH$2 ](channel);
                                        }
                                        else {
                                            removed = true;
                                        }
                                    });
                                    newChannelConfig[_DYN_PUSH$2 ](newQueue);
                                });
                                _channelConfig = newChannelConfig;
                            }
                            removeComplete && removeComplete(removed);
                        });
                        unloadCtx[_DYN_PROCESS_NEXT ](unloadState);
                    }
                    else {
                        removeComplete(false);
                    }
                }
                function _flushInternalLogs() {
                    var queue = _self[_DYN_LOGGER ] ? _self[_DYN_LOGGER ].queue : [];
                    if (queue) {
                        arrForEach(queue, function (logMessage) {
                            var _a;
                            var item = (_a = {},
                                _a[_DYN_NAME$3 ] = _internalLogsEventName ? _internalLogsEventName : "InternalMessageId: " + logMessage[_DYN_MESSAGE_ID ],
                                _a.iKey = getCfgValue(_config[_DYN_INSTRUMENTATION_KEY$2 ]),
                                _a.time = toISOString(new Date()),
                                _a.baseType = _InternalLogMessage.dataType,
                                _a.baseData = { message: logMessage[_DYN_MESSAGE$2 ] },
                                _a);
                            _self.track(item);
                        });
                        queue[_DYN_LENGTH$5 ] = 0;
                    }
                }
                function _flushChannels(isAsync, callBack, sendReason, cbTimeout) {
                    if (_channelControl) {
                        return _channelControl[_DYN_FLUSH ](isAsync, callBack, sendReason || 6 , cbTimeout);
                    }
                    callBack && callBack(false);
                    return true;
                }
                function _initDebugListener() {
                    var disableDbgExt = getCfgValue(_config.disableDbgExt);
                    if (disableDbgExt === true && _debugListener) {
                        _notificationManager[_DYN_REMOVE_NOTIFICATION_2 ](_debugListener);
                        _debugListener = null;
                    }
                    if (_notificationManager && !_debugListener && disableDbgExt !== true) {
                        _debugListener = getDebugListener(_config);
                        _notificationManager[_DYN_ADD_NOTIFICATION_LIS1 ](_debugListener);
                    }
                }
                function _initPerfManager() {
                    var enablePerfMgr = getCfgValue(_config.enablePerfMgr);
                    if (!enablePerfMgr && _cfgPerfManager) {
                        _cfgPerfManager = null;
                    }
                    if (enablePerfMgr) {
                        getSetValue(_config, STR_CREATE_PERF_MGR, _createPerfManager);
                    }
                }
                function _initExtConfig() {
                    var extConfig = getSetValue(_config, STR_EXTENSION_CONFIG, {});
                    extConfig.NotificationManager = _notificationManager;
                }
                function _doUpdate(updateState) {
                    var updateCtx = createProcessTelemetryUpdateContext(_getPluginChain(), _self);
                    if (!_self._updateHook || _self._updateHook(updateCtx, updateState) !== true) {
                        updateCtx[_DYN_PROCESS_NEXT ](updateState);
                    }
                }
                function _logOrThrowError(message) {
                    var logger = _self[_DYN_LOGGER ];
                    if (logger) {
                        _throwInternal(logger, 2 , 73 , message);
                    }
                    else {
                        throwError(message);
                    }
                }
            });
        }
        BaseCore.__ieDyn=1;
        return BaseCore;
    }());

    function _runListeners(listeners, name, isAsync, callback) {
        arrForEach(listeners, function (listener) {
            if (listener && listener[name]) {
                if (isAsync) {
                    setTimeout(function () { return callback(listener); }, 0);
                }
                else {
                    try {
                        callback(listener);
                    }
                    catch (e) {
                    }
                }
            }
        });
    }
    var NotificationManager = /** @class */ (function () {
        function NotificationManager(config) {
            this.listeners = [];
            var perfEvtsSendAll = !!(config || {}).perfEvtsSendAll;
            dynamicProto(NotificationManager, this, function (_self) {
                _self[_DYN_ADD_NOTIFICATION_LIS1 ] = function (listener) {
                    _self.listeners[_DYN_PUSH$2 ](listener);
                };
                _self[_DYN_REMOVE_NOTIFICATION_2 ] = function (listener) {
                    var index = arrIndexOf(_self[_DYN_LISTENERS ], listener);
                    while (index > -1) {
                        _self.listeners[_DYN_SPLICE ](index, 1);
                        index = arrIndexOf(_self[_DYN_LISTENERS ], listener);
                    }
                };
                _self[STR_EVENTS_SENT ] = function (events) {
                    _runListeners(_self[_DYN_LISTENERS ], STR_EVENTS_SENT, true, function (listener) {
                        listener[STR_EVENTS_SENT ](events);
                    });
                };
                _self[STR_EVENTS_DISCARDED ] = function (events, reason) {
                    _runListeners(_self[_DYN_LISTENERS ], STR_EVENTS_DISCARDED, true, function (listener) {
                        listener[STR_EVENTS_DISCARDED ](events, reason);
                    });
                };
                _self[STR_EVENTS_SEND_REQUEST ] = function (sendReason, isAsync) {
                    _runListeners(_self[_DYN_LISTENERS ], STR_EVENTS_SEND_REQUEST, isAsync, function (listener) {
                        listener[STR_EVENTS_SEND_REQUEST ](sendReason, isAsync);
                    });
                };
                _self[STR_PERF_EVENT ] = function (perfEvent) {
                    if (perfEvent) {
                        if (perfEvtsSendAll || !perfEvent[_DYN_IS_CHILD_EVT ]()) {
                            _runListeners(_self[_DYN_LISTENERS ], STR_PERF_EVENT, false, function (listener) {
                                if (perfEvent[_DYN_IS_ASYNC ]) {
                                    setTimeout(function () { return listener[STR_PERF_EVENT ](perfEvent); }, 0);
                                }
                                else {
                                    listener[STR_PERF_EVENT ](perfEvent);
                                }
                            });
                        }
                    }
                };
            });
        }
        NotificationManager.__ieDyn=1;
        return NotificationManager;
    }());

    var AppInsightsCore = /** @class */ (function (_super) {
        __extendsFn(AppInsightsCore, _super);
        function AppInsightsCore() {
            var _this = _super.call(this) || this;
            dynamicProto(AppInsightsCore, _this, function (_self, _base) {
                _self[_DYN_INITIALIZE ] = function (config, extensions, logger, notificationManager) {
                    _base[_DYN_INITIALIZE ](config, extensions, logger || new DiagnosticLogger(config), notificationManager || new NotificationManager(config));
                };
                _self.track = function (telemetryItem) {
                    doPerf(_self[STR_GET_PERF_MGR ](), function () { return "AppInsightsCore:track"; }, function () {
                        if (telemetryItem === null) {
                            _notifyInvalidEvent(telemetryItem);
                            throwError("Invalid telemetry item");
                        }
                        _validateTelemetryItem(telemetryItem);
                        _base.track(telemetryItem);
                    }, function () { return ({ item: telemetryItem }); }, !(telemetryItem.sync));
                };
                function _validateTelemetryItem(telemetryItem) {
                    if (isNullOrUndefined(telemetryItem[_DYN_NAME$3 ])) {
                        _notifyInvalidEvent(telemetryItem);
                        throwError("telemetry name required");
                    }
                }
                function _notifyInvalidEvent(telemetryItem) {
                    var manager = _self[_DYN_GET_NOTIFY_MGR ]();
                    if (manager) {
                        manager[STR_EVENTS_DISCARDED ]([telemetryItem], 2 );
                    }
                }
            });
            return _this;
        }
        AppInsightsCore.__ieDyn=1;
        return AppInsightsCore;
    }(BaseCore));

    var _a$2;
    var FAILED = "Failed";
    var FAILED_MONITOR_AJAX = FAILED + "MonitorAjax";
    var TRACK = "Track";
    var START = "Start";
    var STOP = "Stop";
    var EVENT = "Event";
    var AUTH_CONTEXT = "AuthContext";
    var EXCEPTION = "Exception";
    var LOCAL = "Local";
    var SESSION = "Session";
    var STORAGE = "Storage";
    var BROWSER = "Browser";
    var CANNOT = "Cannot";
    var BUFFER = "Buffer";
    var INSTRUMENTATION_KEY = "InstrumentationKey";
    var LoggingSeverity = createEnumStyle({
        CRITICAL: 1 ,
        WARNING: 2
    });
    createEnumStyle((_a$2 = {},
        _a$2[BROWSER + "DoesNotSupport" + LOCAL + STORAGE] = 0 ,
        _a$2[BROWSER + CANNOT + "Read" + LOCAL + STORAGE] = 1 ,
        _a$2[BROWSER + CANNOT + "Read" + SESSION + STORAGE] = 2 ,
        _a$2[BROWSER + CANNOT + "Write" + LOCAL + STORAGE] = 3 ,
        _a$2[BROWSER + CANNOT + "Write" + SESSION + STORAGE] = 4 ,
        _a$2[BROWSER + FAILED + "RemovalFrom" + LOCAL + STORAGE] = 5 ,
        _a$2[BROWSER + FAILED + "RemovalFrom" + SESSION + STORAGE] = 6 ,
        _a$2[CANNOT + "SendEmptyTelemetry"] = 7 ,
        _a$2.ClientPerformanceMathError = 8 ,
        _a$2["ErrorParsingAI" + SESSION + "Cookie"] = 9 ,
        _a$2.ErrorPVCalc = 10 ,
        _a$2[EXCEPTION + "WhileLoggingError"] = 11 ,
        _a$2[FAILED + "AddingTelemetryTo" + BUFFER] = 12 ,
        _a$2[FAILED_MONITOR_AJAX + "Abort"] = 13 ,
        _a$2[FAILED_MONITOR_AJAX + "Dur"] = 14 ,
        _a$2[FAILED_MONITOR_AJAX + "Open"] = 15 ,
        _a$2[FAILED_MONITOR_AJAX + "RSC"] = 16 ,
        _a$2[FAILED_MONITOR_AJAX + "Send"] = 17 ,
        _a$2[FAILED_MONITOR_AJAX + "GetCorrelationHeader"] = 18 ,
        _a$2[FAILED + "ToAddHandlerForOnBeforeUnload"] = 19 ,
        _a$2[FAILED + "ToSendQueuedTelemetry"] = 20 ,
        _a$2[FAILED + "ToReportDataLoss"] = 21 ,
        _a$2["Flush" + FAILED] = 22 ,
        _a$2.MessageLimitPerPVExceeded = 23 ,
        _a$2.MissingRequiredFieldSpecification = 24 ,
        _a$2.NavigationTimingNotSupported = 25 ,
        _a$2.OnError = 26 ,
        _a$2[SESSION + "RenewalDateIsZero"] = 27 ,
        _a$2.SenderNotInitialized = 28 ,
        _a$2[START + TRACK + EVENT + FAILED] = 29 ,
        _a$2[STOP + TRACK + EVENT + FAILED] = 30 ,
        _a$2[START + TRACK + FAILED] = 31 ,
        _a$2[STOP + TRACK + FAILED] = 32 ,
        _a$2.TelemetrySampledAndNotSent = 33 ,
        _a$2[TRACK + EVENT + FAILED] = 34 ,
        _a$2[TRACK + EXCEPTION + FAILED] = 35 ,
        _a$2[TRACK + "Metric" + FAILED] = 36 ,
        _a$2[TRACK + "PV" + FAILED] = 37 ,
        _a$2[TRACK + "PV" + FAILED + "Calc"] = 38 ,
        _a$2[TRACK + "Trace" + FAILED] = 39 ,
        _a$2["Transmission" + FAILED] = 40 ,
        _a$2[FAILED + "ToSet" + STORAGE + BUFFER] = 41 ,
        _a$2[FAILED + "ToRestore" + STORAGE + BUFFER] = 42 ,
        _a$2.InvalidBackendResponse = 43 ,
        _a$2[FAILED + "ToFixDepricatedValues"] = 44 ,
        _a$2.InvalidDurationValue = 45 ,
        _a$2.TelemetryEnvelopeInvalid = 46 ,
        _a$2.CreateEnvelopeError = 47 ,
        _a$2[CANNOT + "SerializeObject"] = 48 ,
        _a$2[CANNOT + "SerializeObjectNonSerializable"] = 49 ,
        _a$2.CircularReferenceDetected = 50 ,
        _a$2["Clear" + AUTH_CONTEXT + FAILED] = 51 ,
        _a$2[EXCEPTION + "Truncated"] = 52 ,
        _a$2.IllegalCharsInName = 53 ,
        _a$2.ItemNotInArray = 54 ,
        _a$2.MaxAjaxPerPVExceeded = 55 ,
        _a$2.MessageTruncated = 56 ,
        _a$2.NameTooLong = 57 ,
        _a$2.SampleRateOutOfRange = 58 ,
        _a$2["Set" + AUTH_CONTEXT + FAILED] = 59 ,
        _a$2["Set" + AUTH_CONTEXT + FAILED + "AccountName"] = 60 ,
        _a$2.StringValueTooLong = 61 ,
        _a$2.StartCalledMoreThanOnce = 62 ,
        _a$2.StopCalledWithoutStart = 63 ,
        _a$2["TelemetryInitializer" + FAILED] = 64 ,
        _a$2.TrackArgumentsNotSpecified = 65 ,
        _a$2.UrlTooLong = 66 ,
        _a$2[SESSION + STORAGE + BUFFER + "Full"] = 67 ,
        _a$2[CANNOT + "AccessCookie"] = 68 ,
        _a$2.IdTooLong = 69 ,
        _a$2.InvalidEvent = 70 ,
        _a$2[FAILED_MONITOR_AJAX + "SetRequestHeader"] = 71 ,
        _a$2["Send" + BROWSER + "InfoOnUserInit"] = 72 ,
        _a$2["Plugin" + EXCEPTION] = 73 ,
        _a$2["Notification" + EXCEPTION] = 74 ,
        _a$2.SnippetScriptLoadFailure = 99 ,
        _a$2["Invalid" + INSTRUMENTATION_KEY] = 100 ,
        _a$2[CANNOT + "ParseAiBlobValue"] = 101 ,
        _a$2.InvalidContentBlob = 102 ,
        _a$2[TRACK + "PageAction" + EVENT + FAILED] = 103 ,
        _a$2[FAILED + "AddingCustomDefinedRequestContext"] = 104 ,
        _a$2["InMemory" + STORAGE + BUFFER + "Full"] = 105 ,
        _a$2[INSTRUMENTATION_KEY + "Deprecation"] = 106 ,
        _a$2));

    var aiInstrumentHooks = "_aiHooks";
    var cbNames = [
        "req", "rsp", "hkErr", "fnErr"
    ];
    function _arrLoop(arr, fn) {
        if (arr) {
            for (var lp = 0; lp < arr[_DYN_LENGTH$5 ]; lp++) {
                if (fn(arr[lp], lp)) {
                    break;
                }
            }
        }
    }
    function _doCallbacks(hooks, callDetails, cbArgs, hookCtx, type) {
        if (type >= 0  && type <= 2 ) {
            _arrLoop(hooks, function (hook, idx) {
                var cbks = hook.cbks;
                var cb = cbks[cbNames[type]];
                if (cb) {
                    callDetails.ctx = function () {
                        var ctx = hookCtx[idx] = (hookCtx[idx] || {});
                        return ctx;
                    };
                    try {
                        cb[_DYN_APPLY ](callDetails.inst, cbArgs);
                    }
                    catch (err) {
                        var orgEx = callDetails.err;
                        try {
                            var hookErrorCb = cbks[cbNames[2 ]];
                            if (hookErrorCb) {
                                callDetails.err = err;
                                hookErrorCb[_DYN_APPLY ](callDetails.inst, cbArgs);
                            }
                        }
                        catch (e) {
                        }
                        finally {
                            callDetails.err = orgEx;
                        }
                    }
                }
            });
        }
    }
    function _createFunctionHook(aiHook) {
        return function () {
            var _a;
            var funcThis = this;
            var orgArgs = arguments;
            var hooks = aiHook.h;
            var funcArgs = (_a = {},
                _a[_DYN_NAME$3 ] = aiHook.n,
                _a.inst = funcThis,
                _a.ctx = null,
                _a.set = _replaceArg,
                _a);
            var hookCtx = [];
            var cbArgs = _createArgs([funcArgs], orgArgs);
            funcArgs.evt = getGlobalInst("event");
            function _createArgs(target, theArgs) {
                _arrLoop(theArgs, function (arg) {
                    target[_DYN_PUSH$2 ](arg);
                });
                return target;
            }
            function _replaceArg(idx, value) {
                orgArgs = _createArgs([], orgArgs);
                orgArgs[idx] = value;
                cbArgs = _createArgs([funcArgs], orgArgs);
            }
            _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, 0 );
            var theFunc = aiHook.f;
            if (theFunc) {
                try {
                    funcArgs.rslt = theFunc[_DYN_APPLY ](funcThis, orgArgs);
                }
                catch (err) {
                    funcArgs.err = err;
                    _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, 3 );
                    throw err;
                }
            }
            _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, 1 );
            return funcArgs.rslt;
        };
    }
    function _getOwner(target, name, checkPrototype) {
        var owner = null;
        if (target) {
            if (hasOwnProperty(target, name)) {
                owner = target;
            }
            else if (checkPrototype) {
                owner = _getOwner(_getObjProto$1(target), name, false);
            }
        }
        return owner;
    }
    function InstrumentProto(target, funcName, callbacks) {
        if (target) {
            return InstrumentFunc(target[strShimPrototype], funcName, callbacks, false);
        }
        return null;
    }
    function _createInstrumentHook(owner, funcName, fn, callbacks) {
        var aiHook = fn && fn[aiInstrumentHooks];
        if (!aiHook) {
            aiHook = {
                i: 0,
                n: funcName,
                f: fn,
                h: []
            };
            var newFunc = _createFunctionHook(aiHook);
            newFunc[aiInstrumentHooks] = aiHook;
            owner[funcName] = newFunc;
        }
        var theHook = {
            id: aiHook.i,
            cbks: callbacks,
            rm: function () {
                var id = this.id;
                _arrLoop(aiHook.h, function (hook, idx) {
                    if (hook.id === id) {
                        aiHook.h[_DYN_SPLICE ](idx, 1);
                        return 1;
                    }
                });
            }
        };
        aiHook.i++;
        aiHook.h[_DYN_PUSH$2 ](theHook);
        return theHook;
    }
    function InstrumentFunc(target, funcName, callbacks, checkPrototype) {
        if (checkPrototype === void 0) { checkPrototype = true; }
        if (target && funcName && callbacks) {
            var owner = _getOwner(target, funcName, checkPrototype);
            if (owner) {
                var fn = owner[funcName];
                if (typeof fn === strShimFunction) {
                    return _createInstrumentHook(owner, funcName, fn, callbacks);
                }
            }
        }
        return null;
    }
    function InstrumentEvent(target, evtName, callbacks, checkPrototype) {
        if (target && evtName && callbacks) {
            var owner = _getOwner(target, evtName, checkPrototype) || target;
            if (owner) {
                return _createInstrumentHook(owner, evtName, owner[evtName], callbacks);
            }
        }
        return null;
    }

    var DisabledPropertyName = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
    var SampleRate = "sampleRate";
    var ProcessLegacy = "ProcessLegacy";
    var HttpMethod = "http.method";
    var DEFAULT_BREEZE_ENDPOINT = "https://dc.services.visualstudio.com";
    var DEFAULT_BREEZE_PATH = "/v2/track";
    var strNotSpecified = "not_specified";
    var strIkey = "iKey";

    function createDomEvent(eventName) {
        var event = null;
        if (isFunction(Event)) {
            event = new Event(eventName);
        }
        else {
            var doc = getDocument();
            if (doc && doc.createEvent) {
                event = doc.createEvent("Event");
                event.initEvent(eventName, true, true);
            }
        }
        return event;
    }

    var _DYN_SPLIT = "split";
    var _DYN_LENGTH$4 = "length";
    var _DYN_TO_LOWER_CASE$1 = "toLowerCase";
    var _DYN_INGESTIONENDPOINT = "ingestionendpoint";
    var _DYN_TO_STRING$2 = "toString";
    var _DYN_REMOVE_ITEM = "removeItem";
    var _DYN_NAME$2 = "name";
    var _DYN_MESSAGE$1 = "message";
    var _DYN_COUNT$1 = "count";
    var _DYN_STRINGIFY$1 = "stringify";
    var _DYN_PATHNAME = "pathname";
    var _DYN_CORRELATION_HEADER_E0 = "correlationHeaderExcludePatterns";
    var _DYN_INDEX_OF$1 = "indexOf";
    var _DYN_EXTENSION_CONFIG = "extensionConfig";
    var _DYN_EXCEPTIONS = "exceptions";
    var _DYN_PARSED_STACK = "parsedStack";
    var _DYN_PROPERTIES = "properties";
    var _DYN_MEASUREMENTS$1 = "measurements";
    var _DYN_SIZE_IN_BYTES = "sizeInBytes";
    var _DYN_TYPE_NAME = "typeName";
    var _DYN_SEVERITY_LEVEL = "severityLevel";
    var _DYN_PROBLEM_GROUP = "problemGroup";
    var _DYN_IS_MANUAL = "isManual";
    var _DYN__CREATE_FROM_INTERFA1 = "CreateFromInterface";
    var _DYN_HAS_FULL_STACK = "hasFullStack";
    var _DYN_LEVEL = "level";
    var _DYN_METHOD$1 = "method";
    var _DYN_ASSEMBLY = "assembly";
    var _DYN_FILE_NAME = "fileName";
    var _DYN_LINE = "line";
    var _DYN_DURATION$1 = "duration";
    var _DYN_RECEIVED_RESPONSE = "receivedResponse";
    var _DYN_SUBSTRING = "substring";
    var _DYN_SANITIZE_KEY_AND_ADD2 = "sanitizeKeyAndAddUniqueness";
    var _DYN_SANITIZE_EXCEPTION = "sanitizeException";
    var _DYN_SANITIZE_PROPERTIES = "sanitizeProperties";
    var _DYN_SANITIZE_MEASUREMENT3 = "sanitizeMeasurements";

    var strEmpty = "";
    function stringToBoolOrDefault(str, defaultValue) {
        if (defaultValue === void 0) { defaultValue = false; }
        if (str === undefined || str === null) {
            return defaultValue;
        }
        return str.toString()[_DYN_TO_LOWER_CASE$1 ]() === "true";
    }
    function msToTimeSpan(totalms) {
        if (isNaN(totalms) || totalms < 0) {
            totalms = 0;
        }
        totalms = Math.round(totalms);
        var ms = strEmpty + totalms % 1000;
        var sec = strEmpty + Math.floor(totalms / 1000) % 60;
        var min = strEmpty + Math.floor(totalms / (1000 * 60)) % 60;
        var hour = strEmpty + Math.floor(totalms / (1000 * 60 * 60)) % 24;
        var days = Math.floor(totalms / (1000 * 60 * 60 * 24));
        ms = ms[_DYN_LENGTH$4 ] === 1 ? "00" + ms : ms[_DYN_LENGTH$4 ] === 2 ? "0" + ms : ms;
        sec = sec[_DYN_LENGTH$4 ] < 2 ? "0" + sec : sec;
        min = min[_DYN_LENGTH$4 ] < 2 ? "0" + min : min;
        hour = hour[_DYN_LENGTH$4 ] < 2 ? "0" + hour : hour;
        return (days > 0 ? days + "." : strEmpty) + hour + ":" + min + ":" + sec + "." + ms;
    }
    function getExtensionByName(extensions, identifier) {
        var extension = null;
        arrForEach(extensions, function (value) {
            if (value.identifier === identifier) {
                extension = value;
                return -1;
            }
        });
        return extension;
    }
    function isCrossOriginError(message, url, lineNumber, columnNumber, error) {
        return !error && isString(message) && (message === "Script error." || message === "Script error");
    }

    var RequestHeaders = createValueMap({
        requestContextHeader: [0 , "Request-Context"],
        requestContextTargetKey: [1 , "appId"],
        requestContextAppIdFormat: [2 , "appId=cid-v1:"],
        requestIdHeader: [3 , "Request-Id"],
        traceParentHeader: [4 , "traceparent"],
        traceStateHeader: [5 , "tracestate"],
        sdkContextHeader: [6 , "Sdk-Context"],
        sdkContextHeaderAppIdRequest: [7 , "appId"],
        requestContextHeaderLowerCase: [8 , "request-context"]
    });

    var StorageType = createEnumStyle({
        LocalStorage: 0 ,
        SessionStorage: 1
    });
    var DistributedTracingModes = createEnumStyle({
        AI: 0 ,
        AI_AND_W3C: 1 ,
        W3C: 2
    });

    var _canUseLocalStorage = undefined;
    var _canUseSessionStorage = undefined;
    function _getLocalStorageObject() {
        if (utlCanUseLocalStorage()) {
            return _getVerifiedStorageObject(StorageType.LocalStorage);
        }
        return null;
    }
    function _getVerifiedStorageObject(storageType) {
        try {
            if (isNullOrUndefined(getGlobal())) {
                return null;
            }
            var uid = (new Date)[_DYN_TO_STRING$2 ]();
            var storage = getGlobalInst(storageType === StorageType.LocalStorage ? "localStorage" : "sessionStorage");
            storage.setItem(uid, uid);
            var fail = storage.getItem(uid) !== uid;
            storage[_DYN_REMOVE_ITEM ](uid);
            if (!fail) {
                return storage;
            }
        }
        catch (exception) {
        }
        return null;
    }
    function _getSessionStorageObject() {
        if (utlCanUseSessionStorage()) {
            return _getVerifiedStorageObject(StorageType.SessionStorage);
        }
        return null;
    }
    function utlDisableStorage() {
        _canUseLocalStorage = false;
        _canUseSessionStorage = false;
    }
    function utlEnableStorage() {
        _canUseLocalStorage = utlCanUseLocalStorage(true);
        _canUseSessionStorage = utlCanUseSessionStorage(true);
    }
    function utlCanUseLocalStorage(reset) {
        if (reset || _canUseLocalStorage === undefined) {
            _canUseLocalStorage = !!_getVerifiedStorageObject(StorageType.LocalStorage);
        }
        return _canUseLocalStorage;
    }
    function utlGetLocalStorage(logger, name) {
        var storage = _getLocalStorageObject();
        if (storage !== null) {
            try {
                return storage.getItem(name);
            }
            catch (e) {
                _canUseLocalStorage = false;
                _throwInternal(logger, 2 , 1 , "Browser failed read of local storage. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return null;
    }
    function utlSetLocalStorage(logger, name, data) {
        var storage = _getLocalStorageObject();
        if (storage !== null) {
            try {
                storage.setItem(name, data);
                return true;
            }
            catch (e) {
                _canUseLocalStorage = false;
                _throwInternal(logger, 2 , 3 , "Browser failed write to local storage. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return false;
    }
    function utlRemoveStorage(logger, name) {
        var storage = _getLocalStorageObject();
        if (storage !== null) {
            try {
                storage[_DYN_REMOVE_ITEM ](name);
                return true;
            }
            catch (e) {
                _canUseLocalStorage = false;
                _throwInternal(logger, 2 , 5 , "Browser failed removal of local storage item. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return false;
    }
    function utlCanUseSessionStorage(reset) {
        if (reset || _canUseSessionStorage === undefined) {
            _canUseSessionStorage = !!_getVerifiedStorageObject(StorageType.SessionStorage);
        }
        return _canUseSessionStorage;
    }
    function utlGetSessionStorageKeys() {
        var keys = [];
        if (utlCanUseSessionStorage()) {
            objForEachKey(getGlobalInst("sessionStorage"), function (key) {
                keys.push(key);
            });
        }
        return keys;
    }
    function utlGetSessionStorage(logger, name) {
        var storage = _getSessionStorageObject();
        if (storage !== null) {
            try {
                return storage.getItem(name);
            }
            catch (e) {
                _canUseSessionStorage = false;
                _throwInternal(logger, 2 , 2 , "Browser failed read of session storage. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return null;
    }
    function utlSetSessionStorage(logger, name, data) {
        var storage = _getSessionStorageObject();
        if (storage !== null) {
            try {
                storage.setItem(name, data);
                return true;
            }
            catch (e) {
                _canUseSessionStorage = false;
                _throwInternal(logger, 2 , 4 , "Browser failed write to session storage. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return false;
    }
    function utlRemoveSessionStorage(logger, name) {
        var storage = _getSessionStorageObject();
        if (storage !== null) {
            try {
                storage[_DYN_REMOVE_ITEM ](name);
                return true;
            }
            catch (e) {
                _canUseSessionStorage = false;
                _throwInternal(logger, 2 , 6 , "Browser failed removal of session storage item. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return false;
    }

    var _a$1;
    function dataSanitizeKeyAndAddUniqueness(logger, key, map) {
        var origLength = key[_DYN_LENGTH$4 ];
        var field = dataSanitizeKey(logger, key);
        if (field[_DYN_LENGTH$4 ] !== origLength) {
            var i = 0;
            var uniqueField = field;
            while (map[uniqueField] !== undefined) {
                i++;
                uniqueField = field[_DYN_SUBSTRING ](0, 150  - 3) + dsPadNumber(i);
            }
            field = uniqueField;
        }
        return field;
    }
    function dataSanitizeKey(logger, name) {
        var nameTrunc;
        if (name) {
            name = strTrim(name[_DYN_TO_STRING$2 ]());
            if (name[_DYN_LENGTH$4 ] > 150 ) {
                nameTrunc = name[_DYN_SUBSTRING ](0, 150 );
                _throwInternal(logger, 2 , 57 , "name is too long.  It has been truncated to " + 150  + " characters.", { name: name }, true);
            }
        }
        return nameTrunc || name;
    }
    function dataSanitizeString(logger, value, maxLength) {
        if (maxLength === void 0) { maxLength = 1024 ; }
        var valueTrunc;
        if (value) {
            maxLength = maxLength ? maxLength : 1024 ;
            value = strTrim(value);
            if (value.toString()[_DYN_LENGTH$4 ] > maxLength) {
                valueTrunc = value[_DYN_TO_STRING$2 ]()[_DYN_SUBSTRING ](0, maxLength);
                _throwInternal(logger, 2 , 61 , "string value is too long. It has been truncated to " + maxLength + " characters.", { value: value }, true);
            }
        }
        return valueTrunc || value;
    }
    function dataSanitizeUrl(logger, url) {
        return dataSanitizeInput(logger, url, 2048 , 66 );
    }
    function dataSanitizeMessage(logger, message) {
        var messageTrunc;
        if (message) {
            if (message[_DYN_LENGTH$4 ] > 32768 ) {
                messageTrunc = message[_DYN_SUBSTRING ](0, 32768 );
                _throwInternal(logger, 2 , 56 , "message is too long, it has been truncated to " + 32768  + " characters.", { message: message }, true);
            }
        }
        return messageTrunc || message;
    }
    function dataSanitizeException(logger, exception) {
        var exceptionTrunc;
        if (exception) {
            var value = "" + exception;
            if (value[_DYN_LENGTH$4 ] > 32768 ) {
                exceptionTrunc = value[_DYN_SUBSTRING ](0, 32768 );
                _throwInternal(logger, 2 , 52 , "exception is too long, it has been truncated to " + 32768  + " characters.", { exception: exception }, true);
            }
        }
        return exceptionTrunc || exception;
    }
    function dataSanitizeProperties(logger, properties) {
        if (properties) {
            var tempProps_1 = {};
            objForEachKey(properties, function (prop, value) {
                if (isObject(value) && hasJSON()) {
                    try {
                        value = getJSON()[_DYN_STRINGIFY$1 ](value);
                    }
                    catch (e) {
                        _throwInternal(logger, 2 , 49 , "custom property is not valid", { exception: e }, true);
                    }
                }
                value = dataSanitizeString(logger, value, 8192 );
                prop = dataSanitizeKeyAndAddUniqueness(logger, prop, tempProps_1);
                tempProps_1[prop] = value;
            });
            properties = tempProps_1;
        }
        return properties;
    }
    function dataSanitizeMeasurements(logger, measurements) {
        if (measurements) {
            var tempMeasurements_1 = {};
            objForEachKey(measurements, function (measure, value) {
                measure = dataSanitizeKeyAndAddUniqueness(logger, measure, tempMeasurements_1);
                tempMeasurements_1[measure] = value;
            });
            measurements = tempMeasurements_1;
        }
        return measurements;
    }
    function dataSanitizeId(logger, id) {
        return id ? dataSanitizeInput(logger, id, 128 , 69 )[_DYN_TO_STRING$2 ]() : id;
    }
    function dataSanitizeInput(logger, input, maxLength, _msgId) {
        var inputTrunc;
        if (input) {
            input = strTrim(input);
            if (input[_DYN_LENGTH$4 ] > maxLength) {
                inputTrunc = input[_DYN_SUBSTRING ](0, maxLength);
                _throwInternal(logger, 2 , _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
            }
        }
        return inputTrunc || input;
    }
    function dsPadNumber(num) {
        var s = "00" + num;
        return s.substr(s[_DYN_LENGTH$4 ] - 3);
    }
    var DataSanitizer = (_a$1 = {
            MAX_NAME_LENGTH: 150 ,
            MAX_ID_LENGTH: 128 ,
            MAX_PROPERTY_LENGTH: 8192 ,
            MAX_STRING_LENGTH: 1024 ,
            MAX_URL_LENGTH: 2048 ,
            MAX_MESSAGE_LENGTH: 32768 ,
            MAX_EXCEPTION_LENGTH: 32768
        },
        _a$1[_DYN_SANITIZE_KEY_AND_ADD2 ] = dataSanitizeKeyAndAddUniqueness,
        _a$1.sanitizeKey = dataSanitizeKey,
        _a$1.sanitizeString = dataSanitizeString,
        _a$1.sanitizeUrl = dataSanitizeUrl,
        _a$1.sanitizeMessage = dataSanitizeMessage,
        _a$1[_DYN_SANITIZE_EXCEPTION ] = dataSanitizeException,
        _a$1[_DYN_SANITIZE_PROPERTIES ] = dataSanitizeProperties,
        _a$1[_DYN_SANITIZE_MEASUREMENT3 ] = dataSanitizeMeasurements,
        _a$1.sanitizeId = dataSanitizeId,
        _a$1.sanitizeInput = dataSanitizeInput,
        _a$1.padNumber = dsPadNumber,
        _a$1.trim = strTrim,
        _a$1);

    var _document = getDocument() || {};
    var _htmlAnchorIdx = 0;
    var _htmlAnchorElement = [null, null, null, null, null];
    function urlParseUrl(url) {
        var anchorIdx = _htmlAnchorIdx;
        var anchorCache = _htmlAnchorElement;
        var tempAnchor = anchorCache[anchorIdx];
        if (!_document.createElement) {
            tempAnchor = { host: urlParseHost(url, true) };
        }
        else if (!anchorCache[anchorIdx]) {
            tempAnchor = anchorCache[anchorIdx] = _document.createElement("a");
        }
        tempAnchor.href = url;
        anchorIdx++;
        if (anchorIdx >= anchorCache[_DYN_LENGTH$4 ]) {
            anchorIdx = 0;
        }
        _htmlAnchorIdx = anchorIdx;
        return tempAnchor;
    }
    function urlGetAbsoluteUrl(url) {
        var result;
        var a = urlParseUrl(url);
        if (a) {
            result = a.href;
        }
        return result;
    }
    function urlGetPathName(url) {
        var result;
        var a = urlParseUrl(url);
        if (a) {
            result = a[_DYN_PATHNAME ];
        }
        return result;
    }
    function urlGetCompleteUrl(method, absoluteUrl) {
        if (method) {
            return method.toUpperCase() + " " + absoluteUrl;
        }
        return absoluteUrl;
    }
    function urlParseHost(url, inclPort) {
        var fullHost = urlParseFullHost(url, inclPort) || "";
        if (fullHost) {
            var match = fullHost.match(/(www\d{0,5}\.)?([^\/:]{1,256})(:\d{1,20})?/i);
            if (match != null && match[_DYN_LENGTH$4 ] > 3 && isString(match[2]) && match[2][_DYN_LENGTH$4 ] > 0) {
                return match[2] + (match[3] || "");
            }
        }
        return fullHost;
    }
    function urlParseFullHost(url, inclPort) {
        var result = null;
        if (url) {
            var match = url.match(/(\w{1,150}):\/\/([^\/:]{1,256})(:\d{1,20})?/i);
            if (match != null && match[_DYN_LENGTH$4 ] > 2 && isString(match[2]) && match[2][_DYN_LENGTH$4 ] > 0) {
                result = match[2] || "";
                if (inclPort && match[_DYN_LENGTH$4 ] > 2) {
                    var protocol = (match[1] || "")[_DYN_TO_LOWER_CASE$1 ]();
                    var port = match[3] || "";
                    if (protocol === "http" && port === ":80") {
                        port = "";
                    }
                    else if (protocol === "https" && port === ":443") {
                        port = "";
                    }
                    result += port;
                }
            }
        }
        return result;
    }

    var _internalEndpoints = [
        DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH,
        "https://breeze.aimon.applicationinsights.io" + DEFAULT_BREEZE_PATH,
        "https://dc-int.services.visualstudio.com" + DEFAULT_BREEZE_PATH
    ];
    function isInternalApplicationInsightsEndpoint(endpointUrl) {
        return arrIndexOf(_internalEndpoints, endpointUrl[_DYN_TO_LOWER_CASE$1 ]()) !== -1;
    }
    var Util = {
        NotSpecified: strNotSpecified,
        createDomEvent: createDomEvent,
        disableStorage: utlDisableStorage,
        isInternalApplicationInsightsEndpoint: isInternalApplicationInsightsEndpoint,
        canUseLocalStorage: utlCanUseLocalStorage,
        getStorage: utlGetLocalStorage,
        setStorage: utlSetLocalStorage,
        removeStorage: utlRemoveStorage,
        canUseSessionStorage: utlCanUseSessionStorage,
        getSessionStorageKeys: utlGetSessionStorageKeys,
        getSessionStorage: utlGetSessionStorage,
        setSessionStorage: utlSetSessionStorage,
        removeSessionStorage: utlRemoveSessionStorage,
        disableCookies: disableCookies,
        canUseCookies: canUseCookies,
        disallowsSameSiteNone: uaDisallowsSameSiteNone,
        setCookie: setCookie,
        stringToBoolOrDefault: stringToBoolOrDefault,
        getCookie: getCookie,
        deleteCookie: deleteCookie,
        trim: strTrim,
        newId: newId,
        random32: function () {
            return random32(true);
        },
        generateW3CId: generateW3CId,
        isArray: isArray,
        isError: isError,
        isDate: isDate,
        toISOStringForIE8: toISOString,
        getIEVersion: getIEVersion,
        msToTimeSpan: msToTimeSpan,
        isCrossOriginError: isCrossOriginError,
        dump: dumpObj,
        getExceptionName: getExceptionName,
        addEventHandler: attachEvent,
        IsBeaconApiSupported: isBeaconsSupported,
        getExtension: getExtensionByName
    };
    var UrlHelper = {
        parseUrl: urlParseUrl,
        getAbsoluteUrl: urlGetAbsoluteUrl,
        getPathName: urlGetPathName,
        getCompleteUrl: urlGetCompleteUrl,
        parseHost: urlParseHost,
        parseFullHost: urlParseFullHost
    };
    var CorrelationIdHelper = {
        correlationIdPrefix: "cid-v1:",
        canIncludeCorrelationHeader: function (config, requestUrl, currentHost) {
            if (!requestUrl || (config && config.disableCorrelationHeaders)) {
                return false;
            }
            if (config && config[_DYN_CORRELATION_HEADER_E0 ]) {
                for (var i = 0; i < config.correlationHeaderExcludePatterns[_DYN_LENGTH$4 ]; i++) {
                    if (config[_DYN_CORRELATION_HEADER_E0 ][i].test(requestUrl)) {
                        return false;
                    }
                }
            }
            var requestHost = urlParseUrl(requestUrl).host[_DYN_TO_LOWER_CASE$1 ]();
            if (requestHost && (requestHost[_DYN_INDEX_OF$1 ](":443") !== -1 || requestHost[_DYN_INDEX_OF$1 ](":80") !== -1)) {
                requestHost = (urlParseFullHost(requestUrl, true) || "")[_DYN_TO_LOWER_CASE$1 ]();
            }
            if ((!config || !config.enableCorsCorrelation) && (requestHost && requestHost !== currentHost)) {
                return false;
            }
            var includedDomains = config && config.correlationHeaderDomains;
            if (includedDomains) {
                var matchExists_1;
                arrForEach(includedDomains, function (domain) {
                    var regex = new RegExp(domain.toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
                    matchExists_1 = matchExists_1 || regex.test(requestHost);
                });
                if (!matchExists_1) {
                    return false;
                }
            }
            var excludedDomains = config && config.correlationHeaderExcludedDomains;
            if (!excludedDomains || excludedDomains[_DYN_LENGTH$4 ] === 0) {
                return true;
            }
            for (var i = 0; i < excludedDomains[_DYN_LENGTH$4 ]; i++) {
                var regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
                if (regex.test(requestHost)) {
                    return false;
                }
            }
            return requestHost && requestHost[_DYN_LENGTH$4 ] > 0;
        },
        getCorrelationContext: function (responseHeader) {
            if (responseHeader) {
                var correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestHeaders[1 ]);
                if (correlationId && correlationId !== CorrelationIdHelper.correlationIdPrefix) {
                    return correlationId;
                }
            }
        },
        getCorrelationContextValue: function (responseHeader, key) {
            if (responseHeader) {
                var keyValues = responseHeader[_DYN_SPLIT ](",");
                for (var i = 0; i < keyValues[_DYN_LENGTH$4 ]; ++i) {
                    var keyValue = keyValues[i][_DYN_SPLIT ]("=");
                    if (keyValue[_DYN_LENGTH$4 ] === 2 && keyValue[0] === key) {
                        return keyValue[1];
                    }
                }
            }
        }
    };
    function AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName) {
        var target, name = commandName, data = commandName;
        if (absoluteUrl && absoluteUrl[_DYN_LENGTH$4 ] > 0) {
            var parsedUrl = urlParseUrl(absoluteUrl);
            target = parsedUrl.host;
            if (!name) {
                if (parsedUrl[_DYN_PATHNAME ] != null) {
                    var pathName = (parsedUrl.pathname[_DYN_LENGTH$4 ] === 0) ? "/" : parsedUrl[_DYN_PATHNAME ];
                    if (pathName.charAt(0) !== "/") {
                        pathName = "/" + pathName;
                    }
                    data = parsedUrl[_DYN_PATHNAME ];
                    name = dataSanitizeString(logger, method ? method + " " + pathName : pathName);
                }
                else {
                    name = dataSanitizeString(logger, absoluteUrl);
                }
            }
        }
        else {
            target = commandName;
            name = commandName;
        }
        return {
            target: target,
            name: name,
            data: data
        };
    }
    function dateTimeUtilsNow() {
        var perf = getPerformance();
        if (perf && perf.now && perf.timing) {
            var now = perf.now() + perf.timing.navigationStart;
            if (now > 0) {
                return now;
            }
        }
        return dateNow();
    }
    function dateTimeUtilsDuration(start, end) {
        var result = null;
        if (start !== 0 && end !== 0 && !isNullOrUndefined(start) && !isNullOrUndefined(end)) {
            result = end - start;
        }
        return result;
    }
    var DateTimeUtils = {
        Now: dateTimeUtilsNow,
        GetDuration: dateTimeUtilsDuration
    };
    function createDistributedTraceContextFromTrace(telemetryTrace, parentCtx) {
        var trace = telemetryTrace || {};
        return {
            getName: function () {
                return trace[_DYN_NAME$2 ];
            },
            setName: function (newValue) {
                parentCtx && parentCtx.setName(newValue);
                trace[_DYN_NAME$2 ] = newValue;
            },
            getTraceId: function () {
                return trace.traceID;
            },
            setTraceId: function (newValue) {
                parentCtx && parentCtx.setTraceId(newValue);
                if (isValidTraceId(newValue)) {
                    trace.traceID = newValue;
                }
            },
            getSpanId: function () {
                return trace.parentID;
            },
            setSpanId: function (newValue) {
                parentCtx && parentCtx.setSpanId(newValue);
                if (isValidSpanId(newValue)) {
                    trace.parentID = newValue;
                }
            },
            getTraceFlags: function () {
                return trace.traceFlags;
            },
            setTraceFlags: function (newTraceFlags) {
                parentCtx && parentCtx.setTraceFlags(newTraceFlags);
                trace.traceFlags = newTraceFlags;
            }
        };
    }

    var _FIELDS_SEPARATOR = ";";
    var _FIELD_KEY_VALUE_SEPARATOR = "=";
    function parseConnectionString(connectionString) {
        if (!connectionString) {
            return {};
        }
        var kvPairs = connectionString[_DYN_SPLIT ](_FIELDS_SEPARATOR);
        var result = arrReduce(kvPairs, function (fields, kv) {
            var kvParts = kv[_DYN_SPLIT ](_FIELD_KEY_VALUE_SEPARATOR);
            if (kvParts[_DYN_LENGTH$4 ] === 2) {
                var key = kvParts[0][_DYN_TO_LOWER_CASE$1 ]();
                var value = kvParts[1];
                fields[key] = value;
            }
            return fields;
        }, {});
        if (objKeys(result)[_DYN_LENGTH$4 ] > 0) {
            if (result.endpointsuffix) {
                var locationPrefix = result.location ? result.location + "." : "";
                result[_DYN_INGESTIONENDPOINT ] = result[_DYN_INGESTIONENDPOINT ] || ("https://" + locationPrefix + "dc." + result.endpointsuffix);
            }
            result[_DYN_INGESTIONENDPOINT ] = result[_DYN_INGESTIONENDPOINT ] || DEFAULT_BREEZE_ENDPOINT;
        }
        return result;
    }
    var ConnectionStringParser = {
        parse: parseConnectionString
    };

    var Envelope = /** @class */ (function () {
        function Envelope(logger, data, name) {
            var _this = this;
            var _self = this;
            _self.ver = 1;
            _self.sampleRate = 100.0;
            _self.tags = {};
            _self[_DYN_NAME$2 ] = dataSanitizeString(logger, name) || strNotSpecified;
            _self.data = data;
            _self.time = toISOString(new Date());
            _self.aiDataContract = {
                time: 1 ,
                iKey: 1 ,
                name: 1 ,
                sampleRate: function () {
                    return (_this.sampleRate === 100) ? 4  : 1 ;
                },
                tags: 1 ,
                data: 1
            };
        }
        return Envelope;
    }());

    var Event$1 = /** @class */ (function () {
        function Event(logger, name, properties, measurements) {
            this.aiDataContract = {
                ver: 1 ,
                name: 1 ,
                properties: 0 ,
                measurements: 0
            };
            var _self = this;
            _self.ver = 2;
            _self[_DYN_NAME$2 ] = dataSanitizeString(logger, name) || strNotSpecified;
            _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
            _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
        }
        Event.envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
        Event.dataType = "EventData";
        return Event;
    }());

    var NoMethod = "<no_method>";
    var strError = "error";
    var strStack = "stack";
    var strStackDetails = "stackDetails";
    var strErrorSrc = "errorSrc";
    var strMessage = "message";
    var strDescription = "description";
    function _stringify(value, convertToString) {
        var result = value;
        if (result && !isString(result)) {
            if (JSON && JSON[_DYN_STRINGIFY$1 ]) {
                result = JSON[_DYN_STRINGIFY$1 ](value);
                if (convertToString && (!result || result === "{}")) {
                    if (isFunction(value[_DYN_TO_STRING$2 ])) {
                        result = value[_DYN_TO_STRING$2 ]();
                    }
                    else {
                        result = "" + value;
                    }
                }
            }
            else {
                result = "" + value + " - (Missing JSON.stringify)";
            }
        }
        return result || "";
    }
    function _formatMessage(theEvent, errorType) {
        var evtMessage = theEvent;
        if (theEvent) {
            if (evtMessage && !isString(evtMessage)) {
                evtMessage = theEvent[strMessage] || theEvent[strDescription] || evtMessage;
            }
            if (evtMessage && !isString(evtMessage)) {
                evtMessage = _stringify(evtMessage, true);
            }
            if (theEvent["filename"]) {
                evtMessage = evtMessage + " @" + (theEvent["filename"] || "") + ":" + (theEvent["lineno"] || "?") + ":" + (theEvent["colno"] || "?");
            }
        }
        if (errorType && errorType !== "String" && errorType !== "Object" && errorType !== "Error" && (evtMessage || "")[_DYN_INDEX_OF$1 ](errorType) === -1) {
            evtMessage = errorType + ": " + evtMessage;
        }
        return evtMessage || "";
    }
    function _isExceptionDetailsInternal(value) {
        try {
            if (isObject(value)) {
                return "hasFullStack" in value && "typeName" in value;
            }
        }
        catch (e) {
        }
        return false;
    }
    function _isExceptionInternal(value) {
        try {
            if (isObject(value)) {
                return ("ver" in value && "exceptions" in value && "properties" in value);
            }
        }
        catch (e) {
        }
        return false;
    }
    function _isStackDetails(details) {
        return details && details.src && isString(details.src) && details.obj && isArray(details.obj);
    }
    function _convertStackObj(errorStack) {
        var src = errorStack || "";
        if (!isString(src)) {
            if (isString(src[strStack])) {
                src = src[strStack];
            }
            else {
                src = "" + src;
            }
        }
        var items = src[_DYN_SPLIT ]("\n");
        return {
            src: src,
            obj: items
        };
    }
    function _getOperaStack(errorMessage) {
        var stack = [];
        var lines = errorMessage[_DYN_SPLIT ]("\n");
        for (var lp = 0; lp < lines[_DYN_LENGTH$4 ]; lp++) {
            var entry = lines[lp];
            if (lines[lp + 1]) {
                entry += "@" + lines[lp + 1];
                lp++;
            }
            stack.push(entry);
        }
        return {
            src: errorMessage,
            obj: stack
        };
    }
    function _getStackFromErrorObj(errorObj) {
        var details = null;
        if (errorObj) {
            try {
                if (errorObj[strStack]) {
                    details = _convertStackObj(errorObj[strStack]);
                }
                else if (errorObj[strError] && errorObj[strError][strStack]) {
                    details = _convertStackObj(errorObj[strError][strStack]);
                }
                else if (errorObj["exception"] && errorObj.exception[strStack]) {
                    details = _convertStackObj(errorObj.exception[strStack]);
                }
                else if (_isStackDetails(errorObj)) {
                    details = errorObj;
                }
                else if (_isStackDetails(errorObj[strStackDetails])) {
                    details = errorObj[strStackDetails];
                }
                else if (window && window["opera"] && errorObj[strMessage]) {
                    details = _getOperaStack(errorObj[_DYN_MESSAGE$1 ]);
                }
                else if (errorObj["reason"] && errorObj.reason[strStack]) {
                    details = _convertStackObj(errorObj.reason[strStack]);
                }
                else if (isString(errorObj)) {
                    details = _convertStackObj(errorObj);
                }
                else {
                    var evtMessage = errorObj[strMessage] || errorObj[strDescription] || "";
                    if (isString(errorObj[strErrorSrc])) {
                        if (evtMessage) {
                            evtMessage += "\n";
                        }
                        evtMessage += " from " + errorObj[strErrorSrc];
                    }
                    if (evtMessage) {
                        details = _convertStackObj(evtMessage);
                    }
                }
            }
            catch (e) {
                details = _convertStackObj(e);
            }
        }
        return details || {
            src: "",
            obj: null
        };
    }
    function _formatStackTrace(stackDetails) {
        var stack = "";
        if (stackDetails) {
            if (stackDetails.obj) {
                arrForEach(stackDetails.obj, function (entry) {
                    stack += entry + "\n";
                });
            }
            else {
                stack = stackDetails.src || "";
            }
        }
        return stack;
    }
    function _parseStack(stack) {
        var parsedStack;
        var frames = stack.obj;
        if (frames && frames[_DYN_LENGTH$4 ] > 0) {
            parsedStack = [];
            var level_1 = 0;
            var totalSizeInBytes_1 = 0;
            arrForEach(frames, function (frame) {
                var theFrame = frame[_DYN_TO_STRING$2 ]();
                if (_StackFrame.regex.test(theFrame)) {
                    var parsedFrame = new _StackFrame(theFrame, level_1++);
                    totalSizeInBytes_1 += parsedFrame[_DYN_SIZE_IN_BYTES ];
                    parsedStack.push(parsedFrame);
                }
            });
            var exceptionParsedStackThreshold = 32 * 1024;
            if (totalSizeInBytes_1 > exceptionParsedStackThreshold) {
                var left = 0;
                var right = parsedStack[_DYN_LENGTH$4 ] - 1;
                var size = 0;
                var acceptedLeft = left;
                var acceptedRight = right;
                while (left < right) {
                    var lSize = parsedStack[left][_DYN_SIZE_IN_BYTES ];
                    var rSize = parsedStack[right][_DYN_SIZE_IN_BYTES ];
                    size += lSize + rSize;
                    if (size > exceptionParsedStackThreshold) {
                        var howMany = acceptedRight - acceptedLeft + 1;
                        parsedStack.splice(acceptedLeft, howMany);
                        break;
                    }
                    acceptedLeft = left;
                    acceptedRight = right;
                    left++;
                    right--;
                }
            }
        }
        return parsedStack;
    }
    function _getErrorType(errorType) {
        var typeName = "";
        if (errorType) {
            typeName = errorType.typeName || errorType[_DYN_NAME$2 ] || "";
            if (!typeName) {
                try {
                    var funcNameRegex = /function (.{1,200})\(/;
                    var results = (funcNameRegex).exec((errorType).constructor[_DYN_TO_STRING$2 ]());
                    typeName = (results && results[_DYN_LENGTH$4 ] > 1) ? results[1] : "";
                }
                catch (e) {
                }
            }
        }
        return typeName;
    }
    function _formatErrorCode(errorObj) {
        if (errorObj) {
            try {
                if (!isString(errorObj)) {
                    var errorType = _getErrorType(errorObj);
                    var result = _stringify(errorObj, false);
                    if (!result || result === "{}") {
                        if (errorObj[strError]) {
                            errorObj = errorObj[strError];
                            errorType = _getErrorType(errorObj);
                        }
                        result = _stringify(errorObj, true);
                    }
                    if (result[_DYN_INDEX_OF$1 ](errorType) !== 0 && errorType !== "String") {
                        return errorType + ":" + result;
                    }
                    return result;
                }
            }
            catch (e) {
            }
        }
        return "" + (errorObj || "");
    }
    var Exception = /** @class */ (function () {
        function Exception(logger, exception, properties, measurements, severityLevel, id) {
            this.aiDataContract = {
                ver: 1 ,
                exceptions: 1 ,
                severityLevel: 0 ,
                properties: 0 ,
                measurements: 0
            };
            var _self = this;
            _self.ver = 2;
            if (!_isExceptionInternal(exception)) {
                if (!properties) {
                    properties = {};
                }
                _self[_DYN_EXCEPTIONS ] = [new _ExceptionDetails(logger, exception, properties)];
                _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
                _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
                if (severityLevel) {
                    _self[_DYN_SEVERITY_LEVEL ] = severityLevel;
                }
                if (id) {
                    _self.id = id;
                }
            }
            else {
                _self[_DYN_EXCEPTIONS ] = exception[_DYN_EXCEPTIONS ] || [];
                _self[_DYN_PROPERTIES ] = exception[_DYN_PROPERTIES ];
                _self[_DYN_MEASUREMENTS$1 ] = exception[_DYN_MEASUREMENTS$1 ];
                if (exception[_DYN_SEVERITY_LEVEL ]) {
                    _self[_DYN_SEVERITY_LEVEL ] = exception[_DYN_SEVERITY_LEVEL ];
                }
                if (exception.id) {
                    _self.id = exception.id;
                }
                if (exception[_DYN_PROBLEM_GROUP ]) {
                    _self[_DYN_PROBLEM_GROUP ] = exception[_DYN_PROBLEM_GROUP ];
                }
                if (!isNullOrUndefined(exception[_DYN_IS_MANUAL ])) {
                    _self[_DYN_IS_MANUAL ] = exception[_DYN_IS_MANUAL ];
                }
            }
        }
        Exception.CreateAutoException = function (message, url, lineNumber, columnNumber, error, evt, stack, errorSrc) {
            var _a;
            var errorType = _getErrorType(error || evt || message);
            return _a = {},
                _a[_DYN_MESSAGE$1 ] = _formatMessage(message, errorType),
                _a.url = url,
                _a.lineNumber = lineNumber,
                _a.columnNumber = columnNumber,
                _a.error = _formatErrorCode(error || evt || message),
                _a.evt = _formatErrorCode(evt || message),
                _a[_DYN_TYPE_NAME ] = errorType,
                _a.stackDetails = _getStackFromErrorObj(stack || error || evt),
                _a.errorSrc = errorSrc,
                _a;
        };
        Exception.CreateFromInterface = function (logger, exception, properties, measurements) {
            var exceptions = exception[_DYN_EXCEPTIONS ]
                && arrMap(exception[_DYN_EXCEPTIONS ], function (ex) { return _ExceptionDetails[_DYN__CREATE_FROM_INTERFA1 ](logger, ex); });
            var exceptionData = new Exception(logger, __assignFn(__assignFn({}, exception), { exceptions: exceptions }), properties, measurements);
            return exceptionData;
        };
        Exception.prototype.toInterface = function () {
            var _a;
            var _b = this, exceptions = _b.exceptions, properties = _b.properties, measurements = _b.measurements, severityLevel = _b.severityLevel, problemGroup = _b.problemGroup, id = _b.id, isManual = _b.isManual;
            var exceptionDetailsInterface = exceptions instanceof Array
                && arrMap(exceptions, function (exception) { return exception.toInterface(); })
                || undefined;
            return _a = {
                    ver: "4.0"
                },
                _a[_DYN_EXCEPTIONS ] = exceptionDetailsInterface,
                _a.severityLevel = severityLevel,
                _a.properties = properties,
                _a.measurements = measurements,
                _a.problemGroup = problemGroup,
                _a.id = id,
                _a.isManual = isManual,
                _a;
        };
        Exception.CreateSimpleException = function (message, typeName, assembly, fileName, details, line) {
            var _a;
            return {
                exceptions: [
                    (_a = {},
                        _a[_DYN_HAS_FULL_STACK ] = true,
                        _a.message = message,
                        _a.stack = details,
                        _a.typeName = typeName,
                        _a)
                ]
            };
        };
        Exception.envelopeType = "Microsoft.ApplicationInsights.{0}.Exception";
        Exception.dataType = "ExceptionData";
        Exception.formatError = _formatErrorCode;
        return Exception;
    }());
    var _ExceptionDetails = /** @class */ (function () {
        function _ExceptionDetails(logger, exception, properties) {
            this.aiDataContract = {
                id: 0 ,
                outerId: 0 ,
                typeName: 1 ,
                message: 1 ,
                hasFullStack: 0 ,
                stack: 0 ,
                parsedStack: 2
            };
            var _self = this;
            if (!_isExceptionDetailsInternal(exception)) {
                var error = exception;
                var evt = error && error.evt;
                if (!isError(error)) {
                    error = error[strError] || evt || error;
                }
                _self[_DYN_TYPE_NAME ] = dataSanitizeString(logger, _getErrorType(error)) || strNotSpecified;
                _self[_DYN_MESSAGE$1 ] = dataSanitizeMessage(logger, _formatMessage(exception || error, _self[_DYN_TYPE_NAME ])) || strNotSpecified;
                var stack = exception[strStackDetails] || _getStackFromErrorObj(exception);
                _self[_DYN_PARSED_STACK ] = _parseStack(stack);
                _self[strStack] = dataSanitizeException(logger, _formatStackTrace(stack));
                _self.hasFullStack = isArray(_self.parsedStack) && _self.parsedStack[_DYN_LENGTH$4 ] > 0;
                if (properties) {
                    properties[_DYN_TYPE_NAME ] = properties[_DYN_TYPE_NAME ] || _self[_DYN_TYPE_NAME ];
                }
            }
            else {
                _self[_DYN_TYPE_NAME ] = exception[_DYN_TYPE_NAME ];
                _self[_DYN_MESSAGE$1 ] = exception[_DYN_MESSAGE$1 ];
                _self[strStack] = exception[strStack];
                _self[_DYN_PARSED_STACK ] = exception[_DYN_PARSED_STACK ] || [];
                _self[_DYN_HAS_FULL_STACK ] = exception[_DYN_HAS_FULL_STACK ];
            }
        }
        _ExceptionDetails.prototype.toInterface = function () {
            var _a;
            var _self = this;
            var parsedStack = _self[_DYN_PARSED_STACK ] instanceof Array
                && arrMap(_self[_DYN_PARSED_STACK ], function (frame) { return frame.toInterface(); });
            var exceptionDetailsInterface = (_a = {
                    id: _self.id,
                    outerId: _self.outerId,
                    typeName: _self[_DYN_TYPE_NAME ],
                    message: _self[_DYN_MESSAGE$1 ],
                    hasFullStack: _self[_DYN_HAS_FULL_STACK ],
                    stack: _self[strStack]
                },
                _a[_DYN_PARSED_STACK ] = parsedStack || undefined,
                _a);
            return exceptionDetailsInterface;
        };
        _ExceptionDetails.CreateFromInterface = function (logger, exception) {
            var parsedStack = (exception[_DYN_PARSED_STACK ] instanceof Array
                && arrMap(exception[_DYN_PARSED_STACK ], function (frame) { return _StackFrame[_DYN__CREATE_FROM_INTERFA1 ](frame); }))
                || exception[_DYN_PARSED_STACK ];
            var exceptionDetails = new _ExceptionDetails(logger, __assignFn(__assignFn({}, exception), { parsedStack: parsedStack }));
            return exceptionDetails;
        };
        return _ExceptionDetails;
    }());
    var _StackFrame = /** @class */ (function () {
        function _StackFrame(sourceFrame, level) {
            this.aiDataContract = {
                level: 1 ,
                method: 1 ,
                assembly: 0 ,
                fileName: 0 ,
                line: 0
            };
            var _self = this;
            _self[_DYN_SIZE_IN_BYTES ] = 0;
            if (typeof sourceFrame === "string") {
                var frame = sourceFrame;
                _self[_DYN_LEVEL ] = level;
                _self[_DYN_METHOD$1 ] = NoMethod;
                _self[_DYN_ASSEMBLY ] = strTrim(frame);
                _self[_DYN_FILE_NAME ] = "";
                _self[_DYN_LINE ] = 0;
                var matches = frame.match(_StackFrame.regex);
                if (matches && matches[_DYN_LENGTH$4 ] >= 5) {
                    _self[_DYN_METHOD$1 ] = strTrim(matches[2]) || _self[_DYN_METHOD$1 ];
                    _self[_DYN_FILE_NAME ] = strTrim(matches[4]);
                    _self[_DYN_LINE ] = parseInt(matches[5]) || 0;
                }
            }
            else {
                _self[_DYN_LEVEL ] = sourceFrame[_DYN_LEVEL ];
                _self[_DYN_METHOD$1 ] = sourceFrame[_DYN_METHOD$1 ];
                _self[_DYN_ASSEMBLY ] = sourceFrame[_DYN_ASSEMBLY ];
                _self[_DYN_FILE_NAME ] = sourceFrame[_DYN_FILE_NAME ];
                _self[_DYN_LINE ] = sourceFrame[_DYN_LINE ];
                _self[_DYN_SIZE_IN_BYTES ] = 0;
            }
            _self.sizeInBytes += _self.method[_DYN_LENGTH$4 ];
            _self.sizeInBytes += _self.fileName[_DYN_LENGTH$4 ];
            _self.sizeInBytes += _self.assembly[_DYN_LENGTH$4 ];
            _self[_DYN_SIZE_IN_BYTES ] += _StackFrame.baseSize;
            _self.sizeInBytes += _self.level.toString()[_DYN_LENGTH$4 ];
            _self.sizeInBytes += _self.line.toString()[_DYN_LENGTH$4 ];
        }
        _StackFrame.CreateFromInterface = function (frame) {
            return new _StackFrame(frame, null );
        };
        _StackFrame.prototype.toInterface = function () {
            var _self = this;
            return {
                level: _self[_DYN_LEVEL ],
                method: _self[_DYN_METHOD$1 ],
                assembly: _self[_DYN_ASSEMBLY ],
                fileName: _self[_DYN_FILE_NAME ],
                line: _self[_DYN_LINE ]
            };
        };
        _StackFrame.regex = /^([\s]+at)?[\s]{0,50}([^\@\()]+?)[\s]{0,50}(\@|\()([^\(\n]+):([0-9]+):([0-9]+)(\)?)$/;
        _StackFrame.baseSize = 58;
        return _StackFrame;
    }());

    var DataPoint = /** @class */ (function () {
        function DataPoint() {
            this.aiDataContract = {
                name: 1 ,
                kind: 0 ,
                value: 1 ,
                count: 0 ,
                min: 0 ,
                max: 0 ,
                stdDev: 0
            };
            this.kind = 0 ;
        }
        return DataPoint;
    }());

    var Metric = /** @class */ (function () {
        function Metric(logger, name, value, count, min, max, stdDev, properties, measurements) {
            this.aiDataContract = {
                ver: 1 ,
                metrics: 1 ,
                properties: 0
            };
            var _self = this;
            _self.ver = 2;
            var dataPoint = new DataPoint();
            dataPoint[_DYN_COUNT$1 ] = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint[_DYN_NAME$2 ] = dataSanitizeString(logger, name) || strNotSpecified;
            dataPoint.value = value;
            dataPoint.stdDev = isNaN(stdDev) || stdDev === null ? undefined : stdDev;
            _self.metrics = [dataPoint];
            _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
            _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
        }
        Metric.envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
        Metric.dataType = "MetricData";
        return Metric;
    }());

    var PageView = /** @class */ (function () {
        function PageView(logger, name, url, durationMs, properties, measurements, id) {
            this.aiDataContract = {
                ver: 1 ,
                name: 0 ,
                url: 0 ,
                duration: 0 ,
                properties: 0 ,
                measurements: 0 ,
                id: 0
            };
            var _self = this;
            _self.ver = 2;
            _self.id = dataSanitizeId(logger, id);
            _self.url = dataSanitizeUrl(logger, url);
            _self[_DYN_NAME$2 ] = dataSanitizeString(logger, name) || strNotSpecified;
            if (!isNaN(durationMs)) {
                _self[_DYN_DURATION$1 ] = msToTimeSpan(durationMs);
            }
            _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
            _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
        }
        PageView.envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
        PageView.dataType = "PageviewData";
        return PageView;
    }());

    var RemoteDependencyData = /** @class */ (function () {
        function RemoteDependencyData(logger, id, absoluteUrl, commandName, value, success, resultCode, method, requestAPI, correlationContext, properties, measurements) {
            if (requestAPI === void 0) { requestAPI = "Ajax"; }
            this.aiDataContract = {
                id: 1 ,
                ver: 1 ,
                name: 0 ,
                resultCode: 0 ,
                duration: 0 ,
                success: 0 ,
                data: 0 ,
                target: 0 ,
                type: 0 ,
                properties: 0 ,
                measurements: 0 ,
                kind: 0 ,
                value: 0 ,
                count: 0 ,
                min: 0 ,
                max: 0 ,
                stdDev: 0 ,
                dependencyKind: 0 ,
                dependencySource: 0 ,
                commandName: 0 ,
                dependencyTypeName: 0
            };
            var _self = this;
            _self.ver = 2;
            _self.id = id;
            _self[_DYN_DURATION$1 ] = msToTimeSpan(value);
            _self.success = success;
            _self.resultCode = resultCode + "";
            _self.type = dataSanitizeString(logger, requestAPI);
            var dependencyFields = AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName);
            _self.data = dataSanitizeUrl(logger, commandName) || dependencyFields.data;
            _self.target = dataSanitizeString(logger, dependencyFields.target);
            if (correlationContext) {
                _self.target = "".concat(_self.target, " | ").concat(correlationContext);
            }
            _self[_DYN_NAME$2 ] = dataSanitizeString(logger, dependencyFields[_DYN_NAME$2 ]);
            _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
            _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
        }
        RemoteDependencyData.envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        RemoteDependencyData.dataType = "RemoteDependencyData";
        return RemoteDependencyData;
    }());

    var Trace = /** @class */ (function () {
        function Trace(logger, message, severityLevel, properties, measurements) {
            this.aiDataContract = {
                ver: 1 ,
                message: 1 ,
                severityLevel: 0 ,
                properties: 0
            };
            var _self = this;
            _self.ver = 2;
            message = message || strNotSpecified;
            _self[_DYN_MESSAGE$1 ] = dataSanitizeMessage(logger, message);
            _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
            _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
            if (severityLevel) {
                _self[_DYN_SEVERITY_LEVEL ] = severityLevel;
            }
        }
        Trace.envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
        Trace.dataType = "MessageData";
        return Trace;
    }());

    var PageViewPerformance = /** @class */ (function () {
        function PageViewPerformance(logger, name, url, unused, properties, measurements, cs4BaseData) {
            this.aiDataContract = {
                ver: 1 ,
                name: 0 ,
                url: 0 ,
                duration: 0 ,
                perfTotal: 0 ,
                networkConnect: 0 ,
                sentRequest: 0 ,
                receivedResponse: 0 ,
                domProcessing: 0 ,
                properties: 0 ,
                measurements: 0
            };
            var _self = this;
            _self.ver = 2;
            _self.url = dataSanitizeUrl(logger, url);
            _self[_DYN_NAME$2 ] = dataSanitizeString(logger, name) || strNotSpecified;
            _self[_DYN_PROPERTIES ] = dataSanitizeProperties(logger, properties);
            _self[_DYN_MEASUREMENTS$1 ] = dataSanitizeMeasurements(logger, measurements);
            if (cs4BaseData) {
                _self.domProcessing = cs4BaseData.domProcessing;
                _self[_DYN_DURATION$1 ] = cs4BaseData[_DYN_DURATION$1 ];
                _self.networkConnect = cs4BaseData.networkConnect;
                _self.perfTotal = cs4BaseData.perfTotal;
                _self[_DYN_RECEIVED_RESPONSE ] = cs4BaseData[_DYN_RECEIVED_RESPONSE ];
                _self.sentRequest = cs4BaseData.sentRequest;
            }
        }
        PageViewPerformance.envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
        PageViewPerformance.dataType = "PageviewPerformanceData";
        return PageViewPerformance;
    }());

    var Data = /** @class */ (function () {
        function Data(baseType, data) {
            this.aiDataContract = {
                baseType: 1 ,
                baseData: 1
            };
            this.baseType = baseType;
            this.baseData = data;
        }
        return Data;
    }());

    var SeverityLevel = createEnumStyle({
        Verbose: 0 ,
        Information: 1 ,
        Warning: 2 ,
        Error: 3 ,
        Critical: 4
    });

    var ConfigurationManager = /** @class */ (function () {
        function ConfigurationManager() {
        }
        ConfigurationManager.getConfig = function (config, field, identifier, defaultValue) {
            if (defaultValue === void 0) { defaultValue = false; }
            var configValue;
            if (identifier && config[_DYN_EXTENSION_CONFIG ] && config[_DYN_EXTENSION_CONFIG ][identifier] && !isNullOrUndefined(config[_DYN_EXTENSION_CONFIG ][identifier][field])) {
                configValue = config[_DYN_EXTENSION_CONFIG ][identifier][field];
            }
            else {
                configValue = config[field];
            }
            return !isNullOrUndefined(configValue) ? configValue : defaultValue;
        };
        return ConfigurationManager;
    }());

    function _aiNameFunc(baseName) {
        var aiName = "ai." + baseName + ".";
        return function (name) {
            return aiName + name;
        };
    }
    var _aiApplication = _aiNameFunc("application");
    var _aiDevice = _aiNameFunc("device");
    var _aiLocation = _aiNameFunc("location");
    var _aiOperation = _aiNameFunc("operation");
    var _aiSession = _aiNameFunc("session");
    var _aiUser = _aiNameFunc("user");
    var _aiCloud = _aiNameFunc("cloud");
    var _aiInternal = _aiNameFunc("internal");
    var ContextTagKeys = /** @class */ (function (_super) {
        __extendsFn(ContextTagKeys, _super);
        function ContextTagKeys() {
            return _super.call(this) || this;
        }
        return ContextTagKeys;
    }(createClassFromInterface({
        applicationVersion: _aiApplication("ver"),
        applicationBuild: _aiApplication("build"),
        applicationTypeId: _aiApplication("typeId"),
        applicationId: _aiApplication("applicationId"),
        applicationLayer: _aiApplication("layer"),
        deviceId: _aiDevice("id"),
        deviceIp: _aiDevice("ip"),
        deviceLanguage: _aiDevice("language"),
        deviceLocale: _aiDevice("locale"),
        deviceModel: _aiDevice("model"),
        deviceFriendlyName: _aiDevice("friendlyName"),
        deviceNetwork: _aiDevice("network"),
        deviceNetworkName: _aiDevice("networkName"),
        deviceOEMName: _aiDevice("oemName"),
        deviceOS: _aiDevice("os"),
        deviceOSVersion: _aiDevice("osVersion"),
        deviceRoleInstance: _aiDevice("roleInstance"),
        deviceRoleName: _aiDevice("roleName"),
        deviceScreenResolution: _aiDevice("screenResolution"),
        deviceType: _aiDevice("type"),
        deviceMachineName: _aiDevice("machineName"),
        deviceVMName: _aiDevice("vmName"),
        deviceBrowser: _aiDevice("browser"),
        deviceBrowserVersion: _aiDevice("browserVersion"),
        locationIp: _aiLocation("ip"),
        locationCountry: _aiLocation("country"),
        locationProvince: _aiLocation("province"),
        locationCity: _aiLocation("city"),
        operationId: _aiOperation("id"),
        operationName: _aiOperation("name"),
        operationParentId: _aiOperation("parentId"),
        operationRootId: _aiOperation("rootId"),
        operationSyntheticSource: _aiOperation("syntheticSource"),
        operationCorrelationVector: _aiOperation("correlationVector"),
        sessionId: _aiSession("id"),
        sessionIsFirst: _aiSession("isFirst"),
        sessionIsNew: _aiSession("isNew"),
        userAccountAcquisitionDate: _aiUser("accountAcquisitionDate"),
        userAccountId: _aiUser("accountId"),
        userAgent: _aiUser("userAgent"),
        userId: _aiUser("id"),
        userStoreRegion: _aiUser("storeRegion"),
        userAuthUserId: _aiUser("authUserId"),
        userAnonymousUserAcquisitionDate: _aiUser("anonUserAcquisitionDate"),
        userAuthenticatedUserAcquisitionDate: _aiUser("authUserAcquisitionDate"),
        cloudName: _aiCloud("name"),
        cloudRole: _aiCloud("role"),
        cloudRoleVer: _aiCloud("roleVer"),
        cloudRoleInstance: _aiCloud("roleInstance"),
        cloudEnvironment: _aiCloud("environment"),
        cloudLocation: _aiCloud("location"),
        cloudDeploymentUnit: _aiCloud("deploymentUnit"),
        internalNodeName: _aiInternal("nodeName"),
        internalSdkVersion: _aiInternal("sdkVersion"),
        internalAgentVersion: _aiInternal("agentVersion"),
        internalSnippet: _aiInternal("snippet"),
        internalSdkSrc: _aiInternal("sdkSrc")
    })));

    function createTelemetryItem(item, baseType, envelopeName, logger, customProperties, systemProperties) {
        var _a;
        envelopeName = dataSanitizeString(logger, envelopeName) || strNotSpecified;
        if (isNullOrUndefined(item) ||
            isNullOrUndefined(baseType) ||
            isNullOrUndefined(envelopeName)) {
            throwError("Input doesn't contain all required fields");
        }
        var iKey = "";
        if (item[strIkey]) {
            iKey = item[strIkey];
            delete item[strIkey];
        }
        var telemetryItem = (_a = {},
            _a[_DYN_NAME$2 ] = envelopeName,
            _a.time = toISOString(new Date()),
            _a.iKey = iKey,
            _a.ext = systemProperties ? systemProperties : {},
            _a.tags = [],
            _a.data = {},
            _a.baseType = baseType,
            _a.baseData = item
        ,
            _a);
        if (!isNullOrUndefined(customProperties)) {
            objForEachKey(customProperties, function (prop, value) {
                telemetryItem.data[prop] = value;
            });
        }
        return telemetryItem;
    }
    var TelemetryItemCreator = /** @class */ (function () {
        function TelemetryItemCreator() {
        }
        TelemetryItemCreator.create = createTelemetryItem;
        return TelemetryItemCreator;
    }());

    var Extensions = {
        UserExt: "user",
        DeviceExt: "device",
        TraceExt: "trace",
        WebExt: "web",
        AppExt: "app",
        OSExt: "os",
        SessionExt: "ses",
        SDKExt: "sdk"
    };
    var CtxTagKeys = new ContextTagKeys();

    var PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
    var BreezeChannelIdentifier = "AppInsightsChannelPlugin";
    var AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";

    var STR_DURATION$1 = "duration";
    var STR_PROPERTIES = "properties";

    var _DYN_REQUEST_URL = "requestUrl";
    var _DYN_INST = "inst";
    var _DYN_LENGTH$3 = "length";
    var _DYN_TRACE_ID$1 = "traceID";
    var _DYN_SPAN_ID = "spanID";
    var _DYN_TRACE_FLAGS = "traceFlags";
    var _DYN_CONTEXT$1 = "context";
    var _DYN_TRACE_ID0 = "traceId";
    var _DYN_SPAN_ID1 = "spanId";
    var _DYN_CORE$1 = "core";
    var _DYN_INCLUDE_CORRELATION_2 = "includeCorrelationHeaders";
    var _DYN_CAN_INCLUDE_CORRELAT3 = "canIncludeCorrelationHeader";
    var _DYN_GET_ABSOLUTE_URL = "getAbsoluteUrl";
    var _DYN_HEADERS = "headers";
    var _DYN_REQUEST_HEADERS = "requestHeaders";
    var _DYN_APP_ID = "appId";
    var _DYN_SET_REQUEST_HEADER$1 = "setRequestHeader";
    var _DYN_TRACK_DEPENDENCY_DAT4 = "trackDependencyDataInternal";
    var _DYN_DISTRIBUTED_TRACING_5 = "distributedTracingMode";
    var _DYN_START_TIME = "startTime";
    var _DYN_TO_LOWER_CASE = "toLowerCase";
    var _DYN_ENABLE_REQUEST_HEADE6 = "enableRequestHeaderTracking";
    var _DYN_ENABLE_AJAX_ERROR_ST7 = "enableAjaxErrorStatusText";
    var _DYN_ENABLE_AJAX_PERF_TRA8 = "enableAjaxPerfTracking";
    var _DYN_MAX_AJAX_CALLS_PER_V9 = "maxAjaxCallsPerView";
    var _DYN_ENABLE_RESPONSE_HEAD10 = "enableResponseHeaderTracking";
    var _DYN_EXCLUDE_REQUEST_FROM11 = "excludeRequestFromAutoTrackingPatterns";
    var _DYN_ADD_REQUEST_CONTEXT = "addRequestContext";
    var _DYN_DISABLE_AJAX_TRACKIN12 = "disableAjaxTracking";
    var _DYN_DISABLE_FETCH_TRACKI13 = "disableFetchTracking";
    var _DYN_STATUS = "status";
    var _DYN_STATUS_TEXT = "statusText";
    var _DYN_HEADER_MAP = "headerMap";
    var _DYN_OPEN_DONE = "openDone";
    var _DYN_SEND_DONE = "sendDone";
    var _DYN_REQUEST_SENT_TIME = "requestSentTime";
    var _DYN_ABORT_DONE = "abortDone";
    var _DYN_GET_TRACE_ID = "getTraceId";
    var _DYN_GET_TRACE_FLAGS = "getTraceFlags";
    var _DYN_METHOD = "method";
    var _DYN_ERROR_STATUS_TEXT = "errorStatusText";
    var _DYN_STATE_CHANGE_ATTACHE14 = "stateChangeAttached";
    var _DYN_RESPONSE_TEXT = "responseText";
    var _DYN_RESPONSE_FINISHED_TI15 = "responseFinishedTime";
    var _DYN__CREATE_TRACK_ITEM = "CreateTrackItem";
    var _DYN_RESPONSE = "response";
    var _DYN_GET_ALL_RESPONSE_HEA16 = "getAllResponseHeaders";
    var _DYN_GET_PART_APROPS = "getPartAProps";
    var _DYN_GET_CORRELATION_CONT17 = "getCorrelationContext";
    var _DYN_PERF_MARK = "perfMark";
    var _DYN_AJAX_PERF_LOOKUP_DEL18 = "ajaxPerfLookupDelay";
    var _DYN_NAME$1 = "name";
    var _DYN_PERF_TIMING = "perfTiming";
    var _DYN_AJAX_DIAGNOSTICS_MES19 = "ajaxDiagnosticsMessage";
    var _DYN_CORRELATION_CONTEXT = "correlationContext";
    var _DYN_AJAX_TOTAL_DURATION = "ajaxTotalDuration";
    var _DYN_EVENT_TRACE_CTX = "eventTraceCtx";

    function _calcPerfDuration(resourceEntry, start, end) {
        var result = 0;
        var from = resourceEntry[start];
        var to = resourceEntry[end];
        if (from && to) {
            result = dateTimeUtilsDuration(from, to);
        }
        return result;
    }
    function _setPerfDuration(props, name, resourceEntry, start, end) {
        var result = 0;
        var value = _calcPerfDuration(resourceEntry, start, end);
        if (value) {
            result = _setPerfValue(props, name, msToTimeSpan(value));
        }
        return result;
    }
    function _setPerfValue(props, name, value) {
        var strPerf = "ajaxPerf";
        var result = 0;
        if (props && name && value) {
            var perfData = props[strPerf] = (props[strPerf] || {});
            perfData[name] = value;
            result = 1;
        }
        return result;
    }
    function _populatePerfData(ajaxData, dependency) {
        var resourceEntry = ajaxData[_DYN_PERF_TIMING ];
        var props = dependency[STR_PROPERTIES ] || {};
        var propsSet = 0;
        var strName = "name";
        var strStart = "Start";
        var strEnd = "End";
        var strDomainLookup = "domainLookup";
        var strConnect = "connect";
        var strRedirect = "redirect";
        var strRequest = "request";
        var strResponse = "response";
        var strStartTime = "startTime";
        var strDomainLookupStart = strDomainLookup + strStart;
        var strDomainLookupEnd = strDomainLookup + strEnd;
        var strConnectStart = strConnect + strStart;
        var strConnectEnd = strConnect + strEnd;
        var strRequestStart = strRequest + strStart;
        var strRequestEnd = strRequest + strEnd;
        var strResponseStart = strResponse + strStart;
        var strResponseEnd = strResponse + strEnd;
        var strRedirectStart = strRedirect + strStart;
        var strRedirectEnd = strRedirect = strEnd;
        var strTransferSize = "transferSize";
        var strEncodedBodySize = "encodedBodySize";
        var strDecodedBodySize = "decodedBodySize";
        var strServerTiming = "serverTiming";
        if (resourceEntry) {
            propsSet |= _setPerfDuration(props, strRedirect, resourceEntry, strRedirectStart, strRedirectEnd);
            propsSet |= _setPerfDuration(props, strDomainLookup, resourceEntry, strDomainLookupStart, strDomainLookupEnd);
            propsSet |= _setPerfDuration(props, strConnect, resourceEntry, strConnectStart, strConnectEnd);
            propsSet |= _setPerfDuration(props, strRequest, resourceEntry, strRequestStart, strRequestEnd);
            propsSet |= _setPerfDuration(props, strResponse, resourceEntry, strResponseStart, strResponseEnd);
            propsSet |= _setPerfDuration(props, "networkConnect", resourceEntry, strStartTime, strConnectEnd);
            propsSet |= _setPerfDuration(props, "sentRequest", resourceEntry, strRequestStart, strResponseEnd);
            var duration = resourceEntry[STR_DURATION$1 ];
            if (!duration) {
                duration = _calcPerfDuration(resourceEntry, strStartTime, strResponseEnd) || 0;
            }
            propsSet |= _setPerfValue(props, STR_DURATION$1, duration);
            propsSet |= _setPerfValue(props, "perfTotal", duration);
            var serverTiming = resourceEntry[strServerTiming];
            if (serverTiming) {
                var server_1 = {};
                arrForEach(serverTiming, function (value, idx) {
                    var name = normalizeJsName(value[strName] || "" + idx);
                    var newValue = server_1[name] || {};
                    objForEachKey(value, function (key, val) {
                        if (key !== strName && isString(val) || isNumber(val)) {
                            if (newValue[key]) {
                                val = newValue[key] + ";" + val;
                            }
                            if (val || !isString(val)) {
                                newValue[key] = val;
                            }
                        }
                    });
                    server_1[name] = newValue;
                });
                propsSet |= _setPerfValue(props, strServerTiming, server_1);
            }
            propsSet |= _setPerfValue(props, strTransferSize, resourceEntry[strTransferSize]);
            propsSet |= _setPerfValue(props, strEncodedBodySize, resourceEntry[strEncodedBodySize]);
            propsSet |= _setPerfValue(props, strDecodedBodySize, resourceEntry[strDecodedBodySize]);
        }
        else {
            if (ajaxData[_DYN_PERF_MARK ]) {
                propsSet |= _setPerfValue(props, "missing", ajaxData.perfAttempts);
            }
        }
        if (propsSet) {
            dependency[STR_PROPERTIES ] = props;
        }
    }
    var XHRMonitoringState = /** @class */ (function () {
        function XHRMonitoringState() {
            var self = this;
            self[_DYN_OPEN_DONE ] = false;
            self.setRequestHeaderDone = false;
            self[_DYN_SEND_DONE ] = false;
            self[_DYN_ABORT_DONE ] = false;
            self[_DYN_STATE_CHANGE_ATTACHE14 ] = false;
        }
        return XHRMonitoringState;
    }());
    var ajaxRecord = /** @class */ (function () {
        function ajaxRecord(traceId, spanId, logger, traceCtx) {
            var _a;
            var self = this;
            var _logger = logger;
            var strResponseText = "responseText";
            self[_DYN_PERF_MARK ] = null;
            self.completed = false;
            self.requestHeadersSize = null;
            self[_DYN_REQUEST_HEADERS ] = null;
            self.responseReceivingDuration = null;
            self.callbackDuration = null;
            self[_DYN_AJAX_TOTAL_DURATION ] = null;
            self.aborted = 0;
            self.pageUrl = null;
            self[_DYN_REQUEST_URL ] = null;
            self.requestSize = 0;
            self[_DYN_METHOD ] = null;
            self[_DYN_STATUS ] = null;
            self[_DYN_REQUEST_SENT_TIME ] = null;
            self.responseStartedTime = null;
            self[_DYN_RESPONSE_FINISHED_TI15 ] = null;
            self.callbackFinishedTime = null;
            self.endTime = null;
            self.xhrMonitoringState = new XHRMonitoringState();
            self.clientFailure = 0;
            self[_DYN_TRACE_ID$1 ] = traceId;
            self[_DYN_SPAN_ID ] = spanId;
            self[_DYN_TRACE_FLAGS ] = traceCtx === null || traceCtx === void 0 ? void 0 : traceCtx.getTraceFlags();
            if (traceCtx) {
                self[_DYN_EVENT_TRACE_CTX ] = (_a = {},
                    _a[_DYN_TRACE_ID0 ] = traceCtx[_DYN_GET_TRACE_ID ](),
                    _a[_DYN_SPAN_ID1 ] = traceCtx.getSpanId(),
                    _a[_DYN_TRACE_FLAGS ] = traceCtx[_DYN_GET_TRACE_FLAGS ](),
                    _a);
            }
            else {
                self[_DYN_EVENT_TRACE_CTX ] = null;
            }
            dynamicProto(ajaxRecord, self, function (self) {
                self.getAbsoluteUrl = function () {
                    return self[_DYN_REQUEST_URL ] ? urlGetAbsoluteUrl(self[_DYN_REQUEST_URL ]) : null;
                };
                self.getPathName = function () {
                    return self[_DYN_REQUEST_URL ] ? dataSanitizeUrl(_logger, urlGetCompleteUrl(self[_DYN_METHOD ], self[_DYN_REQUEST_URL ])) : null;
                };
                self[_DYN__CREATE_TRACK_ITEM ] = function (ajaxType, enableRequestHeaderTracking, getResponse) {
                    var _a;
                    self.ajaxTotalDuration = Math.round(dateTimeUtilsDuration(self.requestSentTime, self.responseFinishedTime) * 1000) / 1000;
                    if (self[_DYN_AJAX_TOTAL_DURATION ] < 0) {
                        return null;
                    }
                    var dependency = (_a = {
                            id: "|" + self[_DYN_TRACE_ID$1 ] + "." + self[_DYN_SPAN_ID ],
                            target: self[_DYN_GET_ABSOLUTE_URL ]()
                        },
                        _a[_DYN_NAME$1 ] = self.getPathName(),
                        _a.type = ajaxType,
                        _a[_DYN_START_TIME ] = null,
                        _a.duration = self[_DYN_AJAX_TOTAL_DURATION ],
                        _a.success = (+(self[_DYN_STATUS ])) >= 200 && (+(self[_DYN_STATUS ])) < 400,
                        _a.responseCode = (+(self[_DYN_STATUS ])),
                        _a.method = self[_DYN_METHOD ],
                        _a[STR_PROPERTIES] = { HttpMethod: self[_DYN_METHOD ] },
                        _a);
                    if (self[_DYN_REQUEST_SENT_TIME ]) {
                        dependency[_DYN_START_TIME ] = new Date();
                        dependency[_DYN_START_TIME ].setTime(self[_DYN_REQUEST_SENT_TIME ]);
                    }
                    _populatePerfData(self, dependency);
                    if (enableRequestHeaderTracking) {
                        if (objKeys(self.requestHeaders)[_DYN_LENGTH$3 ] > 0) {
                            var props = dependency[STR_PROPERTIES ] = dependency[STR_PROPERTIES ] || {};
                            props[_DYN_REQUEST_HEADERS ] = self[_DYN_REQUEST_HEADERS ];
                        }
                    }
                    if (getResponse) {
                        var response = getResponse();
                        if (response) {
                            var correlationContext = response[_DYN_CORRELATION_CONTEXT ];
                            if (correlationContext) {
                                dependency.correlationContext =  correlationContext;
                            }
                            if (response[_DYN_HEADER_MAP ]) {
                                if (objKeys(response.headerMap)[_DYN_LENGTH$3 ] > 0) {
                                    var props = dependency[STR_PROPERTIES ] = dependency[STR_PROPERTIES ] || {};
                                    props.responseHeaders = response[_DYN_HEADER_MAP ];
                                }
                            }
                            if (self.errorStatusText && self[_DYN_STATUS ] >= 400) {
                                var responseType = response.type;
                                var props = dependency[STR_PROPERTIES ] = dependency[STR_PROPERTIES ] || {};
                                if (responseType === "" || responseType === "text") {
                                    props.responseText = response.responseText ? response[_DYN_STATUS_TEXT ] + " - " + response[strResponseText] : response[_DYN_STATUS_TEXT ];
                                }
                                if (responseType === "json") {
                                    props.responseText = response.response ? response[_DYN_STATUS_TEXT ] + " - " + JSON.stringify(response[_DYN_RESPONSE ]) : response[_DYN_STATUS_TEXT ];
                                }
                            }
                        }
                    }
                    return dependency;
                };
                self[_DYN_GET_PART_APROPS ] = function () {
                    var _a;
                    var partA = null;
                    var traceCtx = self[_DYN_EVENT_TRACE_CTX ];
                    if (traceCtx && (traceCtx[_DYN_TRACE_ID0 ] || traceCtx[_DYN_SPAN_ID1 ])) {
                        partA = {};
                        var traceExt = partA[Extensions.TraceExt] = (_a = {},
                            _a[_DYN_TRACE_ID$1 ] = traceCtx[_DYN_TRACE_ID0 ],
                            _a.parentID = traceCtx[_DYN_SPAN_ID1 ],
                            _a);
                        if (!isNullOrUndefined(traceCtx[_DYN_TRACE_FLAGS ])) {
                            traceExt[_DYN_TRACE_FLAGS ] = traceCtx[_DYN_TRACE_FLAGS ];
                        }
                    }
                    return partA;
                };
            });
        }
        ajaxRecord.__ieDyn=1;
        return ajaxRecord;
    }());

    var AJAX_MONITOR_PREFIX = "ai.ajxmn.";
    var strDiagLog = "diagLog";
    var strAjaxData = "ajaxData";
    var strFetch = "fetch";
    var ERROR_HEADER = "Failed to monitor XMLHttpRequest";
    var ERROR_PREFIX = ", monitoring data for this ajax call ";
    var ERROR_POSTFIX = ERROR_PREFIX + "may be incorrect.";
    var ERROR_NOT_SENT = ERROR_PREFIX + "won't be sent.";
    var CORRELATION_HEADER_ERROR = "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.";
    var CUSTOM_REQUEST_CONTEXT_ERROR = "Failed to add custom defined request context as configured call back may missing a null check.";
    var FAILED_TO_CALCULATE_DURATION_ERROR = "Failed to calculate the duration of the ";
    var _markCount = 0;
    function _supportsFetch() {
        var _global = getGlobal();
        if (!_global ||
            isNullOrUndefined(_global.Request) ||
            isNullOrUndefined(_global.Request[strShimPrototype]) ||
            isNullOrUndefined(_global[strFetch])) {
            return null;
        }
        return _global[strFetch];
    }
    function _supportsAjaxMonitoring(ajaxMonitorInstance) {
        var result = false;
        if (isXhrSupported()) {
            var proto = XMLHttpRequest[strShimPrototype];
            result = !isNullOrUndefined(proto) &&
                !isNullOrUndefined(proto.open) &&
                !isNullOrUndefined(proto.send) &&
                !isNullOrUndefined(proto.abort);
        }
        var ieVer = getIEVersion();
        if (ieVer && ieVer < 9) {
            result = false;
        }
        if (result) {
            try {
                var xhr = new XMLHttpRequest();
                xhr[strAjaxData] = {};
                var theOpen = XMLHttpRequest[strShimPrototype].open;
                XMLHttpRequest[strShimPrototype].open = theOpen;
            }
            catch (e) {
                result = false;
                _throwInternalCritical(ajaxMonitorInstance, 15 , "Failed to enable XMLHttpRequest monitoring, extension is not supported", {
                    exception: dumpObj(e)
                });
            }
        }
        return result;
    }
    function _getFailedAjaxDiagnosticsMessage(xhr) {
        var result = "";
        try {
            if (xhr && xhr[strAjaxData] && xhr[strAjaxData][_DYN_REQUEST_URL ]) {
                result += "(url: '" + xhr[strAjaxData][_DYN_REQUEST_URL ] + "')";
            }
        }
        catch (e) {
        }
        return result;
    }
    function _throwInternalCritical(ajaxMonitorInstance, msgId, message, properties, isUserAct) {
        _throwInternal(ajaxMonitorInstance[strDiagLog](), 1 , msgId, message, properties, isUserAct);
    }
    function _throwInternalWarning(ajaxMonitorInstance, msgId, message, properties, isUserAct) {
        _throwInternal(ajaxMonitorInstance[strDiagLog](), 2 , msgId, message, properties, isUserAct);
    }
    function _createErrorCallbackFunc(ajaxMonitorInstance, internalMessage, message) {
        return function (args) {
            _throwInternalCritical(ajaxMonitorInstance, internalMessage, message, {
                ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(args[_DYN_INST ]),
                exception: dumpObj(args.err)
            });
        };
    }
    function _indexOf(value, match) {
        if (value && match) {
            return value.indexOf(match);
        }
        return -1;
    }
    function _addHandler(container, id, theFunc) {
        var theHandler = {
            id: id,
            fn: theFunc
        };
        container.push(theHandler);
        return {
            remove: function () {
                arrForEach(container, function (initializer, idx) {
                    if (initializer.id === theHandler.id) {
                        container.splice(idx, 1);
                        return -1;
                    }
                });
            }
        };
    }
    function _processDependencyContainer(core, container, details, message) {
        var result = true;
        arrForEach(container, function (theFunc, idx) {
            try {
                if (theFunc.fn.call(null, details) === false) {
                    result = false;
                }
            }
            catch (e) {
                _throwInternal(core && core.logger, 1 , 64 , "Dependency " + message + " [#" + idx + "] failed: " + getExceptionName(e), { exception: dumpObj(e) }, true);
            }
        });
        return result;
    }
    function _processDependencyListeners(listeners, core, ajaxData, xhr, input, init) {
        var _a;
        var initializersCount = listeners[_DYN_LENGTH$3 ];
        if (initializersCount > 0) {
            var details = (_a = {},
                _a[_DYN_CORE$1 ] = core,
                _a.xhr = xhr,
                _a.input = input,
                _a.init = init,
                _a.traceId = ajaxData[_DYN_TRACE_ID$1 ],
                _a.spanId = ajaxData[_DYN_SPAN_ID ],
                _a.traceFlags = ajaxData[_DYN_TRACE_FLAGS ],
                _a.context = ajaxData[_DYN_CONTEXT$1 ] || {},
                _a);
            _processDependencyContainer(core, listeners, details, "listener");
            ajaxData[_DYN_TRACE_ID$1 ] = details[_DYN_TRACE_ID0 ];
            ajaxData[_DYN_SPAN_ID ] = details[_DYN_SPAN_ID1 ];
            ajaxData[_DYN_TRACE_FLAGS ] = details[_DYN_TRACE_FLAGS ];
            ajaxData[_DYN_CONTEXT$1 ] = details[_DYN_CONTEXT$1 ];
        }
    }
    var BLOB_CORE = "*.blob.core.";
    var DfltAjaxCorrelationHeaderExDomains = deepFreeze([
        BLOB_CORE + "windows.net",
        BLOB_CORE + "chinacloudapi.cn",
        BLOB_CORE + "cloudapi.de",
        BLOB_CORE + "usgovcloudapi.net"
    ]);
    var _internalExcludeEndpoints = [
        /https:\/\/[^\/]*(\.pipe\.aria|aria\.pipe|events\.data|collector\.azure)\.[^\/]+\/(OneCollector\/1|Collector\/3)\.0/i
    ];
    function _getDefaultConfig$1() {
        var _a;
        var config = (_a = {},
            _a[_DYN_MAX_AJAX_CALLS_PER_V9 ] = 500,
            _a[_DYN_DISABLE_AJAX_TRACKIN12 ] = false,
            _a[_DYN_DISABLE_FETCH_TRACKI13 ] = false,
            _a[_DYN_EXCLUDE_REQUEST_FROM11 ] = undefined,
            _a.disableCorrelationHeaders = false,
            _a.distributedTracingMode = 1 ,
            _a.correlationHeaderExcludedDomains = DfltAjaxCorrelationHeaderExDomains,
            _a.correlationHeaderDomains = undefined,
            _a.correlationHeaderExcludePatterns = undefined,
            _a[_DYN_APP_ID ] = undefined,
            _a.enableCorsCorrelation = false,
            _a[_DYN_ENABLE_REQUEST_HEADE6 ] = false,
            _a[_DYN_ENABLE_RESPONSE_HEAD10 ] = false,
            _a[_DYN_ENABLE_AJAX_ERROR_ST7 ] = false,
            _a[_DYN_ENABLE_AJAX_PERF_TRA8 ] = false,
            _a.maxAjaxPerfLookupAttempts = 3,
            _a[_DYN_AJAX_PERF_LOOKUP_DEL18 ] = 25,
            _a.ignoreHeaders = [
                "Authorization",
                "X-API-Key",
                "WWW-Authenticate"
            ],
            _a[_DYN_ADD_REQUEST_CONTEXT ] = undefined,
            _a.addIntEndpoints = true,
            _a);
        return config;
    }
    function _getEmptyConfig() {
        var emptyConfig = _getDefaultConfig$1();
        objForEachKey(emptyConfig, function (value) {
            emptyConfig[value] = undefined;
        });
        return emptyConfig;
    }
    var AjaxMonitor = /** @class */ (function (_super) {
        __extendsFn(AjaxMonitor, _super);
        function AjaxMonitor() {
            var _this = _super.call(this) || this;
            _this.identifier = AjaxMonitor.identifier;
            _this.priority = 120;
            var _fetchInitialized;
            var _xhrInitialized;
            var _currentWindowHost;
            var _config;
            var _enableRequestHeaderTracking;
            var _enableAjaxErrorStatusText;
            var _trackAjaxAttempts;
            var _context;
            var _isUsingW3CHeaders;
            var _isUsingAIHeaders;
            var _markPrefix;
            var _enableAjaxPerfTracking;
            var _maxAjaxCallsPerView;
            var _enableResponseHeaderTracking;
            var _disabledUrls;
            var _disableAjaxTracking;
            var _disableFetchTracking;
            var _excludeRequestFromAutoTrackingPatterns;
            var _addRequestContext;
            var _evtNamespace;
            var _dependencyHandlerId;
            var _dependencyListeners;
            var _dependencyInitializers;
            dynamicProto(AjaxMonitor, _this, function (_self, _base) {
                var _addHook = _base._addHook;
                _initDefaults();
                _self.initialize = function (config, core, extensions, pluginChain) {
                    if (!_self.isInitialized()) {
                        _base.initialize(config, core, extensions, pluginChain);
                        _evtNamespace = mergeEvtNamespace(createUniqueNamespace("ajax"), core && core.evtNamespace && core.evtNamespace());
                        _populateDefaults(config);
                        _instrumentXhr();
                        _instrumentFetch();
                        _populateContext();
                    }
                };
                _self._doTeardown = function () {
                    _initDefaults();
                };
                _self.trackDependencyData = function (dependency, properties) {
                    _reportDependencyInternal(_dependencyInitializers, _self[_DYN_CORE$1 ], null, dependency, properties);
                };
                _self[_DYN_INCLUDE_CORRELATION_2 ] = function (ajaxData, input, init, xhr) {
                    var currentWindowHost = _self["_currentWindowHost"] || _currentWindowHost;
                    _processDependencyListeners(_dependencyListeners, _self[_DYN_CORE$1 ], ajaxData, xhr, input, init);
                    if (input) {
                        if (CorrelationIdHelper[_DYN_CAN_INCLUDE_CORRELAT3 ](_config, ajaxData[_DYN_GET_ABSOLUTE_URL ](), currentWindowHost)) {
                            if (!init) {
                                init = {};
                            }
                            var headers = new Headers(init[_DYN_HEADERS ] || (input instanceof Request ? (input[_DYN_HEADERS ] || {}) : {}));
                            if (_isUsingAIHeaders) {
                                var id = "|" + ajaxData[_DYN_TRACE_ID$1 ] + "." + ajaxData[_DYN_SPAN_ID ];
                                headers.set(RequestHeaders[3 ], id);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData[_DYN_REQUEST_HEADERS ][RequestHeaders[3 ]] = id;
                                }
                            }
                            var appId = _config[_DYN_APP_ID ] || (_context && _context[_DYN_APP_ID ]());
                            if (appId) {
                                headers.set(RequestHeaders[0 ], RequestHeaders[2 ] + appId);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData[_DYN_REQUEST_HEADERS ][RequestHeaders[0 ]] = RequestHeaders[2 ] + appId;
                                }
                            }
                            if (_isUsingW3CHeaders) {
                                var traceFlags = ajaxData[_DYN_TRACE_FLAGS ];
                                if (isNullOrUndefined(traceFlags)) {
                                    traceFlags = 0x01;
                                }
                                var traceParent = formatTraceParent(createTraceParent(ajaxData[_DYN_TRACE_ID$1 ], ajaxData[_DYN_SPAN_ID ], traceFlags));
                                headers.set(RequestHeaders[4 ], traceParent);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData[_DYN_REQUEST_HEADERS ][RequestHeaders[4 ]] = traceParent;
                                }
                            }
                            init[_DYN_HEADERS ] = headers;
                        }
                        return init;
                    }
                    else if (xhr) {
                        if (CorrelationIdHelper[_DYN_CAN_INCLUDE_CORRELAT3 ](_config, ajaxData[_DYN_GET_ABSOLUTE_URL ](), currentWindowHost)) {
                            if (_isUsingAIHeaders) {
                                var id = "|" + ajaxData[_DYN_TRACE_ID$1 ] + "." + ajaxData[_DYN_SPAN_ID ];
                                xhr[_DYN_SET_REQUEST_HEADER$1 ](RequestHeaders[3 ], id);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData[_DYN_REQUEST_HEADERS ][RequestHeaders[3 ]] = id;
                                }
                            }
                            var appId = _config[_DYN_APP_ID ] || (_context && _context[_DYN_APP_ID ]());
                            if (appId) {
                                xhr[_DYN_SET_REQUEST_HEADER$1 ](RequestHeaders[0 ], RequestHeaders[2 ] + appId);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData[_DYN_REQUEST_HEADERS ][RequestHeaders[0 ]] = RequestHeaders[2 ] + appId;
                                }
                            }
                            if (_isUsingW3CHeaders) {
                                var traceFlags = ajaxData[_DYN_TRACE_FLAGS ];
                                if (isNullOrUndefined(traceFlags)) {
                                    traceFlags = 0x01;
                                }
                                var traceParent = formatTraceParent(createTraceParent(ajaxData[_DYN_TRACE_ID$1 ], ajaxData[_DYN_SPAN_ID ], traceFlags));
                                xhr[_DYN_SET_REQUEST_HEADER$1 ](RequestHeaders[4 ], traceParent);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData[_DYN_REQUEST_HEADERS ][RequestHeaders[4 ]] = traceParent;
                                }
                            }
                        }
                        return xhr;
                    }
                    return undefined;
                };
                _self[_DYN_TRACK_DEPENDENCY_DAT4 ] = function (dependency, properties, systemProperties) {
                    if (_maxAjaxCallsPerView === -1 || _trackAjaxAttempts < _maxAjaxCallsPerView) {
                        if ((_config[_DYN_DISTRIBUTED_TRACING_5 ] === 2
                            || _config[_DYN_DISTRIBUTED_TRACING_5 ] === 1 )
                            && typeof dependency.id === "string" && dependency.id[dependency.id[_DYN_LENGTH$3 ] - 1] !== ".") {
                            dependency.id += ".";
                        }
                        if (isNullOrUndefined(dependency[_DYN_START_TIME ])) {
                            dependency[_DYN_START_TIME ] = new Date();
                        }
                        var item = createTelemetryItem(dependency, RemoteDependencyData.dataType, RemoteDependencyData.envelopeType, _self[strDiagLog](), properties, systemProperties);
                        _self[_DYN_CORE$1 ].track(item);
                    }
                    else if (_trackAjaxAttempts === _maxAjaxCallsPerView) {
                        _throwInternalCritical(_self, 55 , "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.", true);
                    }
                    ++_trackAjaxAttempts;
                };
                _self.addDependencyListener = function (dependencyListener) {
                    return _addHandler(_dependencyListeners, _dependencyHandlerId++, dependencyListener);
                };
                _self.addDependencyInitializer = function (dependencyInitializer) {
                    return _addHandler(_dependencyInitializers, _dependencyHandlerId++, dependencyInitializer);
                };
                function _initDefaults() {
                    var location = getLocation();
                    _fetchInitialized = false;
                    _xhrInitialized = false;
                    _currentWindowHost = location && location.host && location.host[_DYN_TO_LOWER_CASE ]();
                    _config = AjaxMonitor.getEmptyConfig();
                    _enableRequestHeaderTracking = false;
                    _enableAjaxErrorStatusText = false;
                    _trackAjaxAttempts = 0;
                    _context = null;
                    _isUsingW3CHeaders = false;
                    _isUsingAIHeaders = false;
                    _markPrefix = null;
                    _enableAjaxPerfTracking = false;
                    _maxAjaxCallsPerView = 0;
                    _enableResponseHeaderTracking = false;
                    _disabledUrls = {};
                    _disableAjaxTracking = false;
                    _disableFetchTracking = false;
                    _excludeRequestFromAutoTrackingPatterns = null;
                    _addRequestContext = null;
                    _evtNamespace = null;
                    _dependencyHandlerId = 0;
                    _dependencyListeners = [];
                    _dependencyInitializers = [];
                }
                function _populateDefaults(config) {
                    var ctx = createProcessTelemetryContext(null, config, _self[_DYN_CORE$1 ]);
                    _config = _getEmptyConfig();
                    var defaultConfig = _getDefaultConfig$1();
                    objForEachKey(defaultConfig, function (field, value) {
                        _config[field] = ctx.getConfig(AjaxMonitor.identifier, field, value);
                    });
                    var distributedTracingMode = _config[_DYN_DISTRIBUTED_TRACING_5 ];
                    _enableRequestHeaderTracking = _config[_DYN_ENABLE_REQUEST_HEADE6 ];
                    _enableAjaxErrorStatusText = _config[_DYN_ENABLE_AJAX_ERROR_ST7 ];
                    _enableAjaxPerfTracking = _config[_DYN_ENABLE_AJAX_PERF_TRA8 ];
                    _maxAjaxCallsPerView = _config[_DYN_MAX_AJAX_CALLS_PER_V9 ];
                    _enableResponseHeaderTracking = _config[_DYN_ENABLE_RESPONSE_HEAD10 ];
                    _excludeRequestFromAutoTrackingPatterns = [].concat(_config[_DYN_EXCLUDE_REQUEST_FROM11 ] || [], _config.addIntEndpoints !== false ? _internalExcludeEndpoints : []);
                    _addRequestContext = _config[_DYN_ADD_REQUEST_CONTEXT ];
                    _isUsingAIHeaders = distributedTracingMode === 0  || distributedTracingMode === 1 ;
                    _isUsingW3CHeaders = distributedTracingMode === 1  || distributedTracingMode === 2 ;
                    if (_enableAjaxPerfTracking) {
                        var iKey = config.instrumentationKey || "unkwn";
                        if (iKey[_DYN_LENGTH$3 ] > 5) {
                            _markPrefix = AJAX_MONITOR_PREFIX + iKey.substring(iKey[_DYN_LENGTH$3 ] - 5) + ".";
                        }
                        else {
                            _markPrefix = AJAX_MONITOR_PREFIX + iKey + ".";
                        }
                    }
                    _disableAjaxTracking = !!_config[_DYN_DISABLE_AJAX_TRACKIN12 ];
                    _disableFetchTracking = !!_config[_DYN_DISABLE_FETCH_TRACKI13 ];
                }
                function _populateContext() {
                    var propExt = _self[_DYN_CORE$1 ].getPlugin(PropertiesPluginIdentifier);
                    if (propExt) {
                        _context = propExt.plugin[_DYN_CONTEXT$1 ];
                    }
                }
                function _canIncludeHeaders(header) {
                    var rlt = true;
                    if (header || _config.ignoreHeaders) {
                        arrForEach(_config.ignoreHeaders, (function (key) {
                            if (key[_DYN_TO_LOWER_CASE ]() === header[_DYN_TO_LOWER_CASE ]()) {
                                rlt = false;
                                return -1;
                            }
                        }));
                    }
                    return rlt;
                }
                function _instrumentFetch() {
                    var fetch = _supportsFetch();
                    if (!fetch) {
                        return;
                    }
                    var global = getGlobal();
                    var isPolyfill = fetch.polyfill;
                    if (!_disableFetchTracking && !_fetchInitialized) {
                        _addHook(InstrumentFunc(global, strFetch, {
                            ns: _evtNamespace,
                            req: function (callDetails, input, init) {
                                var fetchData;
                                if (!_disableFetchTracking && _fetchInitialized &&
                                    !_isDisabledRequest(null, input, init) &&
                                    !(isPolyfill && _xhrInitialized)) {
                                    var ctx = callDetails.ctx();
                                    fetchData = _createFetchRecord(input, init);
                                    var newInit = _self[_DYN_INCLUDE_CORRELATION_2 ](fetchData, input, init);
                                    if (newInit !== init) {
                                        callDetails.set(1, newInit);
                                    }
                                    ctx.data = fetchData;
                                }
                            },
                            rsp: function (callDetails, input) {
                                if (!_disableFetchTracking) {
                                    var fetchData_1 = callDetails.ctx().data;
                                    if (fetchData_1) {
                                        callDetails.rslt = callDetails.rslt.then(function (response) {
                                            _reportFetchMetrics(callDetails, (response || {})[_DYN_STATUS ], input, response, fetchData_1, function () {
                                                var _a;
                                                var ajaxResponse = (_a = {
                                                        statusText: response[_DYN_STATUS_TEXT ]
                                                    },
                                                    _a[_DYN_HEADER_MAP ] = null,
                                                    _a[_DYN_CORRELATION_CONTEXT ] = _getFetchCorrelationContext(response),
                                                    _a);
                                                if (_enableResponseHeaderTracking) {
                                                    var responseHeaderMap_1 = {};
                                                    response.headers.forEach(function (value, name) {
                                                        if (_canIncludeHeaders(name)) {
                                                            responseHeaderMap_1[name] = value;
                                                        }
                                                    });
                                                    ajaxResponse[_DYN_HEADER_MAP ] = responseHeaderMap_1;
                                                }
                                                return ajaxResponse;
                                            });
                                            return response;
                                        })["catch"](function (reason) {
                                            _reportFetchMetrics(callDetails, 0, input, null, fetchData_1, null);
                                            throw reason;
                                        });
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 15 , "Failed to monitor Window.fetch" + ERROR_POSTFIX)
                        }));
                        _fetchInitialized = true;
                    }
                    else if (isPolyfill) {
                        _addHook(InstrumentFunc(global, strFetch, {
                            ns: _evtNamespace,
                            req: function (callDetails, input, init) {
                                _isDisabledRequest(null, input, init);
                            }
                        }));
                    }
                    if (isPolyfill) {
                        global[strFetch].polyfill = isPolyfill;
                    }
                }
                function _hookProto(target, funcName, callbacks) {
                    _addHook(InstrumentProto(target, funcName, callbacks));
                }
                function _instrumentXhr() {
                    if (_supportsAjaxMonitoring(_self) && !_disableAjaxTracking && !_xhrInitialized) {
                        _hookProto(XMLHttpRequest, "open", {
                            ns: _evtNamespace,
                            req: function (args, method, url, async) {
                                if (!_disableAjaxTracking) {
                                    var xhr = args[_DYN_INST ];
                                    var ajaxData = xhr[strAjaxData];
                                    if (!_isDisabledRequest(xhr, url) && _isMonitoredXhrInstance(xhr, true)) {
                                        if (!ajaxData || !ajaxData.xhrMonitoringState[_DYN_OPEN_DONE ]) {
                                            _openHandler(xhr, method, url, async);
                                        }
                                        _attachToOnReadyStateChange(xhr);
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 15 , ERROR_HEADER + ".open" + ERROR_POSTFIX)
                        });
                        _hookProto(XMLHttpRequest, "send", {
                            ns: _evtNamespace,
                            req: function (args, context) {
                                if (!_disableAjaxTracking) {
                                    var xhr = args[_DYN_INST ];
                                    var ajaxData = xhr[strAjaxData];
                                    if (_isMonitoredXhrInstance(xhr) && !ajaxData.xhrMonitoringState[_DYN_SEND_DONE ]) {
                                        _createMarkId("xhr", ajaxData);
                                        ajaxData[_DYN_REQUEST_SENT_TIME ] = dateTimeUtilsNow();
                                        _self[_DYN_INCLUDE_CORRELATION_2 ](ajaxData, undefined, undefined, xhr);
                                        ajaxData.xhrMonitoringState[_DYN_SEND_DONE ] = true;
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 17 , ERROR_HEADER + ERROR_POSTFIX)
                        });
                        _hookProto(XMLHttpRequest, "abort", {
                            ns: _evtNamespace,
                            req: function (args) {
                                if (!_disableAjaxTracking) {
                                    var xhr = args[_DYN_INST ];
                                    var ajaxData = xhr[strAjaxData];
                                    if (_isMonitoredXhrInstance(xhr) && !ajaxData.xhrMonitoringState[_DYN_ABORT_DONE ]) {
                                        ajaxData.aborted = 1;
                                        ajaxData.xhrMonitoringState[_DYN_ABORT_DONE ] = true;
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 13 , ERROR_HEADER + ".abort" + ERROR_POSTFIX)
                        });
                        _hookProto(XMLHttpRequest, "setRequestHeader", {
                            ns: _evtNamespace,
                            req: function (args, header, value) {
                                if (!_disableAjaxTracking && _enableRequestHeaderTracking) {
                                    var xhr = args[_DYN_INST ];
                                    if (_isMonitoredXhrInstance(xhr) && _canIncludeHeaders(header)) {
                                        xhr[strAjaxData][_DYN_REQUEST_HEADERS ][header] = value;
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 71 , ERROR_HEADER + ".setRequestHeader" + ERROR_POSTFIX)
                        });
                        _xhrInitialized = true;
                    }
                }
                function _isDisabledRequest(xhr, request, init) {
                    var isDisabled = false;
                    var theUrl = ((!isString(request) ? (request || {}).url || "" : request) || "")[_DYN_TO_LOWER_CASE ]();
                    arrForEach(_excludeRequestFromAutoTrackingPatterns, function (regex) {
                        var theRegex = regex;
                        if (isString(regex)) {
                            theRegex = new RegExp(regex);
                        }
                        if (!isDisabled) {
                            isDisabled = theRegex.test(theUrl);
                        }
                    });
                    if (isDisabled) {
                        return isDisabled;
                    }
                    var idx = _indexOf(theUrl, "?");
                    var idx2 = _indexOf(theUrl, "#");
                    if (idx === -1 || (idx2 !== -1 && idx2 < idx)) {
                        idx = idx2;
                    }
                    if (idx !== -1) {
                        theUrl = theUrl.substring(0, idx);
                    }
                    if (!isNullOrUndefined(xhr)) {
                        isDisabled = xhr[DisabledPropertyName] === true || theUrl[DisabledPropertyName] === true;
                    }
                    else if (!isNullOrUndefined(request)) {
                        isDisabled = (typeof request === "object" ? request[DisabledPropertyName] === true : false) ||
                            (init ? init[DisabledPropertyName] === true : false);
                    }
                    if (!isDisabled && theUrl && isInternalApplicationInsightsEndpoint(theUrl)) {
                        isDisabled = true;
                    }
                    if (isDisabled) {
                        if (!_disabledUrls[theUrl]) {
                            _disabledUrls[theUrl] = 1;
                        }
                    }
                    else {
                        if (_disabledUrls[theUrl]) {
                            isDisabled = true;
                        }
                    }
                    return isDisabled;
                }
                function _isMonitoredXhrInstance(xhr, excludeAjaxDataValidation) {
                    var ajaxValidation = true;
                    var initialized = _xhrInitialized;
                    if (!isNullOrUndefined(xhr)) {
                        ajaxValidation = excludeAjaxDataValidation === true || !isNullOrUndefined(xhr[strAjaxData]);
                    }
                    return initialized
                        && ajaxValidation;
                }
                function _getDistributedTraceCtx() {
                    var distributedTraceCtx = null;
                    if (_self[_DYN_CORE$1 ] && _self[_DYN_CORE$1 ].getTraceCtx) {
                        distributedTraceCtx = _self[_DYN_CORE$1 ].getTraceCtx(false);
                    }
                    if (!distributedTraceCtx && _context && _context.telemetryTrace) {
                        distributedTraceCtx = createDistributedTraceContextFromTrace(_context.telemetryTrace);
                    }
                    return distributedTraceCtx;
                }
                function _openHandler(xhr, method, url, async) {
                    var _a;
                    var distributedTraceCtx = _getDistributedTraceCtx();
                    var traceID = (distributedTraceCtx && distributedTraceCtx[_DYN_GET_TRACE_ID ]()) || generateW3CId();
                    var spanID = generateW3CId().substr(0, 16);
                    var ajaxData = new ajaxRecord(traceID, spanID, _self[strDiagLog](), (_a = _self.core) === null || _a === void 0 ? void 0 : _a.getTraceCtx());
                    ajaxData[_DYN_TRACE_FLAGS ] = distributedTraceCtx && distributedTraceCtx[_DYN_GET_TRACE_FLAGS ]();
                    ajaxData[_DYN_METHOD ] = method;
                    ajaxData[_DYN_REQUEST_URL ] = url;
                    ajaxData.xhrMonitoringState[_DYN_OPEN_DONE ] = true;
                    ajaxData[_DYN_REQUEST_HEADERS ] = {};
                    ajaxData.async = async;
                    ajaxData[_DYN_ERROR_STATUS_TEXT ] = _enableAjaxErrorStatusText;
                    xhr[strAjaxData] = ajaxData;
                }
                function _attachToOnReadyStateChange(xhr) {
                    xhr[strAjaxData].xhrMonitoringState[_DYN_STATE_CHANGE_ATTACHE14 ] = eventOn(xhr, "readystatechange", function () {
                        var _a;
                        try {
                            if (xhr && xhr.readyState === 4 && _isMonitoredXhrInstance(xhr)) {
                                _onAjaxComplete(xhr);
                            }
                        }
                        catch (e) {
                            var exceptionText = dumpObj(e);
                            if (!exceptionText || _indexOf(exceptionText[_DYN_TO_LOWER_CASE ](), "c00c023f") === -1) {
                                _throwInternalCritical(_self, 16 , ERROR_HEADER + " 'readystatechange' event handler" + ERROR_POSTFIX, (_a = {},
                                    _a[_DYN_AJAX_DIAGNOSTICS_MES19 ] = _getFailedAjaxDiagnosticsMessage(xhr),
                                    _a.exception = exceptionText,
                                    _a));
                            }
                        }
                    }, _evtNamespace);
                }
                function _getResponseText(xhr) {
                    try {
                        var responseType = xhr.responseType;
                        if (responseType === "" || responseType === "text") {
                            return xhr[_DYN_RESPONSE_TEXT ];
                        }
                    }
                    catch (e) {
                    }
                    return null;
                }
                function _onAjaxComplete(xhr) {
                    var ajaxData = xhr[strAjaxData];
                    ajaxData[_DYN_RESPONSE_FINISHED_TI15 ] = dateTimeUtilsNow();
                    ajaxData[_DYN_STATUS ] = xhr[_DYN_STATUS ];
                    function _reportXhrError(e, failedProps) {
                        var errorProps = failedProps || {};
                        errorProps["ajaxDiagnosticsMessage"] = _getFailedAjaxDiagnosticsMessage(xhr);
                        if (e) {
                            errorProps["exception"] = dumpObj(e);
                        }
                        _throwInternalWarning(_self, 14 , FAILED_TO_CALCULATE_DURATION_ERROR + "ajax call" + ERROR_NOT_SENT, errorProps);
                    }
                    _findPerfResourceEntry("xmlhttprequest", ajaxData, function () {
                        try {
                            var dependency = ajaxData[_DYN__CREATE_TRACK_ITEM ]("Ajax", _enableRequestHeaderTracking, function () {
                                var _a;
                                var ajaxResponse = (_a = {
                                        statusText: xhr[_DYN_STATUS_TEXT ]
                                    },
                                    _a[_DYN_HEADER_MAP ] = null,
                                    _a[_DYN_CORRELATION_CONTEXT ] = _getAjaxCorrelationContext(xhr),
                                    _a.type = xhr.responseType,
                                    _a[_DYN_RESPONSE_TEXT ] = _getResponseText(xhr),
                                    _a.response = xhr[_DYN_RESPONSE ],
                                    _a);
                                if (_enableResponseHeaderTracking) {
                                    var headers = xhr[_DYN_GET_ALL_RESPONSE_HEA16 ]();
                                    if (headers) {
                                        var arr = strTrim(headers).split(/[\r\n]+/);
                                        var responseHeaderMap_2 = {};
                                        arrForEach(arr, function (line) {
                                            var parts = line.split(": ");
                                            var header = parts.shift();
                                            var value = parts.join(": ");
                                            if (_canIncludeHeaders(header)) {
                                                responseHeaderMap_2[header] = value;
                                            }
                                        });
                                        ajaxResponse[_DYN_HEADER_MAP ] = responseHeaderMap_2;
                                    }
                                }
                                return ajaxResponse;
                            });
                            var properties = void 0;
                            try {
                                if (!!_addRequestContext) {
                                    properties = _addRequestContext({ status: xhr[_DYN_STATUS ], xhr: xhr });
                                }
                            }
                            catch (e) {
                                _throwInternalWarning(_self, 104 , CUSTOM_REQUEST_CONTEXT_ERROR);
                            }
                            if (dependency) {
                                if (properties !== undefined) {
                                    dependency[STR_PROPERTIES ] = __assignFn(__assignFn({}, dependency.properties), properties);
                                }
                                var sysProperties = ajaxData[_DYN_GET_PART_APROPS ]();
                                _reportDependencyInternal(_dependencyInitializers, _self[_DYN_CORE$1 ], ajaxData, dependency, null, sysProperties);
                            }
                            else {
                                _reportXhrError(null, {
                                    requestSentTime: ajaxData[_DYN_REQUEST_SENT_TIME ],
                                    responseFinishedTime: ajaxData[_DYN_RESPONSE_FINISHED_TI15 ]
                                });
                            }
                        }
                        finally {
                            try {
                                xhr[strAjaxData] = null;
                            }
                            catch (e) {
                            }
                        }
                    }, function (e) {
                        _reportXhrError(e, null);
                    });
                }
                function _getAjaxCorrelationContext(xhr) {
                    var _a;
                    try {
                        var responseHeadersString = xhr[_DYN_GET_ALL_RESPONSE_HEA16 ]();
                        if (responseHeadersString !== null) {
                            var index = _indexOf(responseHeadersString[_DYN_TO_LOWER_CASE ](), RequestHeaders[8 ]);
                            if (index !== -1) {
                                var responseHeader = xhr.getResponseHeader(RequestHeaders[0 ]);
                                return CorrelationIdHelper[_DYN_GET_CORRELATION_CONT17 ](responseHeader);
                            }
                        }
                    }
                    catch (e) {
                        _throwInternalWarning(_self, 18 , CORRELATION_HEADER_ERROR, (_a = {},
                            _a[_DYN_AJAX_DIAGNOSTICS_MES19 ] = _getFailedAjaxDiagnosticsMessage(xhr),
                            _a.exception = dumpObj(e),
                            _a));
                    }
                }
                function _createMarkId(type, ajaxData) {
                    if (ajaxData[_DYN_REQUEST_URL ] && _markPrefix && _enableAjaxPerfTracking) {
                        var performance_1 = getPerformance();
                        if (performance_1 && isFunction(performance_1.mark)) {
                            _markCount++;
                            var markId = _markPrefix + type + "#" + _markCount;
                            performance_1.mark(markId);
                            var entries = performance_1.getEntriesByName(markId);
                            if (entries && entries[_DYN_LENGTH$3 ] === 1) {
                                ajaxData[_DYN_PERF_MARK ] = entries[0];
                            }
                        }
                    }
                }
                function _findPerfResourceEntry(initiatorType, ajaxData, trackCallback, reportError) {
                    var perfMark = ajaxData[_DYN_PERF_MARK ];
                    var performance = getPerformance();
                    var maxAttempts = _config.maxAjaxPerfLookupAttempts;
                    var retryDelay = _config[_DYN_AJAX_PERF_LOOKUP_DEL18 ];
                    var requestUrl = ajaxData[_DYN_REQUEST_URL ];
                    var attempt = 0;
                    (function locateResourceTiming() {
                        try {
                            if (performance && perfMark) {
                                attempt++;
                                var perfTiming = null;
                                var entries = performance.getEntries();
                                for (var lp = entries[_DYN_LENGTH$3 ] - 1; lp >= 0; lp--) {
                                    var entry = entries[lp];
                                    if (entry) {
                                        if (entry.entryType === "resource") {
                                            if (entry.initiatorType === initiatorType &&
                                                (_indexOf(entry[_DYN_NAME$1 ], requestUrl) !== -1 || _indexOf(requestUrl, entry[_DYN_NAME$1 ]) !== -1)) {
                                                perfTiming = entry;
                                            }
                                        }
                                        else if (entry.entryType === "mark" && entry[_DYN_NAME$1 ] === perfMark[_DYN_NAME$1 ]) {
                                            ajaxData[_DYN_PERF_TIMING ] = perfTiming;
                                            break;
                                        }
                                        if (entry[_DYN_START_TIME ] < perfMark[_DYN_START_TIME ] - 1000) {
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!perfMark ||
                                ajaxData[_DYN_PERF_TIMING ] ||
                                attempt >= maxAttempts ||
                                ajaxData.async === false) {
                                if (perfMark && isFunction(performance.clearMarks)) {
                                    performance.clearMarks(perfMark[_DYN_NAME$1 ]);
                                }
                                ajaxData.perfAttempts = attempt;
                                trackCallback();
                            }
                            else {
                                setTimeout(locateResourceTiming, retryDelay);
                            }
                        }
                        catch (e) {
                            reportError(e);
                        }
                    })();
                }
                function _createFetchRecord(input, init) {
                    var _a;
                    var distributedTraceCtx = _getDistributedTraceCtx();
                    var traceID = (distributedTraceCtx && distributedTraceCtx[_DYN_GET_TRACE_ID ]()) || generateW3CId();
                    var spanID = generateW3CId().substr(0, 16);
                    var ajaxData = new ajaxRecord(traceID, spanID, _self[strDiagLog](), (_a = _self.core) === null || _a === void 0 ? void 0 : _a.getTraceCtx());
                    ajaxData[_DYN_TRACE_FLAGS ] = distributedTraceCtx && distributedTraceCtx[_DYN_GET_TRACE_FLAGS ]();
                    ajaxData[_DYN_REQUEST_SENT_TIME ] = dateTimeUtilsNow();
                    ajaxData[_DYN_ERROR_STATUS_TEXT ] = _enableAjaxErrorStatusText;
                    if (input instanceof Request) {
                        ajaxData[_DYN_REQUEST_URL ] = input ? input.url : "";
                    }
                    else {
                        ajaxData[_DYN_REQUEST_URL ] = input;
                    }
                    var method = "GET";
                    if (init && init[_DYN_METHOD ]) {
                        method = init[_DYN_METHOD ];
                    }
                    else if (input && input instanceof Request) {
                        method = input[_DYN_METHOD ];
                    }
                    ajaxData[_DYN_METHOD ] = method;
                    var requestHeaders = {};
                    if (_enableRequestHeaderTracking) {
                        var headers = new Headers((init ? init[_DYN_HEADERS ] : 0) || (input instanceof Request ? (input[_DYN_HEADERS ] || {}) : {}));
                        headers.forEach(function (value, key) {
                            if (_canIncludeHeaders(key)) {
                                requestHeaders[key] = value;
                            }
                        });
                    }
                    ajaxData[_DYN_REQUEST_HEADERS ] = requestHeaders;
                    _createMarkId("fetch", ajaxData);
                    return ajaxData;
                }
                function _getFailedFetchDiagnosticsMessage(input) {
                    var result = "";
                    try {
                        if (!isNullOrUndefined(input)) {
                            if (typeof (input) === "string") {
                                result += "(url: '".concat(input, "')");
                            }
                            else {
                                result += "(url: '".concat(input.url, "')");
                            }
                        }
                    }
                    catch (e) {
                        _throwInternalCritical(_self, 15 , "Failed to grab failed fetch diagnostics message", { exception: dumpObj(e) });
                    }
                    return result;
                }
                function _reportFetchMetrics(callDetails, status, input, response, ajaxData, getResponse, properties) {
                    if (!ajaxData) {
                        return;
                    }
                    function _reportFetchError(msgId, e, failedProps) {
                        var errorProps = failedProps || {};
                        errorProps["fetchDiagnosticsMessage"] = _getFailedFetchDiagnosticsMessage(input);
                        if (e) {
                            errorProps["exception"] = dumpObj(e);
                        }
                        _throwInternalWarning(_self, msgId, FAILED_TO_CALCULATE_DURATION_ERROR + "fetch call" + ERROR_NOT_SENT, errorProps);
                    }
                    ajaxData[_DYN_RESPONSE_FINISHED_TI15 ] = dateTimeUtilsNow();
                    ajaxData[_DYN_STATUS ] = status;
                    _findPerfResourceEntry("fetch", ajaxData, function () {
                        var dependency = ajaxData[_DYN__CREATE_TRACK_ITEM ]("Fetch", _enableRequestHeaderTracking, getResponse);
                        var properties;
                        try {
                            if (!!_addRequestContext) {
                                properties = _addRequestContext({ status: status, request: input, response: response });
                            }
                        }
                        catch (e) {
                            _throwInternalWarning(_self, 104 , CUSTOM_REQUEST_CONTEXT_ERROR);
                        }
                        if (dependency) {
                            if (properties !== undefined) {
                                dependency[STR_PROPERTIES ] = __assignFn(__assignFn({}, dependency.properties), properties);
                            }
                            var sysProperties = ajaxData[_DYN_GET_PART_APROPS ]();
                            _reportDependencyInternal(_dependencyInitializers, _self[_DYN_CORE$1 ], ajaxData, dependency, null, sysProperties);
                        }
                        else {
                            _reportFetchError(14 , null, {
                                requestSentTime: ajaxData[_DYN_REQUEST_SENT_TIME ],
                                responseFinishedTime: ajaxData[_DYN_RESPONSE_FINISHED_TI15 ]
                            });
                        }
                    }, function (e) {
                        _reportFetchError(18 , e, null);
                    });
                }
                function _getFetchCorrelationContext(response) {
                    if (response && response[_DYN_HEADERS ]) {
                        try {
                            var responseHeader = response[_DYN_HEADERS ].get(RequestHeaders[0 ]);
                            return CorrelationIdHelper[_DYN_GET_CORRELATION_CONT17 ](responseHeader);
                        }
                        catch (e) {
                            _throwInternalWarning(_self, 18 , CORRELATION_HEADER_ERROR, {
                                fetchDiagnosticsMessage: _getFailedFetchDiagnosticsMessage(response),
                                exception: dumpObj(e)
                            });
                        }
                    }
                }
                function _reportDependencyInternal(initializers, core, ajaxData, dependency, properties, systemProperties) {
                    var _a;
                    var result = true;
                    var initializersCount = initializers[_DYN_LENGTH$3 ];
                    if (initializersCount > 0) {
                        var details = (_a = {
                                item: dependency
                            },
                            _a[STR_PROPERTIES ] = properties,
                            _a.sysProperties = systemProperties,
                            _a.context = ajaxData ? ajaxData[_DYN_CONTEXT$1 ] : null,
                            _a);
                        result = _processDependencyContainer(core, initializers, details, "initializer");
                    }
                    if (result) {
                        _self[_DYN_TRACK_DEPENDENCY_DAT4 ](dependency, properties, systemProperties);
                    }
                }
            });
            return _this;
        }
        AjaxMonitor.prototype.processTelemetry = function (item, itemCtx) {
            this.processNext(item, itemCtx);
        };
        AjaxMonitor.prototype.addDependencyInitializer = function (dependencyInitializer) {
            return null;
        };
        AjaxMonitor.identifier = "AjaxDependencyPlugin";
        AjaxMonitor.getDefaultConfig = _getDefaultConfig$1;
        AjaxMonitor.getEmptyConfig = _getEmptyConfig;
        return AjaxMonitor;
    }(BaseTelemetryPlugin));

    var _AUTHENTICATED_USER_CONTEXT = "AuthenticatedUserContext";
    var _TRACK = "track";
    var STR_SNIPPET = "snippet";
    var STR_GET_COOKIE_MGR = "getCookieMgr";
    var STR_START_TRACK_PAGE = "startTrackPage";
    var STR_STOP_TRACK_PAGE = "stopTrackPage";
    var STR_FLUSH = "flush";
    var STR_START_TRACK_EVENT = "startTrackEvent";
    var STR_STOP_TRACK_EVENT = "stopTrackEvent";
    var STR_ADD_TELEMETRY_INITIALIZER = "addTelemetryInitializer";
    var STR_ADD_TELEMETRY_INITIALIZERS = STR_ADD_TELEMETRY_INITIALIZER + "s";
    var STR_POLL_INTERNAL_LOGS = "pollInternalLogs";
    var STR_GET_PLUGIN = "getPlugin";
    var STR_EVT_NAMESPACE = "evtNamespace";
    var STR_TRACK_EVENT = _TRACK + "Event";
    var STR_TRACK_TRACE = _TRACK + "Trace";
    var STR_TRACK_METRIC = _TRACK + "Metric";
    var STR_TRACK_PAGE_VIEW = _TRACK + "PageView";
    var STR_TRACK_EXCEPTION = _TRACK + "Exception";
    var STR_TRACK_DEPENDENCY_DATA = _TRACK + "DependencyData";
    var STR_SET_AUTHENTICATED_USER_CONTEXT = "set" + _AUTHENTICATED_USER_CONTEXT;
    var STR_CLEAR_AUTHENTICATED_USER_CONTEXT = "clear" + _AUTHENTICATED_USER_CONTEXT;

    var _DYN_UPDATE_SNIPPET_DEFIN0 = "updateSnippetDefinitions";
    var _DYN_LOAD_APP_INSIGHTS = "loadAppInsights";
    var _DYN_ENDPOINT_URL$1 = "endpointUrl";
    var _DYN_MAX_BATCH_SIZE_IN_BY1$1 = "maxBatchSizeInBytes";
    var _DYN_MAX_BATCH_INTERVAL$1 = "maxBatchInterval";
    var _DYN_DISABLE_EXCEPTION_TR2 = "disableExceptionTracking";
    var _DYN_DISABLE_TELEMETRY$1 = "disableTelemetry";
    var _DYN_EMIT_LINE_DELIMITED_3 = "emitLineDelimitedJson";
    var _DYN_DIAGNOSTIC_LOG_INTER4 = "diagnosticLogInterval";
    var _DYN_AUTO_TRACK_PAGE_VISI5 = "autoTrackPageVisitTime";
    var _DYN_SAMPLING_PERCENTAGE$2 = "samplingPercentage";
    var _DYN_DISABLE_AJAX_TRACKIN6 = "disableAjaxTracking";
    var _DYN_MAX_AJAX_CALLS_PER_V7 = "maxAjaxCallsPerView";
    var _DYN_IS_BEACON_API_DISABL8 = "isBeaconApiDisabled";
    var _DYN_DISABLE_CORRELATION_9 = "disableCorrelationHeaders";
    var _DYN_CORRELATION_HEADER_E10 = "correlationHeaderExcludedDomains";
    var _DYN_DISABLE_FLUSH_ON_BEF11 = "disableFlushOnBeforeUnload";
    var _DYN_DISABLE_FLUSH_ON_UNL12 = "disableFlushOnUnload";
    var _DYN_ENABLE_SESSION_STORA13 = "enableSessionStorageBuffer";
    var _DYN_IS_COOKIE_USE_DISABL14 = "isCookieUseDisabled";
    var _DYN_IS_STORAGE_USE_DISAB15 = "isStorageUseDisabled";
    var _DYN_IS_BROWSER_LINK_TRAC16 = "isBrowserLinkTrackingEnabled";
    var _DYN_ENABLE_CORS_CORRELAT17 = "enableCorsCorrelation";
    var _DYN_CONFIG$1 = "config";
    var _DYN_CONTEXT = "context";
    var _DYN_PUSH$1 = "push";
    var _DYN_VERSION = "version";
    var _DYN_QUEUE = "queue";
    var _DYN_CONNECTION_STRING = "connectionString";
    var _DYN_INSTRUMENTATION_KEY$1 = "instrumentationKey";
    var _DYN_APP_INSIGHTS = "appInsights";
    var _DYN_DISABLE_IKEY_DEPRECA18 = "disableIkeyDeprecationMessage";
    var _DYN_GET_TRANSMISSION_CON19 = "getTransmissionControls";
    var _DYN_ONUNLOAD_FLUSH = "onunloadFlush";
    var _DYN_ADD_HOUSEKEEPING_BEF20 = "addHousekeepingBeforeUnload";
    var _DYN_INDEX_OF = "indexOf";

    var _ignoreUpdateSnippetProperties$1 = [
        STR_SNIPPET, "getDefaultConfig", "_hasLegacyInitializers", "_queue", "_processLegacyInitializers"
    ];
    function getDefaultConfig(config) {
        if (!config) {
            config = {};
        }
        config[_DYN_ENDPOINT_URL$1 ] = config[_DYN_ENDPOINT_URL$1 ] || DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
        config.sessionRenewalMs = 30 * 60 * 1000;
        config.sessionExpirationMs = 24 * 60 * 60 * 1000;
        config[_DYN_MAX_BATCH_SIZE_IN_BY1$1 ] = config[_DYN_MAX_BATCH_SIZE_IN_BY1$1 ] > 0 ? config[_DYN_MAX_BATCH_SIZE_IN_BY1$1 ] : 102400;
        config[_DYN_MAX_BATCH_INTERVAL$1 ] = !isNaN(config[_DYN_MAX_BATCH_INTERVAL$1 ]) ? config[_DYN_MAX_BATCH_INTERVAL$1 ] : 15000;
        config.enableDebug = stringToBoolOrDefault(config.enableDebug);
        config[_DYN_DISABLE_EXCEPTION_TR2 ] = stringToBoolOrDefault(config[_DYN_DISABLE_EXCEPTION_TR2 ]);
        config[_DYN_DISABLE_TELEMETRY$1 ] = stringToBoolOrDefault(config[_DYN_DISABLE_TELEMETRY$1 ]);
        config.verboseLogging = stringToBoolOrDefault(config.verboseLogging);
        config[_DYN_EMIT_LINE_DELIMITED_3 ] = stringToBoolOrDefault(config[_DYN_EMIT_LINE_DELIMITED_3 ]);
        config[_DYN_DIAGNOSTIC_LOG_INTER4 ] = config[_DYN_DIAGNOSTIC_LOG_INTER4 ] || 10000;
        config[_DYN_AUTO_TRACK_PAGE_VISI5 ] = stringToBoolOrDefault(config[_DYN_AUTO_TRACK_PAGE_VISI5 ]);
        if (isNaN(config[_DYN_SAMPLING_PERCENTAGE$2 ]) || config[_DYN_SAMPLING_PERCENTAGE$2 ] <= 0 || config[_DYN_SAMPLING_PERCENTAGE$2 ] >= 100) {
            config[_DYN_SAMPLING_PERCENTAGE$2 ] = 100;
        }
        config[_DYN_DISABLE_AJAX_TRACKIN6 ] = stringToBoolOrDefault(config[_DYN_DISABLE_AJAX_TRACKIN6 ]);
        config[_DYN_MAX_AJAX_CALLS_PER_V7 ] = !isNaN(config[_DYN_MAX_AJAX_CALLS_PER_V7 ]) ? config[_DYN_MAX_AJAX_CALLS_PER_V7 ] : 500;
        config[_DYN_IS_BEACON_API_DISABL8 ] = stringToBoolOrDefault(config[_DYN_IS_BEACON_API_DISABL8 ], true);
        config[_DYN_DISABLE_CORRELATION_9 ] = stringToBoolOrDefault(config[_DYN_DISABLE_CORRELATION_9 ]);
        config[_DYN_CORRELATION_HEADER_E10 ] = config[_DYN_CORRELATION_HEADER_E10 ] || DfltAjaxCorrelationHeaderExDomains;
        config[_DYN_DISABLE_FLUSH_ON_BEF11 ] = stringToBoolOrDefault(config[_DYN_DISABLE_FLUSH_ON_BEF11 ]);
        config.disableFlushOnUnload = stringToBoolOrDefault(config.disableFlushOnUnload, config[_DYN_DISABLE_FLUSH_ON_BEF11 ]);
        config[_DYN_ENABLE_SESSION_STORA13 ] = stringToBoolOrDefault(config[_DYN_ENABLE_SESSION_STORA13 ], true);
        config.isRetryDisabled = stringToBoolOrDefault(config.isRetryDisabled);
        config[_DYN_IS_COOKIE_USE_DISABL14 ] = stringToBoolOrDefault(config[_DYN_IS_COOKIE_USE_DISABL14 ]);
        config[_DYN_IS_STORAGE_USE_DISAB15 ] = stringToBoolOrDefault(config[_DYN_IS_STORAGE_USE_DISAB15 ]);
        config[_DYN_IS_BROWSER_LINK_TRAC16 ] = stringToBoolOrDefault(config[_DYN_IS_BROWSER_LINK_TRAC16 ]);
        config[_DYN_ENABLE_CORS_CORRELAT17 ] = stringToBoolOrDefault(config[_DYN_ENABLE_CORS_CORRELAT17 ]);
        return config;
    }
    var AppInsightsDeprecated = /** @class */ (function () {
        function AppInsightsDeprecated(snippet, appInsightsNew) {
            var _this = this;
            var _hasLegacyInitializers = false;
            var _queue = [];
            var _config;
            dynamicProto(AppInsightsDeprecated, this, function (_self) {
                _config = getDefaultConfig(snippet[_DYN_CONFIG$1 ]);
                _self[_DYN_CONFIG$1 ] = _config;
                _self[STR_SNIPPET ] = snippet;
                _self.appInsightsNew = appInsightsNew;
                _self[_DYN_CONTEXT ] = { addTelemetryInitializer: _addTelemetryInitializers.bind(_self) };
                _self[STR_ADD_TELEMETRY_INITIALIZERS ] = _addTelemetryInitializers;
                function _addTelemetryInitializers(callBack) {
                    if (!_hasLegacyInitializers) {
                        appInsightsNew[STR_ADD_TELEMETRY_INITIALIZER ](function (item) {
                            _processLegacyInitializers(item);
                        });
                        _hasLegacyInitializers = true;
                    }
                    _queue[_DYN_PUSH$1 ](callBack);
                }
                proxyFunctions(_self, appInsightsNew, [
                    STR_GET_COOKIE_MGR,
                    STR_START_TRACK_PAGE,
                    STR_STOP_TRACK_PAGE,
                    STR_FLUSH,
                    STR_START_TRACK_EVENT,
                    STR_STOP_TRACK_EVENT
                ]);
                _self[STR_TRACK_PAGE_VIEW ] = function (name, url, properties, measurements, duration) {
                    var telemetry = {
                        name: name,
                        uri: url,
                        properties: properties,
                        measurements: measurements
                    };
                    appInsightsNew[STR_TRACK_PAGE_VIEW ](telemetry);
                };
                _self[STR_TRACK_EVENT ] = function (name, properties, measurements) {
                    appInsightsNew[STR_TRACK_EVENT ]({ name: name });
                };
                _self.trackDependency = function (id, method, absoluteUrl, pathName, totalTime, success, resultCode) {
                    appInsightsNew[STR_TRACK_DEPENDENCY_DATA ]({
                        id: id,
                        target: absoluteUrl,
                        type: pathName,
                        duration: totalTime,
                        properties: { HttpMethod: method },
                        success: success,
                        responseCode: resultCode
                    });
                };
                _self[STR_TRACK_EXCEPTION ] = function (exception, handledAt, properties, measurements, severityLevel) {
                    appInsightsNew[STR_TRACK_EXCEPTION ]({
                        exception: exception
                    });
                };
                _self[STR_TRACK_METRIC ] = function (name, average, sampleCount, min, max, properties) {
                    appInsightsNew[STR_TRACK_METRIC ]({ name: name, average: average, sampleCount: sampleCount, min: min, max: max });
                };
                _self[STR_TRACK_TRACE ] = function (message, properties, severityLevel) {
                    appInsightsNew[STR_TRACK_TRACE ]({ message: message, severityLevel: severityLevel });
                };
                _self[STR_SET_AUTHENTICATED_USER_CONTEXT ] = function (authenticatedUserId, accountId, storeInCookie) {
                    appInsightsNew[_DYN_CONTEXT ].user[STR_SET_AUTHENTICATED_USER_CONTEXT ](authenticatedUserId, accountId, storeInCookie);
                };
                _self[STR_CLEAR_AUTHENTICATED_USER_CONTEXT ] = function () {
                    appInsightsNew[_DYN_CONTEXT ].user[STR_CLEAR_AUTHENTICATED_USER_CONTEXT ]();
                };
                _self._onerror = function (message, url, lineNumber, columnNumber, error) {
                    appInsightsNew._onerror({ message: message, url: url, lineNumber: lineNumber, columnNumber: columnNumber, error: error });
                };
                _self.downloadAndSetup = function (config) {
                    throwError("downloadAndSetup not implemented in web SKU");
                };
                _self[_DYN_UPDATE_SNIPPET_DEFIN0 ] = function (snippet) {
                    proxyAssign(snippet, _this, function (name) {
                        return name && arrIndexOf(_ignoreUpdateSnippetProperties$1, name) === -1;
                    });
                };
                _self[_DYN_LOAD_APP_INSIGHTS ] = function () {
                    if (_self[_DYN_CONFIG$1 ]["iKey"]) {
                        var originalTrackPageView_1 = _self[STR_TRACK_PAGE_VIEW ];
                        _self[STR_TRACK_PAGE_VIEW ] = function (pagePath, properties, measurements) {
                            originalTrackPageView_1.apply(_self, [null, pagePath, properties, measurements]);
                        };
                    }
                    var legacyPageView = "logPageView";
                    if (isFunction(_self[STR_SNIPPET ][legacyPageView])) {
                        _this[legacyPageView] = function (pagePath, properties, measurements) {
                            _self[STR_TRACK_PAGE_VIEW ](null, pagePath, properties, measurements);
                        };
                    }
                    var legacyEvent = "logEvent";
                    if (isFunction(_self[STR_SNIPPET ][legacyEvent])) {
                        _this[legacyEvent] = function (name, props, measurements) {
                            _self[STR_TRACK_EVENT ](name, props, measurements);
                        };
                    }
                    return _this;
                };
                function _processLegacyInitializers(item) {
                    item.tags[ProcessLegacy] = _queue;
                    return item;
                }
            });
        }
        AppInsightsDeprecated.__ieDyn=1;
        return AppInsightsDeprecated;
    }());

    var _DYN_TO_STRING$1 = "toString";
    var _DYN_DISABLE_EXCEPTION_TR0 = "disableExceptionTracking";
    var _DYN_AUTO_TRACK_PAGE_VISI1 = "autoTrackPageVisitTime";
    var _DYN_OVERRIDE_PAGE_VIEW_D2 = "overridePageViewDuration";
    var _DYN_ENABLE_UNHANDLED_PRO3 = "enableUnhandledPromiseRejectionTracking";
    var _DYN_SAMPLING_PERCENTAGE$1 = "samplingPercentage";
    var _DYN_IS_STORAGE_USE_DISAB4 = "isStorageUseDisabled";
    var _DYN_IS_BROWSER_LINK_TRAC5 = "isBrowserLinkTrackingEnabled";
    var _DYN_ENABLE_AUTO_ROUTE_TR6 = "enableAutoRouteTracking";
    var _DYN_NAME_PREFIX$2 = "namePrefix";
    var _DYN_DISABLE_FLUSH_ON_BEF7 = "disableFlushOnBeforeUnload";
    var _DYN_CORE = "core";
    var _DYN_DATA_TYPE$1 = "dataType";
    var _DYN_ENVELOPE_TYPE$1 = "envelopeType";
    var _DYN_DIAG_LOG$1 = "diagLog";
    var _DYN_TRACK = "track";
    var _DYN_TRACK_PAGE_VIEW = "trackPageView";
    var _DYN_TRACK_PREVIOUS_PAGE_9 = "trackPreviousPageVisit";
    var _DYN_SEND_PAGE_VIEW_INTER10 = "sendPageViewInternal";
    var _DYN_SEND_PAGE_VIEW_PERFO11 = "sendPageViewPerformanceInternal";
    var _DYN_POPULATE_PAGE_VIEW_P12 = "populatePageViewPerformanceEvent";
    var _DYN_HREF = "href";
    var _DYN_SEND_EXCEPTION_INTER13 = "sendExceptionInternal";
    var _DYN_EXCEPTION = "exception";
    var _DYN_ERROR = "error";
    var _DYN__ONERROR = "_onerror";
    var _DYN_ERROR_SRC = "errorSrc";
    var _DYN_LINE_NUMBER = "lineNumber";
    var _DYN_COLUMN_NUMBER = "columnNumber";
    var _DYN_MESSAGE = "message";
    var _DYN__CREATE_AUTO_EXCEPTI14 = "CreateAutoException";
    var _DYN_ADD_TELEMETRY_INITIA15 = "addTelemetryInitializer";
    var _DYN_DURATION = "duration";
    var _DYN_LENGTH$2 = "length";
    var _DYN_IS_PERFORMANCE_TIMIN16 = "isPerformanceTimingSupported";
    var _DYN_GET_PERFORMANCE_TIMI17 = "getPerformanceTiming";
    var _DYN_NAVIGATION_START = "navigationStart";
    var _DYN_SHOULD_COLLECT_DURAT18 = "shouldCollectDuration";
    var _DYN_IS_PERFORMANCE_TIMIN19 = "isPerformanceTimingDataReady";
    var _DYN_GET_ENTRIES_BY_TYPE = "getEntriesByType";
    var _DYN_RESPONSE_START = "responseStart";
    var _DYN_REQUEST_START = "requestStart";
    var _DYN_LOAD_EVENT_END = "loadEventEnd";
    var _DYN_RESPONSE_END = "responseEnd";
    var _DYN_CONNECT_END = "connectEnd";
    var _DYN_PAGE_VISIT_START_TIM20 = "pageVisitStartTime";

    var PageViewManager = /** @class */ (function () {
        function PageViewManager(appInsights, overridePageViewDuration, core, pageViewPerformanceManager) {
            dynamicProto(PageViewManager, this, function (_self) {
                var intervalHandle = null;
                var itemQueue = [];
                var pageViewPerformanceSent = false;
                var _logger;
                if (core) {
                    _logger = core.logger;
                }
                function _flushChannels(isAsync) {
                    if (core) {
                        core.flush(isAsync);
                    }
                }
                function _addQueue(cb) {
                    itemQueue.push(cb);
                    if (!intervalHandle) {
                        intervalHandle = setInterval((function () {
                            var allItems = itemQueue.slice(0);
                            var doFlush = false;
                            itemQueue = [];
                            arrForEach(allItems, function (item) {
                                if (!item()) {
                                    itemQueue.push(item);
                                }
                                else {
                                    doFlush = true;
                                }
                            });
                            if (itemQueue[_DYN_LENGTH$2 ] === 0) {
                                clearInterval(intervalHandle);
                                intervalHandle = null;
                            }
                            if (doFlush) {
                                _flushChannels(true);
                            }
                        }), 100);
                    }
                }
                _self[_DYN_TRACK_PAGE_VIEW ] = function (pageView, customProperties) {
                    var name = pageView.name;
                    if (isNullOrUndefined(name) || typeof name !== "string") {
                        var doc = getDocument();
                        name = pageView.name = doc && doc.title || "";
                    }
                    var uri = pageView.uri;
                    if (isNullOrUndefined(uri) || typeof uri !== "string") {
                        var location_1 = getLocation();
                        uri = pageView.uri = location_1 && location_1[_DYN_HREF ] || "";
                    }
                    if (!pageViewPerformanceManager[_DYN_IS_PERFORMANCE_TIMIN16 ]()) {
                        appInsights[_DYN_SEND_PAGE_VIEW_INTER10 ](pageView, customProperties);
                        _flushChannels(true);
                        _throwInternal(_logger, 2 , 25 , "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                        return;
                    }
                    var pageViewSent = false;
                    var customDuration;
                    var start = pageViewPerformanceManager[_DYN_GET_PERFORMANCE_TIMI17 ]()[_DYN_NAVIGATION_START ];
                    if (start > 0) {
                        customDuration = dateTimeUtilsDuration(start, +new Date);
                        if (!pageViewPerformanceManager[_DYN_SHOULD_COLLECT_DURAT18 ](customDuration)) {
                            customDuration = undefined;
                        }
                    }
                    var duration;
                    if (!isNullOrUndefined(customProperties) &&
                        !isNullOrUndefined(customProperties[_DYN_DURATION ])) {
                        duration = customProperties[_DYN_DURATION ];
                    }
                    if (overridePageViewDuration || !isNaN(duration)) {
                        if (isNaN(duration)) {
                            if (!customProperties) {
                                customProperties = {};
                            }
                            customProperties[_DYN_DURATION ] = customDuration;
                        }
                        appInsights[_DYN_SEND_PAGE_VIEW_INTER10 ](pageView, customProperties);
                        _flushChannels(true);
                        pageViewSent = true;
                    }
                    var maxDurationLimit = 60000;
                    if (!customProperties) {
                        customProperties = {};
                    }
                    _addQueue(function () {
                        var processed = false;
                        try {
                            if (pageViewPerformanceManager[_DYN_IS_PERFORMANCE_TIMIN19 ]()) {
                                processed = true;
                                var pageViewPerformance = {
                                    name: name,
                                    uri: uri
                                };
                                pageViewPerformanceManager[_DYN_POPULATE_PAGE_VIEW_P12 ](pageViewPerformance);
                                if (!pageViewPerformance.isValid && !pageViewSent) {
                                    customProperties[_DYN_DURATION ] = customDuration;
                                    appInsights[_DYN_SEND_PAGE_VIEW_INTER10 ](pageView, customProperties);
                                }
                                else {
                                    if (!pageViewSent) {
                                        customProperties[_DYN_DURATION ] = pageViewPerformance.durationMs;
                                        appInsights[_DYN_SEND_PAGE_VIEW_INTER10 ](pageView, customProperties);
                                    }
                                    if (!pageViewPerformanceSent) {
                                        appInsights[_DYN_SEND_PAGE_VIEW_PERFO11 ](pageViewPerformance, customProperties);
                                        pageViewPerformanceSent = true;
                                    }
                                }
                            }
                            else if (start > 0 && dateTimeUtilsDuration(start, +new Date) > maxDurationLimit) {
                                processed = true;
                                if (!pageViewSent) {
                                    customProperties[_DYN_DURATION ] = maxDurationLimit;
                                    appInsights[_DYN_SEND_PAGE_VIEW_INTER10 ](pageView, customProperties);
                                }
                            }
                        }
                        catch (e) {
                            _throwInternal(_logger, 1 , 38 , "trackPageView failed on page load calculation: " + getExceptionName(e), { exception: dumpObj(e) });
                        }
                        return processed;
                    });
                };
                _self.teardown = function (unloadCtx, unloadState) {
                    if (intervalHandle) {
                        clearInterval(intervalHandle);
                        intervalHandle = null;
                        var allItems = itemQueue.slice(0);
                        itemQueue = [];
                        arrForEach(allItems, function (item) {
                            if (item()) ;
                        });
                    }
                };
            });
        }
        PageViewManager.__ieDyn=1;
        return PageViewManager;
    }());

    var MAX_DURATION_ALLOWED = 3600000;
    var botAgentNames = ["googlebot", "adsbot-google", "apis-google", "mediapartners-google"];
    function _isPerformanceTimingSupported() {
        var perf = getPerformance();
        return perf && !!perf.timing;
    }
    function _isPerformanceNavigationTimingSupported() {
        var perf = getPerformance();
        return perf && perf.getEntriesByType && perf.getEntriesByType("navigation")[_DYN_LENGTH$2 ] > 0;
    }
    function _isPerformanceTimingDataReady() {
        var perf = getPerformance();
        var timing = perf ? perf.timing : 0;
        return timing
            && timing.domainLookupStart > 0
            && timing[_DYN_NAVIGATION_START ] > 0
            && timing[_DYN_RESPONSE_START ] > 0
            && timing[_DYN_REQUEST_START ] > 0
            && timing[_DYN_LOAD_EVENT_END ] > 0
            && timing[_DYN_RESPONSE_END ] > 0
            && timing[_DYN_CONNECT_END ] > 0
            && timing.domLoading > 0;
    }
    function _getPerformanceTiming() {
        if (_isPerformanceTimingSupported()) {
            return getPerformance().timing;
        }
        return null;
    }
    function _getPerformanceNavigationTiming() {
        if (_isPerformanceNavigationTimingSupported()) {
            return getPerformance()[_DYN_GET_ENTRIES_BY_TYPE ]("navigation")[0];
        }
        return null;
    }
    function _shouldCollectDuration() {
        var durations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            durations[_i] = arguments[_i];
        }
        var _navigator = getNavigator() || {};
        var userAgent = _navigator.userAgent;
        var isGoogleBot = false;
        if (userAgent) {
            for (var i = 0; i < botAgentNames[_DYN_LENGTH$2 ]; i++) {
                isGoogleBot = isGoogleBot || userAgent.toLowerCase().indexOf(botAgentNames[i]) !== -1;
            }
        }
        if (isGoogleBot) {
            return false;
        }
        else {
            for (var i = 0; i < durations[_DYN_LENGTH$2 ]; i++) {
                if (durations[i] < 0 || durations[i] >= MAX_DURATION_ALLOWED) {
                    return false;
                }
            }
        }
        return true;
    }
    var PageViewPerformanceManager = /** @class */ (function () {
        function PageViewPerformanceManager(core) {
            var _this = this;
            var _logger = safeGetLogger(core);
            dynamicProto(PageViewPerformanceManager, this, function (_self) {
                _self[_DYN_POPULATE_PAGE_VIEW_P12 ] = function (pageViewPerformance) {
                    pageViewPerformance.isValid = false;
                    var navigationTiming = _getPerformanceNavigationTiming();
                    var timing = _getPerformanceTiming();
                    var total = 0;
                    var network = 0;
                    var request = 0;
                    var response = 0;
                    var dom = 0;
                    if (navigationTiming || timing) {
                        if (navigationTiming) {
                            total = navigationTiming[_DYN_DURATION ];
                            network = navigationTiming.startTime === 0 ? navigationTiming[_DYN_CONNECT_END ] : dateTimeUtilsDuration(navigationTiming.startTime, navigationTiming[_DYN_CONNECT_END ]);
                            request = dateTimeUtilsDuration(navigationTiming.requestStart, navigationTiming[_DYN_RESPONSE_START ]);
                            response = dateTimeUtilsDuration(navigationTiming[_DYN_RESPONSE_START ], navigationTiming[_DYN_RESPONSE_END ]);
                            dom = dateTimeUtilsDuration(navigationTiming.responseEnd, navigationTiming[_DYN_LOAD_EVENT_END ]);
                        }
                        else {
                            total = dateTimeUtilsDuration(timing[_DYN_NAVIGATION_START ], timing[_DYN_LOAD_EVENT_END ]);
                            network = dateTimeUtilsDuration(timing[_DYN_NAVIGATION_START ], timing[_DYN_CONNECT_END ]);
                            request = dateTimeUtilsDuration(timing.requestStart, timing[_DYN_RESPONSE_START ]);
                            response = dateTimeUtilsDuration(timing[_DYN_RESPONSE_START ], timing[_DYN_RESPONSE_END ]);
                            dom = dateTimeUtilsDuration(timing.responseEnd, timing[_DYN_LOAD_EVENT_END ]);
                        }
                        if (total === 0) {
                            _throwInternal(_logger, 2 , 10 , "error calculating page view performance.", { total: total, network: network, request: request, response: response, dom: dom });
                        }
                        else if (!_this[_DYN_SHOULD_COLLECT_DURAT18 ](total, network, request, response, dom)) {
                            _throwInternal(_logger, 2 , 45 , "Invalid page load duration value. Browser perf data won't be sent.", { total: total, network: network, request: request, response: response, dom: dom });
                        }
                        else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                            _throwInternal(_logger, 2 , 8 , "client performance math error.", { total: total, network: network, request: request, response: response, dom: dom });
                        }
                        else {
                            pageViewPerformance.durationMs = total;
                            pageViewPerformance.perfTotal = pageViewPerformance[_DYN_DURATION ] = msToTimeSpan(total);
                            pageViewPerformance.networkConnect = msToTimeSpan(network);
                            pageViewPerformance.sentRequest = msToTimeSpan(request);
                            pageViewPerformance.receivedResponse = msToTimeSpan(response);
                            pageViewPerformance.domProcessing = msToTimeSpan(dom);
                            pageViewPerformance.isValid = true;
                        }
                    }
                };
                _self[_DYN_GET_PERFORMANCE_TIMI17 ] = _getPerformanceTiming;
                _self[_DYN_IS_PERFORMANCE_TIMIN16 ] = _isPerformanceTimingSupported;
                _self[_DYN_IS_PERFORMANCE_TIMIN19 ] = _isPerformanceTimingDataReady;
                _self[_DYN_SHOULD_COLLECT_DURAT18 ] = _shouldCollectDuration;
            });
        }
        PageViewPerformanceManager.__ieDyn=1;
        return PageViewPerformanceManager;
    }());

    var PageVisitTimeManager = /** @class */ (function () {
        function PageVisitTimeManager(logger, pageVisitTimeTrackingHandler) {
            var prevPageVisitDataKeyName = "prevPageVisitData";
            dynamicProto(PageVisitTimeManager, this, function (_self) {
                _self[_DYN_TRACK_PREVIOUS_PAGE_9 ] = function (currentPageName, currentPageUrl) {
                    try {
                        var prevPageVisitTimeData = restartPageVisitTimer(currentPageName, currentPageUrl);
                        if (prevPageVisitTimeData) {
                            pageVisitTimeTrackingHandler(prevPageVisitTimeData.pageName, prevPageVisitTimeData.pageUrl, prevPageVisitTimeData.pageVisitTime);
                        }
                    }
                    catch (e) {
                        _warnToConsole(logger, "Auto track page visit time failed, metric will not be collected: " + dumpObj(e));
                    }
                };
                function restartPageVisitTimer(pageName, pageUrl) {
                    var prevPageVisitData = null;
                    try {
                        prevPageVisitData = stopPageVisitTimer();
                        startPageVisitTimer(pageName, pageUrl);
                    }
                    catch (e) {
                        _warnToConsole(logger, "Call to restart failed: " + dumpObj(e));
                        prevPageVisitData = null;
                    }
                    return prevPageVisitData;
                }
                function startPageVisitTimer(pageName, pageUrl) {
                    try {
                        if (utlCanUseSessionStorage()) {
                            if (utlGetSessionStorage(logger, prevPageVisitDataKeyName) != null) {
                                throwError("Cannot call startPageVisit consecutively without first calling stopPageVisit");
                            }
                            var currPageVisitData = new PageVisitData(pageName, pageUrl);
                            var currPageVisitDataStr = getJSON().stringify(currPageVisitData);
                            utlSetSessionStorage(logger, prevPageVisitDataKeyName, currPageVisitDataStr);
                        }
                    }
                    catch (e) {
                        _warnToConsole(logger, "Call to start failed: " + dumpObj(e));
                    }
                }
                function stopPageVisitTimer() {
                    var prevPageVisitData = null;
                    try {
                        if (utlCanUseSessionStorage()) {
                            var pageVisitEndTime = dateNow();
                            var pageVisitDataJsonStr = utlGetSessionStorage(logger, prevPageVisitDataKeyName);
                            if (pageVisitDataJsonStr && hasJSON()) {
                                prevPageVisitData = getJSON().parse(pageVisitDataJsonStr);
                                prevPageVisitData.pageVisitTime = pageVisitEndTime - prevPageVisitData[_DYN_PAGE_VISIT_START_TIM20 ];
                                utlRemoveSessionStorage(logger, prevPageVisitDataKeyName);
                            }
                        }
                    }
                    catch (e) {
                        _warnToConsole(logger, "Stop page visit timer failed: " + dumpObj(e));
                        prevPageVisitData = null;
                    }
                    return prevPageVisitData;
                }
                objDefineAccessors(_self, "_logger", function () { return logger; });
                objDefineAccessors(_self, "pageVisitTimeTrackingHandler", function () { return pageVisitTimeTrackingHandler; });
            });
        }
        PageVisitTimeManager.__ieDyn=1;
        return PageVisitTimeManager;
    }());
    var PageVisitData = /** @class */ (function () {
        function PageVisitData(pageName, pageUrl) {
            this[_DYN_PAGE_VISIT_START_TIM20 ] = dateNow();
            this.pageName = pageName;
            this.pageUrl = pageUrl;
        }
        return PageVisitData;
    }());

    var Timing = /** @class */ (function () {
        function Timing(logger, name) {
            var _self = this;
            var _events = {};
            _self.start = function (name) {
                if (typeof _events[name] !== "undefined") {
                    _throwInternal(logger, 2 , 62 , "start was called more than once for this event without calling stop.", { name: name, key: name }, true);
                }
                _events[name] = +new Date;
            };
            _self.stop = function (name, url, properties, measurements) {
                var start = _events[name];
                if (isNaN(start)) {
                    _throwInternal(logger, 2 , 63 , "stop was called without a corresponding start.", { name: name, key: name }, true);
                }
                else {
                    var end = +new Date;
                    var duration = dateTimeUtilsDuration(start, end);
                    _self.action(name, url, duration, properties, measurements);
                }
                delete _events[name];
                _events[name] = undefined;
            };
        }
        return Timing;
    }());

    var strEvent = "event";
    function _dispatchEvent(target, evnt) {
        if (target && target.dispatchEvent && evnt) {
            target.dispatchEvent(evnt);
        }
    }
    function _getReason(error) {
        if (error && error.reason) {
            var reason = error.reason;
            if (!isString(reason) && isFunction(reason[_DYN_TO_STRING$1 ])) {
                return reason[_DYN_TO_STRING$1 ]();
            }
            return dumpObj(reason);
        }
        return error || "";
    }
    var MinMilliSeconds = 60000;
    function _configMilliseconds(value, defValue) {
        value = value || defValue;
        if (value < MinMilliSeconds) {
            value = MinMilliSeconds;
        }
        return value;
    }
    function _getDefaultConfig(config) {
        if (!config) {
            config = {};
        }
        config.sessionRenewalMs = _configMilliseconds(config.sessionRenewalMs, 30 * 60 * 1000);
        config.sessionExpirationMs = _configMilliseconds(config.sessionExpirationMs, 24 * 60 * 60 * 1000);
        config[_DYN_DISABLE_EXCEPTION_TR0 ] = stringToBoolOrDefault(config[_DYN_DISABLE_EXCEPTION_TR0 ]);
        config[_DYN_AUTO_TRACK_PAGE_VISI1 ] = stringToBoolOrDefault(config[_DYN_AUTO_TRACK_PAGE_VISI1 ]);
        config[_DYN_OVERRIDE_PAGE_VIEW_D2 ] = stringToBoolOrDefault(config[_DYN_OVERRIDE_PAGE_VIEW_D2 ]);
        config[_DYN_ENABLE_UNHANDLED_PRO3 ] = stringToBoolOrDefault(config[_DYN_ENABLE_UNHANDLED_PRO3 ]);
        if (isNaN(config[_DYN_SAMPLING_PERCENTAGE$1 ]) || config[_DYN_SAMPLING_PERCENTAGE$1 ] <= 0 || config[_DYN_SAMPLING_PERCENTAGE$1 ] >= 100) {
            config[_DYN_SAMPLING_PERCENTAGE$1 ] = 100;
        }
        config[_DYN_IS_STORAGE_USE_DISAB4 ] = stringToBoolOrDefault(config[_DYN_IS_STORAGE_USE_DISAB4 ]);
        config[_DYN_IS_BROWSER_LINK_TRAC5 ] = stringToBoolOrDefault(config[_DYN_IS_BROWSER_LINK_TRAC5 ]);
        config[_DYN_ENABLE_AUTO_ROUTE_TR6 ] = stringToBoolOrDefault(config[_DYN_ENABLE_AUTO_ROUTE_TR6 ]);
        config[_DYN_NAME_PREFIX$2 ] = config[_DYN_NAME_PREFIX$2 ] || "";
        config.enableDebug = stringToBoolOrDefault(config.enableDebug);
        config[_DYN_DISABLE_FLUSH_ON_BEF7 ] = stringToBoolOrDefault(config[_DYN_DISABLE_FLUSH_ON_BEF7 ]);
        config.disableFlushOnUnload = stringToBoolOrDefault(config.disableFlushOnUnload, config[_DYN_DISABLE_FLUSH_ON_BEF7 ]);
        return config;
    }
    function _updateStorageUsage(extConfig) {
        if (!isUndefined(extConfig[_DYN_IS_STORAGE_USE_DISAB4 ])) {
            if (extConfig[_DYN_IS_STORAGE_USE_DISAB4 ]) {
                utlDisableStorage();
            }
            else {
                utlEnableStorage();
            }
        }
    }
    var AnalyticsPlugin = /** @class */ (function (_super) {
        __extendsFn(AnalyticsPlugin, _super);
        function AnalyticsPlugin() {
            var _this = _super.call(this) || this;
            _this.identifier = AnalyticsPluginIdentifier;
            _this.priority = 180;
            _this.autoRoutePVDelay = 500;
            var _eventTracking;
            var _pageTracking;
            var _pageViewManager;
            var _pageViewPerformanceManager;
            var _pageVisitTimeManager;
            var _preInitTelemetryInitializers;
            var _isBrowserLinkTrackingEnabled;
            var _browserLinkInitializerAdded;
            var _enableAutoRouteTracking;
            var _historyListenerAdded;
            var _disableExceptionTracking;
            var _autoExceptionInstrumented;
            var _enableUnhandledPromiseRejectionTracking;
            var _autoUnhandledPromiseInstrumented;
            var _prevUri;
            var _currUri;
            var _evtNamespace;
            dynamicProto(AnalyticsPlugin, _this, function (_self, _base) {
                var _addHook = _base._addHook;
                _initDefaults();
                _self.getCookieMgr = function () {
                    return safeGetCookieMgr(_self[_DYN_CORE ]);
                };
                _self.processTelemetry = function (env, itemCtx) {
                    _self.processNext(env, itemCtx);
                };
                _self.trackEvent = function (event, customProperties) {
                    try {
                        var telemetryItem = createTelemetryItem(event, Event$1[_DYN_DATA_TYPE$1 ], Event$1[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), customProperties);
                        _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                    }
                    catch (e) {
                        _throwInternal(2 , 39 , "trackTrace failed, trace will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.startTrackEvent = function (name) {
                    try {
                        _eventTracking.start(name);
                    }
                    catch (e) {
                        _throwInternal(1 , 29 , "startTrackEvent failed, event will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.stopTrackEvent = function (name, properties, measurements) {
                    try {
                        _eventTracking.stop(name, undefined, properties, measurements);
                    }
                    catch (e) {
                        _throwInternal(1 , 30 , "stopTrackEvent failed, event will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.trackTrace = function (trace, customProperties) {
                    try {
                        var telemetryItem = createTelemetryItem(trace, Trace[_DYN_DATA_TYPE$1 ], Trace[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), customProperties);
                        _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                    }
                    catch (e) {
                        _throwInternal(2 , 39 , "trackTrace failed, trace will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.trackMetric = function (metric, customProperties) {
                    try {
                        var telemetryItem = createTelemetryItem(metric, Metric[_DYN_DATA_TYPE$1 ], Metric[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), customProperties);
                        _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                    }
                    catch (e) {
                        _throwInternal(1 , 36 , "trackMetric failed, metric will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self[_DYN_TRACK_PAGE_VIEW ] = function (pageView, customProperties) {
                    try {
                        var inPv = pageView || {};
                        _pageViewManager[_DYN_TRACK_PAGE_VIEW ](inPv, __assignFn(__assignFn(__assignFn({}, inPv.properties), inPv.measurements), customProperties));
                        if (_self.config[_DYN_AUTO_TRACK_PAGE_VISI1 ]) {
                            _pageVisitTimeManager[_DYN_TRACK_PREVIOUS_PAGE_9 ](inPv.name, inPv.uri);
                        }
                    }
                    catch (e) {
                        _throwInternal(1 , 37 , "trackPageView failed, page view will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self[_DYN_SEND_PAGE_VIEW_INTER10 ] = function (pageView, properties, systemProperties) {
                    var doc = getDocument();
                    if (doc) {
                        pageView.refUri = pageView.refUri === undefined ? doc.referrer : pageView.refUri;
                    }
                    var telemetryItem = createTelemetryItem(pageView, PageView[_DYN_DATA_TYPE$1 ], PageView[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), properties, systemProperties);
                    _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                };
                _self[_DYN_SEND_PAGE_VIEW_PERFO11 ] = function (pageViewPerformance, properties, systemProperties) {
                    var telemetryItem = createTelemetryItem(pageViewPerformance, PageViewPerformance[_DYN_DATA_TYPE$1 ], PageViewPerformance[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), properties, systemProperties);
                    _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                };
                _self.trackPageViewPerformance = function (pageViewPerformance, customProperties) {
                    var inPvp = pageViewPerformance || {};
                    try {
                        _pageViewPerformanceManager[_DYN_POPULATE_PAGE_VIEW_P12 ](inPvp);
                        _self[_DYN_SEND_PAGE_VIEW_PERFO11 ](inPvp, customProperties);
                    }
                    catch (e) {
                        _throwInternal(1 , 37 , "trackPageViewPerformance failed, page view will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.startTrackPage = function (name) {
                    try {
                        if (typeof name !== "string") {
                            var doc = getDocument();
                            name = doc && doc.title || "";
                        }
                        _pageTracking.start(name);
                    }
                    catch (e) {
                        _throwInternal(1 , 31 , "startTrackPage failed, page view may not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.stopTrackPage = function (name, url, properties, measurement) {
                    try {
                        if (typeof name !== "string") {
                            var doc = getDocument();
                            name = doc && doc.title || "";
                        }
                        if (typeof url !== "string") {
                            var loc = getLocation();
                            url = loc && loc[_DYN_HREF ] || "";
                        }
                        _pageTracking.stop(name, url, properties, measurement);
                        if (_self.config[_DYN_AUTO_TRACK_PAGE_VISI1 ]) {
                            _pageVisitTimeManager[_DYN_TRACK_PREVIOUS_PAGE_9 ](name, url);
                        }
                    }
                    catch (e) {
                        _throwInternal(1 , 32 , "stopTrackPage failed, page view will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self[_DYN_SEND_EXCEPTION_INTER13 ] = function (exception, customProperties, systemProperties) {
                    var theError = exception[_DYN_EXCEPTION ] || exception[_DYN_ERROR ] || new Error(strNotSpecified);
                    var exceptionPartB = new Exception(_self[_DYN_DIAG_LOG$1 ](), theError, exception.properties || customProperties, exception.measurements, exception.severityLevel, exception.id).toInterface();
                    var telemetryItem = createTelemetryItem(exceptionPartB, Exception[_DYN_DATA_TYPE$1 ], Exception[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), customProperties, systemProperties);
                    _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                };
                _self.trackException = function (exception, customProperties) {
                    if (exception && !exception[_DYN_EXCEPTION ] && exception[_DYN_ERROR ]) {
                        exception[_DYN_EXCEPTION ] = exception[_DYN_ERROR ];
                    }
                    try {
                        _self[_DYN_SEND_EXCEPTION_INTER13 ](exception, customProperties);
                    }
                    catch (e) {
                        _throwInternal(1 , 35 , "trackException failed, exception will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self[_DYN__ONERROR ] = function (exception) {
                    var error = exception && exception[_DYN_ERROR ];
                    var evt = exception && exception.evt;
                    try {
                        if (!evt) {
                            var _window = getWindow();
                            if (_window) {
                                evt = _window[strEvent];
                            }
                        }
                        var url = (exception && exception.url) || (getDocument() || {}).URL;
                        var errorSrc = exception[_DYN_ERROR_SRC ] || "window.onerror@" + url + ":" + (exception[_DYN_LINE_NUMBER ] || 0) + ":" + (exception[_DYN_COLUMN_NUMBER ] || 0);
                        var properties = {
                            errorSrc: errorSrc,
                            url: url,
                            lineNumber: exception[_DYN_LINE_NUMBER ] || 0,
                            columnNumber: exception[_DYN_COLUMN_NUMBER ] || 0,
                            message: exception[_DYN_MESSAGE ]
                        };
                        if (isCrossOriginError(exception.message, exception.url, exception.lineNumber, exception.columnNumber, exception[_DYN_ERROR ])) {
                            _sendCORSException(Exception[_DYN__CREATE_AUTO_EXCEPTI14 ]("Script error: The browser's same-origin policy prevents us from getting the details of this exception. Consider using the 'crossorigin' attribute.", url, exception[_DYN_LINE_NUMBER ] || 0, exception[_DYN_COLUMN_NUMBER ] || 0, error, evt, null, errorSrc), properties);
                        }
                        else {
                            if (!exception[_DYN_ERROR_SRC ]) {
                                exception[_DYN_ERROR_SRC ] = errorSrc;
                            }
                            _self.trackException({ exception: exception, severityLevel: 3  }, properties);
                        }
                    }
                    catch (e) {
                        var errorString = error ? (error.name + ", " + error[_DYN_MESSAGE ]) : "null";
                        _throwInternal(1 , 11 , "_onError threw exception while logging error, error will not be collected: "
                            + getExceptionName(e), { exception: dumpObj(e), errorString: errorString });
                    }
                };
                _self[_DYN_ADD_TELEMETRY_INITIA15 ] = function (telemetryInitializer) {
                    if (_self[_DYN_CORE ]) {
                        return _self[_DYN_CORE ][_DYN_ADD_TELEMETRY_INITIA15 ](telemetryInitializer);
                    }
                    if (!_preInitTelemetryInitializers) {
                        _preInitTelemetryInitializers = [];
                    }
                    _preInitTelemetryInitializers.push(telemetryInitializer);
                };
                _self.initialize = function (config, core, extensions, pluginChain) {
                    if (_self.isInitialized()) {
                        return;
                    }
                    if (isNullOrUndefined(core)) {
                        throwError("Error initializing");
                    }
                    _base.initialize(config, core, extensions, pluginChain);
                    try {
                        _evtNamespace = mergeEvtNamespace(createUniqueNamespace(_self.identifier), core.evtNamespace && core.evtNamespace());
                        if (_preInitTelemetryInitializers) {
                            arrForEach(_preInitTelemetryInitializers, function (initializer) {
                                core[_DYN_ADD_TELEMETRY_INITIA15 ](initializer);
                            });
                            _preInitTelemetryInitializers = null;
                        }
                        var extConfig = _populateDefaults(config);
                        _updateStorageUsage(extConfig);
                        _pageViewPerformanceManager = new PageViewPerformanceManager(_self[_DYN_CORE ]);
                        _pageViewManager = new PageViewManager(_this, extConfig[_DYN_OVERRIDE_PAGE_VIEW_D2 ], _self[_DYN_CORE ], _pageViewPerformanceManager);
                        _pageVisitTimeManager = new PageVisitTimeManager(_self[_DYN_DIAG_LOG$1 ](), function (pageName, pageUrl, pageVisitTime) { return trackPageVisitTime(pageName, pageUrl, pageVisitTime); });
                        _updateBrowserLinkTracking(extConfig, config);
                        _eventTracking = new Timing(_self[_DYN_DIAG_LOG$1 ](), "trackEvent");
                        _eventTracking.action =
                            function (name, url, duration, properties, measurements) {
                                if (!properties) {
                                    properties = {};
                                }
                                if (!measurements) {
                                    measurements = {};
                                }
                                properties.duration = duration[_DYN_TO_STRING$1 ]();
                                _self.trackEvent({ name: name, properties: properties, measurements: measurements });
                            };
                        _pageTracking = new Timing(_self[_DYN_DIAG_LOG$1 ](), "trackPageView");
                        _pageTracking.action = function (name, url, duration, properties, measurements) {
                            if (isNullOrUndefined(properties)) {
                                properties = {};
                            }
                            properties.duration = duration[_DYN_TO_STRING$1 ]();
                            var pageViewItem = {
                                name: name,
                                uri: url,
                                properties: properties,
                                measurements: measurements
                            };
                            _self[_DYN_SEND_PAGE_VIEW_INTER10 ](pageViewItem, properties);
                        };
                        if (hasWindow()) {
                            _updateExceptionTracking(extConfig);
                            _updateLocationChange(extConfig);
                        }
                    }
                    catch (e) {
                        _self.setInitialized(false);
                        throw e;
                    }
                };
                _self._doTeardown = function (unloadCtx, unloadState) {
                    _pageViewManager && _pageViewManager.teardown(unloadCtx, unloadState);
                    eventOff(window, null, null, _evtNamespace);
                    _initDefaults();
                };
                function _populateDefaults(config) {
                    var ctx = createProcessTelemetryContext(null, config, _self[_DYN_CORE ]);
                    var identifier = _self.identifier;
                    var defaults = _getDefaultConfig(config);
                    var extConfig = _self.config = ctx.getExtCfg(identifier);
                    if (defaults !== undefined) {
                        objForEachKey(defaults, function (field, value) {
                            extConfig[field] = ctx.getConfig(identifier, field, value);
                            if (extConfig[field] === undefined) {
                                extConfig = value;
                            }
                        });
                    }
                    return extConfig;
                }
                function _updateBrowserLinkTracking(extConfig, config) {
                    _isBrowserLinkTrackingEnabled = extConfig[_DYN_IS_BROWSER_LINK_TRAC5 ] || config[_DYN_IS_BROWSER_LINK_TRAC5 ];
                    _addDefaultTelemetryInitializers();
                }
                function trackPageVisitTime(pageName, pageUrl, pageVisitTime) {
                    var properties = { PageName: pageName, PageUrl: pageUrl };
                    _self.trackMetric({
                        name: "PageVisitTime",
                        average: pageVisitTime,
                        max: pageVisitTime,
                        min: pageVisitTime,
                        sampleCount: 1
                    }, properties);
                }
                function _addDefaultTelemetryInitializers() {
                    if (!_browserLinkInitializerAdded && _isBrowserLinkTrackingEnabled) {
                        var browserLinkPaths_1 = ["/browserLinkSignalR/", "/__browserLink/"];
                        var dropBrowserLinkRequests = function (envelope) {
                            if (_isBrowserLinkTrackingEnabled && envelope.baseType === RemoteDependencyData[_DYN_DATA_TYPE$1 ]) {
                                var remoteData = envelope.baseData;
                                if (remoteData) {
                                    for (var i = 0; i < browserLinkPaths_1[_DYN_LENGTH$2 ]; i++) {
                                        if (remoteData.target && remoteData.target.indexOf(browserLinkPaths_1[i]) >= 0) {
                                            return false;
                                        }
                                    }
                                }
                            }
                            return true;
                        };
                        _self[_DYN_ADD_TELEMETRY_INITIA15 ](dropBrowserLinkRequests);
                        _browserLinkInitializerAdded = true;
                    }
                }
                function _sendCORSException(exception, properties) {
                    var telemetryItem = createTelemetryItem(exception, Exception[_DYN_DATA_TYPE$1 ], Exception[_DYN_ENVELOPE_TYPE$1 ], _self[_DYN_DIAG_LOG$1 ](), properties);
                    _self[_DYN_CORE ][_DYN_TRACK ](telemetryItem);
                }
                function _updateExceptionTracking(extConfig) {
                    var _window = getWindow();
                    var locn = getLocation(true);
                    _disableExceptionTracking = extConfig[_DYN_DISABLE_EXCEPTION_TR0 ];
                    if (!_disableExceptionTracking && !_autoExceptionInstrumented && !extConfig.autoExceptionInstrumented) {
                        _addHook(InstrumentEvent(_window, "onerror", {
                            ns: _evtNamespace,
                            rsp: function (callDetails, message, url, lineNumber, columnNumber, error) {
                                if (!_disableExceptionTracking && callDetails.rslt !== true) {
                                    _self[_DYN__ONERROR ](Exception[_DYN__CREATE_AUTO_EXCEPTI14 ](message, url, lineNumber, columnNumber, error, callDetails.evt));
                                }
                            }
                        }, false));
                        _autoExceptionInstrumented = true;
                    }
                    _addUnhandledPromiseRejectionTracking(extConfig, _window, locn);
                }
                function _updateLocationChange(extConfig) {
                    var win = getWindow();
                    var locn = getLocation(true);
                    _enableAutoRouteTracking = extConfig[_DYN_ENABLE_AUTO_ROUTE_TR6 ] === true;
                    if (win && _enableAutoRouteTracking && hasHistory()) {
                        var _history = getHistory();
                        if (isFunction(_history.pushState) && isFunction(_history.replaceState) && typeof Event !== strShimUndefined) {
                            _addHistoryListener(extConfig, win, _history, locn);
                        }
                    }
                }
                function _getDistributedTraceCtx() {
                    var distributedTraceCtx = null;
                    if (_self[_DYN_CORE ] && _self[_DYN_CORE ].getTraceCtx) {
                        distributedTraceCtx = _self[_DYN_CORE ].getTraceCtx(false);
                    }
                    if (!distributedTraceCtx) {
                        var properties = _self[_DYN_CORE ].getPlugin(PropertiesPluginIdentifier);
                        if (properties) {
                            var context = properties.plugin.context;
                            if (context) {
                                distributedTraceCtx = createDistributedTraceContextFromTrace(context.telemetryTrace);
                            }
                        }
                    }
                    return distributedTraceCtx;
                }
                function _addHistoryListener(extConfig, win, history, locn) {
                    var namePrefix = extConfig[_DYN_NAME_PREFIX$2 ] || "";
                    function _popstateHandler() {
                        if (_enableAutoRouteTracking) {
                            _dispatchEvent(win, createDomEvent(namePrefix + "locationchange"));
                        }
                    }
                    function _locationChangeHandler() {
                        if (_currUri) {
                            _prevUri = _currUri;
                            _currUri = locn && locn[_DYN_HREF ] || "";
                        }
                        else {
                            _currUri = locn && locn[_DYN_HREF ] || "";
                        }
                        if (_enableAutoRouteTracking) {
                            var distributedTraceCtx = _getDistributedTraceCtx();
                            if (distributedTraceCtx) {
                                distributedTraceCtx.setTraceId(generateW3CId());
                                var traceLocationName = "_unknown_";
                                if (locn && locn.pathname) {
                                    traceLocationName = locn.pathname + (locn.hash || "");
                                }
                                distributedTraceCtx.setName(dataSanitizeString(_self[_DYN_DIAG_LOG$1 ](), traceLocationName));
                            }
                            setTimeout((function (uri) {
                                _self[_DYN_TRACK_PAGE_VIEW ]({ refUri: uri, properties: { duration: 0 } });
                            }).bind(this, _prevUri), _self.autoRoutePVDelay);
                        }
                    }
                    if (!_historyListenerAdded) {
                        _addHook(InstrumentEvent(history, "pushState", {
                            ns: _evtNamespace,
                            rsp: function () {
                                if (_enableAutoRouteTracking) {
                                    _dispatchEvent(win, createDomEvent(namePrefix + "pushState"));
                                    _dispatchEvent(win, createDomEvent(namePrefix + "locationchange"));
                                }
                            }
                        }, true));
                        _addHook(InstrumentEvent(history, "replaceState", {
                            ns: _evtNamespace,
                            rsp: function () {
                                if (_enableAutoRouteTracking) {
                                    _dispatchEvent(win, createDomEvent(namePrefix + "replaceState"));
                                    _dispatchEvent(win, createDomEvent(namePrefix + "locationchange"));
                                }
                            }
                        }, true));
                        eventOn(win, namePrefix + "popstate", _popstateHandler, _evtNamespace);
                        eventOn(win, namePrefix + "locationchange", _locationChangeHandler, _evtNamespace);
                        _historyListenerAdded = true;
                    }
                }
                function _addUnhandledPromiseRejectionTracking(extConfig, _window, _location) {
                    _enableUnhandledPromiseRejectionTracking = extConfig[_DYN_ENABLE_UNHANDLED_PRO3 ] === true;
                    if (_enableUnhandledPromiseRejectionTracking && !_autoUnhandledPromiseInstrumented) {
                        _addHook(InstrumentEvent(_window, "onunhandledrejection", {
                            ns: _evtNamespace,
                            rsp: function (callDetails, error) {
                                if (_enableUnhandledPromiseRejectionTracking && callDetails.rslt !== true) {
                                    _self[_DYN__ONERROR ](Exception[_DYN__CREATE_AUTO_EXCEPTI14 ](_getReason(error), _location ? _location[_DYN_HREF ] : "", 0, 0, error, callDetails.evt));
                                }
                            }
                        }, false));
                        _autoUnhandledPromiseInstrumented = true;
                        extConfig.autoUnhandledPromiseInstrumented = _autoUnhandledPromiseInstrumented;
                    }
                }
                function _throwInternal(severity, msgId, msg, properties, isUserAct) {
                    _self[_DYN_DIAG_LOG$1 ]().throwInternal(severity, msgId, msg, properties, isUserAct);
                }
                function _initDefaults() {
                    _eventTracking = null;
                    _pageTracking = null;
                    _pageViewManager = null;
                    _pageViewPerformanceManager = null;
                    _pageVisitTimeManager = null;
                    _preInitTelemetryInitializers = null;
                    _isBrowserLinkTrackingEnabled = false;
                    _browserLinkInitializerAdded = false;
                    _enableAutoRouteTracking = false;
                    _historyListenerAdded = false;
                    _disableExceptionTracking = false;
                    _autoExceptionInstrumented = false;
                    _enableUnhandledPromiseRejectionTracking = false;
                    _autoUnhandledPromiseInstrumented = false;
                    var location = getLocation(true);
                    _prevUri = location && location[_DYN_HREF ] || "";
                    _currUri = null;
                    _evtNamespace = null;
                }
                objDefineAccessors(_self, "_pageViewManager", function () { return _pageViewManager; });
                objDefineAccessors(_self, "_pageViewPerformanceManager", function () { return _pageViewPerformanceManager; });
                objDefineAccessors(_self, "_pageVisitTimeManager", function () { return _pageVisitTimeManager; });
                objDefineAccessors(_self, "_evtNamespace", function () { return "." + _evtNamespace; });
            });
            return _this;
        }
        AnalyticsPlugin.Version = '2.8.9';
        AnalyticsPlugin.getDefaultConfig = _getDefaultConfig;
        return AnalyticsPlugin;
    }(BaseTelemetryPlugin));

    var STR_DURATION = "duration";

    var _DYN_TAGS = "tags";
    var _DYN_DEVICE_TYPE = "deviceType";
    var _DYN_DATA = "data";
    var _DYN_NAME = "name";
    var _DYN_TRACE_ID = "traceID";
    var _DYN_LENGTH$1 = "length";
    var _DYN_STRINGIFY = "stringify";
    var _DYN_MEASUREMENTS = "measurements";
    var _DYN_DATA_TYPE = "dataType";
    var _DYN_ENVELOPE_TYPE = "envelopeType";
    var _DYN_TO_STRING = "toString";
    var _DYN_ON_LINE = "onLine";
    var _DYN_ENQUEUE = "enqueue";
    var _DYN_COUNT = "count";
    var _DYN_PUSH = "push";
    var _DYN_EMIT_LINE_DELIMITED_0 = "emitLineDelimitedJson";
    var _DYN_CLEAR = "clear";
    var _DYN_BATCH_PAYLOADS = "batchPayloads";
    var _DYN_MARK_AS_SENT = "markAsSent";
    var _DYN_CLEAR_SENT = "clearSent";
    var _DYN__BUFFER__KEY = "BUFFER_KEY";
    var _DYN__SENT__BUFFER__KEY = "SENT_BUFFER_KEY";
    var _DYN__MAX__BUFFER__SIZE = "MAX_BUFFER_SIZE";
    var _DYN_NAME_PREFIX$1 = "namePrefix";
    var _DYN_MAX_BATCH_SIZE_IN_BY1 = "maxBatchSizeInBytes";
    var _DYN_TRIGGER_SEND = "triggerSend";
    var _DYN_DIAG_LOG = "diagLog";
    var _DYN_ONUNLOAD_DISABLE_BEA2 = "onunloadDisableBeacon";
    var _DYN_IS_BEACON_API_DISABL3 = "isBeaconApiDisabled";
    var _DYN__SENDER = "_sender";
    var _DYN__SENDER_CONFIG = "_senderConfig";
    var _DYN__BUFFER = "_buffer";
    var _DYN_ENABLE_SESSION_STORA4 = "enableSessionStorageBuffer";
    var _DYN_SAMPLING_PERCENTAGE = "samplingPercentage";
    var _DYN_INSTRUMENTATION_KEY = "instrumentationKey";
    var _DYN_ENDPOINT_URL = "endpointUrl";
    var _DYN_CUSTOM_HEADERS = "customHeaders";
    var _DYN_DISABLE_XHR = "disableXhr";
    var _DYN_ONUNLOAD_DISABLE_FET5 = "onunloadDisableFetch";
    var _DYN_DISABLE_TELEMETRY = "disableTelemetry";
    var _DYN_BASE_TYPE = "baseType";
    var _DYN_SAMPLE_RATE = "sampleRate";
    var _DYN_CONVERT_UNDEFINED = "convertUndefined";
    var _DYN__XHR_READY_STATE_CHA6 = "_xhrReadyStateChange";
    var _DYN__ON_ERROR = "_onError";
    var _DYN__ON_PARTIAL_SUCCESS = "_onPartialSuccess";
    var _DYN__ON_SUCCESS = "_onSuccess";
    var _DYN_ITEMS_ACCEPTED = "itemsAccepted";
    var _DYN_ITEMS_RECEIVED = "itemsReceived";
    var _DYN_IS_RETRY_DISABLED = "isRetryDisabled";
    var _DYN_SET_REQUEST_HEADER = "setRequestHeader";
    var _DYN_MAX_BATCH_INTERVAL = "maxBatchInterval";
    var _DYN_EVENTS_SEND_REQUEST = "eventsSendRequest";
    var _DYN_DISABLE_INSTRUMENTAT7 = "disableInstrumentationKeyValidation";
    var _DYN_GET_SAMPLING_SCORE = "getSamplingScore";
    var _DYN_GET_HASH_CODE_SCORE = "getHashCodeScore";

    var strBaseType = "baseType";
    var strBaseData = "baseData";
    var strProperties = "properties";
    var strTrue = "true";
    function _setValueIf(target, field, value) {
        return setValue(target, field, value, isTruthy);
    }
    function _extractPartAExtensions(logger, item, env) {
        var envTags = env[_DYN_TAGS ] = env[_DYN_TAGS ] || {};
        var itmExt = item.ext = item.ext || {};
        var itmTags = item[_DYN_TAGS ] = item[_DYN_TAGS ] || [];
        var extUser = itmExt.user;
        if (extUser) {
            _setValueIf(envTags, CtxTagKeys.userAuthUserId, extUser.authId);
            _setValueIf(envTags, CtxTagKeys.userId, extUser.id || extUser.localId);
        }
        var extApp = itmExt.app;
        if (extApp) {
            _setValueIf(envTags, CtxTagKeys.sessionId, extApp.sesId);
        }
        var extDevice = itmExt.device;
        if (extDevice) {
            _setValueIf(envTags, CtxTagKeys.deviceId, extDevice.id || extDevice.localId);
            _setValueIf(envTags, CtxTagKeys[_DYN_DEVICE_TYPE ], extDevice.deviceClass);
            _setValueIf(envTags, CtxTagKeys.deviceIp, extDevice.ip);
            _setValueIf(envTags, CtxTagKeys.deviceModel, extDevice.model);
            _setValueIf(envTags, CtxTagKeys[_DYN_DEVICE_TYPE ], extDevice[_DYN_DEVICE_TYPE ]);
        }
        var web = item.ext.web;
        if (web) {
            _setValueIf(envTags, CtxTagKeys.deviceLanguage, web.browserLang);
            _setValueIf(envTags, CtxTagKeys.deviceBrowserVersion, web.browserVer);
            _setValueIf(envTags, CtxTagKeys.deviceBrowser, web.browser);
            var envData = env[_DYN_DATA ] = env[_DYN_DATA ] || {};
            var envBaseData = envData[strBaseData] = envData[strBaseData] || {};
            var envProps = envBaseData[strProperties] = envBaseData[strProperties] || {};
            _setValueIf(envProps, "domain", web.domain);
            _setValueIf(envProps, "isManual", web.isManual ? strTrue : null);
            _setValueIf(envProps, "screenRes", web.screenRes);
            _setValueIf(envProps, "userConsent", web.userConsent ? strTrue : null);
        }
        var extOs = itmExt.os;
        if (extOs) {
            _setValueIf(envTags, CtxTagKeys.deviceOS, extOs[_DYN_NAME ]);
        }
        var extTrace = itmExt.trace;
        if (extTrace) {
            _setValueIf(envTags, CtxTagKeys.operationParentId, extTrace.parentID);
            _setValueIf(envTags, CtxTagKeys.operationName, dataSanitizeString(logger, extTrace[_DYN_NAME ]));
            _setValueIf(envTags, CtxTagKeys.operationId, extTrace[_DYN_TRACE_ID ]);
        }
        var tgs = {};
        for (var i = itmTags[_DYN_LENGTH$1 ] - 1; i >= 0; i--) {
            var tg = itmTags[i];
            objForEachKey(tg, function (key, value) {
                tgs[key] = value;
            });
            itmTags.splice(i, 1);
        }
        objForEachKey(itmTags, function (tg, value) {
            tgs[tg] = value;
        });
        var theTags = __assignFn(__assignFn({}, envTags), tgs);
        if (!theTags[CtxTagKeys.internalSdkVersion]) {
            theTags[CtxTagKeys.internalSdkVersion] = "javascript:".concat(EnvelopeCreator.Version);
        }
        env[_DYN_TAGS ] = optimizeObject(theTags);
    }
    function _extractPropsAndMeasurements(data, properties, measurements) {
        if (!isNullOrUndefined(data)) {
            objForEachKey(data, function (key, value) {
                if (isNumber(value)) {
                    measurements[key] = value;
                }
                else if (isString(value)) {
                    properties[key] = value;
                }
                else if (hasJSON()) {
                    properties[key] = getJSON()[_DYN_STRINGIFY ](value);
                }
            });
        }
    }
    function _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue) {
        if (!isNullOrUndefined(properties)) {
            objForEachKey(properties, function (key, value) {
                properties[key] = value || customUndefinedValue;
            });
        }
    }
    function _createEnvelope(logger, envelopeType, telemetryItem, data) {
        var envelope = new Envelope(logger, data, envelopeType);
        _setValueIf(envelope, "sampleRate", telemetryItem[SampleRate]);
        if ((telemetryItem[strBaseData] || {}).startTime) {
            envelope.time = toISOString(telemetryItem[strBaseData].startTime);
        }
        envelope.iKey = telemetryItem.iKey;
        var iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
        envelope[_DYN_NAME ] = envelope[_DYN_NAME ].replace("{0}", iKeyNoDashes);
        _extractPartAExtensions(logger, telemetryItem, envelope);
        telemetryItem[_DYN_TAGS ] = telemetryItem[_DYN_TAGS ] || [];
        return optimizeObject(envelope);
    }
    function EnvelopeCreatorInit(logger, telemetryItem) {
        if (isNullOrUndefined(telemetryItem[strBaseData])) {
            _throwInternal(logger, 1 , 46 , "telemetryItem.baseData cannot be null.");
        }
    }
    var EnvelopeCreator = {
        Version: '2.8.9'
    };
    function DependencyEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var customMeasurements = telemetryItem[strBaseData][_DYN_MEASUREMENTS ] || {};
        var customProperties = telemetryItem[strBaseData][strProperties] || {};
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], customProperties, customMeasurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
        }
        var bd = telemetryItem[strBaseData];
        if (isNullOrUndefined(bd)) {
            _warnToConsole(logger, "Invalid input for dependency data");
            return null;
        }
        var method = bd[strProperties] && bd[strProperties][HttpMethod] ? bd[strProperties][HttpMethod] : "GET";
        var remoteDepData = new RemoteDependencyData(logger, bd.id, bd.target, bd[_DYN_NAME ], bd[STR_DURATION ], bd.success, bd.responseCode, method, bd.type, bd.correlationContext, customProperties, customMeasurements);
        var data = new Data(RemoteDependencyData[_DYN_DATA_TYPE ], remoteDepData);
        return _createEnvelope(logger, RemoteDependencyData[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }
    function EventEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var customProperties = {};
        var customMeasurements = {};
        if (telemetryItem[strBaseType] !== Event$1[_DYN_DATA_TYPE ]) {
            customProperties["baseTypeSource"] = telemetryItem[strBaseType];
        }
        if (telemetryItem[strBaseType] === Event$1[_DYN_DATA_TYPE ]) {
            customProperties = telemetryItem[strBaseData][strProperties] || {};
            customMeasurements = telemetryItem[strBaseData][_DYN_MEASUREMENTS ] || {};
        }
        else {
            if (telemetryItem[strBaseData]) {
                _extractPropsAndMeasurements(telemetryItem[strBaseData], customProperties, customMeasurements);
            }
        }
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], customProperties, customMeasurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
        }
        var eventName = telemetryItem[strBaseData][_DYN_NAME ];
        var eventData = new Event$1(logger, eventName, customProperties, customMeasurements);
        var data = new Data(Event$1[_DYN_DATA_TYPE ], eventData);
        return _createEnvelope(logger, Event$1[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }
    function ExceptionEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var customMeasurements = telemetryItem[strBaseData][_DYN_MEASUREMENTS ] || {};
        var customProperties = telemetryItem[strBaseData][strProperties] || {};
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], customProperties, customMeasurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
        }
        var bd = telemetryItem[strBaseData];
        var exData = Exception.CreateFromInterface(logger, bd, customProperties, customMeasurements);
        var data = new Data(Exception[_DYN_DATA_TYPE ], exData);
        return _createEnvelope(logger, Exception[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }
    function MetricEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var baseData = telemetryItem[strBaseData];
        var props = baseData[strProperties] || {};
        var measurements = baseData[_DYN_MEASUREMENTS ] || {};
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], props, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(props, customUndefinedValue);
        }
        var baseMetricData = new Metric(logger, baseData[_DYN_NAME ], baseData.average, baseData.sampleCount, baseData.min, baseData.max, baseData.stdDev, props, measurements);
        var data = new Data(Metric[_DYN_DATA_TYPE ], baseMetricData);
        return _createEnvelope(logger, Metric[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }
    function PageViewEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var duration;
        var baseData = telemetryItem[strBaseData];
        if (!isNullOrUndefined(baseData) &&
            !isNullOrUndefined(baseData[strProperties]) &&
            !isNullOrUndefined(baseData[strProperties][STR_DURATION])) {
            duration = baseData[strProperties][STR_DURATION];
            delete baseData[strProperties][STR_DURATION];
        }
        else if (!isNullOrUndefined(telemetryItem[_DYN_DATA ]) &&
            !isNullOrUndefined(telemetryItem[_DYN_DATA ][STR_DURATION])) {
            duration = telemetryItem[_DYN_DATA ][STR_DURATION];
            delete telemetryItem[_DYN_DATA ][STR_DURATION];
        }
        var bd = telemetryItem[strBaseData];
        var currentContextId;
        if (((telemetryItem.ext || {}).trace || {})[_DYN_TRACE_ID ]) {
            currentContextId = telemetryItem.ext.trace[_DYN_TRACE_ID ];
        }
        var id = bd.id || currentContextId;
        var name = bd[_DYN_NAME ];
        var url = bd.uri;
        var properties = bd[strProperties] || {};
        var measurements = bd[_DYN_MEASUREMENTS ] || {};
        if (!isNullOrUndefined(bd.refUri)) {
            properties["refUri"] = bd.refUri;
        }
        if (!isNullOrUndefined(bd.pageType)) {
            properties["pageType"] = bd.pageType;
        }
        if (!isNullOrUndefined(bd.isLoggedIn)) {
            properties["isLoggedIn"] = bd.isLoggedIn[_DYN_TO_STRING ]();
        }
        if (!isNullOrUndefined(bd[strProperties])) {
            var pageTags = bd[strProperties];
            objForEachKey(pageTags, function (key, value) {
                properties[key] = value;
            });
        }
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], properties, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue);
        }
        var pageViewData = new PageView(logger, name, url, duration, properties, measurements, id);
        var data = new Data(PageView[_DYN_DATA_TYPE ], pageViewData);
        return _createEnvelope(logger, PageView[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }
    function PageViewPerformanceEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var bd = telemetryItem[strBaseData];
        var name = bd[_DYN_NAME ];
        var url = bd.uri || bd.url;
        var properties = bd[strProperties] || {};
        var measurements = bd[_DYN_MEASUREMENTS ] || {};
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], properties, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue);
        }
        var baseData = new PageViewPerformance(logger, name, url, undefined, properties, measurements, bd);
        var data = new Data(PageViewPerformance[_DYN_DATA_TYPE ], baseData);
        return _createEnvelope(logger, PageViewPerformance[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }
    function TraceEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var message = telemetryItem[strBaseData].message;
        var severityLevel = telemetryItem[strBaseData].severityLevel;
        var props = telemetryItem[strBaseData][strProperties] || {};
        var measurements = telemetryItem[strBaseData][_DYN_MEASUREMENTS ] || {};
        _extractPropsAndMeasurements(telemetryItem[_DYN_DATA ], props, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(props, customUndefinedValue);
        }
        var baseData = new Trace(logger, message, severityLevel, props, measurements);
        var data = new Data(Trace[_DYN_DATA_TYPE ], baseData);
        return _createEnvelope(logger, Trace[_DYN_ENVELOPE_TYPE ], telemetryItem, data);
    }

    function _disableEvents(target, evtNamespace) {
        eventOff(target, null, null, evtNamespace);
    }
    function createOfflineListener(parentEvtNamespace) {
        var _document = getDocument();
        var _navigator = getNavigator();
        var _isListening = false;
        var _onlineStatus = true;
        var _evtNamespace = mergeEvtNamespace(createUniqueNamespace("OfflineListener"), parentEvtNamespace);
        try {
            if (_enableEvents(getWindow())) {
                _isListening = true;
            }
            if (_document) {
                var target = _document.body || _document;
                if (target.ononline) {
                    if (_enableEvents(target)) {
                        _isListening = true;
                    }
                }
            }
            if (_isListening) {
                if (_navigator && !isNullOrUndefined(_navigator[_DYN_ON_LINE ])) {
                    _onlineStatus = _navigator[_DYN_ON_LINE ];
                }
            }
        }
        catch (e) {
            _isListening = false;
        }
        function _enableEvents(target) {
            var enabled = false;
            if (target) {
                enabled = eventOn(target, "online", _setOnline, _evtNamespace);
                if (enabled) {
                    eventOn(target, "offline", _setOffline, _evtNamespace);
                }
            }
            return enabled;
        }
        function _setOnline() {
            _onlineStatus = true;
        }
        function _setOffline() {
            _onlineStatus = false;
        }
        function _isOnline() {
            var result = true;
            if (_isListening) {
                result = _onlineStatus;
            }
            else if (_navigator && !isNullOrUndefined(_navigator[_DYN_ON_LINE ])) {
                result = _navigator[_DYN_ON_LINE ];
            }
            return result;
        }
        function _unload() {
            var win = getWindow();
            if (win && _isListening) {
                _disableEvents(win, _evtNamespace);
                if (_document) {
                    var target = _document.body || _document;
                    if (!isUndefined(target.ononline)) {
                        _disableEvents(target, _evtNamespace);
                    }
                }
                _isListening = false;
            }
        }
        return {
            isOnline: _isOnline,
            isListening: function () { return _isListening; },
            unload: _unload
        };
    }

    var BaseSendBuffer = /** @class */ (function () {
        function BaseSendBuffer(logger, config) {
            var _buffer = [];
            var _bufferFullMessageSent = false;
            this._get = function () {
                return _buffer;
            };
            this._set = function (buffer) {
                _buffer = buffer;
                return _buffer;
            };
            dynamicProto(BaseSendBuffer, this, function (_self) {
                _self[_DYN_ENQUEUE ] = function (payload) {
                    if (_self[_DYN_COUNT ]() >= config.eventsLimitInMem()) {
                        if (!_bufferFullMessageSent) {
                            _throwInternal(logger, 2 , 105 , "Maximum in-memory buffer size reached: " + _self[_DYN_COUNT ](), true);
                            _bufferFullMessageSent = true;
                        }
                        return;
                    }
                    _buffer[_DYN_PUSH ](payload);
                };
                _self[_DYN_COUNT ] = function () {
                    return _buffer[_DYN_LENGTH$1 ];
                };
                _self.size = function () {
                    var size = _buffer[_DYN_LENGTH$1 ];
                    for (var lp = 0; lp < _buffer[_DYN_LENGTH$1 ]; lp++) {
                        size += _buffer[lp][_DYN_LENGTH$1 ];
                    }
                    if (!config[_DYN_EMIT_LINE_DELIMITED_0 ]()) {
                        size += 2;
                    }
                    return size;
                };
                _self[_DYN_CLEAR ] = function () {
                    _buffer = [];
                    _bufferFullMessageSent = false;
                };
                _self.getItems = function () {
                    return _buffer.slice(0);
                };
                _self[_DYN_BATCH_PAYLOADS ] = function (payload) {
                    if (payload && payload[_DYN_LENGTH$1 ] > 0) {
                        var batch = config[_DYN_EMIT_LINE_DELIMITED_0 ]() ?
                            payload.join("\n") :
                            "[" + payload.join(",") + "]";
                        return batch;
                    }
                    return null;
                };
            });
        }
        BaseSendBuffer.__ieDyn=1;
        return BaseSendBuffer;
    }());
    var ArraySendBuffer = /** @class */ (function (_super) {
        __extendsFn(ArraySendBuffer, _super);
        function ArraySendBuffer(logger, config) {
            var _this = _super.call(this, logger, config) || this;
            dynamicProto(ArraySendBuffer, _this, function (_self, _base) {
                _self[_DYN_MARK_AS_SENT ] = function (payload) {
                    _base[_DYN_CLEAR ]();
                };
                _self[_DYN_CLEAR_SENT ] = function (payload) {
                };
            });
            return _this;
        }
        ArraySendBuffer.__ieDyn=1;
        return ArraySendBuffer;
    }(BaseSendBuffer));
    var SessionStorageSendBuffer = /** @class */ (function (_super) {
        __extendsFn(SessionStorageSendBuffer, _super);
        function SessionStorageSendBuffer(logger, config) {
            var _this = _super.call(this, logger, config) || this;
            var _bufferFullMessageSent = false;
            dynamicProto(SessionStorageSendBuffer, _this, function (_self, _base) {
                var bufferItems = _getBuffer(SessionStorageSendBuffer[_DYN__BUFFER__KEY ]);
                var notDeliveredItems = _getBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ]);
                var buffer = _self._set(bufferItems.concat(notDeliveredItems));
                if (buffer[_DYN_LENGTH$1 ] > SessionStorageSendBuffer[_DYN__MAX__BUFFER__SIZE ]) {
                    buffer[_DYN_LENGTH$1 ] = SessionStorageSendBuffer[_DYN__MAX__BUFFER__SIZE ];
                }
                _setBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ], []);
                _setBuffer(SessionStorageSendBuffer[_DYN__BUFFER__KEY ], buffer);
                _self[_DYN_ENQUEUE ] = function (payload) {
                    if (_self[_DYN_COUNT ]() >= SessionStorageSendBuffer[_DYN__MAX__BUFFER__SIZE ]) {
                        if (!_bufferFullMessageSent) {
                            _throwInternal(logger, 2 , 67 , "Maximum buffer size reached: " + _self[_DYN_COUNT ](), true);
                            _bufferFullMessageSent = true;
                        }
                        return;
                    }
                    _base[_DYN_ENQUEUE ](payload);
                    _setBuffer(SessionStorageSendBuffer[_DYN__BUFFER__KEY ], _self._get());
                };
                _self[_DYN_CLEAR ] = function () {
                    _base[_DYN_CLEAR ]();
                    _setBuffer(SessionStorageSendBuffer[_DYN__BUFFER__KEY ], _self._get());
                    _setBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ], []);
                    _bufferFullMessageSent = false;
                };
                _self[_DYN_MARK_AS_SENT ] = function (payload) {
                    _setBuffer(SessionStorageSendBuffer[_DYN__BUFFER__KEY ], _self._set(_removePayloadsFromBuffer(payload, _self._get())));
                    var sentElements = _getBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ]);
                    if (sentElements instanceof Array && payload instanceof Array) {
                        sentElements = sentElements.concat(payload);
                        if (sentElements[_DYN_LENGTH$1 ] > SessionStorageSendBuffer[_DYN__MAX__BUFFER__SIZE ]) {
                            _throwInternal(logger, 1 , 67 , "Sent buffer reached its maximum size: " + sentElements[_DYN_LENGTH$1 ], true);
                            sentElements[_DYN_LENGTH$1 ] = SessionStorageSendBuffer[_DYN__MAX__BUFFER__SIZE ];
                        }
                        _setBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ], sentElements);
                    }
                };
                _self[_DYN_CLEAR_SENT ] = function (payload) {
                    var sentElements = _getBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ]);
                    sentElements = _removePayloadsFromBuffer(payload, sentElements);
                    _setBuffer(SessionStorageSendBuffer[_DYN__SENT__BUFFER__KEY ], sentElements);
                };
                function _removePayloadsFromBuffer(payloads, buffer) {
                    var remaining = [];
                    arrForEach(buffer, function (value) {
                        if (!isFunction(value) && arrIndexOf(payloads, value) === -1) {
                            remaining[_DYN_PUSH ](value);
                        }
                    });
                    return remaining;
                }
                function _getBuffer(key) {
                    var prefixedKey = key;
                    try {
                        prefixedKey = config[_DYN_NAME_PREFIX$1 ] && config[_DYN_NAME_PREFIX$1 ]() ? config[_DYN_NAME_PREFIX$1 ]() + "_" + prefixedKey : prefixedKey;
                        var bufferJson = utlGetSessionStorage(logger, prefixedKey);
                        if (bufferJson) {
                            var buffer_1 = getJSON().parse(bufferJson);
                            if (isString(buffer_1)) {
                                buffer_1 = getJSON().parse(buffer_1);
                            }
                            if (buffer_1 && isArray(buffer_1)) {
                                return buffer_1;
                            }
                        }
                    }
                    catch (e) {
                        _throwInternal(logger, 1 , 42 , " storage key: " + prefixedKey + ", " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                    return [];
                }
                function _setBuffer(key, buffer) {
                    var prefixedKey = key;
                    try {
                        prefixedKey = config[_DYN_NAME_PREFIX$1 ] && config[_DYN_NAME_PREFIX$1 ]() ? config[_DYN_NAME_PREFIX$1 ]() + "_" + prefixedKey : prefixedKey;
                        var bufferJson = JSON[_DYN_STRINGIFY ](buffer);
                        utlSetSessionStorage(logger, prefixedKey, bufferJson);
                    }
                    catch (e) {
                        utlSetSessionStorage(logger, prefixedKey, JSON[_DYN_STRINGIFY ]([]));
                        _throwInternal(logger, 2 , 41 , " storage key: " + prefixedKey + ", " + getExceptionName(e) + ". Buffer cleared", { exception: dumpObj(e) });
                    }
                }
            });
            return _this;
        }
        SessionStorageSendBuffer.BUFFER_KEY = "AI_buffer";
        SessionStorageSendBuffer.SENT_BUFFER_KEY = "AI_sentBuffer";
        SessionStorageSendBuffer.MAX_BUFFER_SIZE = 2000;
        return SessionStorageSendBuffer;
    }(BaseSendBuffer));

    var Serializer = /** @class */ (function () {
        function Serializer(logger) {
            dynamicProto(Serializer, this, function (_self) {
                _self.serialize = function (input) {
                    var output = _serializeObject(input, "root");
                    try {
                        return getJSON()[_DYN_STRINGIFY ](output);
                    }
                    catch (e) {
                        _throwInternal(logger, 1 , 48 , (e && isFunction(e[_DYN_TO_STRING ])) ? e[_DYN_TO_STRING ]() : "Error serializing object", null, true);
                    }
                };
                function _serializeObject(source, name) {
                    var circularReferenceCheck = "__aiCircularRefCheck";
                    var output = {};
                    if (!source) {
                        _throwInternal(logger, 1 , 48 , "cannot serialize object because it is null or undefined", { name: name }, true);
                        return output;
                    }
                    if (source[circularReferenceCheck]) {
                        _throwInternal(logger, 2 , 50 , "Circular reference detected while serializing object", { name: name }, true);
                        return output;
                    }
                    if (!source.aiDataContract) {
                        if (name === "measurements") {
                            output = _serializeStringMap(source, "number", name);
                        }
                        else if (name === "properties") {
                            output = _serializeStringMap(source, "string", name);
                        }
                        else if (name === "tags") {
                            output = _serializeStringMap(source, "string", name);
                        }
                        else if (isArray(source)) {
                            output = _serializeArray(source, name);
                        }
                        else {
                            _throwInternal(logger, 2 , 49 , "Attempting to serialize an object which does not implement ISerializable", { name: name }, true);
                            try {
                                getJSON()[_DYN_STRINGIFY ](source);
                                output = source;
                            }
                            catch (e) {
                                _throwInternal(logger, 1 , 48 , (e && isFunction(e[_DYN_TO_STRING ])) ? e[_DYN_TO_STRING ]() : "Error serializing object", null, true);
                            }
                        }
                        return output;
                    }
                    source[circularReferenceCheck] = true;
                    objForEachKey(source.aiDataContract, function (field, contract) {
                        var isRequired = (isFunction(contract)) ? (contract() & 1 ) : (contract & 1 );
                        var isHidden = (isFunction(contract)) ? (contract() & 4 ) : (contract & 4 );
                        var isArray = contract & 2 ;
                        var isPresent = source[field] !== undefined;
                        var isObj = isObject(source[field]) && source[field] !== null;
                        if (isRequired && !isPresent && !isArray) {
                            _throwInternal(logger, 1 , 24 , "Missing required field specification. The field is required but not present on source", { field: field, name: name });
                        }
                        else if (!isHidden) {
                            var value = void 0;
                            if (isObj) {
                                if (isArray) {
                                    value = _serializeArray(source[field], field);
                                }
                                else {
                                    value = _serializeObject(source[field], field);
                                }
                            }
                            else {
                                value = source[field];
                            }
                            if (value !== undefined) {
                                output[field] = value;
                            }
                        }
                    });
                    delete source[circularReferenceCheck];
                    return output;
                }
                function _serializeArray(sources, name) {
                    var output;
                    if (!!sources) {
                        if (!isArray(sources)) {
                            _throwInternal(logger, 1 , 54 , "This field was specified as an array in the contract but the item is not an array.\r\n", { name: name }, true);
                        }
                        else {
                            output = [];
                            for (var i = 0; i < sources[_DYN_LENGTH$1 ]; i++) {
                                var source = sources[i];
                                var item = _serializeObject(source, name + "[" + i + "]");
                                output[_DYN_PUSH ](item);
                            }
                        }
                    }
                    return output;
                }
                function _serializeStringMap(map, expectedType, name) {
                    var output;
                    if (map) {
                        output = {};
                        objForEachKey(map, function (field, value) {
                            if (expectedType === "string") {
                                if (value === undefined) {
                                    output[field] = "undefined";
                                }
                                else if (value === null) {
                                    output[field] = "null";
                                }
                                else if (!value[_DYN_TO_STRING ]) {
                                    output[field] = "invalid field: toString() is not defined.";
                                }
                                else {
                                    output[field] = value[_DYN_TO_STRING ]();
                                }
                            }
                            else if (expectedType === "number") {
                                if (value === undefined) {
                                    output[field] = "undefined";
                                }
                                else if (value === null) {
                                    output[field] = "null";
                                }
                                else {
                                    var num = parseFloat(value);
                                    if (isNaN(num)) {
                                        output[field] = "NaN";
                                    }
                                    else {
                                        output[field] = num;
                                    }
                                }
                            }
                            else {
                                output[field] = "invalid field: " + name + " is of unknown type.";
                                _throwInternal(logger, 1 , output[field], null, true);
                            }
                        });
                    }
                    return output;
                }
            });
        }
        Serializer.__ieDyn=1;
        return Serializer;
    }());

    var MIN_INPUT_LENGTH = 8;
    var HashCodeScoreGenerator = /** @class */ (function () {
        function HashCodeScoreGenerator() {
        }
        HashCodeScoreGenerator.prototype.getHashCodeScore = function (key) {
            var score = this.getHashCode(key) / HashCodeScoreGenerator.INT_MAX_VALUE;
            return score * 100;
        };
        HashCodeScoreGenerator.prototype.getHashCode = function (input) {
            if (input === "") {
                return 0;
            }
            while (input[_DYN_LENGTH$1 ] < MIN_INPUT_LENGTH) {
                input = input.concat(input);
            }
            var hash = 5381;
            for (var i = 0; i < input[_DYN_LENGTH$1 ]; ++i) {
                hash = ((hash << 5) + hash) + input.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        };
        HashCodeScoreGenerator.INT_MAX_VALUE = 2147483647;
        return HashCodeScoreGenerator;
    }());

    var SamplingScoreGenerator = /** @class */ (function () {
        function SamplingScoreGenerator() {
            var _self = this;
            var hashCodeGenerator = new HashCodeScoreGenerator();
            var keys = new ContextTagKeys();
            _self[_DYN_GET_SAMPLING_SCORE ] = function (item) {
                var score = 0;
                if (item[_DYN_TAGS ] && item[_DYN_TAGS ][keys.userId]) {
                    score = hashCodeGenerator.getHashCodeScore(item[_DYN_TAGS ][keys.userId]);
                }
                else if (item.ext && item.ext.user && item.ext.user.id) {
                    score = hashCodeGenerator[_DYN_GET_HASH_CODE_SCORE ](item.ext.user.id);
                }
                else if (item[_DYN_TAGS ] && item[_DYN_TAGS ][keys.operationId]) {
                    score = hashCodeGenerator.getHashCodeScore(item[_DYN_TAGS ][keys.operationId]);
                }
                else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace[_DYN_TRACE_ID ]) {
                    score = hashCodeGenerator.getHashCodeScore(item.ext.telemetryTrace[_DYN_TRACE_ID ]);
                }
                else {
                    score = (Math.random() * 100);
                }
                return score;
            };
        }
        return SamplingScoreGenerator;
    }());

    var Sample = /** @class */ (function () {
        function Sample(sampleRate, logger) {
            this.INT_MAX_VALUE = 2147483647;
            var _logger = logger || safeGetLogger(null);
            if (sampleRate > 100 || sampleRate < 0) {
                _logger.throwInternal(2 , 58 , "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.", { samplingRate: sampleRate }, true);
                sampleRate = 100;
            }
            this[_DYN_SAMPLE_RATE ] = sampleRate;
            this.samplingScoreGenerator = new SamplingScoreGenerator();
        }
        Sample.prototype.isSampledIn = function (envelope) {
            var samplingPercentage = this[_DYN_SAMPLE_RATE ];
            var isSampledIn = false;
            if (samplingPercentage === null || samplingPercentage === undefined || samplingPercentage >= 100) {
                return true;
            }
            else if (envelope.baseType === Metric[_DYN_DATA_TYPE ]) {
                return true;
            }
            isSampledIn = this.samplingScoreGenerator[_DYN_GET_SAMPLING_SCORE ](envelope) < samplingPercentage;
            return isSampledIn;
        };
        return Sample;
    }());

    var _a;
    var FetchSyncRequestSizeLimitBytes = 65000;
    function _getResponseText(xhr) {
        try {
            return xhr.responseText;
        }
        catch (e) {
        }
        return null;
    }
    function _getDefaultAppInsightsChannelConfig() {
        var _a;
        var defaultValue;
        var defaultCustomHeaders;
        return _a = {
                endpointUrl: function () { return DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH; }
            },
            _a[_DYN_EMIT_LINE_DELIMITED_0 ] = function () { return false; },
            _a[_DYN_MAX_BATCH_INTERVAL ] = function () { return 15000; },
            _a[_DYN_MAX_BATCH_SIZE_IN_BY1 ] = function () { return 102400; },
            _a[_DYN_DISABLE_TELEMETRY ] = function () { return false; },
            _a[_DYN_ENABLE_SESSION_STORA4 ] = function () { return true; },
            _a[_DYN_IS_RETRY_DISABLED ] = function () { return false; },
            _a[_DYN_IS_BEACON_API_DISABL3 ] = function () { return true; },
            _a[_DYN_DISABLE_XHR ] = function () { return false; },
            _a[_DYN_ONUNLOAD_DISABLE_FET5 ] = function () { return false; },
            _a[_DYN_ONUNLOAD_DISABLE_BEA2 ] = function () { return false; },
            _a[_DYN_INSTRUMENTATION_KEY ] = function () { return defaultValue; },
            _a[_DYN_NAME_PREFIX$1 ] = function () { return defaultValue; },
            _a[_DYN_SAMPLING_PERCENTAGE ] = function () { return 100; },
            _a[_DYN_CUSTOM_HEADERS ] = function () { return defaultCustomHeaders; },
            _a[_DYN_CONVERT_UNDEFINED ] = function () { return defaultValue; },
            _a.eventsLimitInMem = function () { return 10000; },
            _a;
    }
    var EnvelopeTypeCreator = (_a = {},
        _a[Event$1.dataType] = EventEnvelopeCreator,
        _a[Trace.dataType] = TraceEnvelopeCreator,
        _a[PageView.dataType] = PageViewEnvelopeCreator,
        _a[PageViewPerformance.dataType] = PageViewPerformanceEnvelopeCreator,
        _a[Exception.dataType] = ExceptionEnvelopeCreator,
        _a[Metric.dataType] = MetricEnvelopeCreator,
        _a[RemoteDependencyData.dataType] = DependencyEnvelopeCreator,
        _a);
    var Sender = /** @class */ (function (_super) {
        __extendsFn(Sender, _super);
        function Sender() {
            var _this = _super.call(this) || this;
            _this.priority = 1001;
            _this.identifier = BreezeChannelIdentifier;
            _this._senderConfig = _getDefaultAppInsightsChannelConfig();
            var _consecutiveErrors;
            var _retryAt;
            var _paused;
            var _timeoutHandle;
            var _serializer;
            var _stamp_specific_redirects;
            var _headers;
            var _syncFetchPayload = 0;
            var _fallbackSender;
            var _syncUnloadSender;
            var _offlineListener;
            var _evtNamespace;
            dynamicProto(Sender, _this, function (_self, _base) {
                _initDefaults();
                _self.pause = function () {
                    _clearScheduledTimer();
                    _paused = true;
                };
                _self.resume = function () {
                    if (_paused) {
                        _paused = false;
                        _retryAt = null;
                        if (_self._buffer.size() > _self._senderConfig[_DYN_MAX_BATCH_SIZE_IN_BY1 ]()) {
                            _self[_DYN_TRIGGER_SEND ](true, null, 10 );
                        }
                        _setupTimer();
                    }
                };
                _self.flush = function (isAsync, callBack, sendReason) {
                    if (isAsync === void 0) { isAsync = true; }
                    if (!_paused) {
                        _clearScheduledTimer();
                        try {
                            _self[_DYN_TRIGGER_SEND ](isAsync, null, sendReason || 1 );
                        }
                        catch (e) {
                            _throwInternal(_self[_DYN_DIAG_LOG ](), 1 , 22 , "flush failed, telemetry will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                        }
                    }
                };
                _self.onunloadFlush = function () {
                    if (!_paused) {
                        if ((_self._senderConfig[_DYN_ONUNLOAD_DISABLE_BEA2 ]() === false || _self[_DYN__SENDER_CONFIG ][_DYN_IS_BEACON_API_DISABL3 ]() === false) && isBeaconsSupported()) {
                            try {
                                _self[_DYN_TRIGGER_SEND ](true, _doUnloadSend, 2 );
                            }
                            catch (e) {
                                _throwInternal(_self[_DYN_DIAG_LOG ](), 1 , 20 , "failed to flush with beacon sender on page unload, telemetry will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                            }
                        }
                        else {
                            _self.flush();
                        }
                    }
                };
                _self.addHeader = function (name, value) {
                    _headers[name] = value;
                };
                _self.initialize = function (config, core, extensions, pluginChain) {
                    if (_self.isInitialized()) {
                        _throwInternal(_self[_DYN_DIAG_LOG ](), 1 , 28 , "Sender is already initialized");
                    }
                    _base.initialize(config, core, extensions, pluginChain);
                    var ctx = _self._getTelCtx();
                    var identifier = _self.identifier;
                    _serializer = new Serializer(core.logger);
                    _consecutiveErrors = 0;
                    _retryAt = null;
                    _self[_DYN__SENDER ] = null;
                    _stamp_specific_redirects = 0;
                    var diagLog = _self[_DYN_DIAG_LOG ]();
                    _evtNamespace = mergeEvtNamespace(createUniqueNamespace("Sender"), core.evtNamespace && core.evtNamespace());
                    _offlineListener = createOfflineListener(_evtNamespace);
                    var defaultConfig = _getDefaultAppInsightsChannelConfig();
                    objForEachKey(defaultConfig, function (field, value) {
                        _self[_DYN__SENDER_CONFIG ][field] = function () {
                            var theValue = ctx.getConfig(identifier, field, value());
                            if (!theValue && field === "endpointUrl") {
                                theValue = value();
                            }
                            return theValue;
                        };
                    });
                    _self._buffer = (_self[_DYN__SENDER_CONFIG ][_DYN_ENABLE_SESSION_STORA4 ]() && utlCanUseSessionStorage())
                        ? new SessionStorageSendBuffer(diagLog, _self[_DYN__SENDER_CONFIG ]) : new ArraySendBuffer(diagLog, _self[_DYN__SENDER_CONFIG ]);
                    _self._sample = new Sample(_self[_DYN__SENDER_CONFIG ][_DYN_SAMPLING_PERCENTAGE ](), diagLog);
                    if (!_validateInstrumentationKey(config)) {
                        _throwInternal(diagLog, 1 , 100 , "Invalid Instrumentation key " + config[_DYN_INSTRUMENTATION_KEY ]);
                    }
                    if (!isInternalApplicationInsightsEndpoint(_self._senderConfig.endpointUrl()) && _self._senderConfig.customHeaders() && _self._senderConfig.customHeaders()[_DYN_LENGTH$1 ] > 0) {
                        arrForEach(_self[_DYN__SENDER_CONFIG ][_DYN_CUSTOM_HEADERS ](), function (customHeader) {
                            _this.addHeader(customHeader.header, customHeader.value);
                        });
                    }
                    var senderConfig = _self[_DYN__SENDER_CONFIG ];
                    var sendPostFunc = null;
                    if (!senderConfig[_DYN_DISABLE_XHR ]() && useXDomainRequest()) {
                        sendPostFunc = _xdrSender;
                    }
                    else if (!senderConfig[_DYN_DISABLE_XHR ]() && isXhrSupported()) {
                        sendPostFunc = _xhrSender;
                    }
                    if (!sendPostFunc && isFetchSupported()) {
                        sendPostFunc = _fetchSender;
                    }
                    _fallbackSender = sendPostFunc || _xhrSender;
                    if (!senderConfig[_DYN_IS_BEACON_API_DISABL3 ]() && isBeaconsSupported()) {
                        sendPostFunc = _beaconSender;
                    }
                    _self[_DYN__SENDER ] = sendPostFunc || _xhrSender;
                    if (!senderConfig[_DYN_ONUNLOAD_DISABLE_FET5 ]() && isFetchSupported(true)) {
                        _syncUnloadSender = _fetchKeepAliveSender;
                    }
                    else if (isBeaconsSupported()) {
                        _syncUnloadSender = _beaconSender;
                    }
                    else if (!senderConfig[_DYN_DISABLE_XHR ]() && useXDomainRequest()) {
                        _syncUnloadSender = _xdrSender;
                    }
                    else if (!senderConfig[_DYN_DISABLE_XHR ]() && isXhrSupported()) {
                        _syncUnloadSender = _xhrSender;
                    }
                    else {
                        _syncUnloadSender = _fallbackSender;
                    }
                };
                _self.processTelemetry = function (telemetryItem, itemCtx) {
                    itemCtx = _self._getTelCtx(itemCtx);
                    var diagLogger = itemCtx[_DYN_DIAG_LOG ]();
                    try {
                        if (_self[_DYN__SENDER_CONFIG ][_DYN_DISABLE_TELEMETRY ]()) {
                            return;
                        }
                        if (!telemetryItem) {
                            _throwInternal(diagLogger, 1 , 7 , "Cannot send empty telemetry");
                            return;
                        }
                        if (telemetryItem.baseData && !telemetryItem[_DYN_BASE_TYPE ]) {
                            _throwInternal(diagLogger, 1 , 70 , "Cannot send telemetry without baseData and baseType");
                            return;
                        }
                        if (!telemetryItem[_DYN_BASE_TYPE ]) {
                            telemetryItem[_DYN_BASE_TYPE ] = "EventData";
                        }
                        if (!_self[_DYN__SENDER ]) {
                            _throwInternal(diagLogger, 1 , 28 , "Sender was not initialized");
                            return;
                        }
                        if (!_isSampledIn(telemetryItem)) {
                            _throwInternal(diagLogger, 2 , 33 , "Telemetry item was sampled out and not sent", { SampleRate: _self._sample[_DYN_SAMPLE_RATE ] });
                            return;
                        }
                        else {
                            telemetryItem[SampleRate] = _self._sample[_DYN_SAMPLE_RATE ];
                        }
                        var convertUndefined = _self[_DYN__SENDER_CONFIG ][_DYN_CONVERT_UNDEFINED ]() || undefined;
                        var defaultEnvelopeIkey = telemetryItem.iKey || _self[_DYN__SENDER_CONFIG ][_DYN_INSTRUMENTATION_KEY ]();
                        var aiEnvelope_1 = Sender.constructEnvelope(telemetryItem, defaultEnvelopeIkey, diagLogger, convertUndefined);
                        if (!aiEnvelope_1) {
                            _throwInternal(diagLogger, 1 , 47 , "Unable to create an AppInsights envelope");
                            return;
                        }
                        var doNotSendItem_1 = false;
                        if (telemetryItem[_DYN_TAGS ] && telemetryItem[_DYN_TAGS ][ProcessLegacy]) {
                            arrForEach(telemetryItem[_DYN_TAGS ][ProcessLegacy], function (callBack) {
                                try {
                                    if (callBack && callBack(aiEnvelope_1) === false) {
                                        doNotSendItem_1 = true;
                                        _warnToConsole(diagLogger, "Telemetry processor check returns false");
                                    }
                                }
                                catch (e) {
                                    _throwInternal(diagLogger, 1 , 64 , "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e), { exception: dumpObj(e) }, true);
                                }
                            });
                            delete telemetryItem[_DYN_TAGS ][ProcessLegacy];
                        }
                        if (doNotSendItem_1) {
                            return;
                        }
                        var payload = _serializer.serialize(aiEnvelope_1);
                        var buffer = _self[_DYN__BUFFER ];
                        var bufferSize = buffer.size();
                        if ((bufferSize + payload[_DYN_LENGTH$1 ]) > _self[_DYN__SENDER_CONFIG ][_DYN_MAX_BATCH_SIZE_IN_BY1 ]()) {
                            _self[_DYN_TRIGGER_SEND ](true, null, 10 );
                        }
                        buffer[_DYN_ENQUEUE ](payload);
                        _setupTimer();
                    }
                    catch (e) {
                        _throwInternal(diagLogger, 2 , 12 , "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                    _self.processNext(telemetryItem, itemCtx);
                };
                _self[_DYN__XHR_READY_STATE_CHA6 ] = function (xhr, payload, countOfItemsInPayload) {
                    if (xhr.readyState === 4) {
                        _checkResponsStatus(xhr.status, payload, xhr.responseURL, countOfItemsInPayload, _formatErrorMessageXhr(xhr), _getResponseText(xhr) || xhr.response);
                    }
                };
                _self[_DYN_TRIGGER_SEND ] = function (async, forcedSender, sendReason) {
                    if (async === void 0) { async = true; }
                    if (!_paused) {
                        try {
                            var buffer = _self[_DYN__BUFFER ];
                            if (!_self[_DYN__SENDER_CONFIG ][_DYN_DISABLE_TELEMETRY ]()) {
                                if (buffer[_DYN_COUNT ]() > 0) {
                                    var payload = buffer.getItems();
                                    _notifySendRequest(sendReason || 0 , async);
                                    if (forcedSender) {
                                        forcedSender.call(_this, payload, async);
                                    }
                                    else {
                                        _self[_DYN__SENDER ](payload, async);
                                    }
                                }
                            }
                            else {
                                buffer[_DYN_CLEAR ]();
                            }
                            _clearScheduledTimer();
                        }
                        catch (e) {
                            var ieVer = getIEVersion();
                            if (!ieVer || ieVer > 9) {
                                _throwInternal(_self[_DYN_DIAG_LOG ](), 1 , 40 , "Telemetry transmission failed, some telemetry will be lost: " + getExceptionName(e), { exception: dumpObj(e) });
                            }
                        }
                    }
                };
                _self._doTeardown = function (unloadCtx, unloadState) {
                    _self.onunloadFlush();
                    _offlineListener.unload();
                    _initDefaults();
                };
                _self[_DYN__ON_ERROR ] = function (payload, message, event) {
                    _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 26 , "Failed to send telemetry.", { message: message });
                    _self._buffer[_DYN_CLEAR_SENT ](payload);
                };
                _self[_DYN__ON_PARTIAL_SUCCESS ] = function (payload, results) {
                    var failed = [];
                    var retry = [];
                    var errors = results.errors.reverse();
                    for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                        var error = errors_1[_i];
                        var extracted = payload.splice(error.index, 1)[0];
                        if (_isRetriable(error.statusCode)) {
                            retry[_DYN_PUSH ](extracted);
                        }
                        else {
                            failed[_DYN_PUSH ](extracted);
                        }
                    }
                    if (payload[_DYN_LENGTH$1 ] > 0) {
                        _self[_DYN__ON_SUCCESS ](payload, results[_DYN_ITEMS_ACCEPTED ]);
                    }
                    if (failed[_DYN_LENGTH$1 ] > 0) {
                        _self[_DYN__ON_ERROR ](failed, _formatErrorMessageXhr(null, ["partial success", results[_DYN_ITEMS_ACCEPTED ], "of", results.itemsReceived].join(" ")));
                    }
                    if (retry[_DYN_LENGTH$1 ] > 0) {
                        _resendPayload(retry);
                        _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 40 , "Partial success. " +
                            "Delivered: " + payload[_DYN_LENGTH$1 ] + ", Failed: " + failed[_DYN_LENGTH$1 ] +
                            ". Will retry to send " + retry[_DYN_LENGTH$1 ] + " our of " + results[_DYN_ITEMS_RECEIVED ] + " items");
                    }
                };
                _self[_DYN__ON_SUCCESS ] = function (payload, countOfItemsInPayload) {
                    _self._buffer[_DYN_CLEAR_SENT ](payload);
                };
                _self._xdrOnLoad = function (xdr, payload) {
                    var responseText = _getResponseText(xdr);
                    if (xdr && (responseText + "" === "200" || responseText === "")) {
                        _consecutiveErrors = 0;
                        _self[_DYN__ON_SUCCESS ](payload, 0);
                    }
                    else {
                        var results = _parseResponse(responseText);
                        if (results && results.itemsReceived && results.itemsReceived > results[_DYN_ITEMS_ACCEPTED ]
                            && !_self[_DYN__SENDER_CONFIG ][_DYN_IS_RETRY_DISABLED ]()) {
                            _self[_DYN__ON_PARTIAL_SUCCESS ](payload, results);
                        }
                        else {
                            _self[_DYN__ON_ERROR ](payload, _formatErrorMessageXdr(xdr));
                        }
                    }
                };
                function _isSampledIn(envelope) {
                    return _self._sample.isSampledIn(envelope);
                }
                function _checkResponsStatus(status, payload, responseUrl, countOfItemsInPayload, errorMessage, res) {
                    var response = null;
                    if (!_self._appId) {
                        response = _parseResponse(res);
                        if (response && response.appId) {
                            _self._appId = response.appId;
                        }
                    }
                    if ((status < 200 || status >= 300) && status !== 0) {
                        if (status === 301 || status === 307 || status === 308) {
                            if (!_checkAndUpdateEndPointUrl(responseUrl)) {
                                _self[_DYN__ON_ERROR ](payload, errorMessage);
                                return;
                            }
                        }
                        if (!_self[_DYN__SENDER_CONFIG ][_DYN_IS_RETRY_DISABLED ]() && _isRetriable(status)) {
                            _resendPayload(payload);
                            _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 40 , ". " +
                                "Response code " + status + ". Will retry to send " + payload[_DYN_LENGTH$1 ] + " items.");
                        }
                        else {
                            _self[_DYN__ON_ERROR ](payload, errorMessage);
                        }
                    }
                    else if (_offlineListener && !_offlineListener.isOnline()) {
                        if (!_self[_DYN__SENDER_CONFIG ][_DYN_IS_RETRY_DISABLED ]()) {
                            var offlineBackOffMultiplier = 10;
                            _resendPayload(payload, offlineBackOffMultiplier);
                            _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 40 , ". Offline - Response Code: ".concat(status, ". Offline status: ").concat(!_offlineListener.isOnline(), ". Will retry to send ").concat(payload.length, " items."));
                        }
                    }
                    else {
                        _checkAndUpdateEndPointUrl(responseUrl);
                        if (status === 206) {
                            if (!response) {
                                response = _parseResponse(res);
                            }
                            if (response && !_self[_DYN__SENDER_CONFIG ][_DYN_IS_RETRY_DISABLED ]()) {
                                _self[_DYN__ON_PARTIAL_SUCCESS ](payload, response);
                            }
                            else {
                                _self[_DYN__ON_ERROR ](payload, errorMessage);
                            }
                        }
                        else {
                            _consecutiveErrors = 0;
                            _self[_DYN__ON_SUCCESS ](payload, countOfItemsInPayload);
                        }
                    }
                }
                function _checkAndUpdateEndPointUrl(responseUrl) {
                    if (_stamp_specific_redirects >= 10) {
                        return false;
                    }
                    if (!isNullOrUndefined(responseUrl) && responseUrl !== "") {
                        if (responseUrl !== _self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ]()) {
                            _self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ] = function () { return responseUrl; };
                            ++_stamp_specific_redirects;
                            return true;
                        }
                    }
                    return false;
                }
                function _doUnloadSend(payload, isAsync) {
                    if (_syncUnloadSender) {
                        _syncUnloadSender(payload, false);
                    }
                    else {
                        _beaconSender(payload);
                    }
                }
                function _doBeaconSend(payload) {
                    var nav = getNavigator();
                    var buffer = _self[_DYN__BUFFER ];
                    var url = _self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ]();
                    var batch = _self._buffer[_DYN_BATCH_PAYLOADS ](payload);
                    var plainTextBatch = new Blob([batch], { type: "text/plain;charset=UTF-8" });
                    var queued = nav.sendBeacon(url, plainTextBatch);
                    if (queued) {
                        buffer[_DYN_MARK_AS_SENT ](payload);
                        _self._onSuccess(payload, payload[_DYN_LENGTH$1 ]);
                    }
                    return queued;
                }
                function _beaconSender(payload, isAsync) {
                    if (isArray(payload) && payload[_DYN_LENGTH$1 ] > 0) {
                        if (!_doBeaconSend(payload)) {
                            var droppedPayload = [];
                            for (var lp = 0; lp < payload[_DYN_LENGTH$1 ]; lp++) {
                                var thePayload = payload[lp];
                                if (!_doBeaconSend([thePayload])) {
                                    droppedPayload[_DYN_PUSH ](thePayload);
                                }
                            }
                            if (droppedPayload[_DYN_LENGTH$1 ] > 0) {
                                _fallbackSender && _fallbackSender(droppedPayload, true);
                                _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 40 , ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                            }
                        }
                    }
                }
                function _xhrSender(payload, isAsync) {
                    var xhr = new XMLHttpRequest();
                    var endPointUrl = _self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ]();
                    try {
                        xhr[DisabledPropertyName] = true;
                    }
                    catch (e) {
                    }
                    xhr.open("POST", endPointUrl, isAsync);
                    xhr[_DYN_SET_REQUEST_HEADER ]("Content-type", "application/json");
                    if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                        xhr[_DYN_SET_REQUEST_HEADER ](RequestHeaders[6 ], RequestHeaders[7 ]);
                    }
                    arrForEach(objKeys(_headers), function (headerName) {
                        xhr[_DYN_SET_REQUEST_HEADER ](headerName, _headers[headerName]);
                    });
                    xhr.onreadystatechange = function () { return _self._xhrReadyStateChange(xhr, payload, payload[_DYN_LENGTH$1 ]); };
                    xhr.onerror = function (event) { return _self[_DYN__ON_ERROR ](payload, _formatErrorMessageXhr(xhr), event); };
                    var batch = _self._buffer[_DYN_BATCH_PAYLOADS ](payload);
                    xhr.send(batch);
                    _self._buffer[_DYN_MARK_AS_SENT ](payload);
                }
                function _fetchKeepAliveSender(payload, isAsync) {
                    if (isArray(payload)) {
                        var payloadSize = payload[_DYN_LENGTH$1 ];
                        for (var lp = 0; lp < payload[_DYN_LENGTH$1 ]; lp++) {
                            payloadSize += payload[lp][_DYN_LENGTH$1 ];
                        }
                        if ((_syncFetchPayload + payloadSize) <= FetchSyncRequestSizeLimitBytes) {
                            _doFetchSender(payload, false);
                        }
                        else if (isBeaconsSupported()) {
                            _beaconSender(payload);
                        }
                        else {
                            _fallbackSender && _fallbackSender(payload, true);
                            _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 40 , ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
                        }
                    }
                }
                function _fetchSender(payload, isAsync) {
                    _doFetchSender(payload, true);
                }
                function _doFetchSender(payload, isAsync) {
                    var _a;
                    var endPointUrl = _self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ]();
                    var batch = _self._buffer[_DYN_BATCH_PAYLOADS ](payload);
                    var plainTextBatch = new Blob([batch], { type: "application/json" });
                    var requestHeaders = new Headers();
                    var batchLength = batch[_DYN_LENGTH$1 ];
                    var ignoreResponse = false;
                    var responseHandled = false;
                    if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                        requestHeaders.append(RequestHeaders[6 ], RequestHeaders[7 ]);
                    }
                    arrForEach(objKeys(_headers), function (headerName) {
                        requestHeaders.append(headerName, _headers[headerName]);
                    });
                    var init = (_a = {
                            method: "POST",
                            headers: requestHeaders,
                            body: plainTextBatch
                        },
                        _a[DisabledPropertyName] = true
                    ,
                        _a);
                    if (!isAsync) {
                        init.keepalive = true;
                        ignoreResponse = true;
                        _syncFetchPayload += batchLength;
                    }
                    var request = new Request(endPointUrl, init);
                    try {
                        request[DisabledPropertyName] = true;
                    }
                    catch (e) {
                    }
                    _self._buffer[_DYN_MARK_AS_SENT ](payload);
                    try {
                        fetch(request).then(function (response) {
                            if (!isAsync) {
                                _syncFetchPayload -= batchLength;
                                batchLength = 0;
                            }
                            if (!responseHandled) {
                                responseHandled = true;
                                if (!response.ok) {
                                    _self[_DYN__ON_ERROR ](payload, response.statusText);
                                }
                                else {
                                    response.text().then(function (text) {
                                        _checkResponsStatus(response.status, payload, response.url, payload[_DYN_LENGTH$1 ], response.statusText, text);
                                    });
                                }
                            }
                        })["catch"](function (error) {
                            if (!isAsync) {
                                _syncFetchPayload -= batchLength;
                                batchLength = 0;
                            }
                            if (!responseHandled) {
                                responseHandled = true;
                                _self[_DYN__ON_ERROR ](payload, error.message);
                            }
                        });
                    }
                    catch (e) {
                        if (!responseHandled) {
                            _self[_DYN__ON_ERROR ](payload, dumpObj(e));
                        }
                    }
                    if (ignoreResponse && !responseHandled) {
                        responseHandled = true;
                        _self._onSuccess(payload, payload[_DYN_LENGTH$1 ]);
                    }
                }
                function _parseResponse(response) {
                    try {
                        if (response && response !== "") {
                            var result = getJSON().parse(response);
                            if (result && result.itemsReceived && result.itemsReceived >= result[_DYN_ITEMS_ACCEPTED ] &&
                                result.itemsReceived - result.itemsAccepted === result.errors[_DYN_LENGTH$1 ]) {
                                return result;
                            }
                        }
                    }
                    catch (e) {
                        _throwInternal(_self[_DYN_DIAG_LOG ](), 1 , 43 , "Cannot parse the response. " + getExceptionName(e), {
                            response: response
                        });
                    }
                    return null;
                }
                function _resendPayload(payload, linearFactor) {
                    if (linearFactor === void 0) { linearFactor = 1; }
                    if (!payload || payload[_DYN_LENGTH$1 ] === 0) {
                        return;
                    }
                    var buffer = _self[_DYN__BUFFER ];
                    buffer[_DYN_CLEAR_SENT ](payload);
                    _consecutiveErrors++;
                    for (var _i = 0, payload_1 = payload; _i < payload_1.length; _i++) {
                        var item = payload_1[_i];
                        buffer[_DYN_ENQUEUE ](item);
                    }
                    _setRetryTime(linearFactor);
                    _setupTimer();
                }
                function _setRetryTime(linearFactor) {
                    var SlotDelayInSeconds = 10;
                    var delayInSeconds;
                    if (_consecutiveErrors <= 1) {
                        delayInSeconds = SlotDelayInSeconds;
                    }
                    else {
                        var backOffSlot = (Math.pow(2, _consecutiveErrors) - 1) / 2;
                        var backOffDelay = Math.floor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
                        backOffDelay = linearFactor * backOffDelay;
                        delayInSeconds = Math.max(Math.min(backOffDelay, 3600), SlotDelayInSeconds);
                    }
                    var retryAfterTimeSpan = dateNow() + (delayInSeconds * 1000);
                    _retryAt = retryAfterTimeSpan;
                }
                function _setupTimer() {
                    if (!_timeoutHandle && !_paused) {
                        var retryInterval = _retryAt ? Math.max(0, _retryAt - dateNow()) : 0;
                        var timerValue = Math.max(_self[_DYN__SENDER_CONFIG ][_DYN_MAX_BATCH_INTERVAL ](), retryInterval);
                        _timeoutHandle = setTimeout(function () {
                            _timeoutHandle = null;
                            _self[_DYN_TRIGGER_SEND ](true, null, 1 );
                        }, timerValue);
                    }
                }
                function _clearScheduledTimer() {
                    clearTimeout(_timeoutHandle);
                    _timeoutHandle = null;
                    _retryAt = null;
                }
                function _isRetriable(statusCode) {
                    return statusCode === 401
                        || statusCode === 403
                        || statusCode === 408
                        || statusCode === 429
                        || statusCode === 500
                        || statusCode === 502
                        || statusCode === 503
                        || statusCode === 504;
                }
                function _formatErrorMessageXhr(xhr, message) {
                    if (xhr) {
                        return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + _getResponseText(xhr) || xhr.response || "";
                    }
                    return message;
                }
                function _xdrSender(payload, isAsync) {
                    var buffer = _self[_DYN__BUFFER ];
                    var _window = getWindow();
                    var xdr = new XDomainRequest();
                    xdr.onload = function () { return _self._xdrOnLoad(xdr, payload); };
                    xdr.onerror = function (event) { return _self[_DYN__ON_ERROR ](payload, _formatErrorMessageXdr(xdr), event); };
                    var hostingProtocol = _window && _window.location && _window.location.protocol || "";
                    if (_self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ]().lastIndexOf(hostingProtocol, 0) !== 0) {
                        _throwInternal(_self[_DYN_DIAG_LOG ](), 2 , 40 , ". " +
                            "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");
                        buffer[_DYN_CLEAR ]();
                        return;
                    }
                    var endpointUrl = _self[_DYN__SENDER_CONFIG ][_DYN_ENDPOINT_URL ]().replace(/^(https?:)/, "");
                    xdr.open("POST", endpointUrl);
                    var batch = buffer[_DYN_BATCH_PAYLOADS ](payload);
                    xdr.send(batch);
                    buffer[_DYN_MARK_AS_SENT ](payload);
                }
                function _formatErrorMessageXdr(xdr, message) {
                    if (xdr) {
                        return "XDomainRequest,Response:" + _getResponseText(xdr) || "";
                    }
                    return message;
                }
                function _getNotifyMgr() {
                    var func = "getNotifyMgr";
                    if (_self.core[func]) {
                        return _self.core[func]();
                    }
                    return _self.core["_notificationManager"];
                }
                function _notifySendRequest(sendRequest, isAsync) {
                    var manager = _getNotifyMgr();
                    if (manager && manager[_DYN_EVENTS_SEND_REQUEST ]) {
                        try {
                            manager[_DYN_EVENTS_SEND_REQUEST ](sendRequest, isAsync);
                        }
                        catch (e) {
                            _throwInternal(_self[_DYN_DIAG_LOG ](), 1 , 74 , "send request notification failed: " + getExceptionName(e), { exception: dumpObj(e) });
                        }
                    }
                }
                function _validateInstrumentationKey(config) {
                    var disableIKeyValidationFlag = isNullOrUndefined(config[_DYN_DISABLE_INSTRUMENTAT7 ]) ? false : config[_DYN_DISABLE_INSTRUMENTAT7 ];
                    if (disableIKeyValidationFlag) {
                        return true;
                    }
                    var UUID_Regex = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                    var regexp = new RegExp(UUID_Regex);
                    return regexp.test(config[_DYN_INSTRUMENTATION_KEY ]);
                }
                function _initDefaults() {
                    _self[_DYN__SENDER ] = null;
                    _self[_DYN__BUFFER ] = null;
                    _self._appId = null;
                    _self._sample = null;
                    _headers = {};
                    _offlineListener = null;
                    _consecutiveErrors = 0;
                    _retryAt = null;
                    _paused = false;
                    _timeoutHandle = null;
                    _serializer = null;
                    _stamp_specific_redirects = 0;
                    _syncFetchPayload = 0;
                    _fallbackSender = null;
                    _syncUnloadSender = null;
                    _evtNamespace = null;
                }
            });
            return _this;
        }
        Sender.constructEnvelope = function (orig, iKey, logger, convertUndefined) {
            var envelope;
            if (iKey !== orig.iKey && !isNullOrUndefined(iKey)) {
                envelope = __assignFn(__assignFn({}, orig), { iKey: iKey });
            }
            else {
                envelope = orig;
            }
            var creator = EnvelopeTypeCreator[envelope.baseType] || EventEnvelopeCreator;
            return creator(logger, envelope, convertUndefined);
        };
        return Sender;
    }(BaseTelemetryPlugin));

    var Application = /** @class */ (function () {
        function Application() {
        }
        return Application;
    }());

    var Device = /** @class */ (function () {
        function Device() {
            this.id = "browser";
            this.deviceClass = "Browser";
        }
        return Device;
    }());

    var _DYN_SESSION_MANAGER = "sessionManager";
    var _DYN_UPDATE = "update";
    var _DYN_IS_USER_COOKIE_SET = "isUserCookieSet";
    var _DYN_IS_NEW_USER = "isNewUser";
    var _DYN_GET_TRACE_CTX = "getTraceCtx";
    var _DYN_TELEMETRY_TRACE = "telemetryTrace";
    var _DYN_APPLY_SESSION_CONTEX0 = "applySessionContext";
    var _DYN_APPLY_APPLICATION_CO1 = "applyApplicationContext";
    var _DYN_APPLY_DEVICE_CONTEXT = "applyDeviceContext";
    var _DYN_APPLY_OPERATION_CONT2 = "applyOperationContext";
    var _DYN_APPLY_USER_CONTEXT = "applyUserContext";
    var _DYN_APPLY_OPERATING_SYST3 = "applyOperatingSystemContxt";
    var _DYN_APPLY_LOCATION_CONTE4 = "applyLocationContext";
    var _DYN_APPLY_INTERNAL_CONTE5 = "applyInternalContext";
    var _DYN_ACCOUNT_ID = "accountId";
    var _DYN_SDK_EXTENSION = "sdkExtension";
    var _DYN_GET_SESSION_ID = "getSessionId";
    var _DYN_NAME_PREFIX = "namePrefix";
    var _DYN_SESSION_COOKIE_POSTF6 = "sessionCookiePostfix";
    var _DYN_USER_COOKIE_POSTFIX = "userCookiePostfix";
    var _DYN_ID_LENGTH = "idLength";
    var _DYN_GET_NEW_ID = "getNewId";
    var _DYN_LENGTH = "length";
    var _DYN_AUTOMATIC_SESSION = "automaticSession";
    var _DYN_AUTHENTICATED_ID = "authenticatedId";
    var _DYN_SESSION_EXPIRATION_M7 = "sessionExpirationMs";
    var _DYN_SESSION_RENEWAL_MS = "sessionRenewalMs";
    var _DYN_CONFIG = "config";
    var _DYN_ACQUISITION_DATE = "acquisitionDate";
    var _DYN_RENEWAL_DATE = "renewalDate";
    var _DYN_COOKIE_DOMAIN = "cookieDomain";
    var _DYN_JOIN = "join";
    var _DYN_COOKIE_SEPARATOR = "cookieSeparator";
    var _DYN_AUTH_USER_COOKIE_NAM8 = "authUserCookieName";

    var Version = '2.8.9';
    var Internal = /** @class */ (function () {
        function Internal(config) {
            this.sdkVersion = (config[_DYN_SDK_EXTENSION ] && config[_DYN_SDK_EXTENSION ]() ? config[_DYN_SDK_EXTENSION ]() + "_" : "") + "javascript:" + Version;
        }
        return Internal;
    }());

    var Location = /** @class */ (function () {
        function Location() {
        }
        return Location;
    }());

    var cookieNameConst = "ai_session";
    var Session = /** @class */ (function () {
        function Session() {
        }
        return Session;
    }());
    var _SessionManager = /** @class */ (function () {
        function _SessionManager(config, core) {
            var self = this;
            var _storageNamePrefix;
            var _cookieUpdatedTimestamp;
            var _logger = safeGetLogger(core);
            var _cookieManager = safeGetCookieMgr(core);
            dynamicProto(_SessionManager, self, function (_self) {
                if (!config) {
                    config = {};
                }
                if (!isFunction(config[_DYN_SESSION_EXPIRATION_M7 ])) {
                    config[_DYN_SESSION_EXPIRATION_M7 ] = function () { return _SessionManager.acquisitionSpan; };
                }
                if (!isFunction(config[_DYN_SESSION_RENEWAL_MS ])) {
                    config[_DYN_SESSION_RENEWAL_MS ] = function () { return _SessionManager.renewalSpan; };
                }
                _self[_DYN_CONFIG ] = config;
                var sessionCookiePostfix = (_self.config[_DYN_SESSION_COOKIE_POSTF6 ] && _self[_DYN_CONFIG ][_DYN_SESSION_COOKIE_POSTF6 ]()) ?
                    _self.config[_DYN_SESSION_COOKIE_POSTF6 ]() :
                    ((_self.config[_DYN_NAME_PREFIX ] && _self[_DYN_CONFIG ][_DYN_NAME_PREFIX ]()) ? _self[_DYN_CONFIG ][_DYN_NAME_PREFIX ]() : "");
                _storageNamePrefix = function () { return cookieNameConst + sessionCookiePostfix; };
                _self[_DYN_AUTOMATIC_SESSION ] = new Session();
                _self[_DYN_UPDATE ] = function () {
                    var nowMs = dateNow();
                    var isExpired = false;
                    var session = _self[_DYN_AUTOMATIC_SESSION ];
                    if (!session.id) {
                        isExpired = !_initializeAutomaticSession(session);
                    }
                    var sessionExpirationMs = _self.config[_DYN_SESSION_EXPIRATION_M7 ]();
                    if (!isExpired && sessionExpirationMs > 0) {
                        var sessionRenewalMs = _self.config[_DYN_SESSION_RENEWAL_MS ]();
                        var timeSinceAcqMs = nowMs - session[_DYN_ACQUISITION_DATE ];
                        var timeSinceRenewalMs = nowMs - session[_DYN_RENEWAL_DATE ];
                        isExpired = timeSinceAcqMs < 0 || timeSinceRenewalMs < 0;
                        isExpired = isExpired || timeSinceAcqMs > sessionExpirationMs;
                        isExpired = isExpired || timeSinceRenewalMs > sessionRenewalMs;
                    }
                    if (isExpired) {
                        _renew(nowMs);
                    }
                    else {
                        if (!_cookieUpdatedTimestamp || nowMs - _cookieUpdatedTimestamp > _SessionManager.cookieUpdateInterval) {
                            _setCookie(session, nowMs);
                        }
                    }
                };
                _self.backup = function () {
                    var session = _self[_DYN_AUTOMATIC_SESSION ];
                    _setStorage(session.id, session[_DYN_ACQUISITION_DATE ], session[_DYN_RENEWAL_DATE ]);
                };
                function _initializeAutomaticSession(session, now) {
                    var isValid = false;
                    var cookieValue = _cookieManager.get(_storageNamePrefix());
                    if (cookieValue && isFunction(cookieValue.split)) {
                        isValid = _initializeAutomaticSessionWithData(session, cookieValue);
                    }
                    else {
                        var storageValue = utlGetLocalStorage(_logger, _storageNamePrefix());
                        if (storageValue) {
                            isValid = _initializeAutomaticSessionWithData(session, storageValue);
                        }
                    }
                    return isValid || !!session.id;
                }
                function _initializeAutomaticSessionWithData(session, sessionData) {
                    var isValid = false;
                    var sessionReset = ", session will be reset";
                    var tokens = sessionData.split("|");
                    if (tokens[_DYN_LENGTH ] >= 2) {
                        try {
                            var acqMs = +tokens[1] || 0;
                            var renewalMs = +tokens[2] || 0;
                            if (isNaN(acqMs) || acqMs <= 0) {
                                _throwInternal(_logger, 2 , 27 , "AI session acquisition date is 0" + sessionReset);
                            }
                            else if (isNaN(renewalMs) || renewalMs <= 0) {
                                _throwInternal(_logger, 2 , 27 , "AI session renewal date is 0" + sessionReset);
                            }
                            else if (tokens[0]) {
                                session.id = tokens[0];
                                session[_DYN_ACQUISITION_DATE ] = acqMs;
                                session[_DYN_RENEWAL_DATE ] = renewalMs;
                                isValid = true;
                            }
                        }
                        catch (e) {
                            _throwInternal(_logger, 1 , 9 , "Error parsing ai_session value [" + (sessionData || "") + "]" + sessionReset + " - " + getExceptionName(e), { exception: dumpObj(e) });
                        }
                    }
                    return isValid;
                }
                function _renew(nowMs) {
                    var theConfig = (_self[_DYN_CONFIG ] || {});
                    var getNewId = (theConfig[_DYN_GET_NEW_ID ] ? theConfig[_DYN_GET_NEW_ID ]() : null) || newId;
                    _self.automaticSession.id = getNewId(theConfig[_DYN_ID_LENGTH ] ? theConfig[_DYN_ID_LENGTH ]() : 22);
                    _self[_DYN_AUTOMATIC_SESSION ][_DYN_ACQUISITION_DATE ] = nowMs;
                    _setCookie(_self[_DYN_AUTOMATIC_SESSION ], nowMs);
                    if (!utlCanUseLocalStorage()) {
                        _throwInternal(_logger, 2 , 0 , "Browser does not support local storage. Session durations will be inaccurate.");
                    }
                }
                function _setCookie(session, nowMs) {
                    var acq = session[_DYN_ACQUISITION_DATE ];
                    session[_DYN_RENEWAL_DATE ] = nowMs;
                    var config = _self[_DYN_CONFIG ];
                    var renewalPeriodMs = config[_DYN_SESSION_RENEWAL_MS ]();
                    var acqTimeLeftMs = (acq + config[_DYN_SESSION_EXPIRATION_M7 ]()) - nowMs;
                    var cookie = [session.id, acq, nowMs];
                    var maxAgeSec = 0;
                    if (acqTimeLeftMs < renewalPeriodMs) {
                        maxAgeSec = acqTimeLeftMs / 1000;
                    }
                    else {
                        maxAgeSec = renewalPeriodMs / 1000;
                    }
                    var cookieDomain = config[_DYN_COOKIE_DOMAIN ] ? config[_DYN_COOKIE_DOMAIN ]() : null;
                    _cookieManager.set(_storageNamePrefix(), cookie.join("|"), config[_DYN_SESSION_EXPIRATION_M7 ]() > 0 ? maxAgeSec : null, cookieDomain);
                    _cookieUpdatedTimestamp = nowMs;
                }
                function _setStorage(guid, acq, renewal) {
                    utlSetLocalStorage(_logger, _storageNamePrefix(), [guid, acq, renewal][_DYN_JOIN ]("|"));
                }
            });
        }
        _SessionManager.acquisitionSpan = 86400000;
        _SessionManager.renewalSpan = 1800000;
        _SessionManager.cookieUpdateInterval = 60000;
        return _SessionManager;
    }());

    var TelemetryTrace = /** @class */ (function () {
        function TelemetryTrace(id, parentId, name, logger) {
            var _self = this;
            _self.traceID = id || generateW3CId();
            _self.parentID = parentId;
            var location = getLocation();
            if (!name && location && location.pathname) {
                name = location.pathname;
            }
            _self.name = dataSanitizeString(logger, name);
        }
        return TelemetryTrace;
    }());

    function _validateUserInput(id) {
        if (typeof id !== "string" ||
            !id ||
            id.match(/,|;|=| |\|/)) {
            return false;
        }
        return true;
    }
    var User = /** @class */ (function () {
        function User(config, core) {
            this.isNewUser = false;
            this.isUserCookieSet = false;
            var _logger = safeGetLogger(core);
            var _cookieManager = safeGetCookieMgr(core);
            var _storageNamePrefix;
            dynamicProto(User, this, function (_self) {
                _self[_DYN_CONFIG ] = config;
                var userCookiePostfix = (_self.config[_DYN_USER_COOKIE_POSTFIX ] && _self[_DYN_CONFIG ][_DYN_USER_COOKIE_POSTFIX ]()) ? _self[_DYN_CONFIG ][_DYN_USER_COOKIE_POSTFIX ]() : "";
                _storageNamePrefix = function () { return User.userCookieName + userCookiePostfix; };
                var cookie = _cookieManager.get(_storageNamePrefix());
                if (cookie) {
                    _self[_DYN_IS_NEW_USER ] = false;
                    var params = cookie.split(User[_DYN_COOKIE_SEPARATOR ]);
                    if (params[_DYN_LENGTH ] > 0) {
                        _self.id = params[0];
                        _self[_DYN_IS_USER_COOKIE_SET ] = !!_self.id;
                    }
                }
                function _generateNewId() {
                    var theConfig = (config || {});
                    var getNewId = (theConfig[_DYN_GET_NEW_ID ] ? theConfig[_DYN_GET_NEW_ID ]() : null) || newId;
                    var id = getNewId(theConfig[_DYN_ID_LENGTH ] ? config[_DYN_ID_LENGTH ]() : 22);
                    return id;
                }
                function _generateNewCookie(userId) {
                    var acqStr = toISOString(new Date());
                    _self.accountAcquisitionDate = acqStr;
                    _self[_DYN_IS_NEW_USER ] = true;
                    var newCookie = [userId, acqStr];
                    return newCookie;
                }
                function _setUserCookie(cookie) {
                    var oneYear = 31536000;
                    _self[_DYN_IS_USER_COOKIE_SET ] = _cookieManager.set(_storageNamePrefix(), cookie, oneYear);
                }
                if (!_self.id) {
                    _self.id = _generateNewId();
                    var newCookie = _generateNewCookie(_self.id);
                    _setUserCookie(newCookie[_DYN_JOIN ](User[_DYN_COOKIE_SEPARATOR ]));
                    var name_1 = config[_DYN_NAME_PREFIX ] && config[_DYN_NAME_PREFIX ]() ? config[_DYN_NAME_PREFIX ]() + "ai_session" : "ai_session";
                    utlRemoveStorage(_logger, name_1);
                }
                _self[_DYN_ACCOUNT_ID ] = config[_DYN_ACCOUNT_ID ] ? config[_DYN_ACCOUNT_ID ]() : undefined;
                var authCookie = _cookieManager.get(User[_DYN_AUTH_USER_COOKIE_NAM8 ]);
                if (authCookie) {
                    authCookie = decodeURI(authCookie);
                    var authCookieString = authCookie.split(User[_DYN_COOKIE_SEPARATOR ]);
                    if (authCookieString[0]) {
                        _self[_DYN_AUTHENTICATED_ID ] = authCookieString[0];
                    }
                    if (authCookieString[_DYN_LENGTH ] > 1 && authCookieString[1]) {
                        _self[_DYN_ACCOUNT_ID ] = authCookieString[1];
                    }
                }
                _self.setAuthenticatedUserContext = function (authenticatedUserId, accountId, storeInCookie) {
                    if (storeInCookie === void 0) { storeInCookie = false; }
                    var isInvalidInput = !_validateUserInput(authenticatedUserId) || (accountId && !_validateUserInput(accountId));
                    if (isInvalidInput) {
                        _throwInternal(_logger, 2 , 60 , "Setting auth user context failed. " +
                            "User auth/account id should be of type string, and not contain commas, semi-colons, equal signs, spaces, or vertical-bars.", true);
                        return;
                    }
                    _self[_DYN_AUTHENTICATED_ID ] = authenticatedUserId;
                    var authCookie = _self[_DYN_AUTHENTICATED_ID ];
                    if (accountId) {
                        _self[_DYN_ACCOUNT_ID ] = accountId;
                        authCookie = [_self[_DYN_AUTHENTICATED_ID ], _self.accountId][_DYN_JOIN ](User[_DYN_COOKIE_SEPARATOR ]);
                    }
                    if (storeInCookie) {
                        _cookieManager.set(User[_DYN_AUTH_USER_COOKIE_NAM8 ], encodeURI(authCookie));
                    }
                };
                _self.clearAuthenticatedUserContext = function () {
                    _self[_DYN_AUTHENTICATED_ID ] = null;
                    _self[_DYN_ACCOUNT_ID ] = null;
                    _cookieManager.del(User[_DYN_AUTH_USER_COOKIE_NAM8 ]);
                };
                _self[_DYN_UPDATE ] = function (userId) {
                    if (_self.id !== userId || !_self[_DYN_IS_USER_COOKIE_SET ]) {
                        var user_id = userId ? userId : _generateNewId();
                        var user_cookie = _generateNewCookie(user_id);
                        _setUserCookie(user_cookie[_DYN_JOIN ](User[_DYN_COOKIE_SEPARATOR ]));
                    }
                };
            });
        }
        User.cookieSeparator = "|";
        User.userCookieName = "ai_user";
        User.authUserCookieName = "ai_authUser";
        return User;
    }());

    var strExt = "ext";
    var strTags = "tags";
    function _removeEmpty(target, name) {
        if (target && target[name] && objKeys(target[name])[_DYN_LENGTH ] === 0) {
            delete target[name];
        }
    }
    var TelemetryContext = /** @class */ (function () {
        function TelemetryContext(core, defaultConfig, previousTraceCtx) {
            var _this = this;
            var logger = core.logger;
            this.appId = function () { return null; };
            this[_DYN_GET_SESSION_ID ] = function () { return null; };
            dynamicProto(TelemetryContext, this, function (_self) {
                _self.application = new Application();
                _self.internal = new Internal(defaultConfig);
                if (hasWindow()) {
                    _self[_DYN_SESSION_MANAGER ] = new _SessionManager(defaultConfig, core);
                    _self.device = new Device();
                    _self.location = new Location();
                    _self.user = new User(defaultConfig, core);
                    var traceId = void 0;
                    var parentId = void 0;
                    var name_1;
                    if (previousTraceCtx) {
                        traceId = previousTraceCtx.getTraceId();
                        parentId = previousTraceCtx.getSpanId();
                        name_1 = previousTraceCtx.getName();
                    }
                    _self[_DYN_TELEMETRY_TRACE ] = new TelemetryTrace(traceId, parentId, name_1, logger);
                    _self.session = new Session();
                }
                _self[_DYN_GET_SESSION_ID ] = function () {
                    var session = _self.session;
                    var sesId = null;
                    if (session && isString(session.id)) {
                        sesId = session.id;
                    }
                    else {
                        var autoSession = (_self[_DYN_SESSION_MANAGER ] || {})[_DYN_AUTOMATIC_SESSION ];
                        sesId = autoSession && isString(autoSession.id) ? autoSession.id : null;
                    }
                    return sesId;
                };
                _self[_DYN_APPLY_SESSION_CONTEX0 ] = function (evt, itemCtx) {
                    setValue(getSetValue(evt.ext, Extensions.AppExt), "sesId", _self[_DYN_GET_SESSION_ID ](), isString);
                };
                _self[_DYN_APPLY_OPERATING_SYST3 ] = function (evt, itemCtx) {
                    setValue(evt.ext, Extensions.OSExt, _self.os);
                };
                _self[_DYN_APPLY_APPLICATION_CO1 ] = function (evt, itemCtx) {
                    var application = _self.application;
                    if (application) {
                        var tags = getSetValue(evt, strTags);
                        setValue(tags, CtxTagKeys.applicationVersion, application.ver, isString);
                        setValue(tags, CtxTagKeys.applicationBuild, application.build, isString);
                    }
                };
                _self[_DYN_APPLY_DEVICE_CONTEXT ] = function (evt, itemCtx) {
                    var device = _self.device;
                    if (device) {
                        var extDevice = getSetValue(getSetValue(evt, strExt), Extensions.DeviceExt);
                        setValue(extDevice, "localId", device.id, isString);
                        setValue(extDevice, "ip", device.ip, isString);
                        setValue(extDevice, "model", device.model, isString);
                        setValue(extDevice, "deviceClass", device.deviceClass, isString);
                    }
                };
                _self[_DYN_APPLY_INTERNAL_CONTE5 ] = function (evt, itemCtx) {
                    var internal = _self.internal;
                    if (internal) {
                        var tags = getSetValue(evt, strTags);
                        setValue(tags, CtxTagKeys.internalAgentVersion, internal.agentVersion, isString);
                        setValue(tags, CtxTagKeys.internalSdkVersion, internal.sdkVersion, isString);
                        if (evt.baseType === _InternalLogMessage.dataType || evt.baseType === PageView.dataType) {
                            setValue(tags, CtxTagKeys.internalSnippet, internal.snippetVer, isString);
                            setValue(tags, CtxTagKeys.internalSdkSrc, internal.sdkSrc, isString);
                        }
                    }
                };
                _self[_DYN_APPLY_LOCATION_CONTE4 ] = function (evt, itemCtx) {
                    var location = _this.location;
                    if (location) {
                        setValue(getSetValue(evt, strTags, []), CtxTagKeys.locationIp, location.ip, isString);
                    }
                };
                _self[_DYN_APPLY_OPERATION_CONT2 ] = function (evt, itemCtx) {
                    var telemetryTrace = _self[_DYN_TELEMETRY_TRACE ];
                    if (telemetryTrace) {
                        var extTrace = getSetValue(getSetValue(evt, strExt), Extensions.TraceExt, { traceID: undefined, parentID: undefined });
                        setValue(extTrace, "traceID", telemetryTrace.traceID, isString, isNullOrUndefined);
                        setValue(extTrace, "name", telemetryTrace.name, isString, isNullOrUndefined);
                        setValue(extTrace, "parentID", telemetryTrace.parentID, isString, isNullOrUndefined);
                    }
                };
                _self.applyWebContext = function (evt, itemCtx) {
                    var web = _this.web;
                    if (web) {
                        setValue(getSetValue(evt, strExt), Extensions.WebExt, web);
                    }
                };
                _self[_DYN_APPLY_USER_CONTEXT ] = function (evt, itemCtx) {
                    var user = _self.user;
                    if (user) {
                        var tags = getSetValue(evt, strTags, []);
                        setValue(tags, CtxTagKeys.userAccountId, user[_DYN_ACCOUNT_ID ], isString);
                        var extUser = getSetValue(getSetValue(evt, strExt), Extensions.UserExt);
                        setValue(extUser, "id", user.id, isString);
                        setValue(extUser, "authId", user[_DYN_AUTHENTICATED_ID ], isString);
                    }
                };
                _self.cleanUp = function (evt, itemCtx) {
                    var ext = evt.ext;
                    if (ext) {
                        _removeEmpty(ext, Extensions.DeviceExt);
                        _removeEmpty(ext, Extensions.UserExt);
                        _removeEmpty(ext, Extensions.WebExt);
                        _removeEmpty(ext, Extensions.OSExt);
                        _removeEmpty(ext, Extensions.AppExt);
                        _removeEmpty(ext, Extensions.TraceExt);
                    }
                };
            });
        }
        TelemetryContext.__ieDyn=1;
        return TelemetryContext;
    }());

    var PropertiesPlugin = /** @class */ (function (_super) {
        __extendsFn(PropertiesPlugin, _super);
        function PropertiesPlugin() {
            var _this = _super.call(this) || this;
            _this.priority = 110;
            _this.identifier = PropertiesPluginIdentifier;
            var _extensionConfig;
            var _distributedTraceCtx;
            var _previousTraceCtx;
            dynamicProto(PropertiesPlugin, _this, function (_self, _base) {
                _initDefaults();
                _self.initialize = function (config, core, extensions, pluginChain) {
                    _base.initialize(config, core, extensions, pluginChain);
                    _populateDefaults(config);
                };
                _self.processTelemetry = function (event, itemCtx) {
                    if (isNullOrUndefined(event)) ;
                    else {
                        itemCtx = _self._getTelCtx(itemCtx);
                        if (event.name === PageView.envelopeType) {
                            itemCtx.diagLog().resetInternalMessageCount();
                        }
                        var theContext = (_self.context || {});
                        if (theContext.session) {
                            if (typeof _self.context.session.id !== "string" && theContext[_DYN_SESSION_MANAGER ]) {
                                theContext[_DYN_SESSION_MANAGER ][_DYN_UPDATE ]();
                            }
                        }
                        var userCtx = theContext.user;
                        if (userCtx && !userCtx[_DYN_IS_USER_COOKIE_SET ]) {
                            userCtx[_DYN_UPDATE ](theContext.user.id);
                        }
                        _processTelemetryInternal(event, itemCtx);
                        if (userCtx && userCtx[_DYN_IS_NEW_USER ]) {
                            userCtx[_DYN_IS_NEW_USER ] = false;
                            var message = new _InternalLogMessage(72 , ((getNavigator() || {}).userAgent || ""));
                            _logInternalMessage(itemCtx.diagLog(), 1 , message);
                        }
                        _self.processNext(event, itemCtx);
                    }
                };
                _self._doTeardown = function (unloadCtx, unloadState) {
                    var core = (unloadCtx || {}).core();
                    if (core && core[_DYN_GET_TRACE_CTX ]) {
                        var traceCtx = core[_DYN_GET_TRACE_CTX ](false);
                        if (traceCtx === _distributedTraceCtx) {
                            core.setTraceCtx(_previousTraceCtx);
                        }
                    }
                    _initDefaults();
                };
                function _initDefaults() {
                    _extensionConfig = null;
                    _distributedTraceCtx = null;
                    _previousTraceCtx = null;
                }
                function _populateDefaults(config) {
                    var identifier = _self.identifier;
                    var core = _self.core;
                    var ctx = createProcessTelemetryContext(null, config, core);
                    var defaultConfig = PropertiesPlugin.getDefaultConfig();
                    _extensionConfig = _extensionConfig || {};
                    objForEachKey(defaultConfig, function (field, value) {
                        _extensionConfig[field] = function () { return ctx.getConfig(identifier, field, value()); };
                    });
                    _previousTraceCtx = core[_DYN_GET_TRACE_CTX ](false);
                    _self.context = new TelemetryContext(core, _extensionConfig, _previousTraceCtx);
                    _distributedTraceCtx = createDistributedTraceContextFromTrace(_self.context[_DYN_TELEMETRY_TRACE ], _previousTraceCtx);
                    core.setTraceCtx(_distributedTraceCtx);
                    _self.context.appId = function () {
                        var breezeChannel = core.getPlugin(BreezeChannelIdentifier);
                        return breezeChannel ? breezeChannel.plugin["_appId"] : null;
                    };
                    _self["_extConfig"] = _extensionConfig;
                }
                function _processTelemetryInternal(evt, itemCtx) {
                    getSetValue(evt, "tags", []);
                    getSetValue(evt, "ext", {});
                    var ctx = _self.context;
                    ctx[_DYN_APPLY_SESSION_CONTEX0 ](evt, itemCtx);
                    ctx[_DYN_APPLY_APPLICATION_CO1 ](evt, itemCtx);
                    ctx[_DYN_APPLY_DEVICE_CONTEXT ](evt, itemCtx);
                    ctx[_DYN_APPLY_OPERATION_CONT2 ](evt, itemCtx);
                    ctx[_DYN_APPLY_USER_CONTEXT ](evt, itemCtx);
                    ctx[_DYN_APPLY_OPERATING_SYST3 ](evt, itemCtx);
                    ctx.applyWebContext(evt, itemCtx);
                    ctx[_DYN_APPLY_LOCATION_CONTE4 ](evt, itemCtx);
                    ctx[_DYN_APPLY_INTERNAL_CONTE5 ](evt, itemCtx);
                    ctx.cleanUp(evt, itemCtx);
                }
            });
            return _this;
        }
        PropertiesPlugin.getDefaultConfig = function () {
            var _a;
            var defaultValue;
            var nullValue = null;
            var defaultConfig = (_a = {
                    instrumentationKey: function () { return defaultValue; }
                },
                _a[_DYN_ACCOUNT_ID ] = function () { return nullValue; },
                _a.sessionRenewalMs = function () { return 30 * 60 * 1000; },
                _a.samplingPercentage = function () { return 100; },
                _a.sessionExpirationMs = function () { return 24 * 60 * 60 * 1000; },
                _a[_DYN_COOKIE_DOMAIN ] = function () { return nullValue; },
                _a[_DYN_SDK_EXTENSION ] = function () { return nullValue; },
                _a.isBrowserLinkTrackingEnabled = function () { return false; },
                _a.appId = function () { return nullValue; },
                _a[_DYN_GET_SESSION_ID ] = function () { return nullValue; },
                _a[_DYN_NAME_PREFIX ] = function () { return defaultValue; },
                _a[_DYN_SESSION_COOKIE_POSTF6 ] = function () { return defaultValue; },
                _a[_DYN_USER_COOKIE_POSTFIX ] = function () { return defaultValue; },
                _a[_DYN_ID_LENGTH ] = function () { return 22; },
                _a[_DYN_GET_NEW_ID ] = function () { return nullValue; },
                _a);
            return defaultConfig;
        };
        return PropertiesPlugin;
    }(BaseTelemetryPlugin));
    var PropertiesPlugin$1 = PropertiesPlugin;

    var _internalSdkSrc;
    var _ignoreUpdateSnippetProperties = [
        STR_SNIPPET, "dependencies", "properties", "_snippetVersion", "appInsightsNew", "getSKUDefaults"
    ];
    var fieldType = {
        Default: 0 ,
        Required: 1 ,
        Array: 2 ,
        Hidden: 4
    };
    var Telemetry = {
        __proto__: null,
        PropertiesPluginIdentifier: PropertiesPluginIdentifier,
        BreezeChannelIdentifier: BreezeChannelIdentifier,
        AnalyticsPluginIdentifier: AnalyticsPluginIdentifier,
        Util: Util,
        CorrelationIdHelper: CorrelationIdHelper,
        UrlHelper: UrlHelper,
        DateTimeUtils: DateTimeUtils,
        ConnectionStringParser: ConnectionStringParser,
        FieldType: fieldType,
        RequestHeaders: RequestHeaders,
        DisabledPropertyName: DisabledPropertyName,
        ProcessLegacy: ProcessLegacy,
        SampleRate: SampleRate,
        HttpMethod: HttpMethod,
        DEFAULT_BREEZE_ENDPOINT: DEFAULT_BREEZE_ENDPOINT,
        Envelope: Envelope,
        Event: Event$1,
        Exception: Exception,
        Metric: Metric,
        PageView: PageView,
        RemoteDependencyData: RemoteDependencyData,
        Trace: Trace,
        PageViewPerformance: PageViewPerformance,
        Data: Data,
        SeverityLevel: SeverityLevel,
        ConfigurationManager: ConfigurationManager,
        ContextTagKeys: ContextTagKeys,
        DataSanitizer: DataSanitizer,
        TelemetryItemCreator: TelemetryItemCreator,
        CtxTagKeys: CtxTagKeys,
        Extensions: Extensions,
        DistributedTracingModes: DistributedTracingModes
    };
    var Initialization = /** @class */ (function () {
        function Initialization(snippet) {
            var _this = this;
            var dependencies;
            var properties;
            var _sender;
            var _snippetVersion;
            var _evtNamespace;
            var _houseKeepingNamespace;
            var _core;
            dynamicProto(Initialization, this, function (_self) {
                _initDefaults();
                _snippetVersion = "" + (snippet.sv || snippet[_DYN_VERSION ] || "");
                snippet[_DYN_QUEUE ] = snippet[_DYN_QUEUE ] || [];
                snippet[_DYN_VERSION ] = snippet[_DYN_VERSION ] || 2.0;
                var config = snippet[_DYN_CONFIG$1 ] || {};
                if (config[_DYN_CONNECTION_STRING ]) {
                    var cs = parseConnectionString(config[_DYN_CONNECTION_STRING ]);
                    var ingest = cs.ingestionendpoint;
                    config[_DYN_ENDPOINT_URL$1 ] = ingest ? (ingest + DEFAULT_BREEZE_PATH) : config[_DYN_ENDPOINT_URL$1 ];
                    config[_DYN_INSTRUMENTATION_KEY$1 ] = cs.instrumentationkey || config[_DYN_INSTRUMENTATION_KEY$1 ];
                }
                _self[_DYN_APP_INSIGHTS ] = new AnalyticsPlugin();
                properties = new PropertiesPlugin$1();
                dependencies = new AjaxMonitor();
                _sender = new Sender();
                _core = new AppInsightsCore();
                _self.core = _core;
                var isErrMessageDisabled = isNullOrUndefined(config[_DYN_DISABLE_IKEY_DEPRECA18 ]) ? true : config[_DYN_DISABLE_IKEY_DEPRECA18 ];
                if (!config[_DYN_CONNECTION_STRING ] && !isErrMessageDisabled) {
                    _throwInternal(_core.logger, 1 , 106 , "Instrumentation key support will end soon, see aka.ms/IkeyMigrate");
                }
                _self[STR_SNIPPET ] = snippet;
                _self[_DYN_CONFIG$1 ] = config;
                _getSKUDefaults();
                _self[STR_FLUSH ] = function (async) {
                    if (async === void 0) { async = true; }
                    doPerf(_core, function () { return "AISKU.flush"; }, function () {
                        arrForEach(_core[_DYN_GET_TRANSMISSION_CON19 ](), function (channels) {
                            arrForEach(channels, function (channel) {
                                channel[STR_FLUSH ](async);
                            });
                        });
                    }, null, async);
                };
                _self[_DYN_ONUNLOAD_FLUSH ] = function (async) {
                    if (async === void 0) { async = true; }
                    arrForEach(_core[_DYN_GET_TRANSMISSION_CON19 ](), function (channels) {
                        arrForEach(channels, function (channel) {
                            if (channel[_DYN_ONUNLOAD_FLUSH ]) {
                                channel[_DYN_ONUNLOAD_FLUSH ]();
                            }
                            else {
                                channel[STR_FLUSH ](async);
                            }
                        });
                    });
                };
                _self[_DYN_LOAD_APP_INSIGHTS ] = function (legacyMode, logger, notificationManager) {
                    if (legacyMode === void 0) { legacyMode = false; }
                    function _updateSnippetProperties(snippet) {
                        if (snippet) {
                            var snippetVer = "";
                            if (!isNullOrUndefined(_snippetVersion)) {
                                snippetVer += _snippetVersion;
                            }
                            if (legacyMode) {
                                snippetVer += ".lg";
                            }
                            if (_self[_DYN_CONTEXT ] && _self[_DYN_CONTEXT ].internal) {
                                _self[_DYN_CONTEXT ].internal.snippetVer = snippetVer || "-";
                            }
                            objForEachKey(_self, function (field, value) {
                                if (isString(field) &&
                                    !isFunction(value) &&
                                    field && field[0] !== "_" &&
                                    arrIndexOf(_ignoreUpdateSnippetProperties, field) === -1) {
                                    snippet[field] = value;
                                }
                            });
                        }
                    }
                    if (legacyMode && _self[_DYN_CONFIG$1 ].extensions && _self[_DYN_CONFIG$1 ].extensions.length > 0) {
                        throwError("Extensions not allowed in legacy mode");
                    }
                    doPerf(_self.core, function () { return "AISKU.loadAppInsights"; }, function () {
                        var extensions = [];
                        extensions[_DYN_PUSH$1 ](_sender);
                        extensions[_DYN_PUSH$1 ](properties);
                        extensions[_DYN_PUSH$1 ](dependencies);
                        extensions[_DYN_PUSH$1 ](_self[_DYN_APP_INSIGHTS ]);
                        _core.initialize(_self[_DYN_CONFIG$1 ], extensions, logger, notificationManager);
                        _self[_DYN_CONTEXT ] = properties[_DYN_CONTEXT ];
                        if (_internalSdkSrc && _self[_DYN_CONTEXT ]) {
                            _self[_DYN_CONTEXT ].internal.sdkSrc = _internalSdkSrc;
                        }
                        _updateSnippetProperties(_self[STR_SNIPPET ]);
                        _self.emptyQueue();
                        _self[STR_POLL_INTERNAL_LOGS ]();
                        _self[_DYN_ADD_HOUSEKEEPING_BEF20 ](_this);
                    });
                    return _self;
                };
                _self[_DYN_UPDATE_SNIPPET_DEFIN0 ] = function (snippet) {
                    proxyAssign(snippet, _self, function (name) {
                        return name && arrIndexOf(_ignoreUpdateSnippetProperties, name) === -1;
                    });
                };
                _self.emptyQueue = function () {
                    try {
                        if (isArray(_self.snippet[_DYN_QUEUE ])) {
                            var length_1 = _self.snippet[_DYN_QUEUE ].length;
                            for (var i = 0; i < length_1; i++) {
                                var call = _self.snippet[_DYN_QUEUE ][i];
                                call();
                            }
                            _self.snippet[_DYN_QUEUE ] = undefined;
                            delete _self.snippet[_DYN_QUEUE ];
                        }
                    }
                    catch (exception) {
                        var properties_1 = {};
                        if (exception && isFunction(exception.toString)) {
                            properties_1.exception = exception.toString();
                        }
                    }
                };
                _self[_DYN_ADD_HOUSEKEEPING_BEF20 ] = function (appInsightsInstance) {
                    if (hasWindow() || hasDocument()) {
                        var performHousekeeping = function () {
                            appInsightsInstance[_DYN_ONUNLOAD_FLUSH ](false);
                            if (isFunction(_this.core[STR_GET_PLUGIN ])) {
                                var loadedPlugin = _this.core[STR_GET_PLUGIN ](PropertiesPluginIdentifier);
                                if (loadedPlugin) {
                                    var propertiesPlugin = loadedPlugin.plugin;
                                    if (propertiesPlugin && propertiesPlugin[_DYN_CONTEXT ] && propertiesPlugin[_DYN_CONTEXT ]._sessionManager) {
                                        propertiesPlugin[_DYN_CONTEXT ]._sessionManager.backup();
                                    }
                                }
                            }
                        };
                        var added = false;
                        var excludePageUnloadEvents = appInsightsInstance.appInsights[_DYN_CONFIG$1 ].disablePageUnloadEvents;
                        if (!_houseKeepingNamespace) {
                            _houseKeepingNamespace = mergeEvtNamespace(_evtNamespace, _core[STR_EVT_NAMESPACE ] && _core[STR_EVT_NAMESPACE ]());
                        }
                        if (!appInsightsInstance.appInsights.config[_DYN_DISABLE_FLUSH_ON_BEF11 ]) {
                            if (addPageUnloadEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace)) {
                                added = true;
                            }
                            if (addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace)) {
                                added = true;
                            }
                            if (!added && !isReactNative()) {
                                _throwInternal(appInsightsInstance[_DYN_APP_INSIGHTS ].core.logger, 1 , 19 , "Could not add handler for beforeunload and pagehide");
                            }
                        }
                        if (!added && !appInsightsInstance.appInsights.config[_DYN_DISABLE_FLUSH_ON_UNL12 ]) {
                            addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace);
                        }
                    }
                };
                _self.getSender = function () {
                    return _sender;
                };
                _self.unload = function (isAsync, unloadComplete, cbTimeout) {
                    _self[_DYN_ONUNLOAD_FLUSH ](isAsync);
                    if (_houseKeepingNamespace) {
                        removePageUnloadEventListener(null, _houseKeepingNamespace);
                        removePageHideEventListener(null, _houseKeepingNamespace);
                    }
                    _core.unload && _core.unload(isAsync, unloadComplete, cbTimeout);
                };
                proxyFunctions(_self, _self[_DYN_APP_INSIGHTS ], [
                    STR_GET_COOKIE_MGR,
                    STR_TRACK_EVENT,
                    STR_TRACK_PAGE_VIEW,
                    "trackPageViewPerformance",
                    STR_TRACK_EXCEPTION,
                    "_onerror",
                    STR_TRACK_TRACE,
                    STR_TRACK_METRIC,
                    STR_START_TRACK_PAGE,
                    STR_STOP_TRACK_PAGE,
                    STR_START_TRACK_EVENT,
                    STR_STOP_TRACK_EVENT
                ]);
                proxyFunctions(_self, _getCurrentDependencies, [
                    STR_TRACK_DEPENDENCY_DATA,
                    "addDependencyListener",
                    "addDependencyInitializer"
                ]);
                proxyFunctions(_self, _core, [
                    STR_ADD_TELEMETRY_INITIALIZER,
                    STR_POLL_INTERNAL_LOGS,
                    "stopPollingInternalLogs",
                    STR_GET_PLUGIN,
                    "addPlugin",
                    STR_EVT_NAMESPACE,
                    "addUnloadCb",
                    "getTraceCtx"
                ]);
                proxyFunctions(_self, function () {
                    var context = properties[_DYN_CONTEXT ];
                    return context ? context.user : null;
                }, [
                    STR_SET_AUTHENTICATED_USER_CONTEXT,
                    STR_CLEAR_AUTHENTICATED_USER_CONTEXT
                ]);
                function _getSKUDefaults() {
                    _self.config[_DYN_DIAGNOSTIC_LOG_INTER4 ] =
                        _self.config[_DYN_DIAGNOSTIC_LOG_INTER4 ] && _self[_DYN_CONFIG$1 ][_DYN_DIAGNOSTIC_LOG_INTER4 ] > 0 ? _self[_DYN_CONFIG$1 ][_DYN_DIAGNOSTIC_LOG_INTER4 ] : 10000;
                }
                function _getCurrentDependencies() {
                    return dependencies;
                }
                function _initDefaults() {
                    _evtNamespace = createUniqueNamespace("AISKU");
                    _houseKeepingNamespace = null;
                    dependencies = null;
                    properties = null;
                    _sender = null;
                    _snippetVersion = null;
                }
            });
        }
        Initialization.prototype.addDependencyInitializer = function (dependencyInitializer) {
            return null;
        };
        return Initialization;
    }());
    (function () {
        var sdkSrc = null;
        var cdns = [
            "://js.monitor.azure.com/",
            "://az416426.vo.msecnd.net/"
        ];
        try {
            var scrpt = (document || {}).currentScript;
            if (scrpt) {
                sdkSrc = scrpt.src;
            }
        }
        catch (e) {
        }
        if (sdkSrc) {
            try {
                var url = sdkSrc.toLowerCase();
                if (url) {
                    var src = "";
                    for (var idx = 0; idx < cdns.length; idx++) {
                        if (url[_DYN_INDEX_OF ](cdns[idx]) !== -1) {
                            src = "cdn" + (idx + 1);
                            if (url[_DYN_INDEX_OF ]("/scripts/") === -1) {
                                if (url[_DYN_INDEX_OF ]("/next/") !== -1) {
                                    src += "-next";
                                }
                                else if (url[_DYN_INDEX_OF ]("/beta/") !== -1) {
                                    src += "-beta";
                                }
                            }
                            _internalSdkSrc = src + ("");
                            break;
                        }
                    }
                }
            }
            catch (e) {
            }
        }
    })();

    var ApplicationInsightsContainer = /** @class */ (function () {
        function ApplicationInsightsContainer() {
        }
        ApplicationInsightsContainer.getAppInsights = function (snippet, version) {
            var initialization = new Initialization(snippet);
            var legacyMode = version >= 2 ? false : true;
            _legacyCookieMgr();
            if (!legacyMode) {
                initialization[_DYN_UPDATE_SNIPPET_DEFIN0 ](snippet);
                initialization[_DYN_LOAD_APP_INSIGHTS ](legacyMode);
                return initialization;
            }
            else {
                var legacy = new AppInsightsDeprecated(snippet, initialization);
                legacy[_DYN_UPDATE_SNIPPET_DEFIN0 ](snippet);
                initialization[_DYN_LOAD_APP_INSIGHTS ](legacyMode);
                return legacy;
            }
        };
        return ApplicationInsightsContainer;
    }());

    function _logWarn(aiName, message) {
        var _console = typeof console !== strShimUndefined ? console : null;
        if (_console && _console.warn) {
            _console.warn("Failed to initialize AppInsights JS SDK for instance " + (aiName || "<unknown>") + " - " + message);
        }
    }
    try {
        var aiName;
        if (typeof window !== strShimUndefined) {
            var _window = window;
            aiName = _window["appInsightsSDK"] || "appInsights";
            if (typeof JSON !== strShimUndefined) {
                if (_window[aiName] !== undefined) {
                    var snippet = _window[aiName] || { version: 2.0 };
                    if ((snippet[_DYN_VERSION ] >= 2 && _window[aiName].initialize) || snippet[_DYN_VERSION ] === undefined) {
                        ApplicationInsightsContainer.getAppInsights(snippet, snippet[_DYN_VERSION ]);
                    }
                }
            }
            else {
                _logWarn(aiName, "Missing JSON - you must supply a JSON polyfill!");
            }
        }
        else {
            _logWarn(aiName, "Missing window");
        }
    }
    catch (e) {
        _logWarn(aiName, e.message);
    }

    exports.AnalyticsPluginIdentifier = AnalyticsPluginIdentifier;
    exports.ApplicationInsights = Initialization;
    exports.BreezeChannelIdentifier = BreezeChannelIdentifier;
    exports.CoreUtils = CoreUtils;
    exports.DEFAULT_BREEZE_ENDPOINT = DEFAULT_BREEZE_ENDPOINT;
    exports.DisabledPropertyName = DisabledPropertyName;
    exports.DistributedTracingModes = DistributedTracingModes;
    exports.LoggingSeverity = LoggingSeverity;
    exports.PerfEvent = PerfEvent;
    exports.PerfManager = PerfManager;
    exports.PropertiesPluginIdentifier = PropertiesPluginIdentifier;
    exports.RequestHeaders = RequestHeaders;
    exports.SeverityLevel = SeverityLevel;
    exports.Telemetry = Telemetry;
    exports.Util = Util;
    exports.addEventHandler = addEventHandler;
    exports.doPerf = doPerf;
    exports.eventOff = eventOff;
    exports.eventOn = eventOn;
    exports.findMetaTag = findMetaTag;
    exports.findW3cTraceParent = findW3cTraceParent;
    exports.generateW3CId = generateW3CId;
    exports.isBeaconsSupported = isBeaconsSupported;
    exports.mergeEvtNamespace = mergeEvtNamespace;
    exports.newGuid = newGuid;
    exports.newId = newId;
    exports.random32 = random32;
    exports.randomValue = randomValue;
    exports.removeEventHandler = removeEventHandler;

    (function(obj, prop, descriptor) { /* ai_es3_polyfil defineProperty */ var func = Object["defineProperty"]; if (func) { try { return func(obj, prop, descriptor); } catch(e) { /* IE8 defines defineProperty, but will throw */ } } if (descriptor && typeof descriptor.value !== undefined) { obj[prop] = descriptor.value; } return obj; })(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=ai.2.8.9.js.map
