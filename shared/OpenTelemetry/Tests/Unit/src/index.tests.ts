import { OTelApiTests } from "./api/OTelApi.Tests";

export function runTests() {
    new OTelApiTests().registerTests();
}
