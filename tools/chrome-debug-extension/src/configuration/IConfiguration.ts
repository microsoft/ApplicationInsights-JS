// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { DataEventType } from '../dataSources/IDataEvent';
import { DataSourceType } from '../dataSources/IDataSource';

// This is the expected format of the JSON file loaded for a given configuration
export interface IConfiguration {
  // Which data source to use to gather the events
  dataSourceType: DataSourceType;

  // Optional URLs filter pattern that some data sources use
  dataSourceUrls?: string;

  // A list of fields of the IDataEvent.data to exclude from the details view when "Consolidate details" is checked
  // Note: to exclude data.foo, put "foo" in the list, not "data.foo"
  dataValuesToExcludeFromCondensedList: string[];

  // A list of the columns to display
  columnsToDisplay: IColumn[];

  // The names of optional special fields that enable handy features
  specialFieldNames: ISpecialFieldNames;

  // If supplied, any events without this field will be ignored
  // Note: to require data.foo, supply "foo", not "data.foo"
  ignoreEventsWithoutThisValue?: string;

  // The prioritized list of conditions that will be evaluated to determine the DataEventType of a DataEvent
  // The first match will determine the DataEventType, the default if there are no matches is DataEventType.other
  prioritizedDataEventTypeTests: IDataEventTypeCondition[];
}

export type DynamicValueConverter =
  // Remove the strings <safe> and </safe> from the beginning and end of the string
  | 'RemoveSafeTags'

  // Truncates the value and appends " ms"
  | 'NumberToWholeMilliseconds'

  // Truncates the value and adds locale specific digit grouping
  | 'TruncateWithDigitGrouping';

export interface IDynamicField {
  // The name of the field to display (e.g. "data.foo" will return the IEventData.data.foo value)
  name: string;

  // An optional converter to run on the data before displaying it
  converter?: DynamicValueConverter;
}

export interface IColumn {
  // The text to display in the header of the column
  header: string;

  // Defaults to 'NormalData' - see definitions above
  type: ColumnType;

  // A priority list of the IDataEvent fields to display - the first one found is the one displayed
  // Note: some field types are calculated and don't need a fieldName
  prioritizedFieldNames?: IDynamicField[];
}

export type ColumnType =
  // Just displays the data without manipulation
  | 'NormalData'

  // Displays an incrementing session number, based on specialFieldName.sessionId
  | 'SessionNumber'

  // Displays the change in a number from one entry to the next
  | 'NumberDelta';

// If your data contains these fields, you can enable special column types with handy features,
// such as displaying an incrementing session number instead of a session's GUID to make it easier
// to scan the events visually.
export interface ISpecialFieldNames {
  // A unique ID for each session
  sessionId?: string;
}

export interface IDataEventTypeCondition {
  dataEventType: DataEventType;
  fieldName: string;
  fieldValue: string;
}
