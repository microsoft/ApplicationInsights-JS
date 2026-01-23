export interface IRequestContext {
    status?: number;
    xhr?: XMLHttpRequest;
    request?: Request; // fetch request
    response?: Response | string; // fetch response
}