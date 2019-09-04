/// <reference path="./HashCodeScoreGenerator.ts" />

module Microsoft.ApplicationInsights {
    "use strict";
 
    // Class allows to perform split testing (aka 'a/b testing' aka 'flights')
    // Works similarly to sampling, using the same hashing algorithm under the hood.
    // Suggested use:
    //
    //   newShinyFeature.enabled = false;
    //   if (new SplitTest.isEnabled(<user id>, <percent of users to enable feature for>)){
    //     newShinyFeature.enabled = true;
    //   }
    //
    export class SplitTest {
        private hashCodeGeneragor: HashCodeScoreGenerator = new HashCodeScoreGenerator();

        public isEnabled(key: string, percentEnabled: number) {
            return this.hashCodeGeneragor.getHashCodeScore(key) < percentEnabled;
        }
    }
}