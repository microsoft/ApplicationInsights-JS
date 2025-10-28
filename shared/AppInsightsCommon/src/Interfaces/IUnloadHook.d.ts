/**
* An interface which provides automatic removal during unloading of the component
*/
export interface IUnloadHook {
    /**
     * Self remove the referenced component
     */
    rm: () => void;
}
/**
 * An alternate interface which provides automatic removal during unloading of the component
 */
export interface ILegacyUnloadHook {
    /**
     * Legacy Self remove the referenced component
     */
    remove: () => void;
}
