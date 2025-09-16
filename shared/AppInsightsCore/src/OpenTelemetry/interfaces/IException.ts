
export interface IOTelExceptionWithCode {
    code: string | number;
    name?: string;
    message?: string;
    stack?: string;
}

export interface IOTelExceptionWithMessage {
    code?: string | number;
    message: string;
    name?: string;
    stack?: string;
}

export interface IOTelExceptionWithName {
    code?: string | number;
    message?: string;
    name: string;
    stack?: string;
}
  
/**
 * Defines Exception.
 *
 * string or an object with one of (message or name or code) and optional stack
 *
 * @since 3.4.0
 */
export type OTelException =
    | IOTelExceptionWithCode
    | IOTelExceptionWithMessage
    | IOTelExceptionWithName
    | string;
  