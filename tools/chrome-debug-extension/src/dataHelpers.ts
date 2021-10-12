// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { dynamicValuePreferences, valuesToExcludeFromCondensedList } from './dataConfiguration';

export enum EventType {
  other,
  appLogic,
  warning,
  fatalError,
  performance
}

export interface ICounts {
  all: number;
  appLogic: number;
  performance: number;
  warning: number;
  fatalError: number;
}

// tslint:disable-next-line:no-any
export function getEventType(event: any): EventType {
  if (event && event.data && event.data.errorAlertType === 'Warning') {
    return EventType.warning;
  }
  if (event && event.data && event.data.errorAlertType === 'Fatal') {
    return EventType.fatalError;
  }
  if (event && event.data && event.data.eventType === 'Performance') {
    // QoS events are of type "Performance" - check to see if actually was a warning or failure
    switch (event.data.result) {
      case 'Warning':
        return EventType.warning;
      case 'Fatal':
        return EventType.fatalError;
      case 'Success':
      default:
        return EventType.performance;
    }
  }
  if (event && event.data && event.data.eventType === 'ApplicationLogic') {
    return EventType.appLogic;
  }
  return EventType.other;
}

// tslint:disable-next-line:no-any
export function unpackMessage(message: any): any {
  if (message.event !== undefined) {
    return message.event;
  } else if (message.data !== undefined) {
    return message;
  } else {
    return undefined;
  }
}

export interface IDynamicValuePreference {
  name: string;
  converter?: (originalValue: string) => string;
}

// tslint:disable-next-line:no-any
export function getDynamicValue(event: any): string {
  for (const preference of dynamicValuePreferences) {
    if (event.data[preference.name]) {
      const rawValue = event.data[preference.name];
      return preference.converter ? preference.converter(rawValue) : rawValue;
    }
  }
  return '';
}

// tslint:disable-next-line:no-any
export function getCondensedDetails(event: any): string {
  const condensedDetails = JSON.parse(JSON.stringify(event.data));

  for (const toExclude of valuesToExcludeFromCondensedList) {
    delete condensedDetails[toExclude];
  }
  return condensedDetails;
}
