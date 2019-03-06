// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IWeb {
    /**
     * Current domain. Leverages Window.location.hostname
     */
    domain: string;
    /**
     * Browser name, set at ingestion
     */
    browser: string;
    
    /**
     * Browser ver, set at ingestion.
     */
    browserVer: string;
   
    /**
     * Language, not populated
     */
    browserLang: string;

    /**
     * User consent, not populated
     */
    userConsent: boolean;

    /**
     * Whether event was fired manually, not populated
     */
    isManual: boolean;

    /**
     * Screen resolution, not populated
     */
    screenRes: string;
}