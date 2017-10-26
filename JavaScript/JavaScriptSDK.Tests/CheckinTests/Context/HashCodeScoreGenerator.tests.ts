/// <reference path="../../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../../JavaScriptSDK/Util.ts" />
/// <reference path="../../../JavaScriptSDK/HashCodeScoreGenerator.ts" />
/// <reference path="../../TestFramework/Common.ts" />

class HashCodeScoreGeneratorTests extends TestClass {

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
            name: "HashCodeGeneratorTests: results consistent with .net implementation",
            test: () => {
                // test array is produced by .net sdk test
                var testArray = [
                    ["ss", 1179811869],
                    ["kxi", 34202699],
                    ["wr", 1281077591],
                    ["ynehgfhyuiltaiqovbpyhpm", 2139623659],
                    ["iaxxtklcw", 1941943012],
                    ["hjwvqjiiwhoxrtsjma", 1824011880],
                    ["rpiauyg", 251412007],
                    ["jekvjvh", 9189387],
                    ["hq", 1807146729],
                    ["kgqxrftjhefkwlufcxibwjcy", 270215819],
                    ["lkfc", 1228617029],
                    ["skrnpybqqu", 223230949],
                    ["px", 70671963],
                    ["dtn", 904623389],
                    ["nqfcxobaequ", 397313566],
                    ["togxlt", 948170633],
                    ["jvvdkhnahkaujxarkd", 1486894898],
                    ["mcloukvkamiaqja", 56804453],
                    ["ornuu", 1588005865],
                    ["otodvlhtvu", 1544494884],
                    ["uhpwhasnvmnykjkitla", 981289895],
                    ["itbnryqnjcgpmgivlghqtg", 1923061690],
                    ["wauetkdnivwlafbfhiedsfx", 2114415420],
                    ["fniwmeidbvd", 508699380],
                    ["vuwdgoxspstvj", 1821547235],
                    ["y", 1406544563],
                    ["pceqcixfb", 1282453766],
                    ["aentke", 255756533],
                    ["ni", 1696510239],
                    ["lbwehevltlnl", 1466602040],
                    ["ymxql", 1974582171],
                    ["mvqbaosfuip", 1560556398],
                    ["urmwofajwmmlornynglm", 701710403],
                    ["buptyvonyacerrt", 1315240646],
                    ["cxsqcnyieliatqnwc", 76148095],
                    ["svvco", 1849105799],
                    ["luwmjhwyt", 553630912],
                    ["lisvmmug", 822987687],
                    ["mmntilfbmxwuyij", 882214597],
                    ["hqmyv", 1510970959],
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
new HashCodeScoreGeneratorTests().registerTests();

