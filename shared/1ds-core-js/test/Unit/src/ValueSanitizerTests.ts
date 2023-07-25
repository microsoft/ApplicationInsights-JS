import { AITestClass } from "@microsoft/ai-test-framework";
import { TestHelper } from './TestHelper';
import { IExtendedTelemetryItem, IValueSanitizer } from '../../../src/DataModels';
import { EventPersistence, EventPropertyType, ValueKind } from '../../../src/Enums';
import { sanitizeProperty, getCommonSchemaMetaData } from '../../../src/Utils';
import { arrForEach, isNullOrUndefined, objKeys } from '@microsoft/applicationinsights-core-js';
import { ValueSanitizer  } from '../../../src/ValueSanitizer';

export class ValueSanitizerTests extends AITestClass {

    private _checkFieldValue(dataSanitizer: IValueSanitizer, path: string, name: string, val: any, stringifyObjects?: boolean) {
        // Only add populated properties
        let value1 = dataSanitizer.value(path, name, val, stringifyObjects);
        let value2 = sanitizeProperty(name, val, stringifyObjects);

        if (!isNullOrUndefined(value1) && !isNullOrUndefined(value2)) {
            QUnit.assert.equal(value1.value, value2.value, 'Checking sanitized value [' + path + '.' + name + '] - sanitizeProperty:(' + value2.value + '); Json:' + JSON.stringify(val));
        } else if (isNullOrUndefined(val)) {
            QUnit.assert.equal(value1, value2, 'Checking empty [' + path + '.' + name + ']');
        } else if (!isNullOrUndefined(value2)) {
            // This is a failure condition as value1 (should be not set)
            QUnit.assert.equal(value1, value2.value, 'Checking [' + path + '.' + name + '] - sanitizeProperty:(' + value2 + '); Json:' + JSON.stringify(val));
        } else {
            QUnit.assert.equal(value1, value2, 'Checking sanitized values [' + path + '.' + name + '] - sanitizeProperty:(' + value2 + '); Json:' + JSON.stringify(val));
        }
    }

    private _checkSerialization(dataSanitizer: IValueSanitizer, theEvent: IExtendedTelemetryItem, stringifyObjects?: boolean) {
        // part A
        if (theEvent.ext) {
            arrForEach(objKeys(theEvent.ext), (key) => {
                let rootKey = 'ext.' + key;
                arrForEach(objKeys(theEvent.ext[key]), (subKey) => {
                    this._checkFieldValue(dataSanitizer, rootKey, subKey, theEvent.ext[key][subKey], stringifyObjects);
                });
            });
        }

        // part B
        if (theEvent.baseData) {
            arrForEach(objKeys(theEvent.baseData), (key) => {
                this._checkFieldValue(dataSanitizer, 'baseData', key, theEvent.baseData[key], stringifyObjects);
            });
        }

        // part C
        if (theEvent.data) {
            arrForEach(objKeys(theEvent.data), (key) => {
                this._checkFieldValue(dataSanitizer, 'data', key, theEvent.data[key], stringifyObjects);
            });
        }
    }

    public registerTests() {
        this.testCase({
            name: 'Check basic event serialization against sanitizeProperty with no fieldValueSanitizerProvider - default stringifyObjects',
            test: () => {
                let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                let dataSanitizer = new ValueSanitizer();

                this._checkSerialization(dataSanitizer, event1);
            }
        });

        this.testCase({
            name: 'Check basic event serialization against sanitizeProperty with no fieldValueSanitizerProvider - stringifyObjects - true',
            test: () => {
                let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                let dataSanitizer = new ValueSanitizer();

                this._checkSerialization(dataSanitizer, event1, true);
            }
        });

        this.testCase({
            name: 'Check basic event serialization against sanitizeProperty with no fieldValueSanitizerProvider - stringifyObjects - false',
            test: () => {
                let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                let dataSanitizer = new ValueSanitizer();

                this._checkSerialization(dataSanitizer, event1, false);
            }
        });

        this.testCase({
            name: 'Check basic event serialization against sanitizeProperty with a pass-through (no-op) fieldValueSanitizerProvider - default stringifyObjects',
            test: () => {
                let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                let dataSanitizer = new ValueSanitizer({
                    handleField: () => {
                        return true;
                    },
                    getSanitizer: () => {
                        return null;
                    }
                });

                this._checkSerialization(dataSanitizer, event1);
            }
        });

        this.testCase({
            name: 'Check basic event serialization against sanitizeProperty with a pass-through (no-op) fieldValueSanitizerProvider - stringifyObjects - true',
            test: () => {
                let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                let dataSanitizer = new ValueSanitizer({
                    handleField: () => {
                        return true;
                    },
                    getSanitizer: () => {
                        return null;
                    }
                });

                this._checkSerialization(dataSanitizer, event1, true);
            }
        });

        this.testCase({
            name: 'Check basic event serialization against sanitizeProperty with a pass-through (no-op) fieldValueSanitizerProvider - stringifyObjects - false',
            test: () => {
                let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                let dataSanitizer = new ValueSanitizer({
                    handleField: () => {
                        return true;
                    },
                    getSanitizer: () => {
                        return null;
                    }
                });

                this._checkSerialization(dataSanitizer, event1, false);
            }
        });

        this.testCase({
            name: 'Test different value kind variants and property types - default stringifyObjects',
            test: () => {
                let dataSanitizer = new ValueSanitizer({
                    handleField: () => {
                        return true;
                    },
                    getSanitizer: () => {
                        return null;
                    }
                });
                let valueKind = ValueKind.NotSet;
                while (valueKind < ValueKind.Pii_IPV4AddressLegacy) {
                    let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                    event1.data.evValue3 = {
                        value: 123,
                        kind: valueKind
                    };
                    event1.data.evValue4 = {
                        value: "456",
                        kind: valueKind
                    };
                    event1.data.evValue5 = {
                        value: true,
                        kind: valueKind
                    };
                    event1.data.evValue6 = {
                        value: [7, 8, 9],
                        kind: valueKind
                    };
                    event1.data.evValue7 = {
                        value: ["10", "11", "12"],
                        kind: valueKind
                    };
                    event1.data.evValue9 = {
                        value: [true, false],
                        kind: valueKind
                    };
                    
                    event1.data.ptValue1 = {
                        value: 21,
                        propertyType: EventPropertyType.Int32
                    };

                    event1.data.ptValue2 = {
                        value: "22",
                        propertyType: EventPropertyType.String
                    };
                    
                    event1.data.ptValue2 = {
                        value: 23.0,
                        propertyType: EventPropertyType.Double
                    };
                    
                    event1.data.ptValue3 = {
                        value: 21
                    };

                    event1.data.ptValue4 = {
                        value: "22"
                    };
                    
                    event1.data.ptValue5 = {
                        value: 23.0
                    };
                    
                    QUnit.assert.equal(getCommonSchemaMetaData(123, valueKind), 6 | valueKind << 5, `${valueKind}`);
                    this._checkSerialization(dataSanitizer, event1);
                    valueKind++;
                }
            }
        });

        this.testCase({
            name: 'Test different value kind variants and property types - stringifyObjects - true',
            test: () => {
                let dataSanitizer = new ValueSanitizer({
                    handleField: () => {
                        return true;
                    },
                    getSanitizer: () => {
                        return null;
                    }
                });
                let valueKind = ValueKind.NotSet;
                while (valueKind < ValueKind.Pii_IPV4AddressLegacy) {
                    let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                    event1.data.evValue3 = {
                        value: 123,
                        kind: valueKind
                    };
                    event1.data.evValue4 = {
                        value: "456",
                        kind: valueKind
                    };
                    event1.data.evValue5 = {
                        value: true,
                        kind: valueKind
                    };
                    event1.data.evValue6 = {
                        value: [7, 8, 9],
                        kind: valueKind
                    };
                    event1.data.evValue7 = {
                        value: ["10", "11", "12"],
                        kind: valueKind
                    };
                    event1.data.evValue9 = {
                        value: [true, false],
                        kind: valueKind
                    };
                    
                    event1.data.ptValue1 = {
                        value: 21,
                        propertyType: EventPropertyType.Int32
                    };

                    event1.data.ptValue2 = {
                        value: "22",
                        propertyType: EventPropertyType.String
                    };
                    
                    event1.data.ptValue2 = {
                        value: 23.0,
                        propertyType: EventPropertyType.Double
                    };
                    
                    event1.data.ptValue3 = {
                        value: 21
                    };

                    event1.data.ptValue4 = {
                        value: "22"
                    };
                    
                    event1.data.ptValue5 = {
                        value: 23.0
                    };
                    
                    QUnit.assert.equal(getCommonSchemaMetaData(123, valueKind), 6 | valueKind << 5, `${valueKind}`);
                    this._checkSerialization(dataSanitizer, event1, true);
                    valueKind++;
                }
            }
        });

        this.testCase({
            name: 'Test different value kind variants and property types - stringifyObjects - false',
            test: () => {
                let dataSanitizer = new ValueSanitizer({
                    handleField: () => {
                        return true;
                    },
                    getSanitizer: () => {
                        return null;
                    }
                });
                let valueKind = ValueKind.NotSet;
                while (valueKind < ValueKind.Pii_IPV4AddressLegacy) {
                    let event1 = TestHelper.mockEvent2(EventPersistence.Normal);
                    event1.data.evValue3 = {
                        value: 123,
                        kind: valueKind
                    };
                    event1.data.evValue4 = {
                        value: "456",
                        kind: valueKind
                    };
                    event1.data.evValue5 = {
                        value: true,
                        kind: valueKind
                    };
                    event1.data.evValue6 = {
                        value: [7, 8, 9],
                        kind: valueKind
                    };
                    event1.data.evValue7 = {
                        value: ["10", "11", "12"],
                        kind: valueKind
                    };
                    event1.data.evValue9 = {
                        value: [true, false],
                        kind: valueKind
                    };
                    
                    event1.data.ptValue1 = {
                        value: 21,
                        propertyType: EventPropertyType.Int32
                    };

                    event1.data.ptValue2 = {
                        value: "22",
                        propertyType: EventPropertyType.String
                    };
                    
                    event1.data.ptValue2 = {
                        value: 23.0,
                        propertyType: EventPropertyType.Double
                    };
                    
                    event1.data.ptValue3 = {
                        value: 21
                    };

                    event1.data.ptValue4 = {
                        value: "22"
                    };
                    
                    event1.data.ptValue5 = {
                        value: 23.0
                    };
                    
                    QUnit.assert.equal(getCommonSchemaMetaData(123, valueKind), 6 | valueKind << 5, `${valueKind}`);
                    this._checkSerialization(dataSanitizer, event1, false);
                    valueKind++;
                }
            }
        });
    }
 }
