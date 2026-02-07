import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { eSeverityLevel, SeverityLevel } from "../../../../src/interfaces/ai/contracts/SeverityLevel";

export class SeverityLevelTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "SeverityLevel values",
            test: () => {
                Assert.equal(0, SeverityLevel.Verbose, "Check SeverityLevel.Verbose");
                Assert.equal(1, SeverityLevel.Information, "Check SeverityLevel.Information");
                Assert.equal(2, SeverityLevel.Warning, "Check SeverityLevel.Warning");
                Assert.equal(3, SeverityLevel.Error, "Check SeverityLevel.Error");
                Assert.equal(4, SeverityLevel.Critical, "Check SeverityLevel.Critical");


                Assert.equal(eSeverityLevel.Verbose, SeverityLevel.Verbose, "Check SeverityLevel.Verbose");
                Assert.equal(eSeverityLevel.Information, SeverityLevel.Information, "Check SeverityLevel.Information");
                Assert.equal(eSeverityLevel.Warning, SeverityLevel.Warning, "Check SeverityLevel.Warning");
                Assert.equal(eSeverityLevel.Error, SeverityLevel.Error, "Check SeverityLevel.Error");
                Assert.equal(eSeverityLevel.Critical, SeverityLevel.Critical, "Check SeverityLevel.Critical");

                Assert.ok(0 === SeverityLevel.Verbose, "Check SeverityLevel.Verbose === 0");
                Assert.ok(1 === SeverityLevel.Information, "Check SeverityLevel.Information === 1");
                Assert.ok(2 === SeverityLevel.Warning, "Check SeverityLevel.Warning === 2");
                Assert.ok(3 === SeverityLevel.Error, "Check SeverityLevel.Error === 3");
                Assert.ok(4 === SeverityLevel.Critical, "Check SeverityLevel.Critical === 4");

                Assert.ok(SeverityLevel.Verbose === eSeverityLevel.Verbose, "Check Verbose === eSeverityLevel.Verbose");
                Assert.ok(SeverityLevel.Information === eSeverityLevel.Information, "Check Information === eSeverityLevel.Information");
                Assert.ok(SeverityLevel.Warning === eSeverityLevel.Warning, "Check Warning === eSeverityLevel.Warning");
                Assert.ok(SeverityLevel.Error === eSeverityLevel.Error, "Check Error === eSeverityLevel.Error");
                Assert.ok(SeverityLevel.Critical === eSeverityLevel.Critical, "Check Critical === eSeverityLevel.Critical");

                Assert.equal("0", SeverityLevel.Verbose.toString(), "Checking value of SeverityLevel.Verbose");
                Assert.equal("1", SeverityLevel.Information.toString(), "Checking value of SeverityLevel.Information");
                Assert.equal("2", SeverityLevel.Warning.toString(), "Checking value of SeverityLevel.Warning");
                Assert.equal("3", SeverityLevel.Error.toString(), "Checking value of SeverityLevel.Error");
                Assert.equal("4", SeverityLevel.Critical.toString(), "Checking value of SeverityLevel.Critical");

                Assert.equal("Verbose", SeverityLevel[SeverityLevel.Verbose], "Checking string value of SeverityLevel.Verbose");
                Assert.equal("Information", SeverityLevel[SeverityLevel.Information], "Checking string value of SeverityLevel.Information");
                Assert.equal("Warning", SeverityLevel[SeverityLevel.Warning], "Checking string value of SeverityLevel.Warning");
                Assert.equal("Error", SeverityLevel[SeverityLevel.Error], "Checking string value of SeverityLevel.Error");
                Assert.equal("Critical", SeverityLevel[SeverityLevel.Critical], "Checking string value of SeverityLevel.Critical");
            }
       });
    }
}
