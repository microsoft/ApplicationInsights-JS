import { IAppInsightsDeprecated } from "../src/ApplicationInsightsDeprecated";
import { ApplicationInsightsContainer } from "../src/ApplicationInsightsContainer";
import { Snippet, IApplicationInsights } from "../src/Initialization";

export class ApplicationInsightsDeprecatedTests extends TestClass {
    private static readonly _instrumentationKey = '2865A442-8F5E-41EB-AB96-F1922B9E7C09';
    private _aiDeprecated: IAppInsightsDeprecated | IApplicationInsights;
    private _snippet: Snippet;
    
    public testInitialize() {
        this._snippet = {
            config: {
                instrumentationKey: ApplicationInsightsDeprecatedTests._instrumentationKey,
                disableAjaxTracking: false,
                disableFetchTracking: false
            },
            queue: []
        }

        let container = new ApplicationInsightsContainer();
        this._aiDeprecated = container.getAppInsights(this._snippet, true);
    }

    public registerTests() {
        this.testCase({
            name: 'config.oldApiSupport set to true returns support for 1.0 apis',
            test: () => {

                Assert.ok(this._aiDeprecated, 'ApplicationInsights SDK exists');
                Assert.ok((<IAppInsightsDeprecated>this._aiDeprecated).downloadAndSetup); // has legacy method
            }
        });
    }
}