/*!
 * Application Insights JavaScript SDK - Web, 2.8.3
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
        if (!_cachedGlobal || !useCached) {
            if (typeof globalThis !== strShimUndefined && globalThis) {
                _cachedGlobal = globalThis;
            }
            if (typeof self !== strShimUndefined && self) {
                _cachedGlobal = self;
            }
            if (typeof window !== strShimUndefined && window) {
                _cachedGlobal = window;
            }
            if (typeof global !== strShimUndefined && global) {
                _cachedGlobal = global;
            }
        }
        return _cachedGlobal;
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

    var strEmpty$1 = "";
    var strProcessTelemetry = "processTelemetry";
    var strPriority = "priority";
    var strSetNextPlugin = "setNextPlugin";
    var strIsInitialized = "isInitialized";
    var strTeardown = "teardown";
    var strCore = "core";
    var strUpdate = "update";
    var strDisabled = "disabled";
    var strDoTeardown = "_doTeardown";
    var strProcessNext = "processNext";
    var strResume = "resume";
    var strPause = "pause";
    var strNotificationListener = "NotificationListener";
    var strAddNotificationListener = "add" + strNotificationListener;
    var strRemoveNotificationListener = "remove" + strNotificationListener;
    var strEventsSent = "eventsSent";
    var strEventsDiscarded = "eventsDiscarded";
    var strEventsSendRequest = "eventsSendRequest";
    var strPerfEvent = "perfEvent";

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
    var _objFunctionString = _fnToString.call(ObjClass);
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
        return !!(obj && ObjHasOwnProperty.call(obj, prop));
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
            value = value.replace(rCamelCase, function (_all, letter) {
                return letter.toUpperCase();
            });
            value = value.replace(rNormalizeInvalid, "_");
            value = value.replace(rLeadingNumeric, function (_all, match) {
                return "_" + match;
            });
        }
        return value;
    }
    function objForEachKey(target, callbackfn) {
        if (target) {
            for (var prop in target) {
                if (ObjHasOwnProperty.call(target, prop)) {
                    callbackfn.call(target, prop, target[prop]);
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
        var searchLen = search ? search.length : 0;
        var valLen = value ? value.length : 0;
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
            return value.indexOf(search) !== -1;
        }
        return false;
    }
    function isDate(obj) {
        return !!(obj && _objToString.call(obj) === "[object Date]");
    }
    var isArray = _isArray || _isArrayPoly;
    function _isArrayPoly(obj) {
        return !!(obj && _objToString.call(obj) === "[object Array]");
    }
    function isError(obj) {
        return !!(obj && _objToString.call(obj) === "[object Error]");
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
                if (proto[strConstructor] && ObjHasOwnProperty.call(proto, strConstructor)) {
                    proto = proto[strConstructor];
                }
                result = typeof proto === strShimFunction && _fnToString.call(proto) === _objFunctionString;
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
                if (r.length === 1) {
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
        var len = arr.length;
        try {
            for (var idx = 0; idx < len; idx++) {
                if (idx in arr) {
                    if (callbackfn.call(thisArg || arr, arr[idx], idx, arr) === -1) {
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
            var len = arr.length;
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
            var len = arr.length;
            var _this = thisArg || arr;
            results = new Array(len);
            try {
                for (var lp = 0; lp < len; lp++) {
                    if (lp in arr) {
                        results[lp] = callbackfn.call(_this, arr[lp], arr);
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
            var len = arr.length;
            var lp = 0;
            if (arguments.length >= 3) {
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
            str = (_strTrim && str[cStrTrim]) ? str[cStrTrim]() : (str.replace ? str.replace(/^\s+|\s+$/g, "") : str);
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
            if (obj && ObjHasOwnProperty.call(obj, prop)) {
                result.push(prop);
            }
        }
        if (_objKeysHasDontEnumBug) {
            var dontEnumsLength = _objKeysDontEnums.length;
            for (var lp = 0; lp < dontEnumsLength; lp++) {
                if (obj && ObjHasOwnProperty.call(obj, _objKeysDontEnums[lp])) {
                    result.push(_objKeysDontEnums[lp]);
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
            return object.name;
        }
        return strEmpty$1;
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
    function isNotTruthy(value) {
        return !value;
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
                return src[funcName].apply(src, originalArguments);
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
        var argLen = theArgs.length;
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
                var propOk = (isArgArray && (prop in arg)) || (isArgObj && (ObjHasOwnProperty.call(arg, prop)));
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
     * Microsoft Dynamic Proto Utility, 1.1.6
     * Copyright (c) Microsoft and contributors. All rights reserved.
     */
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
    var DynProtoCurrent = "_dynInstProto";
    var strUseBaseInst = 'useBaseInst';
    var strSetInstFuncs = 'setInstFuncs';
    var Obj = Object;
    var _objGetPrototypeOf = Obj["getPrototypeOf"];
    var _objGetOwnProps = Obj["getOwnPropertyNames"];
    var _dynamicNames = 0;
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
            _throwTypeError("[" + _getObjName(theClass) + "] is not in class hierarchy of [" + _getObjName(target) + "]");
        }
        var className = null;
        if (_hasOwnProperty(classProto, DynClassName)) {
            className = classProto[DynClassName];
        }
        else {
            className = DynClassNamePrefix + _getObjName(theClass, "_") + "$" + _dynamicNames;
            _dynamicNames++;
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
    var perfDefaults = {
        setInstFuncs: true,
        useBaseInst: true
    };
    dynamicProto[DynProtoDefaultOptions] = perfDefaults;

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
        if (nav && (nav.userAgent !== _navUserAgentCheck || _isTrident === null)) {
            _navUserAgentCheck = nav.userAgent;
            var userAgent = (_navUserAgentCheck || strEmpty$1).toLowerCase();
            _isTrident = (strContains(userAgent, strMsie) || strContains(userAgent, strTrident));
        }
        return _isTrident;
    }
    function getIEVersion(userAgentStr) {
        if (userAgentStr === void 0) { userAgentStr = null; }
        if (!userAgentStr) {
            var navigator_1 = getNavigator() || {};
            userAgentStr = navigator_1 ? (navigator_1.userAgent || strEmpty$1).toLowerCase() : strEmpty$1;
        }
        var ua = (userAgentStr || strEmpty$1).toLowerCase();
        if (strContains(ua, strMsie)) {
            var doc = getDocument() || {};
            return Math.max(parseInt(ua.split(strMsie)[1]), (doc[strDocumentMode] || 0));
        }
        else if (strContains(ua, strTrident)) {
            var tridentVer = parseInt(ua.split(strTrident)[1]);
            if (tridentVer) {
                return tridentVer + 4;
            }
        }
        return null;
    }
    function dumpObj(object) {
        var objectTypeDump = Object[strShimPrototype].toString.call(object);
        var propertyValueDump = strEmpty$1;
        if (objectTypeDump === "[object Error]") {
            propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
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
                    listener[name].apply(listener, args);
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
            for (var lp = 0; lp < listenerFuncs.length; lp++) {
                _debugListener[listenerFuncs[lp]] = _listenerProxyFunc(listenerFuncs[lp], config);
            }
        }
        return _debugListener;
    }

    var AiNonUserActionablePrefix = "AI (Internal): ";
    var AiUserActionablePrefix = "AI: ";
    var AIInternalMessagePrefix = "AITR_";
    var strErrorToConsole = "errorToConsole";
    var strWarnToConsole = "warnToConsole";
    function _sanitizeDiagnosticText(text) {
        if (text) {
            return "\"" + text.replace(/\"/g, strEmpty$1) + "\"";
        }
        return strEmpty$1;
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
            _self.messageId = msgId;
            _self.message =
                (isUserAct ? AiUserActionablePrefix : AiNonUserActionablePrefix) +
                    msgId;
            var strProps = strEmpty$1;
            if (hasJSON()) {
                strProps = getJSON().stringify(properties);
            }
            var diagnosticText = (msg ? " message:" + _sanitizeDiagnosticText(msg) : strEmpty$1) +
                (properties ? " props:" + _sanitizeDiagnosticText(strProps) : strEmpty$1);
            _self.message += diagnosticText;
        }
        _InternalLogMessage.dataType = "MessageData";
        return _InternalLogMessage;
    }());
    function safeGetLogger(core, config) {
        return (core || {}).logger || new DiagnosticLogger(config);
    }
    var DiagnosticLogger = /** @class */ (function () {
        function DiagnosticLogger(config) {
            this.identifier = "DiagnosticLogger";
            this.queue = [];
            var _messageCount = 0;
            var _messageLogged = {};
            dynamicProto(DiagnosticLogger, this, function (_self) {
                if (isNullOrUndefined(config)) {
                    config = {};
                }
                _self.consoleLoggingLevel = function () { return _getConfigValue("loggingLevelConsole", 0); };
                _self.telemetryLoggingLevel = function () { return _getConfigValue("loggingLevelTelemetry", 1); };
                _self.maxInternalMessageLimit = function () { return _getConfigValue("maxMessageLimit", 25); };
                _self.enableDebugExceptions = function () { return _getConfigValue("enableDebugExceptions", false); };
                _self.throwInternal = function (severity, msgId, msg, properties, isUserAct) {
                    if (isUserAct === void 0) { isUserAct = false; }
                    var message = new _InternalLogMessage(msgId, msg, isUserAct, properties);
                    if (_self.enableDebugExceptions()) {
                        throw dumpObj(message);
                    }
                    else {
                        var logFunc = severity === 1  ? strErrorToConsole : strWarnToConsole;
                        if (!isUndefined(message.message)) {
                            var logLevel = _self.consoleLoggingLevel();
                            if (isUserAct) {
                                var messageKey = +message.messageId;
                                if (!_messageLogged[messageKey] && logLevel >= severity) {
                                    _self[logFunc](message.message);
                                    _messageLogged[messageKey] = true;
                                }
                            }
                            else {
                                if (logLevel >= severity) {
                                    _self[logFunc](message.message);
                                }
                            }
                            _self.logInternalMessage(severity, message);
                        }
                        else {
                            _debugExtMsg("throw" + (severity === 1  ? "Critical" : "Warning"), message);
                        }
                    }
                };
                _self.warnToConsole = function (message) {
                    _logToConsole("warn", message);
                    _debugExtMsg("warning", message);
                };
                _self.errorToConsole = function (message) {
                    _logToConsole("error", message);
                    _debugExtMsg("error", message);
                };
                _self.resetInternalMessageCount = function () {
                    _messageCount = 0;
                    _messageLogged = {};
                };
                _self.logInternalMessage = function (severity, message) {
                    if (_areInternalMessagesThrottled()) {
                        return;
                    }
                    var logMessage = true;
                    var messageKey = AIInternalMessagePrefix + message.messageId;
                    if (_messageLogged[messageKey]) {
                        logMessage = false;
                    }
                    else {
                        _messageLogged[messageKey] = true;
                    }
                    if (logMessage) {
                        if (severity <= _self.telemetryLoggingLevel()) {
                            _self.queue.push(message);
                            _messageCount++;
                            _debugExtMsg((severity === 1  ? "error" : "warn"), message);
                        }
                        if (_messageCount === _self.maxInternalMessageLimit()) {
                            var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                            var throttleMessage = new _InternalLogMessage(23 , throttleLimitMessage, false);
                            _self.queue.push(throttleMessage);
                            if (severity === 1 ) {
                                _self.errorToConsole(throttleLimitMessage);
                            }
                            else {
                                _self.warnToConsole(throttleLimitMessage);
                            }
                        }
                    }
                };
                function _getConfigValue(name, defValue) {
                    var value = config[name];
                    if (!isNullOrUndefined(value)) {
                        return value;
                    }
                    return defValue;
                }
                function _areInternalMessagesThrottled() {
                    return _messageCount >= _self.maxInternalMessageLimit();
                }
                function _debugExtMsg(name, data) {
                    var dbgExt = getDebugExt(config);
                    if (dbgExt && dbgExt.diagLog) {
                        dbgExt.diagLog(name, data);
                    }
                }
            });
        }
        return DiagnosticLogger;
    }());
    function _getLogger(logger) {
        return (logger || new DiagnosticLogger());
    }
    function _throwInternal(logger, severity, msgId, msg, properties, isUserAct) {
        if (isUserAct === void 0) { isUserAct = false; }
        (logger || new DiagnosticLogger()).throwInternal(severity, msgId, msg, properties, isUserAct);
    }
    function _warnToConsole(logger, message) {
        _getLogger(logger).warnToConsole(message);
    }
    function _logInternalMessage(logger, severity, message) {
        _getLogger(logger).logInternalMessage(severity, message);
    }

    var strExecutionContextKey = "ctx";
    var _defaultPerfManager = null;
    var PerfEvent = /** @class */ (function () {
        function PerfEvent(name, payloadDetails, isAsync) {
            var _self = this;
            var accessorDefined = false;
            _self.start = dateNow();
            _self.name = name;
            _self.isAsync = isAsync;
            _self.isChildEvt = function () { return false; };
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
            _self.getCtx = function (key) {
                if (key) {
                    if (key === PerfEvent.ParentContextKey || key === PerfEvent.ChildrenContextKey) {
                        return _self[key];
                    }
                    return (_self[strExecutionContextKey] || {})[key];
                }
                return null;
            };
            _self.setCtx = function (key, value) {
                if (key) {
                    if (key === PerfEvent.ParentContextKey) {
                        if (!_self[key]) {
                            _self.isChildEvt = function () { return true; };
                        }
                        _self[key] = value;
                    }
                    else if (key === PerfEvent.ChildrenContextKey) {
                        _self[key] = value;
                    }
                    else {
                        var ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                        ctx[key] = value;
                    }
                }
            };
            _self.complete = function () {
                var childTime = 0;
                var childEvts = _self.getCtx(PerfEvent.ChildrenContextKey);
                if (isArray(childEvts)) {
                    for (var lp = 0; lp < childEvts.length; lp++) {
                        var childEvt = childEvts[lp];
                        if (childEvt) {
                            childTime += childEvt.time;
                        }
                    }
                }
                _self.time = dateNow() - _self.start;
                _self.exTime = _self.time - childTime;
                _self.complete = function () { };
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
                        perfEvent.complete();
                        if (manager && isFunction(manager.perfEvent)) {
                            manager.perfEvent(perfEvent);
                        }
                    }
                };
                _self.setCtx = function (key, value) {
                    if (key) {
                        var ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                        ctx[key] = value;
                    }
                };
                _self.getCtx = function (key) {
                    return (_self[strExecutionContextKey] || {})[key];
                };
            });
        }
        return PerfManager;
    }());
    var doPerfActiveKey = "CoreUtils.doPerf";
    function doPerf(mgrSource, getSource, func, details, isAsync) {
        if (mgrSource) {
            var perfMgr = mgrSource;
            if (isFunction(perfMgr["getPerfMgr"])) {
                perfMgr = perfMgr["getPerfMgr"]();
            }
            if (perfMgr) {
                var perfEvt = void 0;
                var currentActive = perfMgr.getCtx(doPerfActiveKey);
                try {
                    perfEvt = perfMgr.create(getSource(), details, isAsync);
                    if (perfEvt) {
                        if (currentActive && perfEvt.setCtx) {
                            perfEvt.setCtx(PerfEvent.ParentContextKey, currentActive);
                            if (currentActive.getCtx && currentActive.setCtx) {
                                var children = currentActive.getCtx(PerfEvent.ChildrenContextKey);
                                if (!children) {
                                    children = [];
                                    currentActive.setCtx(PerfEvent.ChildrenContextKey, children);
                                }
                                children.push(perfEvt);
                            }
                        }
                        perfMgr.setCtx(doPerfActiveKey, perfEvt);
                        return func(perfEvt);
                    }
                }
                catch (ex) {
                    if (perfEvt && perfEvt.setCtx) {
                        perfEvt.setCtx("exception", ex);
                    }
                }
                finally {
                    if (perfEvt) {
                        perfMgr.fire(perfEvt);
                    }
                    perfMgr.setCtx(doPerfActiveKey, currentActive);
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
        var result = strEmpty$1;
        while (result.length < maxLength) {
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
    var version = "2.8.3";
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
        return target.nodeType === 1 || target.nodeType === 9 || !(+target.nodeType);
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
        return normalizeJsName(name + (_dataUid++) + (includeVersion ? "." + version : "") + instanceName);
    }
    function createElmNodeData(name) {
        var data = {
            id: createUniqueNamespace("_aiData-" + (name || "") + "." + version),
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

    var pluginStateData = createElmNodeData("plugin");
    function _getPluginState(plugin) {
        return pluginStateData.get(plugin, "state", {}, true);
    }
    function initializePlugins(processContext, extensions) {
        var initPlugins = [];
        var lastPlugin = null;
        var proxy = processContext.getNext();
        var pluginState;
        while (proxy) {
            var thePlugin = proxy.getPlugin();
            if (thePlugin) {
                if (lastPlugin &&
                    isFunction(lastPlugin[strSetNextPlugin]) &&
                    isFunction(thePlugin[strProcessTelemetry])) {
                    lastPlugin[strSetNextPlugin](thePlugin);
                }
                var isInitialized = false;
                if (isFunction(thePlugin[strIsInitialized])) {
                    isInitialized = thePlugin[strIsInitialized]();
                }
                else {
                    pluginState = _getPluginState(thePlugin);
                    isInitialized = pluginState[strIsInitialized];
                }
                if (!isInitialized) {
                    initPlugins.push(thePlugin);
                }
                lastPlugin = thePlugin;
                proxy = proxy.getNext();
            }
        }
        arrForEach(initPlugins, function (thePlugin) {
            var core = processContext.core();
            thePlugin.initialize(processContext.getCfg(), core, extensions, processContext.getNext());
            pluginState = _getPluginState(thePlugin);
            if (!thePlugin[strCore] && !pluginState[strCore]) {
                pluginState[strCore] = core;
            }
            pluginState[strIsInitialized] = true;
            delete pluginState[strTeardown];
        });
    }
    function sortPlugins(plugins) {
        return plugins.sort(function (extA, extB) {
            var result = 0;
            var bHasProcess = isFunction(extB[strProcessTelemetry]);
            if (isFunction(extA[strProcessTelemetry])) {
                result = bHasProcess ? extA[strPriority] - extB[strPriority] : 1;
            }
            else if (bHasProcess) {
                result = -1;
            }
            return result;
        });
    }

    var strTelemetryPluginChain = "TelemetryPluginChain";
    var strHasRunFlags = "_hasRun";
    var strGetTelCtx = "_getTelCtx";
    var _chainId = 0;
    function _getNextProxyStart(proxy, core, startAt) {
        while (proxy) {
            if (proxy.getPlugin() === startAt) {
                return proxy;
            }
            proxy = proxy.getNext();
        }
        return createTelemetryProxyChain([startAt], core.config || {}, core);
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
                _onComplete.push({
                    func: onComplete,
                    self: !isUndefined(that) ? that : context.ctx,
                    args: args
                });
            }
        }
        function _moveNext() {
            var nextProxy = _nextProxy;
            _nextProxy = nextProxy ? nextProxy.getNext() : null;
            if (!nextProxy) {
                var onComplete = _onComplete;
                if (onComplete && onComplete.length > 0) {
                    arrForEach(onComplete, function (completeDetails) {
                        try {
                            completeDetails.func.call(completeDetails.self, completeDetails.args);
                        }
                        catch (e) {
                            _throwInternal(core.logger, 2 , 73 , "Unexpected Exception during onComplete - " + dumpObj(e));
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
                var extConfig = config.extensionConfig;
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
                var plugin = nextPlugin.getPlugin();
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
            nextPlugin && nextPlugin.processTelemetry(env, context);
            return !nextPlugin;
        }
        function _createNew(plugins, startAt) {
            if (plugins === void 0) { plugins = null; }
            if (isArray(plugins)) {
                plugins = createTelemetryProxyChain(plugins, config, core, startAt);
            }
            return createProcessTelemetryContext(plugins || context.getNext(), config, core, startAt);
        }
        context.processNext = _processNext;
        context.createNew = _createNew;
        return context;
    }
    function createProcessTelemetryUnloadContext(telemetryChain, core, startAt) {
        var config = core.config || {};
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
            return createProcessTelemetryUnloadContext(plugins || context.getNext(), core, startAt);
        }
        context.processNext = _processNext;
        context.createNew = _createNew;
        return context;
    }
    function createProcessTelemetryUpdateContext(telemetryChain, core, startAt) {
        var config = core.config || {};
        var internalContext = _createInternalContext(telemetryChain, config, core, startAt);
        var context = internalContext.ctx;
        function _processNext(updateState) {
            return context.iterate(function (plugin) {
                if (isFunction(plugin.update)) {
                    plugin.update(context, updateState);
                }
            });
        }
        function _createNew(plugins, startAt) {
            if (plugins === void 0) { plugins = null; }
            if (isArray(plugins)) {
                plugins = createTelemetryProxyChain(plugins, config, core, startAt);
            }
            return createProcessTelemetryUpdateContext(plugins || context.getNext(), core, startAt);
        }
        context.processNext = _processNext;
        context.createNew = _createNew;
        return context;
    }
    function createTelemetryProxyChain(plugins, config, core, startAt) {
        var firstProxy = null;
        var add = startAt ? false : true;
        if (isArray(plugins) && plugins.length > 0) {
            var lastProxy_1 = null;
            arrForEach(plugins, function (thePlugin) {
                if (!add && startAt === thePlugin) {
                    add = true;
                }
                if (add && thePlugin && isFunction(thePlugin.processTelemetry)) {
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
        var hasProcessTelemetry = isFunction(plugin.processTelemetry);
        var hasSetNext = isFunction(plugin.setNextPlugin);
        var chainId;
        if (plugin) {
            chainId = plugin.identifier + "-" + plugin.priority + "-" + _chainId++;
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
            var identifier = plugin ? plugin.identifier : strTelemetryPluginChain;
            var hasRunContext = itemCtx[strHasRunFlags];
            if (!hasRunContext) {
                hasRunContext = itemCtx[strHasRunFlags] = {};
            }
            itemCtx.setNext(nextProxy);
            if (plugin) {
                doPerf(itemCtx[strCore](), function () { return identifier + ":" + name; }, function () {
                    hasRunContext[chainId] = true;
                    try {
                        var nextId = nextProxy ? nextProxy._id : strEmpty$1;
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
                            _throwInternal(itemCtx.diagLog(), 1 , 73 , "Plugin [" + identifier + "] failed during " + name + " - " + dumpObj(error) + ", run flags: " + dumpObj(hasRunContext));
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
                if (pluginState.teardown || pluginState[strDisabled]) {
                    return false;
                }
                if (hasSetNext) {
                    plugin.setNextPlugin(nextProxy);
                }
                plugin.processTelemetry(env, itemCtx);
                return true;
            }
            if (!_processChain(itemCtx, _callProcessTelemetry, "processTelemetry", function () { return ({ item: env }); }, !(env.sync))) {
                itemCtx.processNext(env);
            }
        }
        function _unloadPlugin(unloadCtx, unloadState) {
            function _callTeardown() {
                var hasRun = false;
                if (plugin) {
                    var pluginState = _getPluginState(plugin);
                    var pluginCore = plugin[strCore] || pluginState.core;
                    if (plugin && (!pluginCore || pluginCore === unloadCtx[strCore]()) && !pluginState[strTeardown]) {
                        pluginState[strCore] = null;
                        pluginState[strTeardown] = true;
                        pluginState[strIsInitialized] = false;
                        if (plugin[strTeardown] && plugin[strTeardown](unloadCtx, unloadState) === true) {
                            hasRun = true;
                        }
                    }
                }
                return hasRun;
            }
            if (!_processChain(unloadCtx, _callTeardown, "unload", function () { }, unloadState.isAsync)) {
                unloadCtx.processNext(unloadState);
            }
        }
        function _updatePlugin(updateCtx, updateState) {
            function _callUpdate() {
                var hasRun = false;
                if (plugin) {
                    var pluginState = _getPluginState(plugin);
                    var pluginCore = plugin[strCore] || pluginState.core;
                    if (plugin && (!pluginCore || pluginCore === updateCtx[strCore]()) && !pluginState[strTeardown]) {
                        if (plugin[strUpdate] && plugin[strUpdate](updateCtx, updateState) === true) {
                            hasRun = true;
                        }
                    }
                }
                return hasRun;
            }
            if (!_processChain(updateCtx, _callUpdate, "update", function () { }, false)) {
                updateCtx.processNext(updateState);
            }
        }
        return objFreeze(proxyChain);
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
        var cookieMgrCfg = rootConfig.cookieCfg = rootConfig.cookieCfg || {};
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
    function safeGetCookieMgr(core, config) {
        var cookieMgr;
        if (core) {
            cookieMgr = core.getCookieMgr();
        }
        else if (config) {
            var cookieCfg = config.cookieCfg;
            if (cookieCfg[strConfigCookieMgr]) {
                cookieMgr = cookieCfg[strConfigCookieMgr];
            }
            else {
                cookieMgr = createCookieMgr(config);
            }
        }
        if (!cookieMgr) {
            cookieMgr = _gblCookieMgr(config, (core || {}).logger);
        }
        return cookieMgr;
    }
    function createCookieMgr(rootConfig, logger) {
        var cookieMgrConfig = _createCookieMgrConfig(rootConfig || _globalCookieConfig);
        var _path = cookieMgrConfig.path || "/";
        var _domain = cookieMgrConfig.domain;
        var _enabled = cookieMgrConfig[strEnabled] !== false;
        var cookieMgr = {
            isEnabled: function () {
                var enabled = _enabled && areCookiesSupported(logger);
                var gblManager = _globalCookieConfig[strConfigCookieMgr];
                if (enabled && gblManager && cookieMgr !== gblManager) {
                    enabled = _isMgrEnabled(gblManager);
                }
                return enabled;
            },
            setEnabled: function (value) {
                _enabled = value !== false;
            },
            set: function (name, value, maxAgeSec, domain, path) {
                var result = false;
                if (_isMgrEnabled(cookieMgr)) {
                    var values = {};
                    var theValue = strTrim(value || strEmpty$1);
                    var idx = theValue.indexOf(";");
                    if (idx !== -1) {
                        theValue = strTrim(value.substring(0, idx));
                        values = _extractParts(value.substring(idx + 1));
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
                                setValue(values, strExpires, _formatDate(expiry, !_isIE ? strToUTCString : strToGMTString) || _formatDate(expiry, _isIE ? strToGMTString : strToUTCString) || strEmpty$1, isTruthy);
                            }
                        }
                        if (!_isIE) {
                            setValue(values, "max-age", strEmpty$1 + maxAgeSec, null, isUndefined);
                        }
                    }
                    var location_1 = getLocation();
                    if (location_1 && location_1.protocol === "https:") {
                        setValue(values, "secure", null, null, isUndefined);
                        if (_allowUaSameSite === null) {
                            _allowUaSameSite = !uaDisallowsSameSiteNone((getNavigator() || {}).userAgent);
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
            get: function (name) {
                var value = strEmpty$1;
                if (_isMgrEnabled(cookieMgr)) {
                    value = (cookieMgrConfig.getCookie || _getCookieValue)(name);
                }
                return value;
            },
            del: function (name, path) {
                var result = false;
                if (_isMgrEnabled(cookieMgr)) {
                    result = cookieMgr.purge(name, path);
                }
                return result;
            },
            purge: function (name, path) {
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
                    delCookie(name, _formatCookieValue(strEmpty$1, values));
                    result = true;
                }
                return result;
            }
        };
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
        if (theValue && theValue.length) {
            var parts = strTrim(theValue).split(";");
            arrForEach(parts, function (thePart) {
                thePart = strTrim(thePart || strEmpty$1);
                if (thePart) {
                    var idx = thePart.indexOf("=");
                    if (idx === -1) {
                        values[thePart] = null;
                    }
                    else {
                        values[strTrim(thePart.substring(0, idx))] = strTrim(thePart.substring(idx + 1));
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
        var cookieValue = value || strEmpty$1;
        objForEachKey(values, function (name, theValue) {
            cookieValue += "; " + name + (!isNullOrUndefined(theValue) ? "=" + theValue : strEmpty$1);
        });
        return cookieValue;
    }
    function _getCookieValue(name) {
        var cookieValue = strEmpty$1;
        if (_doc) {
            var theCookie = _doc[strCookie] || strEmpty$1;
            if (_parsedCookieValue !== theCookie) {
                _cookieCache = _extractParts(theCookie);
                _parsedCookieValue = theCookie;
            }
            cookieValue = strTrim(_cookieCache[name] || strEmpty$1);
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

    var strIKey = "iKey";
    var strExtensionConfig = "extensionConfig";

    var ChannelControllerPriority = 500;
    var ChannelValidationMessage = "Channel has invalid priority - ";
    function _addChannelQueue(channelQueue, queue, config, core) {
        if (queue && isArray(queue) && queue.length > 0) {
            queue = queue.sort(function (a, b) {
                return a.priority - b.priority;
            });
            arrForEach(queue, function (queueItem) {
                if (queueItem.priority < ChannelControllerPriority) {
                    throwError(ChannelValidationMessage + queueItem.identifier);
                }
            });
            channelQueue.push({
                queue: objFreeze(queue),
                chain: createTelemetryProxyChain(queue, config, core)
            });
        }
    }
    function createChannelControllerPlugin(channelQueue, core) {
        var _a;
        function _getTelCtx() {
            return createProcessTelemetryContext(null, core.config, core, null);
        }
        function _processChannelQueue(theChannels, itemCtx, processFn, onComplete) {
            var waiting = theChannels ? (theChannels.length + 1) : 1;
            function _runChainOnComplete() {
                waiting--;
                if (waiting === 0) {
                    onComplete && onComplete();
                    onComplete = null;
                }
            }
            if (waiting > 0) {
                arrForEach(theChannels, function (channels) {
                    if (channels && channels.queue.length > 0) {
                        var channelChain = channels.chain;
                        var chainCtx = itemCtx.createNew(channelChain);
                        chainCtx.onComplete(_runChainOnComplete);
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
                chainCtx[strProcessNext](theUpdateState);
            }, function () {
                updateCtx[strProcessNext](theUpdateState);
            });
            return true;
        }
        function _doTeardown(unloadCtx, unloadState) {
            var theUnloadState = unloadState || {
                reason: 0 ,
                isAsync: false
            };
            _processChannelQueue(channelQueue, unloadCtx, function (chainCtx) {
                chainCtx[strProcessNext](theUnloadState);
            }, function () {
                unloadCtx[strProcessNext](theUnloadState);
                isInitialized = false;
            });
            return true;
        }
        function _getChannel(pluginIdentifier) {
            var thePlugin = null;
            if (channelQueue && channelQueue.length > 0) {
                arrForEach(channelQueue, function (channels) {
                    if (channels && channels.queue.length > 0) {
                        arrForEach(channels.queue, function (ext) {
                            if (ext.identifier === pluginIdentifier) {
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
        var channelController = (_a = {
                identifier: "ChannelControllerPlugin",
                priority: ChannelControllerPriority,
                initialize: function (config, core, extensions, pluginChain) {
                    isInitialized = true;
                    arrForEach(channelQueue, function (channels) {
                        if (channels && channels.queue.length > 0) {
                            initializePlugins(createProcessTelemetryContext(channels.chain, config, core), extensions);
                        }
                    });
                },
                isInitialized: function () {
                    return isInitialized;
                },
                processTelemetry: function (item, itemCtx) {
                    _processChannelQueue(channelQueue, itemCtx || _getTelCtx(), function (chainCtx) {
                        chainCtx[strProcessNext](item);
                    }, function () {
                        itemCtx[strProcessNext](item);
                    });
                },
                update: _doUpdate
            },
            _a[strPause] = function () {
                _processChannelQueue(channelQueue, _getTelCtx(), function (chainCtx) {
                    chainCtx.iterate(function (plugin) {
                        plugin[strPause] && plugin[strPause]();
                    });
                }, null);
            },
            _a[strResume] = function () {
                _processChannelQueue(channelQueue, _getTelCtx(), function (chainCtx) {
                    chainCtx.iterate(function (plugin) {
                        plugin[strResume] && plugin[strResume]();
                    });
                }, null);
            },
            _a[strTeardown] = _doTeardown,
            _a.getChannel = _getChannel,
            _a.flush = function (isAsync, callBack, sendReason, cbTimeout) {
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
                        if (plugin.flush) {
                            waiting++;
                            var handled_1 = false;
                            if (!plugin.flush(isAsync, function () {
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
            _a._setQueue = function (queue) {
                channelQueue = queue;
            },
            _a);
        return channelController;
    }
    function createChannelQueues(channels, extensions, config, core) {
        var channelQueue = [];
        if (channels) {
            arrForEach(channels, function (queue) { return _addChannelQueue(channelQueue, queue, config, core); });
        }
        if (extensions) {
            var extensionQueue_1 = [];
            arrForEach(extensions, function (plugin) {
                if (plugin.priority > ChannelControllerPriority) {
                    extensionQueue_1.push(plugin);
                }
            });
            _addChannelQueue(channelQueue, extensionQueue_1, config, core);
        }
        return channelQueue;
    }

    function createUnloadHandlerContainer() {
        var handlers = [];
        function _addHandler(handler) {
            if (handler) {
                handlers.push(handler);
            }
        }
        function _runHandlers(unloadCtx, unloadState) {
            arrForEach(handlers, function (handler) {
                try {
                    handler(unloadCtx, unloadState);
                }
                catch (e) {
                    _throwInternal(unloadCtx.diagLog(), 2 , 73 , "Unexpected error calling unload handler - " + dumpObj(e));
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
                _self.initialize = function (config, core, extensions, pluginChain) {
                    _setDefaults(config, core, pluginChain);
                    _isinitialized = true;
                };
                _self.teardown = function (unloadCtx, unloadState) {
                    var core = _self.core;
                    if (!core || (unloadCtx && core !== unloadCtx.core())) {
                        return;
                    }
                    var result;
                    var unloadDone = false;
                    var theUnloadCtx = unloadCtx || createProcessTelemetryUnloadContext(null, core, _nextPlugin && _nextPlugin[strGetPlugin] ? _nextPlugin[strGetPlugin]() : _nextPlugin);
                    var theUnloadState = unloadState || {
                        reason: 0 ,
                        isAsync: false
                    };
                    function _unloadCallback() {
                        if (!unloadDone) {
                            unloadDone = true;
                            _unloadHandlerContainer.run(theUnloadCtx, unloadState);
                            arrForEach(_hooks, function (fn) {
                                fn.rm();
                            });
                            _hooks = [];
                            if (result === true) {
                                theUnloadCtx.processNext(theUnloadState);
                            }
                            _initDefaults();
                        }
                    }
                    if (!_self[strDoTeardown] || _self[strDoTeardown](theUnloadCtx, theUnloadState, _unloadCallback) !== true) {
                        _unloadCallback();
                    }
                    else {
                        result = true;
                    }
                    return result;
                };
                _self.update = function (updateCtx, updateState) {
                    var core = _self.core;
                    if (!core || (updateCtx && core !== updateCtx.core())) {
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
                            _setDefaults(theUpdateCtx.getCfg(), theUpdateCtx.core(), theUpdateCtx.getNext());
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
                            _hooks.push(hooks);
                        }
                    }
                };
                proxyFunctionAs(_self, "_addUnloadCb", function () { return _unloadHandlerContainer; }, "add");
            });
            _self.diagLog = function (itemCtx) {
                return _getTelCtx(itemCtx).diagLog();
            };
            _self[strIsInitialized] = function () {
                return _isinitialized;
            };
            _self.setInitialized = function (isInitialized) {
                _isinitialized = isInitialized;
            };
            _self[strSetNextPlugin] = function (next) {
                _nextPlugin = next;
            };
            _self.processNext = function (env, itemCtx) {
                if (itemCtx) {
                    itemCtx.processNext(env);
                }
                else if (_nextPlugin && isFunction(_nextPlugin.processTelemetry)) {
                    _nextPlugin.processTelemetry(env, null);
                }
            };
            _self._getTelCtx = _getTelCtx;
            function _getTelCtx(currentCtx) {
                if (currentCtx === void 0) { currentCtx = null; }
                var itemCtx = currentCtx;
                if (!itemCtx) {
                    var rootCtx = _rootCtx || createProcessTelemetryContext(null, {}, _self.core);
                    if (_nextPlugin && _nextPlugin[strGetPlugin]) {
                        itemCtx = rootCtx.createNew(null, _nextPlugin[strGetPlugin]);
                    }
                    else {
                        itemCtx = rootCtx.createNew(null, _nextPlugin);
                    }
                }
                return itemCtx;
            }
            function _setDefaults(config, core, pluginChain) {
                if (config) {
                    setValue(config, strExtensionConfig, [], null, isNullOrUndefined);
                }
                if (!pluginChain && core) {
                    pluginChain = core.getProcessTelContext().getNext();
                }
                var nextPlugin = _nextPlugin;
                if (_nextPlugin && _nextPlugin[strGetPlugin]) {
                    nextPlugin = _nextPlugin[strGetPlugin]();
                }
                _self.core = core;
                _rootCtx = createProcessTelemetryContext(pluginChain, config, core, nextPlugin);
            }
            function _initDefaults() {
                _isinitialized = false;
                _self.core = null;
                _rootCtx = null;
                _nextPlugin = null;
                _hooks = [];
                _unloadHandlerContainer = createUnloadHandlerContainer();
            }
        }
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
                    _initializers.push(theInitializer);
                    var handler = {
                        remove: function () {
                            arrForEach(_initializers, function (initializer, idx) {
                                if (initializer.id === theInitializer.id) {
                                    _initializers.splice(idx, 1);
                                    return -1;
                                }
                            });
                        }
                    };
                    return handler;
                };
                _self.processTelemetry = function (item, itemCtx) {
                    var doNotSendItem = false;
                    var telemetryInitializersCount = _initializers.length;
                    for (var i = 0; i < telemetryInitializersCount; ++i) {
                        var telemetryInitializer = _initializers[i];
                        if (telemetryInitializer) {
                            try {
                                if (telemetryInitializer.fn.apply(null, [item]) === false) {
                                    doNotSendItem = true;
                                    break;
                                }
                            }
                            catch (e) {
                                _throwInternal(itemCtx.diagLog(), 1 , 64 , "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e), { exception: dumpObj(e) }, true);
                            }
                        }
                    }
                    if (!doNotSendItem) {
                        _self.processNext(item, itemCtx);
                    }
                };
                _self[strDoTeardown] = function () {
                    _initDefaults();
                };
            });
            function _initDefaults() {
                _id = 0;
                _initializers = [];
            }
            return _this;
        }
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
        var coreExtensions = [];
        var extPriorities = {};
        arrForEach(allExtensions, function (ext) {
            if (isNullOrUndefined(ext) || isNullOrUndefined(ext.initialize)) {
                throwError(strValidationError);
            }
            var extPriority = ext.priority;
            var identifier = ext.identifier;
            if (ext && extPriority) {
                if (!isNullOrUndefined(extPriorities[extPriority])) {
                    _warnToConsole(logger, "Two extensions have same priority #" + extPriority + " - " + extPriorities[extPriority] + ", " + identifier);
                }
                else {
                    extPriorities[extPriority] = identifier;
                }
            }
            if (!extPriority || extPriority < channelPriority) {
                coreExtensions.push(ext);
            }
        });
        return {
            all: allExtensions,
            core: coreExtensions
        };
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
            _a[strAddNotificationListener] = function (listener) { },
            _a[strRemoveNotificationListener] = function (listener) { },
            _a[strEventsSent] = function (events) { },
            _a[strEventsDiscarded] = function (events, reason) { },
            _a[strEventsSendRequest] = function (sendReason, isAsync) { },
            _a));
    }
    var BaseCore = /** @class */ (function () {
        function BaseCore() {
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
            var _internalLogPoller = 0;
            dynamicProto(BaseCore, this, function (_self) {
                _initDefaults();
                _self.isInitialized = function () { return _isInitialized; };
                _self.initialize = function (config, extensions, logger, notificationManager) {
                    if (_isUnloading) {
                        throwError(strSdkUnloadingError);
                    }
                    if (_self.isInitialized()) {
                        throwError("Core should not be initialized more than once");
                    }
                    if (!config || isNullOrUndefined(config.instrumentationKey)) {
                        throwError("Please provide instrumentation key");
                    }
                    _notificationManager = notificationManager;
                    _self[strNotificationManager] = notificationManager;
                    _self.config = config || {};
                    _initDebugListener(config);
                    _initPerfManager(config);
                    config.extensions = isNullOrUndefined(config.extensions) ? [] : config.extensions;
                    _initExtConfig(config);
                    if (logger) {
                        _self.logger = logger;
                    }
                    _configExtensions = [];
                    _configExtensions.push.apply(_configExtensions, __spreadArrayFn(__spreadArrayFn([], extensions, false), config.extensions));
                    _channelConfig = (config || {}).channels;
                    _initPluginChain(config, null);
                    if (!_channelQueue || _channelQueue.length === 0) {
                        throwError("No channels available");
                    }
                    _isInitialized = true;
                    _self.releaseQueue();
                };
                _self.getTransmissionControls = function () {
                    var controls = [];
                    if (_channelQueue) {
                        arrForEach(_channelQueue, function (channels) {
                            controls.push(channels.queue);
                        });
                    }
                    return objFreeze(controls);
                };
                _self.track = function (telemetryItem) {
                    setValue(telemetryItem, strIKey, _self.config.instrumentationKey, null, isNotTruthy);
                    setValue(telemetryItem, "time", toISOString(new Date()), null, isNotTruthy);
                    setValue(telemetryItem, "ver", "4.0", null, isNullOrUndefined);
                    if (!_isUnloading && _self.isInitialized()) {
                        _createTelCtx().processNext(telemetryItem);
                    }
                    else {
                        _eventQueue.push(telemetryItem);
                    }
                };
                _self.getProcessTelContext = _createTelCtx;
                _self.getNotifyMgr = function () {
                    if (!_notificationManager) {
                        _notificationManager = _createDummyNotificationManager();
                        _self[strNotificationManager] = _notificationManager;
                    }
                    return _notificationManager;
                };
                _self[strAddNotificationListener] = function (listener) {
                    if (_notificationManager) {
                        _notificationManager[strAddNotificationListener](listener);
                    }
                };
                _self[strRemoveNotificationListener] = function (listener) {
                    if (_notificationManager) {
                        _notificationManager[strRemoveNotificationListener](listener);
                    }
                };
                _self.getCookieMgr = function () {
                    if (!_cookieManager) {
                        _cookieManager = createCookieMgr(_self.config, _self.logger);
                    }
                    return _cookieManager;
                };
                _self.setCookieMgr = function (cookieMgr) {
                    _cookieManager = cookieMgr;
                };
                _self.getPerfMgr = function () {
                    if (!_perfManager && !_cfgPerfManager) {
                        if (_self.config && _self.config.enablePerfMgr && isFunction(_self.config.createPerfMgr)) {
                            _cfgPerfManager = _self.config.createPerfMgr(_self, _self.getNotifyMgr());
                        }
                    }
                    return _perfManager || _cfgPerfManager || getGblPerfMgr();
                };
                _self.setPerfMgr = function (perfMgr) {
                    _perfManager = perfMgr;
                };
                _self.eventCnt = function () {
                    return _eventQueue.length;
                };
                _self.releaseQueue = function () {
                    if (_isInitialized && _eventQueue.length > 0) {
                        var eventQueue = _eventQueue;
                        _eventQueue = [];
                        arrForEach(eventQueue, function (event) {
                            _createTelCtx().processNext(event);
                        });
                    }
                };
                _self.pollInternalLogs = function (eventName) {
                    _internalLogsEventName = eventName || null;
                    var interval = _self.config.diagnosticLogInterval;
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
                _self.stopPollingInternalLogs = function () {
                    if (_internalLogPoller) {
                        clearInterval(_internalLogPoller);
                        _internalLogPoller = 0;
                        _flushInternalLogs();
                    }
                };
                proxyFunctions(_self, function () { return _telemetryInitializerPlugin; }, ["addTelemetryInitializer"]);
                _self.unload = function (isAsync, unloadComplete, cbTimeout) {
                    if (isAsync === void 0) { isAsync = true; }
                    if (!_isInitialized) {
                        throwError(strSdkNotInitialized);
                    }
                    if (_isUnloading) {
                        throwError(strSdkUnloadingError);
                    }
                    var unloadState = {
                        reason: 50 ,
                        isAsync: isAsync,
                        flushComplete: false
                    };
                    var processUnloadCtx = createProcessTelemetryUnloadContext(_getPluginChain(), _self);
                    processUnloadCtx.onComplete(function () {
                        _initDefaults();
                        unloadComplete && unloadComplete(unloadState);
                    }, _self);
                    function _doUnload(flushComplete) {
                        unloadState.flushComplete = flushComplete;
                        _isUnloading = true;
                        _unloadHandlers.run(processUnloadCtx, unloadState);
                        _self.stopPollingInternalLogs();
                        processUnloadCtx.processNext(unloadState);
                    }
                    if (!_flushChannels(isAsync, _doUnload, 6 , cbTimeout)) {
                        _doUnload(false);
                    }
                };
                _self.getPlugin = _getPlugin;
                _self.addPlugin = function (plugin, replaceExisting, isAsync, addCb) {
                    if (!plugin) {
                        addCb && addCb(false);
                        _logOrThrowError(strValidationError);
                        return;
                    }
                    var existingPlugin = _getPlugin(plugin.identifier);
                    if (existingPlugin && !replaceExisting) {
                        addCb && addCb(false);
                        _logOrThrowError("Plugin [" + plugin.identifier + "] is already loaded!");
                        return;
                    }
                    var updateState = {
                        reason: 16
                    };
                    function _addPlugin(removed) {
                        _configExtensions.push(plugin);
                        updateState.added = [plugin];
                        _initPluginChain(_self.config, updateState);
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
                _self.flush = _flushChannels;
                proxyFunctionAs(_self, "addUnloadCb", function () { return _unloadHandlers; }, "add");
                function _initDefaults() {
                    _isInitialized = false;
                    _self.config = objExtend(true, {}, defaultInitConfig);
                    _self.logger = new DiagnosticLogger(_self.config);
                    _self._extensions = [];
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
                }
                function _createTelCtx() {
                    return createProcessTelemetryContext(_getPluginChain(), _self.config, _self);
                }
                function _initPluginChain(config, updateState) {
                    var theExtensions = _validateExtensions(_self.logger, ChannelControllerPriority, _configExtensions);
                    _coreExtensions = theExtensions.core;
                    _pluginChain = null;
                    var allExtensions = theExtensions.all;
                    _channelQueue = objFreeze(createChannelQueues(_channelConfig, allExtensions, config, _self));
                    if (_channelControl) {
                        var idx = arrIndexOf(allExtensions, _channelControl);
                        if (idx !== -1) {
                            allExtensions.splice(idx, 1);
                        }
                        idx = arrIndexOf(_coreExtensions, _channelControl);
                        if (idx !== -1) {
                            _coreExtensions.splice(idx, 1);
                        }
                        _channelControl._setQueue(_channelQueue);
                    }
                    else {
                        _channelControl = createChannelControllerPlugin(_channelQueue, _self);
                    }
                    allExtensions.push(_channelControl);
                    _coreExtensions.push(_channelControl);
                    _self._extensions = sortPlugins(allExtensions);
                    _channelControl.initialize(config, _self, allExtensions);
                    initializePlugins(_createTelCtx(), allExtensions);
                    _self._extensions = objFreeze(sortPlugins(_coreExtensions || [])).slice();
                    if (updateState) {
                        _doUpdate(updateState);
                    }
                }
                function _getPlugin(pluginIdentifier) {
                    var theExt = null;
                    var thePlugin = null;
                    arrForEach(_self._extensions, function (ext) {
                        if (ext.identifier === pluginIdentifier && ext !== _channelControl && ext !== _telemetryInitializerPlugin) {
                            thePlugin = ext;
                            return -1;
                        }
                    });
                    if (!thePlugin && _channelControl) {
                        thePlugin = _channelControl.getChannel(pluginIdentifier);
                    }
                    if (thePlugin) {
                        theExt = {
                            plugin: thePlugin,
                            setEnabled: function (enabled) {
                                _getPluginState(thePlugin)[strDisabled] = !enabled;
                            },
                            isEnabled: function () {
                                var pluginState = _getPluginState(thePlugin);
                                return !pluginState[strTeardown] && !pluginState[strDisabled];
                            },
                            remove: function (isAsync, removeCb) {
                                if (isAsync === void 0) { isAsync = true; }
                                var pluginsToRemove = [thePlugin];
                                var unloadState = {
                                    reason: 1 ,
                                    isAsync: isAsync
                                };
                                _removePlugins(pluginsToRemove, unloadState, function (removed) {
                                    if (removed) {
                                        _initPluginChain(_self.config, {
                                            reason: 32 ,
                                            removed: pluginsToRemove
                                        });
                                    }
                                    removeCb && removeCb(removed);
                                });
                            }
                        };
                    }
                    return theExt;
                }
                function _getPluginChain() {
                    if (!_pluginChain) {
                        var extensions = (_coreExtensions || []).slice();
                        if (arrIndexOf(extensions, _telemetryInitializerPlugin) === -1) {
                            extensions.push(_telemetryInitializerPlugin);
                        }
                        _pluginChain = createTelemetryProxyChain(sortPlugins(extensions), _self.config, _self);
                    }
                    return _pluginChain;
                }
                function _removePlugins(thePlugins, unloadState, removeComplete) {
                    if (thePlugins && thePlugins.length > 0) {
                        var unloadChain = createTelemetryProxyChain(thePlugins, _self.config, _self);
                        var unloadCtx = createProcessTelemetryUnloadContext(unloadChain, _self);
                        unloadCtx.onComplete(function () {
                            var removed = false;
                            var newConfigExtensions = [];
                            arrForEach(_configExtensions, function (plugin, idx) {
                                if (!_isPluginPresent(plugin, thePlugins)) {
                                    newConfigExtensions.push(plugin);
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
                                            newQueue.push(channel);
                                        }
                                        else {
                                            removed = true;
                                        }
                                    });
                                    newChannelConfig.push(newQueue);
                                });
                                _channelConfig = newChannelConfig;
                            }
                            removeComplete && removeComplete(removed);
                        });
                        unloadCtx.processNext(unloadState);
                    }
                    else {
                        removeComplete(false);
                    }
                }
                function _flushInternalLogs() {
                    var queue = _self.logger ? _self.logger.queue : [];
                    if (queue) {
                        arrForEach(queue, function (logMessage) {
                            var item = {
                                name: _internalLogsEventName ? _internalLogsEventName : "InternalMessageId: " + logMessage.messageId,
                                iKey: _self.config.instrumentationKey,
                                time: toISOString(new Date()),
                                baseType: _InternalLogMessage.dataType,
                                baseData: { message: logMessage.message }
                            };
                            _self.track(item);
                        });
                        queue.length = 0;
                    }
                }
                function _flushChannels(isAsync, callBack, sendReason, cbTimeout) {
                    if (_channelControl) {
                        return _channelControl.flush(isAsync, callBack, sendReason || 6 , cbTimeout);
                    }
                    callBack && callBack(false);
                    return true;
                }
                function _initDebugListener(config) {
                    if (config.disableDbgExt === true && _debugListener) {
                        _notificationManager[strRemoveNotificationListener](_debugListener);
                        _debugListener = null;
                    }
                    if (_notificationManager && !_debugListener && config.disableDbgExt !== true) {
                        _debugListener = getDebugListener(config);
                        _notificationManager[strAddNotificationListener](_debugListener);
                    }
                }
                function _initPerfManager(config) {
                    if (!config.enablePerfMgr && _cfgPerfManager) {
                        _cfgPerfManager = null;
                    }
                    if (config.enablePerfMgr) {
                        setValue(_self.config, "createPerfMgr", _createPerfManager);
                    }
                }
                function _initExtConfig(config) {
                    var extConfig = getSetValue(config, strExtensionConfig);
                    extConfig.NotificationManager = _notificationManager;
                }
                function _doUpdate(updateState) {
                    var updateCtx = createProcessTelemetryUpdateContext(_getPluginChain(), _self);
                    if (!_self._updateHook || _self._updateHook(updateCtx, updateState) !== true) {
                        updateCtx.processNext(updateState);
                    }
                }
                function _logOrThrowError(message) {
                    var logger = _self.logger;
                    if (logger) {
                        _throwInternal(logger, 2 , 73 , message);
                    }
                    else {
                        throwError(message);
                    }
                }
            });
        }
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
                _self[strAddNotificationListener] = function (listener) {
                    _self.listeners.push(listener);
                };
                _self[strRemoveNotificationListener] = function (listener) {
                    var index = arrIndexOf(_self.listeners, listener);
                    while (index > -1) {
                        _self.listeners.splice(index, 1);
                        index = arrIndexOf(_self.listeners, listener);
                    }
                };
                _self[strEventsSent] = function (events) {
                    _runListeners(_self.listeners, strEventsSent, true, function (listener) {
                        listener[strEventsSent](events);
                    });
                };
                _self[strEventsDiscarded] = function (events, reason) {
                    _runListeners(_self.listeners, strEventsDiscarded, true, function (listener) {
                        listener[strEventsDiscarded](events, reason);
                    });
                };
                _self[strEventsSendRequest] = function (sendReason, isAsync) {
                    _runListeners(_self.listeners, strEventsSendRequest, isAsync, function (listener) {
                        listener[strEventsSendRequest](sendReason, isAsync);
                    });
                };
                _self[strPerfEvent] = function (perfEvent) {
                    if (perfEvent) {
                        if (perfEvtsSendAll || !perfEvent.isChildEvt()) {
                            _runListeners(_self.listeners, strPerfEvent, false, function (listener) {
                                if (perfEvent.isAsync) {
                                    setTimeout(function () { return listener[strPerfEvent](perfEvent); }, 0);
                                }
                                else {
                                    listener[strPerfEvent](perfEvent);
                                }
                            });
                        }
                    }
                };
            });
        }
        return NotificationManager;
    }());

    var AppInsightsCore = /** @class */ (function (_super) {
        __extendsFn(AppInsightsCore, _super);
        function AppInsightsCore() {
            var _this = _super.call(this) || this;
            dynamicProto(AppInsightsCore, _this, function (_self, _base) {
                _self.initialize = function (config, extensions, logger, notificationManager) {
                    _base.initialize(config, extensions, logger || new DiagnosticLogger(config), notificationManager || new NotificationManager(config));
                };
                _self.track = function (telemetryItem) {
                    doPerf(_self.getPerfMgr(), function () { return "AppInsightsCore:track"; }, function () {
                        if (telemetryItem === null) {
                            _notifyInvalidEvent(telemetryItem);
                            throwError("Invalid telemetry item");
                        }
                        _validateTelemetryItem(telemetryItem);
                        _base.track(telemetryItem);
                    }, function () { return ({ item: telemetryItem }); }, !(telemetryItem.sync));
                };
                function _validateTelemetryItem(telemetryItem) {
                    if (isNullOrUndefined(telemetryItem.name)) {
                        _notifyInvalidEvent(telemetryItem);
                        throwError("telemetry name required");
                    }
                }
                function _notifyInvalidEvent(telemetryItem) {
                    var manager = _self.getNotifyMgr();
                    if (manager) {
                        manager.eventsDiscarded([telemetryItem], 2 );
                    }
                }
            });
            return _this;
        }
        return AppInsightsCore;
    }(BaseCore));

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
        if (name && name.replace) {
            return name.replace(/^\s*\.*|\.*\s*$/g, "");
        }
        return name;
    }
    function _getEvtNamespace(eventName, evtNamespace) {
        if (evtNamespace) {
            var theNamespace_1 = "";
            if (isArray(evtNamespace)) {
                theNamespace_1 = "";
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
                eventName = (eventName || "") + theNamespace_1;
            }
        }
        var parsedEvent = (eventNamespace.exec(eventName || "") || []);
        return {
            type: parsedEvent[1],
            ns: ((parsedEvent[2] || "").replace(rRemoveEmptyNs, ".").replace(rRemoveTrailingEmptyNs, "").split(".").sort()).join(".")
        };
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
        if (obj && evtName && evtName.type) {
            if (obj[strRemoveEventListener]) {
                obj[strRemoveEventListener](evtName.type, handlerRef, useCapture);
            }
            else if (obj[strDetachEvent]) {
                obj[strDetachEvent](strOnPrefix + evtName.type, handlerRef);
            }
        }
    }
    function _doAttach(obj, evtName, handlerRef, useCapture) {
        var result = false;
        if (obj && evtName && evtName.type && handlerRef) {
            if (obj[strAddEventHelper]) {
                obj[strAddEventHelper](evtName.type, handlerRef, useCapture);
                result = true;
            }
            else if (obj[strAttachEvent]) {
                obj[strAttachEvent](strOnPrefix + evtName.type, handlerRef);
                result = true;
            }
        }
        return result;
    }
    function _doUnregister(target, events, evtName, unRegFn) {
        var idx = events.length;
        while (idx--) {
            var theEvent = events[idx];
            if (theEvent) {
                if (!evtName.ns || evtName.ns === theEvent.evtName.ns) {
                    if (!unRegFn || unRegFn(theEvent)) {
                        _doDetach(target, theEvent.evtName, theEvent.handler, theEvent.capture);
                        events.splice(idx, 1);
                    }
                }
            }
        }
    }
    function _unregisterEvents(target, evtName, unRegFn) {
        if (evtName.type) {
            _doUnregister(target, _getRegisteredEvents(target, evtName.type), evtName, unRegFn);
        }
        else {
            var eventCache = elmNodeData.get(target, strEvents, {});
            objForEachKey(eventCache, function (evtType, events) {
                _doUnregister(target, events, evtName, unRegFn);
            });
            if (objKeys(eventCache).length === 0) {
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
            newNamespaces = (_getEvtNamespace("xx", newNamespaces).ns).split(".");
        }
        else {
            newNamespaces = theNamespace;
        }
        return newNamespaces;
    }
    function eventOn(target, eventName, handlerRef, evtNamespace, useCapture) {
        if (useCapture === void 0) { useCapture = false; }
        var result = false;
        if (target) {
            try {
                var evtName = _getEvtNamespace(eventName, evtNamespace);
                result = _doAttach(target, evtName, handlerRef, useCapture);
                if (result && elmNodeData.accept(target)) {
                    var registeredEvent = {
                        guid: _guid++,
                        evtName: evtName,
                        handler: handlerRef,
                        capture: useCapture
                    };
                    _getRegisteredEvents(target, evtName.type).push(registeredEvent);
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
                    if ((evtName_1.ns && !handlerRef) || regEvent.handler === handlerRef) {
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
        if (listener && events && events.length > 0) {
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
            if (!added && excludeEvents && excludeEvents.length > 0) {
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
        function randomHexDigit() {
            return randomValue(15);
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(GuidRegex, function (c) {
            var r = (randomHexDigit() | 0), v = (c === "x" ? r : r & 0x3 | 0x8);
            return v.toString(16);
        });
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
        var oct = strEmpty$1, tmp;
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
        return oct.substr(0, 8) + oct.substr(9, 4) + "4" + oct.substr(13, 3) + clockSequenceHi + oct.substr(16, 3) + oct.substr(19, 12);
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
    var GuidRegex = /[xy]/g;
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
                    mgr.setEnabled(value);
                });
            });
        }
        if (arrIndexOf(_cookieMgrs, cookieMgr) === -1) {
            _cookieMgrs.push(cookieMgr);
        }
        if (isBoolean(legacyCanUseCookies)) {
            cookieMgr.setEnabled(legacyCanUseCookies);
        }
        if (isBoolean(_canUseCookies)) {
            cookieMgr.setEnabled(_canUseCookies);
        }
        return cookieMgr;
    }
    function disableCookies() {
        _legacyCookieMgr().setEnabled(false);
    }

    var aiInstrumentHooks = "_aiHooks";
    var cbNames = [
        "req", "rsp", "hkErr", "fnErr"
    ];
    function _arrLoop(arr, fn) {
        if (arr) {
            for (var lp = 0; lp < arr.length; lp++) {
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
                        cb.apply(callDetails.inst, cbArgs);
                    }
                    catch (err) {
                        var orgEx = callDetails.err;
                        try {
                            var hookErrorCb = cbks[cbNames[2 ]];
                            if (hookErrorCb) {
                                callDetails.err = err;
                                hookErrorCb.apply(callDetails.inst, cbArgs);
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
            var funcThis = this;
            var orgArgs = arguments;
            var hooks = aiHook.h;
            var funcArgs = {
                name: aiHook.n,
                inst: funcThis,
                ctx: null,
                set: _replaceArg
            };
            var hookCtx = [];
            var cbArgs = _createArgs([funcArgs], orgArgs);
            funcArgs.evt = getGlobalInst("event");
            function _createArgs(target, theArgs) {
                _arrLoop(theArgs, function (arg) {
                    target.push(arg);
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
                    funcArgs.rslt = theFunc.apply(funcThis, orgArgs);
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
                        aiHook.h.splice(idx, 1);
                        return 1;
                    }
                });
            }
        };
        aiHook.i++;
        aiHook.h.push(theHook);
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

    function dataSanitizeKeyAndAddUniqueness(logger, key, map) {
        var origLength = key.length;
        var field = dataSanitizeKey(logger, key);
        if (field.length !== origLength) {
            var i = 0;
            var uniqueField = field;
            while (map[uniqueField] !== undefined) {
                i++;
                uniqueField = field.substring(0, 150  - 3) + dsPadNumber(i);
            }
            field = uniqueField;
        }
        return field;
    }
    function dataSanitizeKey(logger, name) {
        var nameTrunc;
        if (name) {
            name = strTrim(name.toString());
            if (name.length > 150 ) {
                nameTrunc = name.substring(0, 150 );
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
            if (value.toString().length > maxLength) {
                valueTrunc = value.toString().substring(0, maxLength);
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
            if (message.length > 32768 ) {
                messageTrunc = message.substring(0, 32768 );
                _throwInternal(logger, 2 , 56 , "message is too long, it has been truncated to " + 32768  + " characters.", { message: message }, true);
            }
        }
        return messageTrunc || message;
    }
    function dataSanitizeException(logger, exception) {
        var exceptionTrunc;
        if (exception) {
            var value = "" + exception;
            if (value.length > 32768 ) {
                exceptionTrunc = value.substring(0, 32768 );
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
                        value = getJSON().stringify(value);
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
        return id ? dataSanitizeInput(logger, id, 128 , 69 ).toString() : id;
    }
    function dataSanitizeInput(logger, input, maxLength, _msgId) {
        var inputTrunc;
        if (input) {
            input = strTrim(input);
            if (input.length > maxLength) {
                inputTrunc = input.substring(0, maxLength);
                _throwInternal(logger, 2 , _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
            }
        }
        return inputTrunc || input;
    }
    function dsPadNumber(num) {
        var s = "00" + num;
        return s.substr(s.length - 3);
    }

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

    var strEmpty = "";
    function stringToBoolOrDefault(str, defaultValue) {
        if (defaultValue === void 0) { defaultValue = false; }
        if (str === undefined || str === null) {
            return defaultValue;
        }
        return str.toString().toLowerCase() === "true";
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
        ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
        sec = sec.length < 2 ? "0" + sec : sec;
        min = min.length < 2 ? "0" + min : min;
        hour = hour.length < 2 ? "0" + hour : hour;
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

    var DisabledPropertyName = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
    var SampleRate = "sampleRate";
    var ProcessLegacy = "ProcessLegacy";
    var HttpMethod = "http.method";
    var DEFAULT_BREEZE_ENDPOINT = "https://dc.services.visualstudio.com";
    var strNotSpecified = "not_specified";
    var strIkey = "iKey";

    var StorageType = createEnumStyle({
        LocalStorage: 0 ,
        SessionStorage: 1
    });
    createEnumStyle({
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
            var uid = (new Date).toString();
            var storage = getGlobalInst(storageType === StorageType.LocalStorage ? "localStorage" : "sessionStorage");
            storage.setItem(uid, uid);
            var fail = storage.getItem(uid) !== uid;
            storage.removeItem(uid);
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
                storage.removeItem(name);
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
                storage.removeItem(name);
                return true;
            }
            catch (e) {
                _canUseSessionStorage = false;
                _throwInternal(logger, 2 , 6 , "Browser failed removal of session storage item. " + getExceptionName(e), { exception: dumpObj(e) });
            }
        }
        return false;
    }

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
        if (anchorIdx >= anchorCache.length) {
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
    function urlGetCompleteUrl(method, absoluteUrl) {
        if (method) {
            return method.toUpperCase() + " " + absoluteUrl;
        }
        return absoluteUrl;
    }
    function urlParseHost(url, inclPort) {
        var fullHost = urlParseFullHost(url, inclPort) || "";
        if (fullHost) {
            var match = fullHost.match(/(www[0-9]?\.)?(.[^/:]+)(\:[\d]+)?/i);
            if (match != null && match.length > 3 && isString(match[2]) && match[2].length > 0) {
                return match[2] + (match[3] || "");
            }
        }
        return fullHost;
    }
    function urlParseFullHost(url, inclPort) {
        var result = null;
        if (url) {
            var match = url.match(/(\w*):\/\/(.[^/:]+)(\:[\d]+)?/i);
            if (match != null && match.length > 2 && isString(match[2]) && match[2].length > 0) {
                result = match[2] || "";
                if (inclPort && match.length > 2) {
                    var protocol = (match[1] || "").toLowerCase();
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
        "https://dc.services.visualstudio.com/v2/track",
        "https://breeze.aimon.applicationinsights.io/v2/track",
        "https://dc-int.services.visualstudio.com/v2/track"
    ];
    function isInternalApplicationInsightsEndpoint(endpointUrl) {
        return arrIndexOf(_internalEndpoints, endpointUrl.toLowerCase()) !== -1;
    }
    var CorrelationIdHelper = {
        correlationIdPrefix: "cid-v1:",
        canIncludeCorrelationHeader: function (config, requestUrl, currentHost) {
            if (!requestUrl || (config && config.disableCorrelationHeaders)) {
                return false;
            }
            if (config && config.correlationHeaderExcludePatterns) {
                for (var i = 0; i < config.correlationHeaderExcludePatterns.length; i++) {
                    if (config.correlationHeaderExcludePatterns[i].test(requestUrl)) {
                        return false;
                    }
                }
            }
            var requestHost = urlParseUrl(requestUrl).host.toLowerCase();
            if (requestHost && (requestHost.indexOf(":443") !== -1 || requestHost.indexOf(":80") !== -1)) {
                requestHost = (urlParseFullHost(requestUrl, true) || "").toLowerCase();
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
            if (!excludedDomains || excludedDomains.length === 0) {
                return true;
            }
            for (var i = 0; i < excludedDomains.length; i++) {
                var regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
                if (regex.test(requestHost)) {
                    return false;
                }
            }
            return requestHost && requestHost.length > 0;
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
                var keyValues = responseHeader.split(",");
                for (var i = 0; i < keyValues.length; ++i) {
                    var keyValue = keyValues[i].split("=");
                    if (keyValue.length === 2 && keyValue[0] === key) {
                        return keyValue[1];
                    }
                }
            }
        }
    };
    function AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName) {
        var target, name = commandName, data = commandName;
        if (absoluteUrl && absoluteUrl.length > 0) {
            var parsedUrl = urlParseUrl(absoluteUrl);
            target = parsedUrl.host;
            if (!name) {
                if (parsedUrl.pathname != null) {
                    var pathName = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== "/") {
                        pathName = "/" + pathName;
                    }
                    data = parsedUrl.pathname;
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

    var _FIELDS_SEPARATOR = ";";
    var _FIELD_KEY_VALUE_SEPARATOR = "=";
    function parseConnectionString(connectionString) {
        if (!connectionString) {
            return {};
        }
        var kvPairs = connectionString.split(_FIELDS_SEPARATOR);
        var result = arrReduce(kvPairs, function (fields, kv) {
            var kvParts = kv.split(_FIELD_KEY_VALUE_SEPARATOR);
            if (kvParts.length === 2) {
                var key = kvParts[0].toLowerCase();
                var value = kvParts[1];
                fields[key] = value;
            }
            return fields;
        }, {});
        if (objKeys(result).length > 0) {
            if (result.endpointsuffix) {
                var locationPrefix = result.location ? result.location + "." : "";
                result.ingestionendpoint = result.ingestionendpoint || ("https://" + locationPrefix + "dc." + result.endpointsuffix);
            }
            result.ingestionendpoint = result.ingestionendpoint || DEFAULT_BREEZE_ENDPOINT;
        }
        return result;
    }

    var Envelope = /** @class */ (function () {
        function Envelope(logger, data, name) {
            var _this = this;
            var _self = this;
            _self.ver = 1;
            _self.sampleRate = 100.0;
            _self.tags = {};
            _self.name = dataSanitizeString(logger, name) || strNotSpecified;
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
            _self.name = dataSanitizeString(logger, name) || strNotSpecified;
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
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
            if (JSON && JSON.stringify) {
                result = JSON.stringify(value);
                if (convertToString && (!result || result === "{}")) {
                    if (isFunction(value.toString)) {
                        result = value.toString();
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
        if (errorType && errorType !== "String" && errorType !== "Object" && errorType !== "Error" && (evtMessage || "").indexOf(errorType) === -1) {
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
        var items = src.split("\n");
        return {
            src: src,
            obj: items
        };
    }
    function _getOperaStack(errorMessage) {
        var stack = [];
        var lines = errorMessage.split("\n");
        for (var lp = 0; lp < lines.length; lp++) {
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
                    details = _getOperaStack(errorObj.message);
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
        if (frames && frames.length > 0) {
            parsedStack = [];
            var level_1 = 0;
            var totalSizeInBytes_1 = 0;
            arrForEach(frames, function (frame) {
                var theFrame = frame.toString();
                if (_StackFrame.regex.test(theFrame)) {
                    var parsedFrame = new _StackFrame(theFrame, level_1++);
                    totalSizeInBytes_1 += parsedFrame.sizeInBytes;
                    parsedStack.push(parsedFrame);
                }
            });
            var exceptionParsedStackThreshold = 32 * 1024;
            if (totalSizeInBytes_1 > exceptionParsedStackThreshold) {
                var left = 0;
                var right = parsedStack.length - 1;
                var size = 0;
                var acceptedLeft = left;
                var acceptedRight = right;
                while (left < right) {
                    var lSize = parsedStack[left].sizeInBytes;
                    var rSize = parsedStack[right].sizeInBytes;
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
            typeName = errorType.typeName || errorType.name || "";
            if (!typeName) {
                try {
                    var funcNameRegex = /function (.{1,200})\(/;
                    var results = (funcNameRegex).exec((errorType).constructor.toString());
                    typeName = (results && results.length > 1) ? results[1] : "";
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
                    if (result.indexOf(errorType) !== 0 && errorType !== "String") {
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
                _self.exceptions = [new _ExceptionDetails(logger, exception, properties)];
                _self.properties = dataSanitizeProperties(logger, properties);
                _self.measurements = dataSanitizeMeasurements(logger, measurements);
                if (severityLevel) {
                    _self.severityLevel = severityLevel;
                }
                if (id) {
                    _self.id = id;
                }
            }
            else {
                _self.exceptions = exception.exceptions || [];
                _self.properties = exception.properties;
                _self.measurements = exception.measurements;
                if (exception.severityLevel) {
                    _self.severityLevel = exception.severityLevel;
                }
                if (exception.id) {
                    _self.id = exception.id;
                }
                if (exception.problemGroup) {
                    _self.problemGroup = exception.problemGroup;
                }
                if (!isNullOrUndefined(exception.isManual)) {
                    _self.isManual = exception.isManual;
                }
            }
        }
        Exception.CreateAutoException = function (message, url, lineNumber, columnNumber, error, evt, stack, errorSrc) {
            var errorType = _getErrorType(error || evt || message);
            return {
                message: _formatMessage(message, errorType),
                url: url,
                lineNumber: lineNumber,
                columnNumber: columnNumber,
                error: _formatErrorCode(error || evt || message),
                evt: _formatErrorCode(evt || message),
                typeName: errorType,
                stackDetails: _getStackFromErrorObj(stack || error || evt),
                errorSrc: errorSrc
            };
        };
        Exception.CreateFromInterface = function (logger, exception, properties, measurements) {
            var exceptions = exception.exceptions
                && arrMap(exception.exceptions, function (ex) { return _ExceptionDetails.CreateFromInterface(logger, ex); });
            var exceptionData = new Exception(logger, __assignFn(__assignFn({}, exception), { exceptions: exceptions }), properties, measurements);
            return exceptionData;
        };
        Exception.prototype.toInterface = function () {
            var _a = this, exceptions = _a.exceptions, properties = _a.properties, measurements = _a.measurements, severityLevel = _a.severityLevel, problemGroup = _a.problemGroup, id = _a.id, isManual = _a.isManual;
            var exceptionDetailsInterface = exceptions instanceof Array
                && arrMap(exceptions, function (exception) { return exception.toInterface(); })
                || undefined;
            return {
                ver: "4.0",
                exceptions: exceptionDetailsInterface,
                severityLevel: severityLevel,
                properties: properties,
                measurements: measurements,
                problemGroup: problemGroup,
                id: id,
                isManual: isManual
            };
        };
        Exception.CreateSimpleException = function (message, typeName, assembly, fileName, details, line) {
            return {
                exceptions: [
                    {
                        hasFullStack: true,
                        message: message,
                        stack: details,
                        typeName: typeName
                    }
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
                _self.typeName = dataSanitizeString(logger, _getErrorType(error)) || strNotSpecified;
                _self.message = dataSanitizeMessage(logger, _formatMessage(exception || error, _self.typeName)) || strNotSpecified;
                var stack = exception[strStackDetails] || _getStackFromErrorObj(exception);
                _self.parsedStack = _parseStack(stack);
                _self[strStack] = dataSanitizeException(logger, _formatStackTrace(stack));
                _self.hasFullStack = isArray(_self.parsedStack) && _self.parsedStack.length > 0;
                if (properties) {
                    properties.typeName = properties.typeName || _self.typeName;
                }
            }
            else {
                _self.typeName = exception.typeName;
                _self.message = exception.message;
                _self[strStack] = exception[strStack];
                _self.parsedStack = exception.parsedStack || [];
                _self.hasFullStack = exception.hasFullStack;
            }
        }
        _ExceptionDetails.prototype.toInterface = function () {
            var _self = this;
            var parsedStack = _self.parsedStack instanceof Array
                && arrMap(_self.parsedStack, function (frame) { return frame.toInterface(); });
            var exceptionDetailsInterface = {
                id: _self.id,
                outerId: _self.outerId,
                typeName: _self.typeName,
                message: _self.message,
                hasFullStack: _self.hasFullStack,
                stack: _self[strStack],
                parsedStack: parsedStack || undefined
            };
            return exceptionDetailsInterface;
        };
        _ExceptionDetails.CreateFromInterface = function (logger, exception) {
            var parsedStack = (exception.parsedStack instanceof Array
                && arrMap(exception.parsedStack, function (frame) { return _StackFrame.CreateFromInterface(frame); }))
                || exception.parsedStack;
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
            _self.sizeInBytes = 0;
            if (typeof sourceFrame === "string") {
                var frame = sourceFrame;
                _self.level = level;
                _self.method = NoMethod;
                _self.assembly = strTrim(frame);
                _self.fileName = "";
                _self.line = 0;
                var matches = frame.match(_StackFrame.regex);
                if (matches && matches.length >= 5) {
                    _self.method = strTrim(matches[2]) || _self.method;
                    _self.fileName = strTrim(matches[4]);
                    _self.line = parseInt(matches[5]) || 0;
                }
            }
            else {
                _self.level = sourceFrame.level;
                _self.method = sourceFrame.method;
                _self.assembly = sourceFrame.assembly;
                _self.fileName = sourceFrame.fileName;
                _self.line = sourceFrame.line;
                _self.sizeInBytes = 0;
            }
            _self.sizeInBytes += _self.method.length;
            _self.sizeInBytes += _self.fileName.length;
            _self.sizeInBytes += _self.assembly.length;
            _self.sizeInBytes += _StackFrame.baseSize;
            _self.sizeInBytes += _self.level.toString().length;
            _self.sizeInBytes += _self.line.toString().length;
        }
        _StackFrame.CreateFromInterface = function (frame) {
            return new _StackFrame(frame, null );
        };
        _StackFrame.prototype.toInterface = function () {
            var _self = this;
            return {
                level: _self.level,
                method: _self.method,
                assembly: _self.assembly,
                fileName: _self.fileName,
                line: _self.line
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
            dataPoint.count = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint.name = dataSanitizeString(logger, name) || strNotSpecified;
            dataPoint.value = value;
            dataPoint.stdDev = isNaN(stdDev) || stdDev === null ? undefined : stdDev;
            _self.metrics = [dataPoint];
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
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
            _self.name = dataSanitizeString(logger, name) || strNotSpecified;
            if (!isNaN(durationMs)) {
                _self.duration = msToTimeSpan(durationMs);
            }
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
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
            _self.duration = msToTimeSpan(value);
            _self.success = success;
            _self.resultCode = resultCode + "";
            _self.type = dataSanitizeString(logger, requestAPI);
            var dependencyFields = AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName);
            _self.data = dataSanitizeUrl(logger, commandName) || dependencyFields.data;
            _self.target = dataSanitizeString(logger, dependencyFields.target);
            if (correlationContext) {
                _self.target = "".concat(_self.target, " | ").concat(correlationContext);
            }
            _self.name = dataSanitizeString(logger, dependencyFields.name);
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
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
            _self.message = dataSanitizeMessage(logger, message);
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
            if (severityLevel) {
                _self.severityLevel = severityLevel;
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
            _self.name = dataSanitizeString(logger, name) || strNotSpecified;
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
            if (cs4BaseData) {
                _self.domProcessing = cs4BaseData.domProcessing;
                _self.duration = cs4BaseData.duration;
                _self.networkConnect = cs4BaseData.networkConnect;
                _self.perfTotal = cs4BaseData.perfTotal;
                _self.receivedResponse = cs4BaseData.receivedResponse;
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
        var telemetryItem = {
            name: envelopeName,
            time: toISOString(new Date()),
            iKey: iKey,
            ext: systemProperties ? systemProperties : {},
            tags: [],
            data: {},
            baseType: baseType,
            baseData: item
        };
        if (!isNullOrUndefined(customProperties)) {
            objForEachKey(customProperties, function (prop, value) {
                telemetryItem.data[prop] = value;
            });
        }
        return telemetryItem;
    }

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

    var DEFAULT_VERSION = "00";
    var INVALID_VERSION = "ff";
    var INVALID_TRACE_ID = "00000000000000000000000000000000";
    var INVALID_SPAN_ID = "0000000000000000";
    function _isValid(value, len, invalidValue) {
        if (value && value.length === len && value !== invalidValue) {
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
        while (result.length < 2) {
            result = "0" + result;
        }
        return result;
    }
    function createTraceParent(traceId, spanId, flags, version) {
        return {
            version: _isValid(version, 2, INVALID_VERSION) ? version : DEFAULT_VERSION,
            traceId: isValidTraceId(traceId) ? traceId : generateW3CId(),
            spanId: isValidSpanId(spanId) ? spanId : generateW3CId().substr(0, 16),
            traceFlags: flags >= 0 && flags <= 0xFF ? flags : 1
        };
    }
    function isValidTraceId(value) {
        return _isValid(value, 32, INVALID_TRACE_ID);
    }
    function isValidSpanId(value) {
        return _isValid(value, 16, INVALID_SPAN_ID);
    }
    function formatTraceParent(value) {
        if (value) {
            var flags = _formatFlags(value.traceFlags);
            if (!_isValid(flags, 2)) {
                flags = "01";
            }
            var version = value.version || DEFAULT_VERSION;
            if (version !== "00" && version !== "ff") {
                version = DEFAULT_VERSION;
            }
            return "".concat(version, "-").concat(_formatValue(value.traceId, 32, INVALID_TRACE_ID), "-").concat(_formatValue(value.spanId, 16, INVALID_SPAN_ID), "-").concat(flags);
        }
        return "";
    }

    var PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
    var BreezeChannelIdentifier = "AppInsightsChannelPlugin";
    var AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";

    var _ignoreUpdateSnippetProperties$1 = [
        "snippet", "getDefaultConfig", "_hasLegacyInitializers", "_queue", "_processLegacyInitializers"
    ];
    var AppInsightsDeprecated = /** @class */ (function () {
        function AppInsightsDeprecated(snippet, appInsightsNew) {
            this._hasLegacyInitializers = false;
            this._queue = [];
            this.config = AppInsightsDeprecated.getDefaultConfig(snippet.config);
            this.appInsightsNew = appInsightsNew;
            this.context = { addTelemetryInitializer: this.addTelemetryInitializers.bind(this) };
        }
        AppInsightsDeprecated.getDefaultConfig = function (config) {
            if (!config) {
                config = {};
            }
            config.endpointUrl = config.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
            config.sessionRenewalMs = 30 * 60 * 1000;
            config.sessionExpirationMs = 24 * 60 * 60 * 1000;
            config.maxBatchSizeInBytes = config.maxBatchSizeInBytes > 0 ? config.maxBatchSizeInBytes : 102400;
            config.maxBatchInterval = !isNaN(config.maxBatchInterval) ? config.maxBatchInterval : 15000;
            config.enableDebug = stringToBoolOrDefault(config.enableDebug);
            config.disableExceptionTracking = stringToBoolOrDefault(config.disableExceptionTracking);
            config.disableTelemetry = stringToBoolOrDefault(config.disableTelemetry);
            config.verboseLogging = stringToBoolOrDefault(config.verboseLogging);
            config.emitLineDelimitedJson = stringToBoolOrDefault(config.emitLineDelimitedJson);
            config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
            config.autoTrackPageVisitTime = stringToBoolOrDefault(config.autoTrackPageVisitTime);
            if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
                config.samplingPercentage = 100;
            }
            config.disableAjaxTracking = stringToBoolOrDefault(config.disableAjaxTracking);
            config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;
            config.isBeaconApiDisabled = stringToBoolOrDefault(config.isBeaconApiDisabled, true);
            config.disableCorrelationHeaders = stringToBoolOrDefault(config.disableCorrelationHeaders);
            config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || [
                "*.blob.core.windows.net",
                "*.blob.core.chinacloudapi.cn",
                "*.blob.core.cloudapi.de",
                "*.blob.core.usgovcloudapi.net"
            ];
            config.disableFlushOnBeforeUnload = stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
            config.disableFlushOnUnload = stringToBoolOrDefault(config.disableFlushOnUnload, config.disableFlushOnBeforeUnload);
            config.enableSessionStorageBuffer = stringToBoolOrDefault(config.enableSessionStorageBuffer, true);
            config.isRetryDisabled = stringToBoolOrDefault(config.isRetryDisabled);
            config.isCookieUseDisabled = stringToBoolOrDefault(config.isCookieUseDisabled);
            config.isStorageUseDisabled = stringToBoolOrDefault(config.isStorageUseDisabled);
            config.isBrowserLinkTrackingEnabled = stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
            config.enableCorsCorrelation = stringToBoolOrDefault(config.enableCorsCorrelation);
            return config;
        };
        AppInsightsDeprecated.prototype.addTelemetryInitializers = function (callBack) {
            var _this = this;
            if (!this._hasLegacyInitializers) {
                this.appInsightsNew.addTelemetryInitializer(function (item) {
                    _this._processLegacyInitializers(item);
                });
                this._hasLegacyInitializers = true;
            }
            this._queue.push(callBack);
        };
        AppInsightsDeprecated.prototype.getCookieMgr = function () {
            return this.appInsightsNew.getCookieMgr();
        };
        AppInsightsDeprecated.prototype.startTrackPage = function (name) {
            this.appInsightsNew.startTrackPage(name);
        };
        AppInsightsDeprecated.prototype.stopTrackPage = function (name, url, properties, measurements) {
            this.appInsightsNew.stopTrackPage(name, url, properties);
        };
        AppInsightsDeprecated.prototype.trackPageView = function (name, url, properties, measurements, duration) {
            var telemetry = {
                name: name,
                uri: url,
                properties: properties,
                measurements: measurements
            };
            this.appInsightsNew.trackPageView(telemetry);
        };
        AppInsightsDeprecated.prototype.trackEvent = function (name, properties, measurements) {
            this.appInsightsNew.trackEvent({ name: name });
        };
        AppInsightsDeprecated.prototype.trackDependency = function (id, method, absoluteUrl, pathName, totalTime, success, resultCode) {
            this.appInsightsNew.trackDependencyData({
                id: id,
                target: absoluteUrl,
                type: pathName,
                duration: totalTime,
                properties: { HttpMethod: method },
                success: success,
                responseCode: resultCode
            });
        };
        AppInsightsDeprecated.prototype.trackException = function (exception, handledAt, properties, measurements, severityLevel) {
            this.appInsightsNew.trackException({
                exception: exception
            });
        };
        AppInsightsDeprecated.prototype.trackMetric = function (name, average, sampleCount, min, max, properties) {
            this.appInsightsNew.trackMetric({ name: name, average: average, sampleCount: sampleCount, min: min, max: max });
        };
        AppInsightsDeprecated.prototype.trackTrace = function (message, properties, severityLevel) {
            this.appInsightsNew.trackTrace({ message: message, severityLevel: severityLevel });
        };
        AppInsightsDeprecated.prototype.flush = function (async) {
            this.appInsightsNew.flush(async);
        };
        AppInsightsDeprecated.prototype.setAuthenticatedUserContext = function (authenticatedUserId, accountId, storeInCookie) {
            this.appInsightsNew.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
        };
        AppInsightsDeprecated.prototype.clearAuthenticatedUserContext = function () {
            this.appInsightsNew.context.user.clearAuthenticatedUserContext();
        };
        AppInsightsDeprecated.prototype._onerror = function (message, url, lineNumber, columnNumber, error) {
            this.appInsightsNew._onerror({ message: message, url: url, lineNumber: lineNumber, columnNumber: columnNumber, error: error });
        };
        AppInsightsDeprecated.prototype.startTrackEvent = function (name) {
            this.appInsightsNew.startTrackEvent(name);
        };
        AppInsightsDeprecated.prototype.stopTrackEvent = function (name, properties, measurements) {
            this.appInsightsNew.stopTrackEvent(name, properties, measurements);
        };
        AppInsightsDeprecated.prototype.downloadAndSetup = function (config) {
            throwError("downloadAndSetup not implemented in web SKU");
        };
        AppInsightsDeprecated.prototype.updateSnippetDefinitions = function (snippet) {
            proxyAssign(snippet, this, function (name) {
                return name && arrIndexOf(_ignoreUpdateSnippetProperties$1, name) === -1;
            });
        };
        AppInsightsDeprecated.prototype.loadAppInsights = function () {
            var _this = this;
            if (this.config["iKey"]) {
                var originalTrackPageView_1 = this.trackPageView;
                this.trackPageView = function (pagePath, properties, measurements) {
                    originalTrackPageView_1.apply(_this, [null, pagePath, properties, measurements]);
                };
            }
            var legacyPageView = "logPageView";
            if (typeof this.snippet[legacyPageView] === "function") {
                this[legacyPageView] = function (pagePath, properties, measurements) {
                    _this.trackPageView(null, pagePath, properties, measurements);
                };
            }
            var legacyEvent = "logEvent";
            if (typeof this.snippet[legacyEvent] === "function") {
                this[legacyEvent] = function (name, props, measurements) {
                    _this.trackEvent(name, props, measurements);
                };
            }
            return this;
        };
        AppInsightsDeprecated.prototype._processLegacyInitializers = function (item) {
            item.tags[ProcessLegacy] = this._queue;
            return item;
        };
        return AppInsightsDeprecated;
    }());

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
                            if (itemQueue.length === 0) {
                                clearInterval(intervalHandle);
                                intervalHandle = null;
                            }
                            if (doFlush) {
                                _flushChannels(true);
                            }
                        }), 100);
                    }
                }
                _self.trackPageView = function (pageView, customProperties) {
                    var name = pageView.name;
                    if (isNullOrUndefined(name) || typeof name !== "string") {
                        var doc = getDocument();
                        name = pageView.name = doc && doc.title || "";
                    }
                    var uri = pageView.uri;
                    if (isNullOrUndefined(uri) || typeof uri !== "string") {
                        var location_1 = getLocation();
                        uri = pageView.uri = location_1 && location_1.href || "";
                    }
                    if (!pageViewPerformanceManager.isPerformanceTimingSupported()) {
                        appInsights.sendPageViewInternal(pageView, customProperties);
                        _flushChannels(true);
                        _throwInternal(_logger, 2 , 25 , "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                        return;
                    }
                    var pageViewSent = false;
                    var customDuration;
                    var start = pageViewPerformanceManager.getPerformanceTiming().navigationStart;
                    if (start > 0) {
                        customDuration = dateTimeUtilsDuration(start, +new Date);
                        if (!pageViewPerformanceManager.shouldCollectDuration(customDuration)) {
                            customDuration = undefined;
                        }
                    }
                    var duration;
                    if (!isNullOrUndefined(customProperties) &&
                        !isNullOrUndefined(customProperties.duration)) {
                        duration = customProperties.duration;
                    }
                    if (overridePageViewDuration || !isNaN(duration)) {
                        if (isNaN(duration)) {
                            if (!customProperties) {
                                customProperties = {};
                            }
                            customProperties["duration"] = customDuration;
                        }
                        appInsights.sendPageViewInternal(pageView, customProperties);
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
                            if (pageViewPerformanceManager.isPerformanceTimingDataReady()) {
                                processed = true;
                                var pageViewPerformance = {
                                    name: name,
                                    uri: uri
                                };
                                pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);
                                if (!pageViewPerformance.isValid && !pageViewSent) {
                                    customProperties["duration"] = customDuration;
                                    appInsights.sendPageViewInternal(pageView, customProperties);
                                }
                                else {
                                    if (!pageViewSent) {
                                        customProperties["duration"] = pageViewPerformance.durationMs;
                                        appInsights.sendPageViewInternal(pageView, customProperties);
                                    }
                                    if (!pageViewPerformanceSent) {
                                        appInsights.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
                                        pageViewPerformanceSent = true;
                                    }
                                }
                            }
                            else if (start > 0 && dateTimeUtilsDuration(start, +new Date) > maxDurationLimit) {
                                processed = true;
                                if (!pageViewSent) {
                                    customProperties["duration"] = maxDurationLimit;
                                    appInsights.sendPageViewInternal(pageView, customProperties);
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
        return PageViewManager;
    }());

    var PageVisitTimeManager = /** @class */ (function () {
        function PageVisitTimeManager(logger, pageVisitTimeTrackingHandler) {
            this.prevPageVisitDataKeyName = "prevPageVisitData";
            this.pageVisitTimeTrackingHandler = pageVisitTimeTrackingHandler;
            this._logger = logger;
        }
        PageVisitTimeManager.prototype.trackPreviousPageVisit = function (currentPageName, currentPageUrl) {
            try {
                var prevPageVisitTimeData = this.restartPageVisitTimer(currentPageName, currentPageUrl);
                if (prevPageVisitTimeData) {
                    this.pageVisitTimeTrackingHandler(prevPageVisitTimeData.pageName, prevPageVisitTimeData.pageUrl, prevPageVisitTimeData.pageVisitTime);
                }
            }
            catch (e) {
                _warnToConsole(this._logger, "Auto track page visit time failed, metric will not be collected: " + dumpObj(e));
            }
        };
        PageVisitTimeManager.prototype.restartPageVisitTimer = function (pageName, pageUrl) {
            try {
                var prevPageVisitData = this.stopPageVisitTimer();
                this.startPageVisitTimer(pageName, pageUrl);
                return prevPageVisitData;
            }
            catch (e) {
                _warnToConsole(this._logger, "Call to restart failed: " + dumpObj(e));
                return null;
            }
        };
        PageVisitTimeManager.prototype.startPageVisitTimer = function (pageName, pageUrl) {
            try {
                if (utlCanUseSessionStorage()) {
                    if (utlGetSessionStorage(this._logger, this.prevPageVisitDataKeyName) != null) {
                        throwError("Cannot call startPageVisit consecutively without first calling stopPageVisit");
                    }
                    var currPageVisitData = new PageVisitData(pageName, pageUrl);
                    var currPageVisitDataStr = getJSON().stringify(currPageVisitData);
                    utlSetSessionStorage(this._logger, this.prevPageVisitDataKeyName, currPageVisitDataStr);
                }
            }
            catch (e) {
                _warnToConsole(this._logger, "Call to start failed: " + dumpObj(e));
            }
        };
        PageVisitTimeManager.prototype.stopPageVisitTimer = function () {
            try {
                if (utlCanUseSessionStorage()) {
                    var pageVisitEndTime = dateNow();
                    var pageVisitDataJsonStr = utlGetSessionStorage(this._logger, this.prevPageVisitDataKeyName);
                    if (pageVisitDataJsonStr && hasJSON()) {
                        var prevPageVisitData = getJSON().parse(pageVisitDataJsonStr);
                        prevPageVisitData.pageVisitTime = pageVisitEndTime - prevPageVisitData.pageVisitStartTime;
                        utlRemoveSessionStorage(this._logger, this.prevPageVisitDataKeyName);
                        return prevPageVisitData;
                    }
                    else {
                        return null;
                    }
                }
                return null;
            }
            catch (e) {
                _warnToConsole(this._logger, "Stop page visit timer failed: " + dumpObj(e));
                return null;
            }
        };
        return PageVisitTimeManager;
    }());
    var PageVisitData = /** @class */ (function () {
        function PageVisitData(pageName, pageUrl) {
            this.pageVisitStartTime = dateNow();
            this.pageName = pageName;
            this.pageUrl = pageUrl;
        }
        return PageVisitData;
    }());

    var PageViewPerformanceManager = /** @class */ (function () {
        function PageViewPerformanceManager(core) {
            this.MAX_DURATION_ALLOWED = 3600000;
            if (core) {
                this._logger = core.logger;
            }
        }
        PageViewPerformanceManager.prototype.populatePageViewPerformanceEvent = function (pageViewPerformance) {
            pageViewPerformance.isValid = false;
            var navigationTiming = this.getPerformanceNavigationTiming();
            var timing = this.getPerformanceTiming();
            var total = 0;
            var network = 0;
            var request = 0;
            var response = 0;
            var dom = 0;
            if (navigationTiming || timing) {
                if (navigationTiming) {
                    total = navigationTiming.duration;
                    network = navigationTiming.startTime === 0 ? navigationTiming.connectEnd : dateTimeUtilsDuration(navigationTiming.startTime, navigationTiming.connectEnd);
                    request = dateTimeUtilsDuration(navigationTiming.requestStart, navigationTiming.responseStart);
                    response = dateTimeUtilsDuration(navigationTiming.responseStart, navigationTiming.responseEnd);
                    dom = dateTimeUtilsDuration(navigationTiming.responseEnd, navigationTiming.loadEventEnd);
                }
                else {
                    total = dateTimeUtilsDuration(timing.navigationStart, timing.loadEventEnd);
                    network = dateTimeUtilsDuration(timing.navigationStart, timing.connectEnd);
                    request = dateTimeUtilsDuration(timing.requestStart, timing.responseStart);
                    response = dateTimeUtilsDuration(timing.responseStart, timing.responseEnd);
                    dom = dateTimeUtilsDuration(timing.responseEnd, timing.loadEventEnd);
                }
                var logger = this._logger;
                if (total === 0) {
                    _throwInternal(logger, 2 , 10 , "error calculating page view performance.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (!this.shouldCollectDuration(total, network, request, response, dom)) {
                    _throwInternal(logger, 2 , 45 , "Invalid page load duration value. Browser perf data won't be sent.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                    _throwInternal(logger, 2 , 8 , "client performance math error.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else {
                    pageViewPerformance.durationMs = total;
                    pageViewPerformance.perfTotal = pageViewPerformance.duration = msToTimeSpan(total);
                    pageViewPerformance.networkConnect = msToTimeSpan(network);
                    pageViewPerformance.sentRequest = msToTimeSpan(request);
                    pageViewPerformance.receivedResponse = msToTimeSpan(response);
                    pageViewPerformance.domProcessing = msToTimeSpan(dom);
                    pageViewPerformance.isValid = true;
                }
            }
        };
        PageViewPerformanceManager.prototype.getPerformanceTiming = function () {
            if (this.isPerformanceTimingSupported()) {
                return getPerformance().timing;
            }
            return null;
        };
        PageViewPerformanceManager.prototype.getPerformanceNavigationTiming = function () {
            if (this.isPerformanceNavigationTimingSupported()) {
                return getPerformance().getEntriesByType("navigation")[0];
            }
            return null;
        };
        PageViewPerformanceManager.prototype.isPerformanceNavigationTimingSupported = function () {
            var perf = getPerformance();
            return perf && perf.getEntriesByType && perf.getEntriesByType("navigation").length > 0;
        };
        PageViewPerformanceManager.prototype.isPerformanceTimingSupported = function () {
            var perf = getPerformance();
            return perf && perf.timing;
        };
        PageViewPerformanceManager.prototype.isPerformanceTimingDataReady = function () {
            var perf = getPerformance();
            var timing = perf ? perf.timing : 0;
            return timing
                && timing.domainLookupStart > 0
                && timing.navigationStart > 0
                && timing.responseStart > 0
                && timing.requestStart > 0
                && timing.loadEventEnd > 0
                && timing.responseEnd > 0
                && timing.connectEnd > 0
                && timing.domLoading > 0;
        };
        PageViewPerformanceManager.prototype.shouldCollectDuration = function () {
            var durations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                durations[_i] = arguments[_i];
            }
            var _navigator = getNavigator() || {};
            var botAgentNames = ["googlebot", "adsbot-google", "apis-google", "mediapartners-google"];
            var userAgent = _navigator.userAgent;
            var isGoogleBot = false;
            if (userAgent) {
                for (var i = 0; i < botAgentNames.length; i++) {
                    isGoogleBot = isGoogleBot || userAgent.toLowerCase().indexOf(botAgentNames[i]) !== -1;
                }
            }
            if (isGoogleBot) {
                return false;
            }
            else {
                for (var i = 0; i < durations.length; i++) {
                    if (durations[i] < 0 || durations[i] >= this.MAX_DURATION_ALLOWED) {
                        return false;
                    }
                }
            }
            return true;
        };
        return PageViewPerformanceManager;
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

    var durationProperty = "duration";
    var strEvent = "event";
    function _dispatchEvent(target, evnt) {
        if (target && target.dispatchEvent && evnt) {
            target.dispatchEvent(evnt);
        }
    }
    function _getReason(error) {
        if (error && error.reason) {
            var reason = error.reason;
            if (!isString(reason) && isFunction(reason.toString)) {
                return reason.toString();
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
        config.disableExceptionTracking = stringToBoolOrDefault(config.disableExceptionTracking);
        config.autoTrackPageVisitTime = stringToBoolOrDefault(config.autoTrackPageVisitTime);
        config.overridePageViewDuration = stringToBoolOrDefault(config.overridePageViewDuration);
        config.enableUnhandledPromiseRejectionTracking = stringToBoolOrDefault(config.enableUnhandledPromiseRejectionTracking);
        if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
            config.samplingPercentage = 100;
        }
        config.isStorageUseDisabled = stringToBoolOrDefault(config.isStorageUseDisabled);
        config.isBrowserLinkTrackingEnabled = stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
        config.enableAutoRouteTracking = stringToBoolOrDefault(config.enableAutoRouteTracking);
        config.namePrefix = config.namePrefix || "";
        config.enableDebug = stringToBoolOrDefault(config.enableDebug);
        config.disableFlushOnBeforeUnload = stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
        config.disableFlushOnUnload = stringToBoolOrDefault(config.disableFlushOnUnload, config.disableFlushOnBeforeUnload);
        return config;
    }
    function _updateStorageUsage(extConfig) {
        if (!isUndefined(extConfig.isStorageUseDisabled)) {
            if (extConfig.isStorageUseDisabled) {
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
                    return safeGetCookieMgr(_self.core);
                };
                _self.processTelemetry = function (env, itemCtx) {
                    _self.processNext(env, itemCtx);
                };
                _self.trackEvent = function (event, customProperties) {
                    try {
                        var telemetryItem = createTelemetryItem(event, Event$1.dataType, Event$1.envelopeType, _self.diagLog(), customProperties);
                        _self.core.track(telemetryItem);
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
                        _eventTracking.stop(name, undefined, properties);
                    }
                    catch (e) {
                        _throwInternal(1 , 30 , "stopTrackEvent failed, event will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.trackTrace = function (trace, customProperties) {
                    try {
                        var telemetryItem = createTelemetryItem(trace, Trace.dataType, Trace.envelopeType, _self.diagLog(), customProperties);
                        _self.core.track(telemetryItem);
                    }
                    catch (e) {
                        _throwInternal(2 , 39 , "trackTrace failed, trace will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.trackMetric = function (metric, customProperties) {
                    try {
                        var telemetryItem = createTelemetryItem(metric, Metric.dataType, Metric.envelopeType, _self.diagLog(), customProperties);
                        _self.core.track(telemetryItem);
                    }
                    catch (e) {
                        _throwInternal(1 , 36 , "trackMetric failed, metric will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.trackPageView = function (pageView, customProperties) {
                    try {
                        var inPv = pageView || {};
                        _pageViewManager.trackPageView(inPv, __assignFn(__assignFn(__assignFn({}, inPv.properties), inPv.measurements), customProperties));
                        if (_self.config.autoTrackPageVisitTime) {
                            _pageVisitTimeManager.trackPreviousPageVisit(inPv.name, inPv.uri);
                        }
                    }
                    catch (e) {
                        _throwInternal(1 , 37 , "trackPageView failed, page view will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.sendPageViewInternal = function (pageView, properties, systemProperties) {
                    var doc = getDocument();
                    if (doc) {
                        pageView.refUri = pageView.refUri === undefined ? doc.referrer : pageView.refUri;
                    }
                    var telemetryItem = createTelemetryItem(pageView, PageView.dataType, PageView.envelopeType, _self.diagLog(), properties, systemProperties);
                    _self.core.track(telemetryItem);
                };
                _self.sendPageViewPerformanceInternal = function (pageViewPerformance, properties, systemProperties) {
                    var telemetryItem = createTelemetryItem(pageViewPerformance, PageViewPerformance.dataType, PageViewPerformance.envelopeType, _self.diagLog(), properties, systemProperties);
                    _self.core.track(telemetryItem);
                };
                _self.trackPageViewPerformance = function (pageViewPerformance, customProperties) {
                    var inPvp = pageViewPerformance || {};
                    try {
                        _pageViewPerformanceManager.populatePageViewPerformanceEvent(inPvp);
                        _self.sendPageViewPerformanceInternal(inPvp, customProperties);
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
                            url = loc && loc.href || "";
                        }
                        _pageTracking.stop(name, url, properties, measurement);
                        if (_self.config.autoTrackPageVisitTime) {
                            _pageVisitTimeManager.trackPreviousPageVisit(name, url);
                        }
                    }
                    catch (e) {
                        _throwInternal(1 , 32 , "stopTrackPage failed, page view will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self.sendExceptionInternal = function (exception, customProperties, systemProperties) {
                    var theError = exception.exception || exception.error || new Error(strNotSpecified);
                    var exceptionPartB = new Exception(_self.diagLog(), theError, exception.properties || customProperties, exception.measurements, exception.severityLevel, exception.id).toInterface();
                    var telemetryItem = createTelemetryItem(exceptionPartB, Exception.dataType, Exception.envelopeType, _self.diagLog(), customProperties, systemProperties);
                    _self.core.track(telemetryItem);
                };
                _self.trackException = function (exception, customProperties) {
                    if (exception && !exception.exception && exception.error) {
                        exception.exception = exception.error;
                    }
                    try {
                        _self.sendExceptionInternal(exception, customProperties);
                    }
                    catch (e) {
                        _throwInternal(1 , 35 , "trackException failed, exception will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                };
                _self._onerror = function (exception) {
                    var error = exception && exception.error;
                    var evt = exception && exception.evt;
                    try {
                        if (!evt) {
                            var _window = getWindow();
                            if (_window) {
                                evt = _window[strEvent];
                            }
                        }
                        var url = (exception && exception.url) || (getDocument() || {}).URL;
                        var errorSrc = exception.errorSrc || "window.onerror@" + url + ":" + (exception.lineNumber || 0) + ":" + (exception.columnNumber || 0);
                        var properties = {
                            errorSrc: errorSrc,
                            url: url,
                            lineNumber: exception.lineNumber || 0,
                            columnNumber: exception.columnNumber || 0,
                            message: exception.message
                        };
                        if (isCrossOriginError(exception.message, exception.url, exception.lineNumber, exception.columnNumber, exception.error)) {
                            _sendCORSException(Exception.CreateAutoException("Script error: The browser's same-origin policy prevents us from getting the details of this exception. Consider using the 'crossorigin' attribute.", url, exception.lineNumber || 0, exception.columnNumber || 0, error, evt, null, errorSrc), properties);
                        }
                        else {
                            if (!exception.errorSrc) {
                                exception.errorSrc = errorSrc;
                            }
                            _self.trackException({ exception: exception, severityLevel: 3  }, properties);
                        }
                    }
                    catch (e) {
                        var errorString = error ? (error.name + ", " + error.message) : "null";
                        _throwInternal(1 , 11 , "_onError threw exception while logging error, error will not be collected: "
                            + getExceptionName(e), { exception: dumpObj(e), errorString: errorString });
                    }
                };
                _self.addTelemetryInitializer = function (telemetryInitializer) {
                    if (_self.core) {
                        return _self.core.addTelemetryInitializer(telemetryInitializer);
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
                                core.addTelemetryInitializer(initializer);
                            });
                            _preInitTelemetryInitializers = null;
                        }
                        var extConfig = _populateDefaults(config);
                        _updateStorageUsage(extConfig);
                        _pageViewPerformanceManager = new PageViewPerformanceManager(_self.core);
                        _pageViewManager = new PageViewManager(_this, extConfig.overridePageViewDuration, _self.core, _pageViewPerformanceManager);
                        _pageVisitTimeManager = new PageVisitTimeManager(_self.diagLog(), function (pageName, pageUrl, pageVisitTime) { return trackPageVisitTime(pageName, pageUrl, pageVisitTime); });
                        _updateBrowserLinkTracking(extConfig, config);
                        _eventTracking = new Timing(_self.diagLog(), "trackEvent");
                        _eventTracking.action =
                            function (name, url, duration, properties) {
                                if (!properties) {
                                    properties = {};
                                }
                                properties[durationProperty] = duration.toString();
                                _self.trackEvent({ name: name, properties: properties });
                            };
                        _pageTracking = new Timing(_self.diagLog(), "trackPageView");
                        _pageTracking.action = function (name, url, duration, properties, measurements) {
                            if (isNullOrUndefined(properties)) {
                                properties = {};
                            }
                            properties[durationProperty] = duration.toString();
                            var pageViewItem = {
                                name: name,
                                uri: url,
                                properties: properties,
                                measurements: measurements
                            };
                            _self.sendPageViewInternal(pageViewItem, properties);
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
                    var ctx = createProcessTelemetryContext(null, config, _self.core);
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
                    _isBrowserLinkTrackingEnabled = extConfig.isBrowserLinkTrackingEnabled || config.isBrowserLinkTrackingEnabled;
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
                            if (_isBrowserLinkTrackingEnabled && envelope.baseType === RemoteDependencyData.dataType) {
                                var remoteData = envelope.baseData;
                                if (remoteData) {
                                    for (var i = 0; i < browserLinkPaths_1.length; i++) {
                                        if (remoteData.target && remoteData.target.indexOf(browserLinkPaths_1[i]) >= 0) {
                                            return false;
                                        }
                                    }
                                }
                            }
                            return true;
                        };
                        _self.addTelemetryInitializer(dropBrowserLinkRequests);
                        _browserLinkInitializerAdded = true;
                    }
                }
                function _sendCORSException(exception, properties) {
                    var telemetryItem = createTelemetryItem(exception, Exception.dataType, Exception.envelopeType, _self.diagLog(), properties);
                    _self.core.track(telemetryItem);
                }
                function _updateExceptionTracking(extConfig) {
                    var _window = getWindow();
                    var locn = getLocation(true);
                    _disableExceptionTracking = extConfig.disableExceptionTracking;
                    if (!_disableExceptionTracking && !_autoExceptionInstrumented && !extConfig.autoExceptionInstrumented) {
                        _addHook(InstrumentEvent(_window, "onerror", {
                            ns: _evtNamespace,
                            rsp: function (callDetails, message, url, lineNumber, columnNumber, error) {
                                if (!_disableExceptionTracking && callDetails.rslt !== true) {
                                    _self._onerror(Exception.CreateAutoException(message, url, lineNumber, columnNumber, error, callDetails.evt));
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
                    _enableAutoRouteTracking = extConfig.enableAutoRouteTracking === true;
                    if (win && _enableAutoRouteTracking && hasHistory()) {
                        var _history = getHistory();
                        if (isFunction(_history.pushState) && isFunction(_history.replaceState) && typeof Event !== strShimUndefined) {
                            _addHistoryListener(extConfig, win, _history, locn);
                        }
                    }
                }
                function _addHistoryListener(extConfig, win, history, locn) {
                    function _popstateHandler() {
                        if (_enableAutoRouteTracking) {
                            _dispatchEvent(win, createDomEvent(extConfig.namePrefix + "locationchange"));
                        }
                    }
                    function _locationChangeHandler() {
                        if (_currUri) {
                            _prevUri = _currUri;
                            _currUri = locn && locn.href || "";
                        }
                        else {
                            _currUri = locn && locn.href || "";
                        }
                        if (_enableAutoRouteTracking) {
                            var properties = _self.core.getPlugin(PropertiesPluginIdentifier);
                            if (properties) {
                                var context = properties.plugin.context;
                                if (context && context.telemetryTrace) {
                                    context.telemetryTrace.traceID = generateW3CId();
                                    var traceLocationName = "_unknown_";
                                    if (locn && locn.pathname) {
                                        traceLocationName = locn.pathname + (locn.hash || "");
                                    }
                                    context.telemetryTrace.name = dataSanitizeString(_self.diagLog(), traceLocationName);
                                }
                            }
                            setTimeout((function (uri) {
                                _self.trackPageView({ refUri: uri, properties: { duration: 0 } });
                            }).bind(this, _prevUri), _self.autoRoutePVDelay);
                        }
                    }
                    if (!_historyListenerAdded) {
                        _addHook(InstrumentEvent(history, "pushState", {
                            ns: _evtNamespace,
                            rsp: function () {
                                if (_enableAutoRouteTracking) {
                                    _dispatchEvent(win, createDomEvent(extConfig.namePrefix + "pushState"));
                                    _dispatchEvent(win, createDomEvent(extConfig.namePrefix + "locationchange"));
                                }
                            }
                        }, true));
                        _addHook(InstrumentEvent(history, "replaceState", {
                            ns: _evtNamespace,
                            rsp: function () {
                                if (_enableAutoRouteTracking) {
                                    _dispatchEvent(win, createDomEvent(extConfig.namePrefix + "replaceState"));
                                    _dispatchEvent(win, createDomEvent(extConfig.namePrefix + "locationchange"));
                                }
                            }
                        }, true));
                        eventOn(win, extConfig.namePrefix + "popstate", _popstateHandler, _evtNamespace);
                        eventOn(win, extConfig.namePrefix + "locationchange", _locationChangeHandler, _evtNamespace);
                        _historyListenerAdded = true;
                    }
                }
                function _addUnhandledPromiseRejectionTracking(extConfig, _window, _location) {
                    _enableUnhandledPromiseRejectionTracking = extConfig.enableUnhandledPromiseRejectionTracking === true;
                    if (_enableUnhandledPromiseRejectionTracking && !_autoUnhandledPromiseInstrumented) {
                        _addHook(InstrumentEvent(_window, "onunhandledrejection", {
                            ns: _evtNamespace,
                            rsp: function (callDetails, error) {
                                if (_enableUnhandledPromiseRejectionTracking && callDetails.rslt !== true) {
                                    _self._onerror(Exception.CreateAutoException(_getReason(error), _location ? _location.href : "", 0, 0, error, callDetails.evt));
                                }
                            }
                        }, false));
                        _autoUnhandledPromiseInstrumented = true;
                        extConfig.autoUnhandledPromiseInstrumented = _autoUnhandledPromiseInstrumented;
                    }
                }
                function _throwInternal(severity, msgId, msg, properties, isUserAct) {
                    _self.diagLog().throwInternal(severity, msgId, msg, properties, isUserAct);
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
                    _prevUri = location && location.href || "";
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
        AnalyticsPlugin.Version = "2.8.3";
        AnalyticsPlugin.getDefaultConfig = _getDefaultConfig;
        return AnalyticsPlugin;
    }(BaseTelemetryPlugin));

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
                _self.enqueue = function (payload) {
                    if (_self.count() >= config.eventsLimitInMem()) {
                        if (!_bufferFullMessageSent) {
                            _throwInternal(logger, 2 , 105 , "Maximum in-memory buffer size reached: " + _self.count(), true);
                            _bufferFullMessageSent = true;
                        }
                        return;
                    }
                    _buffer.push(payload);
                };
                _self.count = function () {
                    return _buffer.length;
                };
                _self.size = function () {
                    var size = _buffer.length;
                    for (var lp = 0; lp < _buffer.length; lp++) {
                        size += _buffer[lp].length;
                    }
                    if (!config.emitLineDelimitedJson()) {
                        size += 2;
                    }
                    return size;
                };
                _self.clear = function () {
                    _buffer = [];
                    _bufferFullMessageSent = false;
                };
                _self.getItems = function () {
                    return _buffer.slice(0);
                };
                _self.batchPayloads = function (payload) {
                    if (payload && payload.length > 0) {
                        var batch = config.emitLineDelimitedJson() ?
                            payload.join("\n") :
                            "[" + payload.join(",") + "]";
                        return batch;
                    }
                    return null;
                };
            });
        }
        return BaseSendBuffer;
    }());
    var ArraySendBuffer = /** @class */ (function (_super) {
        __extendsFn(ArraySendBuffer, _super);
        function ArraySendBuffer(logger, config) {
            var _this = _super.call(this, logger, config) || this;
            dynamicProto(ArraySendBuffer, _this, function (_self, _base) {
                _self.markAsSent = function (payload) {
                    _base.clear();
                };
                _self.clearSent = function (payload) {
                };
            });
            return _this;
        }
        return ArraySendBuffer;
    }(BaseSendBuffer));
    var SessionStorageSendBuffer = /** @class */ (function (_super) {
        __extendsFn(SessionStorageSendBuffer, _super);
        function SessionStorageSendBuffer(logger, config) {
            var _this = _super.call(this, logger, config) || this;
            var _bufferFullMessageSent = false;
            dynamicProto(SessionStorageSendBuffer, _this, function (_self, _base) {
                var bufferItems = _getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
                var notDeliveredItems = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                var buffer = _self._set(bufferItems.concat(notDeliveredItems));
                if (buffer.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                    buffer.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
                }
                _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, buffer);
                _self.enqueue = function (payload) {
                    if (_self.count() >= SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                        if (!_bufferFullMessageSent) {
                            _throwInternal(logger, 2 , 67 , "Maximum buffer size reached: " + _self.count(), true);
                            _bufferFullMessageSent = true;
                        }
                        return;
                    }
                    _base.enqueue(payload);
                    _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _self._get());
                };
                _self.clear = function () {
                    _base.clear();
                    _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _self._get());
                    _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
                    _bufferFullMessageSent = false;
                };
                _self.markAsSent = function (payload) {
                    _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _self._set(_removePayloadsFromBuffer(payload, _self._get())));
                    var sentElements = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                    if (sentElements instanceof Array && payload instanceof Array) {
                        sentElements = sentElements.concat(payload);
                        if (sentElements.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                            _throwInternal(logger, 1 , 67 , "Sent buffer reached its maximum size: " + sentElements.length, true);
                            sentElements.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
                        }
                        _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
                    }
                };
                _self.clearSent = function (payload) {
                    var sentElements = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                    sentElements = _removePayloadsFromBuffer(payload, sentElements);
                    _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
                };
                function _removePayloadsFromBuffer(payloads, buffer) {
                    var remaining = [];
                    arrForEach(buffer, function (value) {
                        if (!isFunction(value) && arrIndexOf(payloads, value) === -1) {
                            remaining.push(value);
                        }
                    });
                    return remaining;
                }
                function _getBuffer(key) {
                    var prefixedKey = key;
                    try {
                        prefixedKey = config.namePrefix && config.namePrefix() ? config.namePrefix() + "_" + prefixedKey : prefixedKey;
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
                        prefixedKey = config.namePrefix && config.namePrefix() ? config.namePrefix() + "_" + prefixedKey : prefixedKey;
                        var bufferJson = JSON.stringify(buffer);
                        utlSetSessionStorage(logger, prefixedKey, bufferJson);
                    }
                    catch (e) {
                        utlSetSessionStorage(logger, prefixedKey, JSON.stringify([]));
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

    var strBaseType = "baseType";
    var strBaseData = "baseData";
    var strProperties$1 = "properties";
    var strTrue = "true";
    function _setValueIf(target, field, value) {
        return setValue(target, field, value, isTruthy);
    }
    function _extractPartAExtensions(logger, item, env) {
        var envTags = env.tags = env.tags || {};
        var itmExt = item.ext = item.ext || {};
        var itmTags = item.tags = item.tags || [];
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
            _setValueIf(envTags, CtxTagKeys.deviceType, extDevice.deviceClass);
            _setValueIf(envTags, CtxTagKeys.deviceIp, extDevice.ip);
            _setValueIf(envTags, CtxTagKeys.deviceModel, extDevice.model);
            _setValueIf(envTags, CtxTagKeys.deviceType, extDevice.deviceType);
        }
        var web = item.ext.web;
        if (web) {
            _setValueIf(envTags, CtxTagKeys.deviceLanguage, web.browserLang);
            _setValueIf(envTags, CtxTagKeys.deviceBrowserVersion, web.browserVer);
            _setValueIf(envTags, CtxTagKeys.deviceBrowser, web.browser);
            var envData = env.data = env.data || {};
            var envBaseData = envData[strBaseData] = envData[strBaseData] || {};
            var envProps = envBaseData[strProperties$1] = envBaseData[strProperties$1] || {};
            _setValueIf(envProps, "domain", web.domain);
            _setValueIf(envProps, "isManual", web.isManual ? strTrue : null);
            _setValueIf(envProps, "screenRes", web.screenRes);
            _setValueIf(envProps, "userConsent", web.userConsent ? strTrue : null);
        }
        var extOs = itmExt.os;
        if (extOs) {
            _setValueIf(envTags, CtxTagKeys.deviceOS, extOs.name);
        }
        var extTrace = itmExt.trace;
        if (extTrace) {
            _setValueIf(envTags, CtxTagKeys.operationParentId, extTrace.parentID);
            _setValueIf(envTags, CtxTagKeys.operationName, dataSanitizeString(logger, extTrace.name));
            _setValueIf(envTags, CtxTagKeys.operationId, extTrace.traceID);
        }
        var tgs = {};
        for (var i = itmTags.length - 1; i >= 0; i--) {
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
        env.tags = optimizeObject(theTags);
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
                    properties[key] = getJSON().stringify(value);
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
        envelope.name = envelope.name.replace("{0}", iKeyNoDashes);
        _extractPartAExtensions(logger, telemetryItem, envelope);
        telemetryItem.tags = telemetryItem.tags || [];
        return optimizeObject(envelope);
    }
    function EnvelopeCreatorInit(logger, telemetryItem) {
        if (isNullOrUndefined(telemetryItem[strBaseData])) {
            _throwInternal(logger, 1 , 46 , "telemetryItem.baseData cannot be null.");
        }
    }
    var EnvelopeCreator = {
        Version: "2.8.3"
    };
    function DependencyEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var customMeasurements = telemetryItem[strBaseData].measurements || {};
        var customProperties = telemetryItem[strBaseData][strProperties$1] || {};
        _extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
        }
        var bd = telemetryItem[strBaseData];
        if (isNullOrUndefined(bd)) {
            _warnToConsole(logger, "Invalid input for dependency data");
            return null;
        }
        var method = bd[strProperties$1] && bd[strProperties$1][HttpMethod] ? bd[strProperties$1][HttpMethod] : "GET";
        var remoteDepData = new RemoteDependencyData(logger, bd.id, bd.target, bd.name, bd.duration, bd.success, bd.responseCode, method, bd.type, bd.correlationContext, customProperties, customMeasurements);
        var data = new Data(RemoteDependencyData.dataType, remoteDepData);
        return _createEnvelope(logger, RemoteDependencyData.envelopeType, telemetryItem, data);
    }
    function EventEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var customProperties = {};
        var customMeasurements = {};
        if (telemetryItem[strBaseType] !== Event$1.dataType) {
            customProperties["baseTypeSource"] = telemetryItem[strBaseType];
        }
        if (telemetryItem[strBaseType] === Event$1.dataType) {
            customProperties = telemetryItem[strBaseData][strProperties$1] || {};
            customMeasurements = telemetryItem[strBaseData].measurements || {};
        }
        else {
            if (telemetryItem[strBaseData]) {
                _extractPropsAndMeasurements(telemetryItem[strBaseData], customProperties, customMeasurements);
            }
        }
        _extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
        }
        var eventName = telemetryItem[strBaseData].name;
        var eventData = new Event$1(logger, eventName, customProperties, customMeasurements);
        var data = new Data(Event$1.dataType, eventData);
        return _createEnvelope(logger, Event$1.envelopeType, telemetryItem, data);
    }
    function ExceptionEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var customMeasurements = telemetryItem[strBaseData].measurements || {};
        var customProperties = telemetryItem[strBaseData][strProperties$1] || {};
        _extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
        }
        var bd = telemetryItem[strBaseData];
        var exData = Exception.CreateFromInterface(logger, bd, customProperties, customMeasurements);
        var data = new Data(Exception.dataType, exData);
        return _createEnvelope(logger, Exception.envelopeType, telemetryItem, data);
    }
    function MetricEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var baseData = telemetryItem[strBaseData];
        var props = baseData[strProperties$1] || {};
        var measurements = baseData.measurements || {};
        _extractPropsAndMeasurements(telemetryItem.data, props, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(props, customUndefinedValue);
        }
        var baseMetricData = new Metric(logger, baseData.name, baseData.average, baseData.sampleCount, baseData.min, baseData.max, baseData.stdDev, props, measurements);
        var data = new Data(Metric.dataType, baseMetricData);
        return _createEnvelope(logger, Metric.envelopeType, telemetryItem, data);
    }
    function PageViewEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var strDuration = "duration";
        var duration;
        var baseData = telemetryItem[strBaseData];
        if (!isNullOrUndefined(baseData) &&
            !isNullOrUndefined(baseData[strProperties$1]) &&
            !isNullOrUndefined(baseData[strProperties$1][strDuration])) {
            duration = baseData[strProperties$1][strDuration];
            delete baseData[strProperties$1][strDuration];
        }
        else if (!isNullOrUndefined(telemetryItem.data) &&
            !isNullOrUndefined(telemetryItem.data[strDuration])) {
            duration = telemetryItem.data[strDuration];
            delete telemetryItem.data[strDuration];
        }
        var bd = telemetryItem[strBaseData];
        var currentContextId;
        if (((telemetryItem.ext || {}).trace || {}).traceID) {
            currentContextId = telemetryItem.ext.trace.traceID;
        }
        var id = bd.id || currentContextId;
        var name = bd.name;
        var url = bd.uri;
        var properties = bd[strProperties$1] || {};
        var measurements = bd.measurements || {};
        if (!isNullOrUndefined(bd.refUri)) {
            properties["refUri"] = bd.refUri;
        }
        if (!isNullOrUndefined(bd.pageType)) {
            properties["pageType"] = bd.pageType;
        }
        if (!isNullOrUndefined(bd.isLoggedIn)) {
            properties["isLoggedIn"] = bd.isLoggedIn.toString();
        }
        if (!isNullOrUndefined(bd[strProperties$1])) {
            var pageTags = bd[strProperties$1];
            objForEachKey(pageTags, function (key, value) {
                properties[key] = value;
            });
        }
        _extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue);
        }
        var pageViewData = new PageView(logger, name, url, duration, properties, measurements, id);
        var data = new Data(PageView.dataType, pageViewData);
        return _createEnvelope(logger, PageView.envelopeType, telemetryItem, data);
    }
    function PageViewPerformanceEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var bd = telemetryItem[strBaseData];
        var name = bd.name;
        var url = bd.uri || bd.url;
        var properties = bd[strProperties$1] || {};
        var measurements = bd.measurements || {};
        _extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue);
        }
        var baseData = new PageViewPerformance(logger, name, url, undefined, properties, measurements, bd);
        var data = new Data(PageViewPerformance.dataType, baseData);
        return _createEnvelope(logger, PageViewPerformance.envelopeType, telemetryItem, data);
    }
    function TraceEnvelopeCreator(logger, telemetryItem, customUndefinedValue) {
        EnvelopeCreatorInit(logger, telemetryItem);
        var message = telemetryItem[strBaseData].message;
        var severityLevel = telemetryItem[strBaseData].severityLevel;
        var props = telemetryItem[strBaseData][strProperties$1] || {};
        var measurements = telemetryItem[strBaseData].measurements || {};
        _extractPropsAndMeasurements(telemetryItem.data, props, measurements);
        if (!isNullOrUndefined(customUndefinedValue)) {
            _convertPropsUndefinedToCustomDefinedValue(props, customUndefinedValue);
        }
        var baseData = new Trace(logger, message, severityLevel, props, measurements);
        var data = new Data(Trace.dataType, baseData);
        return _createEnvelope(logger, Trace.envelopeType, telemetryItem, data);
    }

    var Serializer = /** @class */ (function () {
        function Serializer(logger) {
            dynamicProto(Serializer, this, function (_self) {
                _self.serialize = function (input) {
                    var output = _serializeObject(input, "root");
                    try {
                        return getJSON().stringify(output);
                    }
                    catch (e) {
                        _throwInternal(logger, 1 , 48 , (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
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
                                getJSON().stringify(source);
                                output = source;
                            }
                            catch (e) {
                                _throwInternal(logger, 1 , 48 , (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
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
                            for (var i = 0; i < sources.length; i++) {
                                var source = sources[i];
                                var item = _serializeObject(source, name + "[" + i + "]");
                                output.push(item);
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
                                else if (!value.toString) {
                                    output[field] = "invalid field: toString() is not defined.";
                                }
                                else {
                                    output[field] = value.toString();
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
        return Serializer;
    }());

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
                if (_navigator && !isNullOrUndefined(_navigator.onLine)) {
                    _onlineStatus = _navigator.onLine;
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
            else if (_navigator && !isNullOrUndefined(_navigator.onLine)) {
                result = _navigator.onLine;
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
            while (input.length < MIN_INPUT_LENGTH) {
                input = input.concat(input);
            }
            var hash = 5381;
            for (var i = 0; i < input.length; ++i) {
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
            _self.getSamplingScore = function (item) {
                var score = 0;
                if (item.tags && item.tags[keys.userId]) {
                    score = hashCodeGenerator.getHashCodeScore(item.tags[keys.userId]);
                }
                else if (item.ext && item.ext.user && item.ext.user.id) {
                    score = hashCodeGenerator.getHashCodeScore(item.ext.user.id);
                }
                else if (item.tags && item.tags[keys.operationId]) {
                    score = hashCodeGenerator.getHashCodeScore(item.tags[keys.operationId]);
                }
                else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
                    score = hashCodeGenerator.getHashCodeScore(item.ext.telemetryTrace.traceID);
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
            this.sampleRate = sampleRate;
            this.samplingScoreGenerator = new SamplingScoreGenerator();
        }
        Sample.prototype.isSampledIn = function (envelope) {
            var samplingPercentage = this.sampleRate;
            var isSampledIn = false;
            if (samplingPercentage === null || samplingPercentage === undefined || samplingPercentage >= 100) {
                return true;
            }
            else if (envelope.baseType === Metric.dataType) {
                return true;
            }
            isSampledIn = this.samplingScoreGenerator.getSamplingScore(envelope) < samplingPercentage;
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
        return {
            endpointUrl: function () { return "https://dc.services.visualstudio.com/v2/track"; },
            emitLineDelimitedJson: function () { return false; },
            maxBatchInterval: function () { return 15000; },
            maxBatchSizeInBytes: function () { return 102400; },
            disableTelemetry: function () { return false; },
            enableSessionStorageBuffer: function () { return true; },
            isRetryDisabled: function () { return false; },
            isBeaconApiDisabled: function () { return true; },
            disableXhr: function () { return false; },
            onunloadDisableFetch: function () { return false; },
            onunloadDisableBeacon: function () { return false; },
            instrumentationKey: function () { return undefined; },
            namePrefix: function () { return undefined; },
            samplingPercentage: function () { return 100; },
            customHeaders: function () { return undefined; },
            convertUndefined: function () { return undefined; },
            eventsLimitInMem: function () { return 10000; }
        };
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
            var _lastSend;
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
                        if (_self._buffer.size() > _self._senderConfig.maxBatchSizeInBytes()) {
                            _self.triggerSend(true, null, 10 );
                        }
                        _setupTimer();
                    }
                };
                _self.flush = function (isAsync, callBack, sendReason) {
                    if (isAsync === void 0) { isAsync = true; }
                    if (!_paused) {
                        _clearScheduledTimer();
                        try {
                            _self.triggerSend(isAsync, null, sendReason || 1 );
                        }
                        catch (e) {
                            _throwInternal(_self.diagLog(), 1 , 22 , "flush failed, telemetry will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
                        }
                    }
                };
                _self.onunloadFlush = function () {
                    if (!_paused) {
                        if ((_self._senderConfig.onunloadDisableBeacon() === false || _self._senderConfig.isBeaconApiDisabled() === false) && isBeaconsSupported()) {
                            try {
                                _self.triggerSend(true, _doUnloadSend, 2 );
                            }
                            catch (e) {
                                _throwInternal(_self.diagLog(), 1 , 20 , "failed to flush with beacon sender on page unload, telemetry will not be collected: " + getExceptionName(e), { exception: dumpObj(e) });
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
                        _throwInternal(_self.diagLog(), 1 , 28 , "Sender is already initialized");
                    }
                    _base.initialize(config, core, extensions, pluginChain);
                    var ctx = _self._getTelCtx();
                    var identifier = _self.identifier;
                    _serializer = new Serializer(core.logger);
                    _consecutiveErrors = 0;
                    _retryAt = null;
                    _lastSend = 0;
                    _self._sender = null;
                    _stamp_specific_redirects = 0;
                    var diagLog = _self.diagLog();
                    _evtNamespace = mergeEvtNamespace(createUniqueNamespace("Sender"), core.evtNamespace && core.evtNamespace());
                    _offlineListener = createOfflineListener(_evtNamespace);
                    var defaultConfig = _getDefaultAppInsightsChannelConfig();
                    objForEachKey(defaultConfig, function (field, value) {
                        _self._senderConfig[field] = function () { return ctx.getConfig(identifier, field, value()); };
                    });
                    _self._buffer = (_self._senderConfig.enableSessionStorageBuffer() && utlCanUseSessionStorage())
                        ? new SessionStorageSendBuffer(diagLog, _self._senderConfig) : new ArraySendBuffer(diagLog, _self._senderConfig);
                    _self._sample = new Sample(_self._senderConfig.samplingPercentage(), diagLog);
                    if (!_validateInstrumentationKey(config)) {
                        _throwInternal(diagLog, 1 , 100 , "Invalid Instrumentation key " + config.instrumentationKey);
                    }
                    if (!isInternalApplicationInsightsEndpoint(_self._senderConfig.endpointUrl()) && _self._senderConfig.customHeaders() && _self._senderConfig.customHeaders().length > 0) {
                        arrForEach(_self._senderConfig.customHeaders(), function (customHeader) {
                            _this.addHeader(customHeader.header, customHeader.value);
                        });
                    }
                    var senderConfig = _self._senderConfig;
                    var sendPostFunc = null;
                    if (!senderConfig.disableXhr() && useXDomainRequest()) {
                        sendPostFunc = _xdrSender;
                    }
                    else if (!senderConfig.disableXhr() && isXhrSupported()) {
                        sendPostFunc = _xhrSender;
                    }
                    if (!sendPostFunc && isFetchSupported()) {
                        sendPostFunc = _fetchSender;
                    }
                    _fallbackSender = sendPostFunc || _xhrSender;
                    if (!senderConfig.isBeaconApiDisabled() && isBeaconsSupported()) {
                        sendPostFunc = _beaconSender;
                    }
                    _self._sender = sendPostFunc || _xhrSender;
                    if (!senderConfig.onunloadDisableFetch() && isFetchSupported(true)) {
                        _syncUnloadSender = _fetchKeepAliveSender;
                    }
                    else if (isBeaconsSupported()) {
                        _syncUnloadSender = _beaconSender;
                    }
                    else if (!senderConfig.disableXhr() && useXDomainRequest()) {
                        _syncUnloadSender = _xdrSender;
                    }
                    else if (!senderConfig.disableXhr() && isXhrSupported()) {
                        _syncUnloadSender = _xhrSender;
                    }
                    else {
                        _syncUnloadSender = _fallbackSender;
                    }
                };
                _self.processTelemetry = function (telemetryItem, itemCtx) {
                    itemCtx = _self._getTelCtx(itemCtx);
                    try {
                        if (_self._senderConfig.disableTelemetry()) {
                            return;
                        }
                        if (!telemetryItem) {
                            _throwInternal(itemCtx.diagLog(), 1 , 7 , "Cannot send empty telemetry");
                            return;
                        }
                        if (telemetryItem.baseData && !telemetryItem.baseType) {
                            _throwInternal(itemCtx.diagLog(), 1 , 70 , "Cannot send telemetry without baseData and baseType");
                            return;
                        }
                        if (!telemetryItem.baseType) {
                            telemetryItem.baseType = "EventData";
                        }
                        if (!_self._sender) {
                            _throwInternal(itemCtx.diagLog(), 1 , 28 , "Sender was not initialized");
                            return;
                        }
                        if (!_isSampledIn(telemetryItem)) {
                            _throwInternal(itemCtx.diagLog(), 2 , 33 , "Telemetry item was sampled out and not sent", { SampleRate: _self._sample.sampleRate });
                            return;
                        }
                        else {
                            telemetryItem[SampleRate] = _self._sample.sampleRate;
                        }
                        var convertUndefined = _self._senderConfig.convertUndefined() || undefined;
                        var defaultEnvelopeIkey = telemetryItem.iKey || _self._senderConfig.instrumentationKey();
                        var aiEnvelope_1 = Sender.constructEnvelope(telemetryItem, defaultEnvelopeIkey, itemCtx.diagLog(), convertUndefined);
                        if (!aiEnvelope_1) {
                            _throwInternal(itemCtx.diagLog(), 1 , 47 , "Unable to create an AppInsights envelope");
                            return;
                        }
                        var doNotSendItem_1 = false;
                        if (telemetryItem.tags && telemetryItem.tags[ProcessLegacy]) {
                            arrForEach(telemetryItem.tags[ProcessLegacy], function (callBack) {
                                try {
                                    if (callBack && callBack(aiEnvelope_1) === false) {
                                        doNotSendItem_1 = true;
                                        _warnToConsole(itemCtx.diagLog(), "Telemetry processor check returns false");
                                    }
                                }
                                catch (e) {
                                    _throwInternal(itemCtx.diagLog(), 1 , 64 , "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e), { exception: dumpObj(e) }, true);
                                }
                            });
                            delete telemetryItem.tags[ProcessLegacy];
                        }
                        if (doNotSendItem_1) {
                            return;
                        }
                        var payload = _serializer.serialize(aiEnvelope_1);
                        var buffer = _self._buffer;
                        var bufferSize = buffer.size();
                        if ((bufferSize + payload.length) > _self._senderConfig.maxBatchSizeInBytes()) {
                            _self.triggerSend(true, null, 10 );
                        }
                        buffer.enqueue(payload);
                        _setupTimer();
                    }
                    catch (e) {
                        _throwInternal(itemCtx.diagLog(), 2 , 12 , "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + getExceptionName(e), { exception: dumpObj(e) });
                    }
                    _self.processNext(telemetryItem, itemCtx);
                };
                _self._xhrReadyStateChange = function (xhr, payload, countOfItemsInPayload) {
                    if (xhr.readyState === 4) {
                        _checkResponsStatus(xhr.status, payload, xhr.responseURL, countOfItemsInPayload, _formatErrorMessageXhr(xhr), _getResponseText(xhr) || xhr.response);
                    }
                };
                _self.triggerSend = function (async, forcedSender, sendReason) {
                    if (async === void 0) { async = true; }
                    if (!_paused) {
                        try {
                            var buffer = _self._buffer;
                            if (!_self._senderConfig.disableTelemetry()) {
                                if (buffer.count() > 0) {
                                    var payload = buffer.getItems();
                                    _notifySendRequest(sendReason || 0 , async);
                                    if (forcedSender) {
                                        forcedSender.call(_this, payload, async);
                                    }
                                    else {
                                        _self._sender(payload, async);
                                    }
                                }
                                _lastSend = +new Date;
                            }
                            else {
                                buffer.clear();
                            }
                            _clearScheduledTimer();
                        }
                        catch (e) {
                            var ieVer = getIEVersion();
                            if (!ieVer || ieVer > 9) {
                                _throwInternal(_self.diagLog(), 1 , 40 , "Telemetry transmission failed, some telemetry will be lost: " + getExceptionName(e), { exception: dumpObj(e) });
                            }
                        }
                    }
                };
                _self._doTeardown = function (unloadCtx, unloadState) {
                    _self.onunloadFlush();
                    _offlineListener.unload();
                    _initDefaults();
                };
                _self._onError = function (payload, message, event) {
                    _throwInternal(_self.diagLog(), 2 , 26 , "Failed to send telemetry.", { message: message });
                    _self._buffer.clearSent(payload);
                };
                _self._onPartialSuccess = function (payload, results) {
                    var failed = [];
                    var retry = [];
                    var errors = results.errors.reverse();
                    for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                        var error = errors_1[_i];
                        var extracted = payload.splice(error.index, 1)[0];
                        if (_isRetriable(error.statusCode)) {
                            retry.push(extracted);
                        }
                        else {
                            failed.push(extracted);
                        }
                    }
                    if (payload.length > 0) {
                        _self._onSuccess(payload, results.itemsAccepted);
                    }
                    if (failed.length > 0) {
                        _self._onError(failed, _formatErrorMessageXhr(null, ["partial success", results.itemsAccepted, "of", results.itemsReceived].join(" ")));
                    }
                    if (retry.length > 0) {
                        _resendPayload(retry);
                        _throwInternal(_self.diagLog(), 2 , 40 , "Partial success. " +
                            "Delivered: " + payload.length + ", Failed: " + failed.length +
                            ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
                    }
                };
                _self._onSuccess = function (payload, countOfItemsInPayload) {
                    _self._buffer.clearSent(payload);
                };
                _self._xdrOnLoad = function (xdr, payload) {
                    var responseText = _getResponseText(xdr);
                    if (xdr && (responseText + "" === "200" || responseText === "")) {
                        _consecutiveErrors = 0;
                        _self._onSuccess(payload, 0);
                    }
                    else {
                        var results = _parseResponse(responseText);
                        if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                            && !_self._senderConfig.isRetryDisabled()) {
                            _self._onPartialSuccess(payload, results);
                        }
                        else {
                            _self._onError(payload, _formatErrorMessageXdr(xdr));
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
                                _self._onError(payload, errorMessage);
                                return;
                            }
                        }
                        if (!_self._senderConfig.isRetryDisabled() && _isRetriable(status)) {
                            _resendPayload(payload);
                            _throwInternal(_self.diagLog(), 2 , 40 , ". " +
                                "Response code " + status + ". Will retry to send " + payload.length + " items.");
                        }
                        else {
                            _self._onError(payload, errorMessage);
                        }
                    }
                    else if (_offlineListener && !_offlineListener.isOnline()) {
                        if (!_self._senderConfig.isRetryDisabled()) {
                            var offlineBackOffMultiplier = 10;
                            _resendPayload(payload, offlineBackOffMultiplier);
                            _throwInternal(_self.diagLog(), 2 , 40 , ". Offline - Response Code: ".concat(status, ". Offline status: ").concat(!_offlineListener.isOnline(), ". Will retry to send ").concat(payload.length, " items."));
                        }
                    }
                    else {
                        _checkAndUpdateEndPointUrl(responseUrl);
                        if (status === 206) {
                            if (!response) {
                                response = _parseResponse(res);
                            }
                            if (response && !_self._senderConfig.isRetryDisabled()) {
                                _self._onPartialSuccess(payload, response);
                            }
                            else {
                                _self._onError(payload, errorMessage);
                            }
                        }
                        else {
                            _consecutiveErrors = 0;
                            _self._onSuccess(payload, countOfItemsInPayload);
                        }
                    }
                }
                function _checkAndUpdateEndPointUrl(responseUrl) {
                    if (_stamp_specific_redirects >= 10) {
                        return false;
                    }
                    if (!isNullOrUndefined(responseUrl) && responseUrl !== "") {
                        if (responseUrl !== _self._senderConfig.endpointUrl()) {
                            _self._senderConfig.endpointUrl = function () { return responseUrl; };
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
                    var buffer = _self._buffer;
                    var url = _self._senderConfig.endpointUrl();
                    var batch = _self._buffer.batchPayloads(payload);
                    var plainTextBatch = new Blob([batch], { type: "text/plain;charset=UTF-8" });
                    var queued = nav.sendBeacon(url, plainTextBatch);
                    if (queued) {
                        buffer.markAsSent(payload);
                        _self._onSuccess(payload, payload.length);
                    }
                    return queued;
                }
                function _beaconSender(payload, isAsync) {
                    if (isArray(payload) && payload.length > 0) {
                        if (!_doBeaconSend(payload)) {
                            var droppedPayload = [];
                            for (var lp = 0; lp < payload.length; lp++) {
                                var thePayload = payload[lp];
                                if (!_doBeaconSend([thePayload])) {
                                    droppedPayload.push(thePayload);
                                }
                            }
                            if (droppedPayload.length > 0) {
                                _fallbackSender && _fallbackSender(droppedPayload, true);
                                _throwInternal(_self.diagLog(), 2 , 40 , ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                            }
                        }
                    }
                }
                function _xhrSender(payload, isAsync) {
                    var xhr = new XMLHttpRequest();
                    var endPointUrl = _self._senderConfig.endpointUrl();
                    try {
                        xhr[DisabledPropertyName] = true;
                    }
                    catch (e) {
                    }
                    xhr.open("POST", endPointUrl, isAsync);
                    xhr.setRequestHeader("Content-type", "application/json");
                    if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                        xhr.setRequestHeader(RequestHeaders.sdkContextHeader, RequestHeaders.sdkContextHeaderAppIdRequest);
                    }
                    arrForEach(objKeys(_headers), function (headerName) {
                        xhr.setRequestHeader(headerName, _headers[headerName]);
                    });
                    xhr.onreadystatechange = function () { return _self._xhrReadyStateChange(xhr, payload, payload.length); };
                    xhr.onerror = function (event) { return _self._onError(payload, _formatErrorMessageXhr(xhr), event); };
                    var batch = _self._buffer.batchPayloads(payload);
                    xhr.send(batch);
                    _self._buffer.markAsSent(payload);
                }
                function _fetchKeepAliveSender(payload, isAsync) {
                    if (isArray(payload)) {
                        var payloadSize = payload.length;
                        for (var lp = 0; lp < payload.length; lp++) {
                            payloadSize += payload[lp].length;
                        }
                        if ((_syncFetchPayload + payloadSize) <= FetchSyncRequestSizeLimitBytes) {
                            _doFetchSender(payload, false);
                        }
                        else if (isBeaconsSupported()) {
                            _beaconSender(payload);
                        }
                        else {
                            _fallbackSender && _fallbackSender(payload, true);
                            _throwInternal(_self.diagLog(), 2 , 40 , ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
                        }
                    }
                }
                function _fetchSender(payload, isAsync) {
                    _doFetchSender(payload, true);
                }
                function _doFetchSender(payload, isAsync) {
                    var _a;
                    var endPointUrl = _self._senderConfig.endpointUrl();
                    var batch = _self._buffer.batchPayloads(payload);
                    var plainTextBatch = new Blob([batch], { type: "application/json" });
                    var requestHeaders = new Headers();
                    var batchLength = batch.length;
                    var ignoreResponse = false;
                    var responseHandled = false;
                    if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                        requestHeaders.append(RequestHeaders.sdkContextHeader, RequestHeaders.sdkContextHeaderAppIdRequest);
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
                    _self._buffer.markAsSent(payload);
                    try {
                        fetch(request).then(function (response) {
                            if (!isAsync) {
                                _syncFetchPayload -= batchLength;
                                batchLength = 0;
                            }
                            if (!responseHandled) {
                                responseHandled = true;
                                if (!response.ok) {
                                    _self._onError(payload, response.statusText);
                                }
                                else {
                                    response.text().then(function (text) {
                                        _checkResponsStatus(response.status, payload, response.url, payload.length, response.statusText, text);
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
                                _self._onError(payload, error.message);
                            }
                        });
                    }
                    catch (e) {
                        if (!responseHandled) {
                            _self._onError(payload, dumpObj(e));
                        }
                    }
                    if (ignoreResponse && !responseHandled) {
                        responseHandled = true;
                        _self._onSuccess(payload, payload.length);
                    }
                }
                function _parseResponse(response) {
                    try {
                        if (response && response !== "") {
                            var result = getJSON().parse(response);
                            if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                                result.itemsReceived - result.itemsAccepted === result.errors.length) {
                                return result;
                            }
                        }
                    }
                    catch (e) {
                        _throwInternal(_self.diagLog(), 1 , 43 , "Cannot parse the response. " + getExceptionName(e), {
                            response: response
                        });
                    }
                    return null;
                }
                function _resendPayload(payload, linearFactor) {
                    if (linearFactor === void 0) { linearFactor = 1; }
                    if (!payload || payload.length === 0) {
                        return;
                    }
                    var buffer = _self._buffer;
                    buffer.clearSent(payload);
                    _consecutiveErrors++;
                    for (var _i = 0, payload_1 = payload; _i < payload_1.length; _i++) {
                        var item = payload_1[_i];
                        buffer.enqueue(item);
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
                        var timerValue = Math.max(_self._senderConfig.maxBatchInterval(), retryInterval);
                        _timeoutHandle = setTimeout(function () {
                            _timeoutHandle = null;
                            _self.triggerSend(true, null, 1 );
                        }, timerValue);
                    }
                }
                function _clearScheduledTimer() {
                    clearTimeout(_timeoutHandle);
                    _timeoutHandle = null;
                    _retryAt = null;
                }
                function _isRetriable(statusCode) {
                    return statusCode === 408
                        || statusCode === 429
                        || statusCode === 500
                        || statusCode === 503;
                }
                function _formatErrorMessageXhr(xhr, message) {
                    if (xhr) {
                        return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + _getResponseText(xhr) || xhr.response || "";
                    }
                    return message;
                }
                function _xdrSender(payload, isAsync) {
                    var buffer = _self._buffer;
                    var _window = getWindow();
                    var xdr = new XDomainRequest();
                    xdr.onload = function () { return _self._xdrOnLoad(xdr, payload); };
                    xdr.onerror = function (event) { return _self._onError(payload, _formatErrorMessageXdr(xdr), event); };
                    var hostingProtocol = _window && _window.location && _window.location.protocol || "";
                    if (_self._senderConfig.endpointUrl().lastIndexOf(hostingProtocol, 0) !== 0) {
                        _throwInternal(_self.diagLog(), 2 , 40 , ". " +
                            "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");
                        buffer.clear();
                        return;
                    }
                    var endpointUrl = _self._senderConfig.endpointUrl().replace(/^(https?:)/, "");
                    xdr.open("POST", endpointUrl);
                    var batch = buffer.batchPayloads(payload);
                    xdr.send(batch);
                    buffer.markAsSent(payload);
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
                    if (manager && manager.eventsSendRequest) {
                        try {
                            manager.eventsSendRequest(sendRequest, isAsync);
                        }
                        catch (e) {
                            _throwInternal(_self.diagLog(), 1 , 74 , "send request notification failed: " + getExceptionName(e), { exception: dumpObj(e) });
                        }
                    }
                }
                function _validateInstrumentationKey(config) {
                    var disableIKeyValidationFlag = isNullOrUndefined(config.disableInstrumentationKeyValidation) ? false : config.disableInstrumentationKeyValidation;
                    if (disableIKeyValidationFlag) {
                        return true;
                    }
                    var UUID_Regex = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                    var regexp = new RegExp(UUID_Regex);
                    return regexp.test(config.instrumentationKey);
                }
                function _initDefaults() {
                    _self._sender = null;
                    _self._buffer = null;
                    _self._appId = null;
                    _self._sample = null;
                    _headers = {};
                    _offlineListener = null;
                    _consecutiveErrors = 0;
                    _retryAt = null;
                    _lastSend = null;
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
                if (!isFunction(config.sessionExpirationMs)) {
                    config.sessionExpirationMs = function () { return _SessionManager.acquisitionSpan; };
                }
                if (!isFunction(config.sessionRenewalMs)) {
                    config.sessionRenewalMs = function () { return _SessionManager.renewalSpan; };
                }
                _self.config = config;
                var sessionCookiePostfix = (_self.config.sessionCookiePostfix && _self.config.sessionCookiePostfix()) ?
                    _self.config.sessionCookiePostfix() :
                    ((_self.config.namePrefix && _self.config.namePrefix()) ? _self.config.namePrefix() : "");
                _storageNamePrefix = function () { return cookieNameConst + sessionCookiePostfix; };
                _self.automaticSession = new Session();
                _self.update = function () {
                    var nowMs = dateNow();
                    var isExpired = false;
                    var session = _self.automaticSession;
                    if (!session.id) {
                        isExpired = !_initializeAutomaticSession(session);
                    }
                    var sessionExpirationMs = _self.config.sessionExpirationMs();
                    if (!isExpired && sessionExpirationMs > 0) {
                        var sessionRenewalMs = _self.config.sessionRenewalMs();
                        var timeSinceAcqMs = nowMs - session.acquisitionDate;
                        var timeSinceRenewalMs = nowMs - session.renewalDate;
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
                    var session = _self.automaticSession;
                    _setStorage(session.id, session.acquisitionDate, session.renewalDate);
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
                    if (tokens.length >= 2) {
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
                                session.acquisitionDate = acqMs;
                                session.renewalDate = renewalMs;
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
                    var theConfig = (_self.config || {});
                    var getNewId = (theConfig.getNewId ? theConfig.getNewId() : null) || newId;
                    _self.automaticSession.id = getNewId(theConfig.idLength ? theConfig.idLength() : 22);
                    _self.automaticSession.acquisitionDate = nowMs;
                    _setCookie(_self.automaticSession, nowMs);
                    if (!utlCanUseLocalStorage()) {
                        _throwInternal(_logger, 2 , 0 , "Browser does not support local storage. Session durations will be inaccurate.");
                    }
                }
                function _setCookie(session, nowMs) {
                    var acq = session.acquisitionDate;
                    session.renewalDate = nowMs;
                    var config = _self.config;
                    var renewalPeriodMs = config.sessionRenewalMs();
                    var acqTimeLeftMs = (acq + config.sessionExpirationMs()) - nowMs;
                    var cookie = [session.id, acq, nowMs];
                    var maxAgeSec = 0;
                    if (acqTimeLeftMs < renewalPeriodMs) {
                        maxAgeSec = acqTimeLeftMs / 1000;
                    }
                    else {
                        maxAgeSec = renewalPeriodMs / 1000;
                    }
                    var cookieDomain = config.cookieDomain ? config.cookieDomain() : null;
                    _cookieManager.set(_storageNamePrefix(), cookie.join("|"), config.sessionExpirationMs() > 0 ? maxAgeSec : null, cookieDomain);
                    _cookieUpdatedTimestamp = nowMs;
                }
                function _setStorage(guid, acq, renewal) {
                    utlSetLocalStorage(_logger, _storageNamePrefix(), [guid, acq, renewal].join("|"));
                }
            });
        }
        _SessionManager.acquisitionSpan = 86400000;
        _SessionManager.renewalSpan = 1800000;
        _SessionManager.cookieUpdateInterval = 60000;
        return _SessionManager;
    }());

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

    var Version = "2.8.3";
    var Internal = /** @class */ (function () {
        function Internal(config) {
            this.sdkVersion = (config.sdkExtension && config.sdkExtension() ? config.sdkExtension() + "_" : "") + "javascript:" + Version;
        }
        return Internal;
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
                _self.config = config;
                var userCookiePostfix = (_self.config.userCookiePostfix && _self.config.userCookiePostfix()) ? _self.config.userCookiePostfix() : "";
                _storageNamePrefix = function () { return User.userCookieName + userCookiePostfix; };
                var cookie = _cookieManager.get(_storageNamePrefix());
                if (cookie) {
                    _self.isNewUser = false;
                    var params = cookie.split(User.cookieSeparator);
                    if (params.length > 0) {
                        _self.id = params[0];
                        _self.isUserCookieSet = !!_self.id;
                    }
                }
                function _generateNewId() {
                    var theConfig = (config || {});
                    var getNewId = (theConfig.getNewId ? theConfig.getNewId() : null) || newId;
                    var id = getNewId(theConfig.idLength ? config.idLength() : 22);
                    return id;
                }
                function _generateNewCookie(userId) {
                    var acqStr = toISOString(new Date());
                    _self.accountAcquisitionDate = acqStr;
                    _self.isNewUser = true;
                    var newCookie = [userId, acqStr];
                    return newCookie;
                }
                function _setUserCookie(cookie) {
                    var oneYear = 31536000;
                    _self.isUserCookieSet = _cookieManager.set(_storageNamePrefix(), cookie, oneYear);
                }
                if (!_self.id) {
                    _self.id = _generateNewId();
                    var newCookie = _generateNewCookie(_self.id);
                    _setUserCookie(newCookie.join(User.cookieSeparator));
                    var name_1 = config.namePrefix && config.namePrefix() ? config.namePrefix() + "ai_session" : "ai_session";
                    utlRemoveStorage(_logger, name_1);
                }
                _self.accountId = config.accountId ? config.accountId() : undefined;
                var authCookie = _cookieManager.get(User.authUserCookieName);
                if (authCookie) {
                    authCookie = decodeURI(authCookie);
                    var authCookieString = authCookie.split(User.cookieSeparator);
                    if (authCookieString[0]) {
                        _self.authenticatedId = authCookieString[0];
                    }
                    if (authCookieString.length > 1 && authCookieString[1]) {
                        _self.accountId = authCookieString[1];
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
                    _self.authenticatedId = authenticatedUserId;
                    var authCookie = _self.authenticatedId;
                    if (accountId) {
                        _self.accountId = accountId;
                        authCookie = [_self.authenticatedId, _self.accountId].join(User.cookieSeparator);
                    }
                    if (storeInCookie) {
                        _cookieManager.set(User.authUserCookieName, encodeURI(authCookie));
                    }
                };
                _self.clearAuthenticatedUserContext = function () {
                    _self.authenticatedId = null;
                    _self.accountId = null;
                    _cookieManager.del(User.authUserCookieName);
                };
                _self.update = function (userId) {
                    if (_self.id !== userId || !_self.isUserCookieSet) {
                        var user_id = userId ? userId : _generateNewId();
                        var user_cookie = _generateNewCookie(user_id);
                        _setUserCookie(user_cookie.join(User.cookieSeparator));
                    }
                };
            });
        }
        User.cookieSeparator = "|";
        User.userCookieName = "ai_user";
        User.authUserCookieName = "ai_authUser";
        return User;
    }());

    var Location = /** @class */ (function () {
        function Location() {
        }
        return Location;
    }());

    var TelemetryTrace = /** @class */ (function () {
        function TelemetryTrace(id, parentId, name, logger) {
            var _self = this;
            _self.traceID = id || generateW3CId();
            _self.parentID = parentId;
            _self.name = name;
            var location = getLocation();
            if (!name && location && location.pathname) {
                _self.name = location.pathname;
            }
            _self.name = dataSanitizeString(logger, _self.name);
        }
        return TelemetryTrace;
    }());

    var strExt = "ext";
    var strTags = "tags";
    function _removeEmpty(target, name) {
        if (target && target[name] && objKeys(target[name]).length === 0) {
            delete target[name];
        }
    }
    var TelemetryContext = /** @class */ (function () {
        function TelemetryContext(core, defaultConfig) {
            var _this = this;
            var logger = core.logger;
            this.appId = function () { return null; };
            this.getSessionId = function () { return null; };
            dynamicProto(TelemetryContext, this, function (_self) {
                _self.application = new Application();
                _self.internal = new Internal(defaultConfig);
                if (hasWindow()) {
                    _self.sessionManager = new _SessionManager(defaultConfig, core);
                    _self.device = new Device();
                    _self.location = new Location();
                    _self.user = new User(defaultConfig, core);
                    _self.telemetryTrace = new TelemetryTrace(undefined, undefined, undefined, logger);
                    _self.session = new Session();
                }
                _self.getSessionId = function () {
                    var session = _self.session;
                    var sesId = null;
                    if (session && isString(session.id)) {
                        sesId = session.id;
                    }
                    else {
                        var autoSession = (_self.sessionManager || {}).automaticSession;
                        sesId = autoSession && isString(autoSession.id) ? autoSession.id : null;
                    }
                    return sesId;
                };
                _self.applySessionContext = function (evt, itemCtx) {
                    setValue(getSetValue(evt.ext, Extensions.AppExt), "sesId", _self.getSessionId(), isString);
                };
                _self.applyOperatingSystemContxt = function (evt, itemCtx) {
                    setValue(evt.ext, Extensions.OSExt, _self.os);
                };
                _self.applyApplicationContext = function (evt, itemCtx) {
                    var application = _self.application;
                    if (application) {
                        var tags = getSetValue(evt, strTags);
                        setValue(tags, CtxTagKeys.applicationVersion, application.ver, isString);
                        setValue(tags, CtxTagKeys.applicationBuild, application.build, isString);
                    }
                };
                _self.applyDeviceContext = function (evt, itemCtx) {
                    var device = _self.device;
                    if (device) {
                        var extDevice = getSetValue(getSetValue(evt, strExt), Extensions.DeviceExt);
                        setValue(extDevice, "localId", device.id, isString);
                        setValue(extDevice, "ip", device.ip, isString);
                        setValue(extDevice, "model", device.model, isString);
                        setValue(extDevice, "deviceClass", device.deviceClass, isString);
                    }
                };
                _self.applyInternalContext = function (evt, itemCtx) {
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
                _self.applyLocationContext = function (evt, itemCtx) {
                    var location = _this.location;
                    if (location) {
                        setValue(getSetValue(evt, strTags, []), CtxTagKeys.locationIp, location.ip, isString);
                    }
                };
                _self.applyOperationContext = function (evt, itemCtx) {
                    var telemetryTrace = _self.telemetryTrace;
                    if (telemetryTrace) {
                        var extTrace = getSetValue(getSetValue(evt, strExt), Extensions.TraceExt, { traceID: undefined, parentID: undefined });
                        setValue(extTrace, "traceID", telemetryTrace.traceID, isString);
                        setValue(extTrace, "name", telemetryTrace.name, isString);
                        setValue(extTrace, "parentID", telemetryTrace.parentID, isString);
                    }
                };
                _self.applyWebContext = function (evt, itemCtx) {
                    var web = _this.web;
                    if (web) {
                        setValue(getSetValue(evt, strExt), Extensions.WebExt, web);
                    }
                };
                _self.applyUserContext = function (evt, itemCtx) {
                    var user = _self.user;
                    if (user) {
                        var tags = getSetValue(evt, strTags, []);
                        setValue(tags, CtxTagKeys.userAccountId, user.accountId, isString);
                        var extUser = getSetValue(getSetValue(evt, strExt), Extensions.UserExt);
                        setValue(extUser, "id", user.id, isString);
                        setValue(extUser, "authId", user.authenticatedId, isString);
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
        return TelemetryContext;
    }());

    var PropertiesPlugin = /** @class */ (function (_super) {
        __extendsFn(PropertiesPlugin, _super);
        function PropertiesPlugin() {
            var _this = _super.call(this) || this;
            _this.priority = 110;
            _this.identifier = PropertiesPluginIdentifier;
            var _breezeChannel;
            var _extensionConfig;
            dynamicProto(PropertiesPlugin, _this, function (_self, _base) {
                _self.initialize = function (config, core, extensions, pluginChain) {
                    _base.initialize(config, core, extensions, pluginChain);
                    var ctx = _self._getTelCtx();
                    var identifier = _self.identifier;
                    var defaultConfig = PropertiesPlugin.getDefaultConfig();
                    _extensionConfig = _extensionConfig || {};
                    objForEachKey(defaultConfig, function (field, value) {
                        _extensionConfig[field] = function () { return ctx.getConfig(identifier, field, value()); };
                    });
                    _self.context = new TelemetryContext(core, _extensionConfig);
                    _breezeChannel = getExtensionByName(extensions, BreezeChannelIdentifier);
                    _self.context.appId = function () { return _breezeChannel ? _breezeChannel["_appId"] : null; };
                    _self["_extConfig"] = _extensionConfig;
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
                            if (typeof _self.context.session.id !== "string" && theContext.sessionManager) {
                                theContext.sessionManager.update();
                            }
                        }
                        var userCtx = theContext.user;
                        if (userCtx && !userCtx.isUserCookieSet) {
                            userCtx.update(theContext.user.id);
                        }
                        _processTelemetryInternal(event, itemCtx);
                        if (userCtx && userCtx.isNewUser) {
                            userCtx.isNewUser = false;
                            var message = new _InternalLogMessage(72 , ((getNavigator() || {}).userAgent || ""));
                            _logInternalMessage(itemCtx.diagLog(), 1 , message);
                        }
                        _self.processNext(event, itemCtx);
                    }
                };
                function _processTelemetryInternal(evt, itemCtx) {
                    getSetValue(evt, "tags", []);
                    getSetValue(evt, "ext", {});
                    var ctx = _self.context;
                    ctx.applySessionContext(evt, itemCtx);
                    ctx.applyApplicationContext(evt, itemCtx);
                    ctx.applyDeviceContext(evt, itemCtx);
                    ctx.applyOperationContext(evt, itemCtx);
                    ctx.applyUserContext(evt, itemCtx);
                    ctx.applyOperatingSystemContxt(evt, itemCtx);
                    ctx.applyWebContext(evt, itemCtx);
                    ctx.applyLocationContext(evt, itemCtx);
                    ctx.applyInternalContext(evt, itemCtx);
                    ctx.cleanUp(evt, itemCtx);
                }
            });
            return _this;
        }
        PropertiesPlugin.getDefaultConfig = function () {
            var defaultConfig = {
                instrumentationKey: function () { return undefined; },
                accountId: function () { return null; },
                sessionRenewalMs: function () { return 30 * 60 * 1000; },
                samplingPercentage: function () { return 100; },
                sessionExpirationMs: function () { return 24 * 60 * 60 * 1000; },
                cookieDomain: function () { return null; },
                sdkExtension: function () { return null; },
                isBrowserLinkTrackingEnabled: function () { return false; },
                appId: function () { return null; },
                getSessionId: function () { return null; },
                namePrefix: function () { return undefined; },
                sessionCookiePostfix: function () { return undefined; },
                userCookiePostfix: function () { return undefined; },
                idLength: function () { return 22; },
                getNewId: function () { return null; }
            };
            return defaultConfig;
        };
        return PropertiesPlugin;
    }(BaseTelemetryPlugin));
    var PropertiesPlugin$1 = PropertiesPlugin;

    var strProperties = "properties";
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
        var resourceEntry = ajaxData.perfTiming;
        var props = dependency[strProperties] || {};
        var propsSet = 0;
        var strName = "name";
        var strStart = "Start";
        var strEnd = "End";
        var strDomainLookup = "domainLookup";
        var strConnect = "connect";
        var strRedirect = "redirect";
        var strRequest = "request";
        var strResponse = "response";
        var strDuration = "duration";
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
            var duration = resourceEntry[strDuration];
            if (!duration) {
                duration = _calcPerfDuration(resourceEntry, strStartTime, strResponseEnd) || 0;
            }
            propsSet |= _setPerfValue(props, strDuration, duration);
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
            if (ajaxData.perfMark) {
                propsSet |= _setPerfValue(props, "missing", ajaxData.perfAttempts);
            }
        }
        if (propsSet) {
            dependency[strProperties] = props;
        }
    }
    var XHRMonitoringState = /** @class */ (function () {
        function XHRMonitoringState() {
            var self = this;
            self.openDone = false;
            self.setRequestHeaderDone = false;
            self.sendDone = false;
            self.abortDone = false;
            self.stateChangeAttached = false;
        }
        return XHRMonitoringState;
    }());
    var ajaxRecord = /** @class */ (function () {
        function ajaxRecord(traceID, spanID, logger) {
            var self = this;
            var _logger = logger;
            var strResponseText = "responseText";
            self.perfMark = null;
            self.completed = false;
            self.requestHeadersSize = null;
            self.requestHeaders = null;
            self.responseReceivingDuration = null;
            self.callbackDuration = null;
            self.ajaxTotalDuration = null;
            self.aborted = 0;
            self.pageUrl = null;
            self.requestUrl = null;
            self.requestSize = 0;
            self.method = null;
            self.status = null;
            self.requestSentTime = null;
            self.responseStartedTime = null;
            self.responseFinishedTime = null;
            self.callbackFinishedTime = null;
            self.endTime = null;
            self.xhrMonitoringState = new XHRMonitoringState();
            self.clientFailure = 0;
            self.traceID = traceID;
            self.spanID = spanID;
            dynamicProto(ajaxRecord, self, function (self) {
                self.getAbsoluteUrl = function () {
                    return self.requestUrl ? urlGetAbsoluteUrl(self.requestUrl) : null;
                };
                self.getPathName = function () {
                    return self.requestUrl ? dataSanitizeUrl(_logger, urlGetCompleteUrl(self.method, self.requestUrl)) : null;
                };
                self.CreateTrackItem = function (ajaxType, enableRequestHeaderTracking, getResponse) {
                    var _a;
                    self.ajaxTotalDuration = Math.round(dateTimeUtilsDuration(self.requestSentTime, self.responseFinishedTime) * 1000) / 1000;
                    if (self.ajaxTotalDuration < 0) {
                        return null;
                    }
                    var dependency = (_a = {
                            id: "|" + self.traceID + "." + self.spanID,
                            target: self.getAbsoluteUrl(),
                            name: self.getPathName(),
                            type: ajaxType,
                            startTime: null,
                            duration: self.ajaxTotalDuration,
                            success: (+(self.status)) >= 200 && (+(self.status)) < 400,
                            responseCode: (+(self.status)),
                            method: self.method
                        },
                        _a[strProperties] = { HttpMethod: self.method },
                        _a);
                    if (self.requestSentTime) {
                        dependency.startTime = new Date();
                        dependency.startTime.setTime(self.requestSentTime);
                    }
                    _populatePerfData(self, dependency);
                    if (enableRequestHeaderTracking) {
                        if (objKeys(self.requestHeaders).length > 0) {
                            dependency[strProperties] = dependency[strProperties] || {};
                            dependency[strProperties].requestHeaders = self.requestHeaders;
                        }
                    }
                    if (getResponse) {
                        var response = getResponse();
                        if (response) {
                            var correlationContext = response.correlationContext;
                            if (correlationContext) {
                                dependency.correlationContext =  correlationContext;
                            }
                            if (response.headerMap) {
                                if (objKeys(response.headerMap).length > 0) {
                                    dependency[strProperties] = dependency[strProperties] || {};
                                    dependency[strProperties].responseHeaders = response.headerMap;
                                }
                            }
                            if (self.errorStatusText && self.status >= 400) {
                                var responseType = response.type;
                                dependency[strProperties] = dependency[strProperties] || {};
                                if (responseType === "" || responseType === "text") {
                                    dependency[strProperties][strResponseText] = response[strResponseText] ? response.statusText + " - " + response[strResponseText] : response.statusText;
                                }
                                if (responseType === "json") {
                                    dependency[strProperties][strResponseText] = response.response ? response.statusText + " - " + JSON.stringify(response.response) : response.statusText;
                                }
                            }
                        }
                    }
                    return dependency;
                };
            });
        }
        return ajaxRecord;
    }());

    var AJAX_MONITOR_PREFIX = "ai.ajxmn.";
    var strDiagLog = "diagLog";
    var strAjaxData = "ajaxData";
    var strFetch = "fetch";
    var strTrackDependencyDataInternal = "trackDependencyDataInternal";
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
            if (!isNullOrUndefined(xhr) &&
                !isNullOrUndefined(xhr[strAjaxData]) &&
                !isNullOrUndefined(xhr[strAjaxData].requestUrl)) {
                result += "(url: '" + xhr[strAjaxData].requestUrl + "')";
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
                ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(args.inst),
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
                    _self[strTrackDependencyDataInternal](dependency, properties);
                };
                _self.includeCorrelationHeaders = function (ajaxData, input, init, xhr) {
                    var currentWindowHost = _self["_currentWindowHost"] || _currentWindowHost;
                    if (input) {
                        if (CorrelationIdHelper.canIncludeCorrelationHeader(_config, ajaxData.getAbsoluteUrl(), currentWindowHost)) {
                            if (!init) {
                                init = {};
                            }
                            init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                            if (_isUsingAIHeaders) {
                                var id = "|" + ajaxData.traceID + "." + ajaxData.spanID;
                                init.headers.set(RequestHeaders[3 ], id);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[3 ]] = id;
                                }
                            }
                            var appId = _config.appId || (_context && _context.appId());
                            if (appId) {
                                init.headers.set(RequestHeaders[0 ], RequestHeaders[2 ] + appId);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[0 ]] = RequestHeaders[2 ] + appId;
                                }
                            }
                            if (_isUsingW3CHeaders) {
                                var traceParent = formatTraceParent(createTraceParent(ajaxData.traceID, ajaxData.spanID, 0x01));
                                init.headers.set(RequestHeaders[4 ], traceParent);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[4 ]] = traceParent;
                                }
                            }
                        }
                        return init;
                    }
                    else if (xhr) {
                        if (CorrelationIdHelper.canIncludeCorrelationHeader(_config, ajaxData.getAbsoluteUrl(), currentWindowHost)) {
                            if (_isUsingAIHeaders) {
                                var id = "|" + ajaxData.traceID + "." + ajaxData.spanID;
                                xhr.setRequestHeader(RequestHeaders[3 ], id);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[3 ]] = id;
                                }
                            }
                            var appId = _config.appId || (_context && _context.appId());
                            if (appId) {
                                xhr.setRequestHeader(RequestHeaders[0 ], RequestHeaders[2 ] + appId);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[0 ]] = RequestHeaders[2 ] + appId;
                                }
                            }
                            if (_isUsingW3CHeaders) {
                                var traceParent = formatTraceParent(createTraceParent(ajaxData.traceID, ajaxData.spanID, 0x01));
                                xhr.setRequestHeader(RequestHeaders[4 ], traceParent);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[4 ]] = traceParent;
                                }
                            }
                        }
                        return xhr;
                    }
                    return undefined;
                };
                _self[strTrackDependencyDataInternal] = function (dependency, properties, systemProperties) {
                    if (_maxAjaxCallsPerView === -1 || _trackAjaxAttempts < _maxAjaxCallsPerView) {
                        if ((_config.distributedTracingMode === 2
                            || _config.distributedTracingMode === 1 )
                            && typeof dependency.id === "string" && dependency.id[dependency.id.length - 1] !== ".") {
                            dependency.id += ".";
                        }
                        if (isNullOrUndefined(dependency.startTime)) {
                            dependency.startTime = new Date();
                        }
                        var item = createTelemetryItem(dependency, RemoteDependencyData.dataType, RemoteDependencyData.envelopeType, _self[strDiagLog](), properties, systemProperties);
                        _self.core.track(item);
                    }
                    else if (_trackAjaxAttempts === _maxAjaxCallsPerView) {
                        _throwInternalCritical(_self, 55 , "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.", true);
                    }
                    ++_trackAjaxAttempts;
                };
                function _initDefaults() {
                    var location = getLocation();
                    _fetchInitialized = false;
                    _xhrInitialized = false;
                    _currentWindowHost = location && location.host && location.host.toLowerCase();
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
                }
                function _populateDefaults(config) {
                    var ctx = createProcessTelemetryContext(null, config, _self.core);
                    _config = AjaxMonitor.getEmptyConfig();
                    var defaultConfig = AjaxMonitor.getDefaultConfig();
                    objForEachKey(defaultConfig, function (field, value) {
                        _config[field] = ctx.getConfig(AjaxMonitor.identifier, field, value);
                    });
                    var distributedTracingMode = _config.distributedTracingMode;
                    _enableRequestHeaderTracking = _config.enableRequestHeaderTracking;
                    _enableAjaxErrorStatusText = _config.enableAjaxErrorStatusText;
                    _enableAjaxPerfTracking = _config.enableAjaxPerfTracking;
                    _maxAjaxCallsPerView = _config.maxAjaxCallsPerView;
                    _enableResponseHeaderTracking = _config.enableResponseHeaderTracking;
                    _excludeRequestFromAutoTrackingPatterns = _config.excludeRequestFromAutoTrackingPatterns;
                    _addRequestContext = _config.addRequestContext;
                    _isUsingAIHeaders = distributedTracingMode === 0  || distributedTracingMode === 1 ;
                    _isUsingW3CHeaders = distributedTracingMode === 1  || distributedTracingMode === 2 ;
                    if (_enableAjaxPerfTracking) {
                        var iKey = config.instrumentationKey || "unkwn";
                        if (iKey.length > 5) {
                            _markPrefix = AJAX_MONITOR_PREFIX + iKey.substring(iKey.length - 5) + ".";
                        }
                        else {
                            _markPrefix = AJAX_MONITOR_PREFIX + iKey + ".";
                        }
                    }
                    _disableAjaxTracking = !!_config.disableAjaxTracking;
                    _disableFetchTracking = !!_config.disableFetchTracking;
                }
                function _populateContext() {
                    var propExt = _self.core.getPlugin(PropertiesPluginIdentifier);
                    if (propExt) {
                        _context = propExt.plugin.context;
                    }
                }
                function _canIncludeHeaders(header) {
                    var rlt = true;
                    if (header || _config.ignoreHeaders) {
                        arrForEach(_config.ignoreHeaders, (function (key) {
                            if (key.toLowerCase() === header.toLowerCase()) {
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
                                    var newInit = _self.includeCorrelationHeaders(fetchData, input, init);
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
                                            _reportFetchMetrics(callDetails, (response || {}).status, input, response, fetchData_1, function () {
                                                var ajaxResponse = {
                                                    statusText: response.statusText,
                                                    headerMap: null,
                                                    correlationContext: _getFetchCorrelationContext(response)
                                                };
                                                if (_enableResponseHeaderTracking) {
                                                    var responseHeaderMap_1 = {};
                                                    response.headers.forEach(function (value, name) {
                                                        if (_canIncludeHeaders(name)) {
                                                            responseHeaderMap_1[name] = value;
                                                        }
                                                    });
                                                    ajaxResponse.headerMap = responseHeaderMap_1;
                                                }
                                                return ajaxResponse;
                                            });
                                            return response;
                                        })["catch"](function (reason) {
                                            _reportFetchMetrics(callDetails, 0, input, null, fetchData_1, null, { error: reason.message });
                                            throw reason;
                                        });
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 15 , "Failed to monitor Window.fetch, monitoring data for this fetch call may be incorrect.")
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
                                    var xhr = args.inst;
                                    var ajaxData = xhr[strAjaxData];
                                    if (!_isDisabledRequest(xhr, url) && _isMonitoredXhrInstance(xhr, true)) {
                                        if (!ajaxData || !ajaxData.xhrMonitoringState.openDone) {
                                            _openHandler(xhr, method, url, async);
                                        }
                                        _attachToOnReadyStateChange(xhr);
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 15 , "Failed to monitor XMLHttpRequest.open, monitoring data for this ajax call may be incorrect.")
                        });
                        _hookProto(XMLHttpRequest, "send", {
                            ns: _evtNamespace,
                            req: function (args, context) {
                                if (!_disableAjaxTracking) {
                                    var xhr = args.inst;
                                    var ajaxData = xhr[strAjaxData];
                                    if (_isMonitoredXhrInstance(xhr) && !ajaxData.xhrMonitoringState.sendDone) {
                                        _createMarkId("xhr", ajaxData);
                                        ajaxData.requestSentTime = dateTimeUtilsNow();
                                        _self.includeCorrelationHeaders(ajaxData, undefined, undefined, xhr);
                                        ajaxData.xhrMonitoringState.sendDone = true;
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 17 , "Failed to monitor XMLHttpRequest, monitoring data for this ajax call may be incorrect.")
                        });
                        _hookProto(XMLHttpRequest, "abort", {
                            ns: _evtNamespace,
                            req: function (args) {
                                if (!_disableAjaxTracking) {
                                    var xhr = args.inst;
                                    var ajaxData = xhr[strAjaxData];
                                    if (_isMonitoredXhrInstance(xhr) && !ajaxData.xhrMonitoringState.abortDone) {
                                        ajaxData.aborted = 1;
                                        ajaxData.xhrMonitoringState.abortDone = true;
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 13 , "Failed to monitor XMLHttpRequest.abort, monitoring data for this ajax call may be incorrect.")
                        });
                        _hookProto(XMLHttpRequest, "setRequestHeader", {
                            ns: _evtNamespace,
                            req: function (args, header, value) {
                                if (!_disableAjaxTracking && _enableRequestHeaderTracking) {
                                    var xhr = args.inst;
                                    if (_isMonitoredXhrInstance(xhr) && _canIncludeHeaders(header)) {
                                        xhr[strAjaxData].requestHeaders[header] = value;
                                    }
                                }
                            },
                            hkErr: _createErrorCallbackFunc(_self, 71 , "Failed to monitor XMLHttpRequest.setRequestHeader, monitoring data for this ajax call may be incorrect.")
                        });
                        _xhrInitialized = true;
                    }
                }
                function _isDisabledRequest(xhr, request, init) {
                    var isDisabled = false;
                    var theUrl = ((!isString(request) ? (request || {}).url || "" : request) || "").toLowerCase();
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
                function _openHandler(xhr, method, url, async) {
                    var traceID = (_context && _context.telemetryTrace && _context.telemetryTrace.traceID) || generateW3CId();
                    var spanID = generateW3CId().substr(0, 16);
                    var ajaxData = new ajaxRecord(traceID, spanID, _self[strDiagLog]());
                    ajaxData.method = method;
                    ajaxData.requestUrl = url;
                    ajaxData.xhrMonitoringState.openDone = true;
                    ajaxData.requestHeaders = {};
                    ajaxData.async = async;
                    ajaxData.errorStatusText = _enableAjaxErrorStatusText;
                    xhr[strAjaxData] = ajaxData;
                }
                function _attachToOnReadyStateChange(xhr) {
                    xhr[strAjaxData].xhrMonitoringState.stateChangeAttached = eventOn(xhr, "readystatechange", function () {
                        try {
                            if (xhr && xhr.readyState === 4 && _isMonitoredXhrInstance(xhr)) {
                                _onAjaxComplete(xhr);
                            }
                        }
                        catch (e) {
                            var exceptionText = dumpObj(e);
                            if (!exceptionText || _indexOf(exceptionText.toLowerCase(), "c00c023f") === -1) {
                                _throwInternalCritical(_self, 16 , "Failed to monitor XMLHttpRequest 'readystatechange' event handler, monitoring data for this ajax call may be incorrect.", {
                                    ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(xhr),
                                    exception: exceptionText
                                });
                            }
                        }
                    }, _evtNamespace);
                }
                function _getResponseText(xhr) {
                    try {
                        var responseType = xhr.responseType;
                        if (responseType === "" || responseType === "text") {
                            return xhr.responseText;
                        }
                    }
                    catch (e) {
                    }
                    return null;
                }
                function _onAjaxComplete(xhr) {
                    var ajaxData = xhr[strAjaxData];
                    ajaxData.responseFinishedTime = dateTimeUtilsNow();
                    ajaxData.status = xhr.status;
                    function _reportXhrError(e, failedProps) {
                        var errorProps = failedProps || {};
                        errorProps["ajaxDiagnosticsMessage"] = _getFailedAjaxDiagnosticsMessage(xhr);
                        if (e) {
                            errorProps["exception"] = dumpObj(e);
                        }
                        _throwInternalWarning(_self, 14 , "Failed to calculate the duration of the ajax call, monitoring data for this ajax call won't be sent.", errorProps);
                    }
                    _findPerfResourceEntry("xmlhttprequest", ajaxData, function () {
                        try {
                            var dependency = ajaxData.CreateTrackItem("Ajax", _enableRequestHeaderTracking, function () {
                                var ajaxResponse = {
                                    statusText: xhr.statusText,
                                    headerMap: null,
                                    correlationContext: _getAjaxCorrelationContext(xhr),
                                    type: xhr.responseType,
                                    responseText: _getResponseText(xhr),
                                    response: xhr.response
                                };
                                if (_enableResponseHeaderTracking) {
                                    var headers = xhr.getAllResponseHeaders();
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
                                        ajaxResponse.headerMap = responseHeaderMap_2;
                                    }
                                }
                                return ajaxResponse;
                            });
                            var properties = void 0;
                            try {
                                if (!!_addRequestContext) {
                                    properties = _addRequestContext({ status: xhr.status, xhr: xhr });
                                }
                            }
                            catch (e) {
                                _throwInternalWarning(_self, 104 , "Failed to add custom defined request context as configured call back may missing a null check.");
                            }
                            if (dependency) {
                                if (properties !== undefined) {
                                    dependency.properties = __assignFn(__assignFn({}, dependency.properties), properties);
                                }
                                _self[strTrackDependencyDataInternal](dependency);
                            }
                            else {
                                _reportXhrError(null, {
                                    requestSentTime: ajaxData.requestSentTime,
                                    responseFinishedTime: ajaxData.responseFinishedTime
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
                    try {
                        var responseHeadersString = xhr.getAllResponseHeaders();
                        if (responseHeadersString !== null) {
                            var index = _indexOf(responseHeadersString.toLowerCase(), RequestHeaders[8 ]);
                            if (index !== -1) {
                                var responseHeader = xhr.getResponseHeader(RequestHeaders[0 ]);
                                return CorrelationIdHelper.getCorrelationContext(responseHeader);
                            }
                        }
                    }
                    catch (e) {
                        _throwInternalWarning(_self, 18 , "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                            ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(xhr),
                            exception: dumpObj(e)
                        });
                    }
                }
                function _createMarkId(type, ajaxData) {
                    if (ajaxData.requestUrl && _markPrefix && _enableAjaxPerfTracking) {
                        var performance_1 = getPerformance();
                        if (performance_1 && isFunction(performance_1.mark)) {
                            _markCount++;
                            var markId = _markPrefix + type + "#" + _markCount;
                            performance_1.mark(markId);
                            var entries = performance_1.getEntriesByName(markId);
                            if (entries && entries.length === 1) {
                                ajaxData.perfMark = entries[0];
                            }
                        }
                    }
                }
                function _findPerfResourceEntry(initiatorType, ajaxData, trackCallback, reportError) {
                    var perfMark = ajaxData.perfMark;
                    var performance = getPerformance();
                    var maxAttempts = _config.maxAjaxPerfLookupAttempts;
                    var retryDelay = _config.ajaxPerfLookupDelay;
                    var requestUrl = ajaxData.requestUrl;
                    var attempt = 0;
                    (function locateResourceTiming() {
                        try {
                            if (performance && perfMark) {
                                attempt++;
                                var perfTiming = null;
                                var entries = performance.getEntries();
                                for (var lp = entries.length - 1; lp >= 0; lp--) {
                                    var entry = entries[lp];
                                    if (entry) {
                                        if (entry.entryType === "resource") {
                                            if (entry.initiatorType === initiatorType &&
                                                (_indexOf(entry.name, requestUrl) !== -1 || _indexOf(requestUrl, entry.name) !== -1)) {
                                                perfTiming = entry;
                                            }
                                        }
                                        else if (entry.entryType === "mark" && entry.name === perfMark.name) {
                                            ajaxData.perfTiming = perfTiming;
                                            break;
                                        }
                                        if (entry.startTime < perfMark.startTime - 1000) {
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!perfMark ||
                                ajaxData.perfTiming ||
                                attempt >= maxAttempts ||
                                ajaxData.async === false) {
                                if (perfMark && isFunction(performance.clearMarks)) {
                                    performance.clearMarks(perfMark.name);
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
                    var traceID = (_context && _context.telemetryTrace && _context.telemetryTrace.traceID) || generateW3CId();
                    var spanID = generateW3CId().substr(0, 16);
                    var ajaxData = new ajaxRecord(traceID, spanID, _self[strDiagLog]());
                    ajaxData.requestSentTime = dateTimeUtilsNow();
                    ajaxData.errorStatusText = _enableAjaxErrorStatusText;
                    if (input instanceof Request) {
                        ajaxData.requestUrl = input ? input.url : "";
                    }
                    else {
                        ajaxData.requestUrl = input;
                    }
                    var method = "GET";
                    if (init && init.method) {
                        method = init.method;
                    }
                    else if (input && input instanceof Request) {
                        method = input.method;
                    }
                    ajaxData.method = method;
                    var requestHeaders = {};
                    if (_enableRequestHeaderTracking) {
                        var headers = new Headers((init ? init.headers : 0) || (input instanceof Request ? (input.headers || {}) : {}));
                        headers.forEach(function (value, key) {
                            if (_canIncludeHeaders(key)) {
                                requestHeaders[key] = value;
                            }
                        });
                    }
                    ajaxData.requestHeaders = requestHeaders;
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
                        _throwInternalWarning(_self, msgId, "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.", errorProps);
                    }
                    ajaxData.responseFinishedTime = dateTimeUtilsNow();
                    ajaxData.status = status;
                    _findPerfResourceEntry("fetch", ajaxData, function () {
                        var dependency = ajaxData.CreateTrackItem("Fetch", _enableRequestHeaderTracking, getResponse);
                        var properties;
                        try {
                            if (!!_addRequestContext) {
                                properties = _addRequestContext({ status: status, request: input, response: response });
                            }
                        }
                        catch (e) {
                            _throwInternalWarning(_self, 104 , "Failed to add custom defined request context as configured call back may missing a null check.");
                        }
                        if (dependency) {
                            if (properties !== undefined) {
                                dependency.properties = __assignFn(__assignFn({}, dependency.properties), properties);
                            }
                            _self[strTrackDependencyDataInternal](dependency);
                        }
                        else {
                            _reportFetchError(14 , null, {
                                requestSentTime: ajaxData.requestSentTime,
                                responseFinishedTime: ajaxData.responseFinishedTime
                            });
                        }
                    }, function (e) {
                        _reportFetchError(18 , e, null);
                    });
                }
                function _getFetchCorrelationContext(response) {
                    if (response && response.headers) {
                        try {
                            var responseHeader = response.headers.get(RequestHeaders[0 ]);
                            return CorrelationIdHelper.getCorrelationContext(responseHeader);
                        }
                        catch (e) {
                            _throwInternalWarning(_self, 18 , "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                                fetchDiagnosticsMessage: _getFailedFetchDiagnosticsMessage(response),
                                exception: dumpObj(e)
                            });
                        }
                    }
                }
            });
            return _this;
        }
        AjaxMonitor.getDefaultConfig = function () {
            var config = {
                maxAjaxCallsPerView: 500,
                disableAjaxTracking: false,
                disableFetchTracking: false,
                excludeRequestFromAutoTrackingPatterns: undefined,
                disableCorrelationHeaders: false,
                distributedTracingMode: 1 ,
                correlationHeaderExcludedDomains: [
                    "*.blob.core.windows.net",
                    "*.blob.core.chinacloudapi.cn",
                    "*.blob.core.cloudapi.de",
                    "*.blob.core.usgovcloudapi.net"
                ],
                correlationHeaderDomains: undefined,
                correlationHeaderExcludePatterns: undefined,
                appId: undefined,
                enableCorsCorrelation: false,
                enableRequestHeaderTracking: false,
                enableResponseHeaderTracking: false,
                enableAjaxErrorStatusText: false,
                enableAjaxPerfTracking: false,
                maxAjaxPerfLookupAttempts: 3,
                ajaxPerfLookupDelay: 25,
                ignoreHeaders: [
                    "Authorization",
                    "X-API-Key",
                    "WWW-Authenticate"
                ],
                addRequestContext: undefined
            };
            return config;
        };
        AjaxMonitor.getEmptyConfig = function () {
            var emptyConfig = this.getDefaultConfig();
            objForEachKey(emptyConfig, function (value) {
                emptyConfig[value] = undefined;
            });
            return emptyConfig;
        };
        AjaxMonitor.prototype.processTelemetry = function (item, itemCtx) {
            this.processNext(item, itemCtx);
        };
        AjaxMonitor.identifier = "AjaxDependencyPlugin";
        return AjaxMonitor;
    }(BaseTelemetryPlugin));

    var _internalSdkSrc;
    var _ignoreUpdateSnippetProperties = [
        "snippet", "dependencies", "properties", "_snippetVersion", "appInsightsNew", "getSKUDefaults"
    ];
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
                _snippetVersion = "" + (snippet.sv || snippet.version || "");
                snippet.queue = snippet.queue || [];
                snippet.version = snippet.version || 2.0;
                var config = snippet.config || {};
                if (config.connectionString) {
                    var cs = parseConnectionString(config.connectionString);
                    var ingest = cs.ingestionendpoint;
                    config.endpointUrl = ingest ? "".concat(ingest, "/v2/track") : config.endpointUrl;
                    config.instrumentationKey = cs.instrumentationkey || config.instrumentationKey;
                }
                _self.appInsights = new AnalyticsPlugin();
                properties = new PropertiesPlugin$1();
                dependencies = new AjaxMonitor();
                _sender = new Sender();
                _core = new AppInsightsCore();
                _self.core = _core;
                _self.snippet = snippet;
                _self.config = config;
                _getSKUDefaults();
                _self.flush = function (async) {
                    if (async === void 0) { async = true; }
                    doPerf(_core, function () { return "AISKU.flush"; }, function () {
                        arrForEach(_core.getTransmissionControls(), function (channels) {
                            arrForEach(channels, function (channel) {
                                channel.flush(async);
                            });
                        });
                    }, null, async);
                };
                _self.onunloadFlush = function (async) {
                    if (async === void 0) { async = true; }
                    arrForEach(_core.getTransmissionControls(), function (channels) {
                        arrForEach(channels, function (channel) {
                            if (channel.onunloadFlush) {
                                channel.onunloadFlush();
                            }
                            else {
                                channel.flush(async);
                            }
                        });
                    });
                };
                _self.loadAppInsights = function (legacyMode, logger, notificationManager) {
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
                            if (_self.context && _self.context.internal) {
                                _self.context.internal.snippetVer = snippetVer || "-";
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
                    if (legacyMode && _self.config.extensions && _self.config.extensions.length > 0) {
                        throwError("Extensions not allowed in legacy mode");
                    }
                    doPerf(_self.core, function () { return "AISKU.loadAppInsights"; }, function () {
                        var extensions = [];
                        extensions.push(_sender);
                        extensions.push(properties);
                        extensions.push(dependencies);
                        extensions.push(_self.appInsights);
                        _core.initialize(_self.config, extensions, logger, notificationManager);
                        _self.context = properties.context;
                        if (_internalSdkSrc && _self.context) {
                            _self.context.internal.sdkSrc = _internalSdkSrc;
                        }
                        _updateSnippetProperties(_self.snippet);
                        _self.emptyQueue();
                        _self.pollInternalLogs();
                        _self.addHousekeepingBeforeUnload(_this);
                    });
                    return _self;
                };
                _self.updateSnippetDefinitions = function (snippet) {
                    proxyAssign(snippet, _self, function (name) {
                        return name && arrIndexOf(_ignoreUpdateSnippetProperties, name) === -1;
                    });
                };
                _self.emptyQueue = function () {
                    try {
                        if (isArray(_self.snippet.queue)) {
                            var length_1 = _self.snippet.queue.length;
                            for (var i = 0; i < length_1; i++) {
                                var call = _self.snippet.queue[i];
                                call();
                            }
                            _self.snippet.queue = undefined;
                            delete _self.snippet.queue;
                        }
                    }
                    catch (exception) {
                        var properties_1 = {};
                        if (exception && isFunction(exception.toString)) {
                            properties_1.exception = exception.toString();
                        }
                    }
                };
                _self.addHousekeepingBeforeUnload = function (appInsightsInstance) {
                    if (hasWindow() || hasDocument()) {
                        var performHousekeeping = function () {
                            appInsightsInstance.onunloadFlush(false);
                            if (isFunction(_this.core.getPlugin)) {
                                var loadedPlugin = _this.core.getPlugin(PropertiesPluginIdentifier);
                                if (loadedPlugin) {
                                    var propertiesPlugin = loadedPlugin.plugin;
                                    if (propertiesPlugin && propertiesPlugin.context && propertiesPlugin.context._sessionManager) {
                                        propertiesPlugin.context._sessionManager.backup();
                                    }
                                }
                            }
                        };
                        var added = false;
                        var excludePageUnloadEvents = appInsightsInstance.appInsights.config.disablePageUnloadEvents;
                        if (!_houseKeepingNamespace) {
                            _houseKeepingNamespace = mergeEvtNamespace(_evtNamespace, _core.evtNamespace && _core.evtNamespace());
                        }
                        if (!appInsightsInstance.appInsights.config.disableFlushOnBeforeUnload) {
                            if (addPageUnloadEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace)) {
                                added = true;
                            }
                            if (addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace)) {
                                added = true;
                            }
                            if (!added && !isReactNative()) {
                                _throwInternal(appInsightsInstance.appInsights.core.logger, 1 , 19 , "Could not add handler for beforeunload and pagehide");
                            }
                        }
                        if (!added && !appInsightsInstance.appInsights.config.disableFlushOnUnload) {
                            addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace);
                        }
                    }
                };
                _self.getSender = function () {
                    return _sender;
                };
                _self.unload = function (isAsync, unloadComplete, cbTimeout) {
                    _self.onunloadFlush(isAsync);
                    if (_houseKeepingNamespace) {
                        removePageUnloadEventListener(null, _houseKeepingNamespace);
                        removePageHideEventListener(null, _houseKeepingNamespace);
                    }
                    _core.unload && _core.unload(isAsync, unloadComplete, cbTimeout);
                };
                proxyFunctions(_self, _self.appInsights, [
                    "getCookieMgr",
                    "trackEvent",
                    "trackPageView",
                    "trackPageViewPerformance",
                    "trackException",
                    "_onerror",
                    "trackTrace",
                    "trackMetric",
                    "startTrackPage",
                    "stopTrackPage",
                    "startTrackEvent",
                    "stopTrackEvent"
                ]);
                proxyFunctions(_self, _getCurrentDependencies, [
                    "trackDependencyData"
                ]);
                proxyFunctions(_self, _core, [
                    "addTelemetryInitializer",
                    "pollInternalLogs",
                    "stopPollingInternalLogs",
                    "getPlugin",
                    "addPlugin",
                    "evtNamespace",
                    "addUnloadCb"
                ]);
                proxyFunctions(_self, function () {
                    var context = properties.context;
                    return context ? context.user : null;
                }, [
                    "setAuthenticatedUserContext",
                    "clearAuthenticatedUserContext"
                ]);
                function _getSKUDefaults() {
                    _self.config.diagnosticLogInterval =
                        _self.config.diagnosticLogInterval && _self.config.diagnosticLogInterval > 0 ? _self.config.diagnosticLogInterval : 10000;
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
        return Initialization;
    }());
    (function () {
        var sdkSrc = null;
        var isModule = false;
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
                        if (url.indexOf(cdns[idx]) !== -1) {
                            src = "cdn" + (idx + 1);
                            if (url.indexOf("/scripts/") === -1) {
                                if (url.indexOf("/next/") !== -1) {
                                    src += "-next";
                                }
                                else if (url.indexOf("/beta/") !== -1) {
                                    src += "-beta";
                                }
                            }
                            _internalSdkSrc = src + (isModule ? ".mod" : "");
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
            var legacyMode = version !== 2.0 ? true : false;
            _legacyCookieMgr();
            if (version === 2.0) {
                initialization.updateSnippetDefinitions(snippet);
                initialization.loadAppInsights(legacyMode);
                return initialization;
            }
            else {
                var legacy = new AppInsightsDeprecated(snippet, initialization);
                legacy.updateSnippetDefinitions(snippet);
                initialization.loadAppInsights(legacyMode);
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
                    if ((snippet.version >= 2.0 && _window[aiName].initialize) || snippet.version === undefined) {
                        ApplicationInsightsContainer.getAppInsights(snippet, snippet.version);
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

    exports.ApplicationInsights = Initialization;

    (function(obj, prop, descriptor) { /* ai_es3_polyfil defineProperty */ var func = Object["defineProperty"]; if (func) { try { return func(obj, prop, descriptor); } catch(e) { /* IE8 defines defineProperty, but will throw */ } } if (descriptor && typeof descriptor.value !== undefined) { obj[prop] = descriptor.value; } return obj; })(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=ai.2.8.3.js.map
