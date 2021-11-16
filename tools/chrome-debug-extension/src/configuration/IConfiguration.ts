// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DataEventType } from "../dataSources/IDataEvent";
import { DataSourceType } from "../dataSources/IDataSource";

// This is the expected format of the JSON file loaded for a given configuration
export interface IConfiguration {
    /**
     * Which data source to use to gather the events, defaults to Default
     */
    dataSourceType?: DataSourceType;

    /**
     * Optional URL filter pattern that some data sources use
     */
    dataSourceUrls?: string | string[];

    /**
     * Optional default value for the network capture setting in the UI
     */
    defaultNetworkCaptureValue?: boolean;

    /**
     * Optional default value for the SDK capture setting in the UI
     */
    defaultSDKCaptureValue?: boolean;

     /**
     * A list of fields of the fields to exclude from the details view when "Consolidate details" is checked
     */
    fieldsToExcludeFromCondensedList?: string[];

    /**
     * A list of the columns to display
     */
    columnsToDisplay: IColumn[];

    /**
     * The names of optional special fields that enable handy features
     */
    specialFieldNames?: ISpecialFieldNames;

    /**
     * If supplied, any events without this field will be ignored
     */
    ignoreEventsWithoutThisField?: string;

    /**
     * The prioritized list of conditions that will be evaluated to determine the DataEventType of a DataEvent
     * The first match will determine the DataEventType, the default if there are no matches is DataEventType.other
     */
    prioritizedDataEventTypeTests?: IDataEventTypeCondition[];

    /**
     * [Optional] Ignore notification messages
     */
    ignoreNotifications?: boolean;
}

export type DynamicValueConverter =
    // Remove the strings <safe> and </safe> from the beginning and end of the string
    | "RemoveSafeTags"

    // Truncates the value and appends " ms"
    | "NumberToWholeMilliseconds"

    // Truncates the value and adds locale specific digit grouping
    | "TruncateWithDigitGrouping";

export interface IDynamicField {
    // The name of the field to display
    // Examples:
    //  "data.foo" will return "abc" for this event { "data" : { "foo": "abc" } }
    //  "data['foo.bar']" will return "abc" for this event: { "data": { "foo.bar": "abc"} }
    //  "data['foo[0]']" will return "abc" for this event: { "data": { "foo": [ "abc" ] } }
    name: string;

    // An optional converter to run on the data before displaying it
    converter?: DynamicValueConverter;
}

export interface IColumn {
    // The text to display in the header of the column
    header: string;

    // Defaults to 'NormalData' - see ColumnType for details
    type: ColumnType;

    // A priority list of the IDataEvent fields to display - the first one found is the one displayed
    // Note: some field types are calculated and don't need a fieldName
    prioritizedFieldNames?: IDynamicField[];
}

export type ColumnType =
    // Just displays the data without manipulation
    | "NormalData"

    // Displays an incrementing session number, based on specialFieldName.sessionId
    | "SessionNumber"

    // Displays the change in a number from one entry to the next
    | "NumberDelta"

    // Displays the change in a timestamp from one entry to the next (in milliseconds)
    | "TimeDelta";

// If your data contains these fields, you can enable special column types with handy features,
// such as displaying an incrementing session number instead of a session's GUID to make it easier
/**
 *  to scan the events visually.
 */
export interface ISpecialFieldNames {
    /**
     * A unique ID for each session
     */
    sessionId?: string|string[];

    /**
     * If specified, a regular expression to use on the data in the sessionId field -
     * the first capture group is used as the sessionId
     */
    sessionIdRegex?: string;

    /**
     * The names of fields which contain JSON data, so that they can be parsed and then referenced
     * in this configuration
     */
    jsonFieldNames?: string;
}

export interface IDataEventTypeCondition {
    /**
     * The DataEventType that will be assigned to this event if the conditions are met
     */
    dataEventType: DataEventType;

    /**
     * The name of the field to test (see IDynamicField.name for a description of valid values)
     */
    fieldName: string;

    /**
     * The value to test for
     */
    fieldValue: string;
}
