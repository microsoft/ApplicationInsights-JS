/// <reference path="min/ai.d.ts" />
export declare class UrlHelper {
    private static document;
    private static htmlAnchorElement;
    static parseUrl(url: any): HTMLAnchorElement;
    static getAbsoluteUrl(url: any): string;
    static getPathName(url: any): string;
}
