// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import _ from 'lodash';
import { DynamicValueConverter, IConfiguration, IDynamicField } from '../configuration/IConfiguration';
import { DataEventType, IDataEvent } from './IDataEvent';

export interface ICounts {
  all: number;
  appLogic: number;
  performance: number;
  warning: number;
  fatalError: number;
}

export function getEventType(dataEvent: IDataEvent, configuration: IConfiguration): DataEventType {
  for (const dataEventTypeTest of configuration.prioritizedDataEventTypeTests) {
    const fieldValue = getFieldValueAsString(dataEvent, dataEventTypeTest.fieldName);
    if (fieldValue && fieldValue === dataEventTypeTest.fieldValue) {
      return dataEventTypeTest.dataEventType;
    }
  }
  return 'other';
}

export function getDynamicFieldValue(dataEvent: IDataEvent, dynamicFields?: IDynamicField[]): string {
  if (dynamicFields === undefined) {
    return '';
  }

  for (const dynamicField of dynamicFields) {
    const rawValue = getFieldValueAsString(dataEvent, dynamicField.name);
    if (rawValue) {
      return applyConverter(rawValue, dynamicField.converter) || '';
    }
  }
  return '';
}

export function getCondensedDetails(dataEvent: IDataEvent, configuration: IConfiguration): string {
  const condensedDetails = JSON.parse(JSON.stringify(dataEvent.data));

  for (const toExclude of configuration.dataValuesToExcludeFromCondensedList) {
    delete condensedDetails[toExclude];
  }
  return condensedDetails;
}

export function applyConverter(
  value: string | undefined,
  converter?: DynamicValueConverter
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  switch (converter) {
    case 'RemoveSafeTags': {
      return value.replace('<safe>', '').replace('</safe>', '');
    }
    case 'NumberToWholeMilliseconds': {
      return `${Math.trunc(Number.parseInt(value, 10))} ms`;
    }
    case 'TruncateWithDigitGrouping': {
      return `${Math.trunc(Number.parseInt(value, 10)).toLocaleString()}`;
    }
    default: {
      return value;
    }
  }
}

export function getSessionId(dataEvent: IDataEvent, configuration: IConfiguration): string | undefined {
  if (!configuration.specialFieldNames.sessionId) {
    return undefined;
  }

  return getFieldValueAsString(dataEvent, configuration.specialFieldNames.sessionId);
}

export function getFieldValueAsString(dataEvent: IDataEvent, fieldName?: string): string | undefined {
  if (fieldName === undefined) {
    return undefined;
  }

  const value = _.get(dataEvent, fieldName);
  switch (typeof value) {
    case 'number':
      return value.toString();
    case 'string':
      return value;
    default:
      return undefined;
  }
}
