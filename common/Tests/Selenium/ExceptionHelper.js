
function ExceptionHelper(config) {

    let orgError = null;

    function throwCorsException() {
        throw "Simulated Cors Exception";
    }

    function throwPageException(value) {
        function doThrow() {
            throw value;
        }

        doThrow();
    }

    function throwStrictException(value) {
        "use strict";
        function doThrow() {
            throw value;
        }

        doThrow();
    }

    function throwRuntimeException(timeoutFunc) {
        function doThrow() {
            var ug = "Hello";
            // This should throw
            ug();
        }

        if (!timeoutFunc) {
            timeoutFunc = setTimeout;
        }

        timeoutFunc(function() {
            doThrow();
        }, 0);
    }

    function throwStrictRuntimeException(timeoutFunc) {
        "use strict";
        function doThrow() {
            var ug = "Hello";
            // This should throw
            ug();
        }

        if (!timeoutFunc) {
            timeoutFunc = setTimeout;
        }

        timeoutFunc(function() {
            doThrow();
        }, 0);
    }
    function saveOnError() {
        if (!orgError) {
            orgError = {
                onerror: window.onerror
            };
        }
    }

    function restoreOnError() {
        if (orgError && orgError.onerror) {
            window.onerror = orgError.onerror;
        }
    }

    function captureStrictPageOnError(appInsights) {
        saveOnError();

        "use strict";
        function doCapture() {

            // Ignoring any previous handler
            window.onerror = function (message, url, lineNumber, columnNumber, error) {
                appInsights._onerror({
                    message,
                    url,
                    lineNumber,
                    columnNumber,
                    error: error,
                    evt: window.event
                });
    
                return true;
            }
        }

        doCapture();
    }

    function capturePageOnError(appInsights) {
        saveOnError();

        function doCapture() {
            // Ignoring any previous handler
            window.onerror = function (message, url, lineNumber, columnNumber, error) {
                appInsights._onerror({
                    message,
                    url,
                    lineNumber,
                    columnNumber,
                    error: error,
                    evt: window.event
                });
    
                return true;
            }
        }

        doCapture();
    }

    return {
        capture: capturePageOnError,
        captureStrict: captureStrictPageOnError,
        throw: throwPageException,
        throwCors: throwCorsException,
        throwStrict: throwStrictException,
        throwRuntimeException: throwRuntimeException,
        throwStrictRuntimeException: throwStrictRuntimeException
    }
}