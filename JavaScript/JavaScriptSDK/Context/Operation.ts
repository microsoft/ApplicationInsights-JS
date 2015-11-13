/// <reference path="../util.ts" />

module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class Operation {

        public id: string;
        public name: string;
        public parentId: string;
        public rootId: string;
        public syntheticSource: string;

        constructor() {
            this.id = Util.newGuid();            
            if (window && window.location && window.location.pathname) {
                this.name = window.location.pathname;
            }
        }
    }
} 