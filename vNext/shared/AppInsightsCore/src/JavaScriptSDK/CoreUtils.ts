// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

export class CoreUtils {
    public static isNullOrUndefined(input: any): boolean {
        return input === null || input === undefined;
    }


    /**
* Creates a new GUID.
* @return {string} A GUID.
*/

    public static newGuid():  string  {
        return  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(GuidRegex,  function  (c) {
            // tslint:disable-next-line:insecure-random
            var  r  =  (Math.random()  *  16  |  0),  v  =  (c  ===  'x'  ?  r  :  r  &  0x3  |  0x8);
            return  v.toString(16);
        });
    }




}
const GuidRegex = /[xy]/g;