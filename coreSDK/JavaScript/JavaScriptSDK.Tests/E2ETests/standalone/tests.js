var time = new Date().getTime().toString();
var url = document.location.href;
var tests = [
    {
        name: "appInsights is loaded",
        test: function() {
            return !!appInsights;
        }
    }, {
        name: "appInsights queue is emptied",
        test: function() {
            return !appInsights.queue;
        }
    }, {
        name: "V1 API log event",
        test: function() {
            appInsights.bufferMinInterval = 0;
            appInsights.bufferMaxInterval = 1;
            appInsights.bufferSize = 10;
            return !appInsights.logEvent(url + " test app " + time);
        }
    }, {
        name: "V1 API log page",
        test: function() {
            return !appInsights.logPageView(url + " test app " + time);
        }
    }, {
        name: "V2 API trackEvent",
        test: function() {
            return appInsights.trackEvent(url + " test app " + time);
        }
    }, {
        name: "V2 API trackException",
        test: function() {
            return appInsights.trackException(new Error(url + " test app " + time));
        }
    }, {
        name: "V2 API trackMetric",
        test: function() {
            return appInsights.trackMetric(url + " test app " + time, Math.round(100 * Math.random()));
        }
    }, {
        name: "V2 API trackTrace",
        test: function() {
            return appInsights.trackTrace(url + " test app " + time);
        }
    }, {
        name: "V2 API trackPageView",
        test: function() {
            return appInsights.trackPageView();
        }
    }
];

// execute test cases and display results
$('body').append('<ol id="results">');
setTimeout(function() {
    for (var i = 0; i < tests.length; i++) {

        var test = function(input, div) {
            var result = true;
            try {
                input.test();
            } catch (e) {
                console.error(e.toString());
                result = false;
            }

            div.toggleClass("success", !!result);
            div.toggleClass("failure", !result);
        }

        var input = tests[i];
        var li = $('<li class="success">' + input.name + '</li>');
        var proxy = $.proxy(test, this, input, li);
        proxy();
        li.click(proxy);
        $('#results').append(li);
    }
}, 500);