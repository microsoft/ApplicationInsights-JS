/**
* Type of storage to differentiate between local storage and session storage
*/
export enum StorageType {
    LocalStorage,
    SessionStorage
}

/**
 * Enum is used in aiDataContract to describe how fields are serialized. 
 * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
 */
export enum FieldType { Default = 0, Required = 1, Array = 2, Hidden = 4 };
