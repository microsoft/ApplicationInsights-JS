import {AppInsights, initialize as initializeAppInsights} from "AppInsightsModule"
initializeAppInsights({ instrumentationKey: "f2c1b11a-e3ec-4d3a-b96b-xxxxxxxx" });
AppInsights.trackPageView(
    "FirstPage",
    null,
    { prop1: "prop1", prop2: "prop2" },
    { measurement1: 1 },
    123);

AppInsights.trackEvent("TestEvent", { prop1: "prop1", prop2: "prop2" }, { measurement1: 1 });