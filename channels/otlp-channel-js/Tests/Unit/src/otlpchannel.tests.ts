import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { ChannelChainTests } from "./ChannelChain.Tests";
import { ConverterTests } from "./Converter.Tests";
import { FidelityTests } from "./Fidelity.Tests";
import { OtlpChannelTests } from "./Channel.Tests";
import { TimeUtilsTests } from "./TimeUtils.Tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new TimeUtilsTests().registerTests();
    new ConverterTests().registerTests();
    new FidelityTests().registerTests();
    new OtlpChannelTests().registerTests();
    new ChannelChainTests().registerTests();
}
