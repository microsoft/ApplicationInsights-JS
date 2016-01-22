/// <reference path="../../../JavaScriptSDK/appInsights.ts" />
/// <reference path="../../../JavaScriptSDK/SamplingScoreGenerator.ts" />
/// <reference path="../../testframework/common.ts" />

class SamplingScoreGeneratorTests extends TestClass {

    private originalDocument;
    private results: any[];

    /** Method called before the start of each test method */
    public testInitialize() {
        this.results = [];
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.results = [];
    }

    public registerTests() {
        var contextKeys = new AI.ContextTagKeys();

        this.testCase({
            name: "SamplingScoreGeneratorTests: results consistent with .net implementation",
            test: () => {
                // test array is produced by .net sdk test
                var testArray = [
                    [ "ss", 5863819 ],
                    [ "kxi", 193497585 ],
                    [ "wr", 5863950 ],
                    [ "ynehgfhyuiltaiqovbpyhpm", 2139623659 ],
                    [ "iaxxtklcw", 1941943012 ],
                    [ "hjwvqjiiwhoxrtsjma", 1824011880 ],
                    [ "rpiauyg", 1477685542 ],
                    [ "jekvjvh", 691498499 ],
                    [ "hq", 5863454 ],
                    [ "kgqxrftjhefkwlufcxibwjcy", 270215819 ],
                    [ "lkfc", 2090474789 ],
                    [ "skrnpybqqu", 223230949 ],
                    [ "px", 5863725 ],
                    [ "dtn", 193489835 ],
                    [ "nqfcxobaequ", 397313566 ],
                    [ "togxlt", 512267655 ],
                    [ "jvvdkhnahkaujxarkd", 1486894898 ],
                    [ "mcloukvkamiaqja", 56804453 ],
                    [ "ornuu", 270010046 ],
                    [ "otodvlhtvu", 1544494884 ],
                    [ "uhpwhasnvmnykjkitla", 981289895 ],
                    [ "itbnryqnjcgpmfuckghqtg", 1481733713 ],
                    [ "wauetkdnivwlafbfhiedsfx", 2114415420 ],
                    [ "fniwmeidbvd", 508699380 ],
                    [ "vuwdgoxspstvj", 1821547235 ],
                    [ "y", 177694 ],
                    [ "pceqcixfb", 1282453766 ],
                    [ "aentke", 242916867 ],
                    [ "ni", 5863644 ],
                    [ "lbwehevltlnl", 1466602040 ],
                    [ "ymxql", 281700320 ],
                    [ "mvqbaosfuip", 1560556398 ],
                    [ "urmwofajwmmlornynglm", 701710403 ],
                    [ "buptyvonyacerrt", 1315240646 ],
                    [ "cxsqcnyieliatqnwc", 76148095 ],
                    [ "svvco", 274905590 ],
                    [ "luwmjhwyt", 553630912 ],
                    [ "lisvmmug", 822987687 ],
                    [ "mmntilfbmxwuyij", 882214597 ],
                    [ "hqmyv", 261671706 ],
                ];

                var sut = new Microsoft.ApplicationInsights.HashCodeScoreGenerator();
                for (var i = 0; i < testArray.length; ++i) {
                    var res = sut.getHashCode(<string>testArray[i][0]);
                    Assert.equal(<number>testArray[i][1], res);
                }
            }
        });

    }
}
new SamplingScoreGeneratorTests().registerTests();

