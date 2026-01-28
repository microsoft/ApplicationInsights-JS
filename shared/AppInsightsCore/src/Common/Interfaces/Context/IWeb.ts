// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IWeb {
    /**
     * Browser name, set at ingestion
     */
    browser: string;
    
    /**
     * Browser ver, set at ingestion.
     */
    browserVer: string;
    
    /**
     * Language
     */
    browserLang: string;
    
    /**
     * User consent, populated to properties bag
     */
    userConsent: boolean;
    
    /**
     * Whether event was fired manually, populated to properties bag
     */
    isManual: boolean;
    
    /**
     * Screen resolution, populated to properties bag
     */
    screenRes: string;

    /**
     * Current domain. Leverages Window.location.hostname. populated to properties bag
     */
    domain: string;
}