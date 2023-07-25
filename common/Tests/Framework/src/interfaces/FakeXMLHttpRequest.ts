
export interface IFakeXMLHttpRequest extends XMLHttpRequest {
    url?: string;
    method?: string;
    requestHeaders?: any;
    async?: boolean;
    respond: (status: number, headers: any, body: string) => void;
}
