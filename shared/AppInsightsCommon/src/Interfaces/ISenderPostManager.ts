import { OnCompleteCallback } from "@microsoft/applicationinsights-core-js";
import { IXDomainRequest } from "./IXDomainRequest";

export interface ISenderOnload {
    xdrOnload?(response: IXDomainRequest, oncomplete: OnCompleteCallback, msg?: string): void;
    fetchOnComplete?(response: Response, onComplete: OnCompleteCallback, resValue?: any, msg?: string): void;
    xhrOnload?(request: XMLHttpRequest, oncomplete: OnCompleteCallback, msg?: string):void
}
