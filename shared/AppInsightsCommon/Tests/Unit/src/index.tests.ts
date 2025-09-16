import { ApplicationInsightsTests } from "./AppInsightsCommon.tests";
import { ExceptionTests } from "./Exception.tests";
import { UtilTests } from "./Util.tests";
import { ConnectionStringParserTests } from "./ConnectionStringParser.tests";
import { SeverityLevelTests } from "./SeverityLevel.tests";
import { RequestHeadersTests } from "./RequestHeaders.tests";
import { ThrottleMgrTest } from "./ThrottleMgr.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { W3CTraceStateModesTests } from "./W3CTraceStateModes.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new ThrottleMgrTest().registerTests();
    new ApplicationInsightsTests().registerTests();
    new ExceptionTests().registerTests();
    new UtilTests().registerTests();
    new ConnectionStringParserTests().registerTests();
    new SeverityLevelTests().registerTests();
    new RequestHeadersTests().registerTests();
    new W3CTraceStateModesTests().registerTests();
}
