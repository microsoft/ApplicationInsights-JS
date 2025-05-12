import { FinallyPromiseHandler, IPromise, RejectedPromiseHandler, ResolvedPromiseHandler } from "@nevware21/ts-async";
import { ITestContext } from "./ITestContext";

export type AITestQueueTask = (testContext?: ITestContext) => (PromiseLike<void>|void);

export interface IAsyncQueue {
    add: (task: AITestQueueTask, taskName?: string, timeout?: number) => IAsyncQueue;
    concat: (task: AITestQueueTask, taskName?: string, timeout?: number) => IAsyncQueue;
    doAwait<T, TResult1 = T, TResult2 = never>(value: T | PromiseLike<T>,  resolveFn: ResolvedPromiseHandler<T, TResult1>, rejectFn?: RejectedPromiseHandler<TResult2>, finallyFn?: FinallyPromiseHandler): IAsyncQueue;
    waitComplete: () => IPromise<void>;
}
