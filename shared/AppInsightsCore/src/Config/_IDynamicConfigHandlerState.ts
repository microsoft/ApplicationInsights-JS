import { IDynamicConfigHandler } from "./IDynamicConfigHandler";
import { IDynamicPropertyHandler } from "./IDynamicPropertyHandler";
import { IWatcherHandler, WatcherFunction } from "./IDynamicWatcher";

/**
 * @internal
 * Interface for the global dynamic config handler
 */
export interface _IDynamicConfigHandlerState<T> {
    prop: symbol;
    ro: symbol;
    
    /**
     * Link to the handler
     */
    hdlr: IDynamicConfigHandler<T>;

    /**
     * Identifies the current active handler
     */
    act?: IWatcherHandler<T>;

    /**
     * Enable / Disable updates to dynamic readonly properties
     */
    upd?: boolean;

    /**
     * Helper to call any listeners that are waiting to be notified
     */
    notify: () => void;

    /**
     * Add this property handler to the collection to be notified
     */
    add: (handler: IDynamicPropertyHandler<T>) => void;

    /**
     * Use the provided handler to listen for changes
     */
    use: (activeHandler: IWatcherHandler<T>, callback: WatcherFunction<T>) => void;
}
