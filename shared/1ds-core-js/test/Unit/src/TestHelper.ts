import { IExtendedTelemetryItem } from '../../../src/DataModels';

export class TestHelper {
    private static _idCount = 0;

    static reset(key: string) {
        this._idCount = 0;
        localStorage.removeItem(key);
    }

    static mockEvent(persistence: number): IExtendedTelemetryItem {
        this._idCount++;
        return {
            name: 'test_event-' + this._idCount.toString(),
            baseType: 'custom',
            time: '',
            persistence: persistence,
            data: {
                'key': 'value',
                empty: [],
                value1: [1],
                value2: ['Hello'],
                value3: [['Hello']],
                value4: true,
                value5: 42,
                value6: {
                    more: {
                        data: 'X'
                    }
                },
                evValue1: {
                    value: 'event Property'
                },
                evValue2: {
                    value: 'event Property2',
                    kind: 32 /* CustomerContent_GenericContent */,
                    propertyType: 1 /* String */
                }
            }
        };
    }

    static mockEvent2(persistence: number): IExtendedTelemetryItem {
        this._idCount++;
        return {
            name: 'test_event-' + this._idCount.toString(),
            time: ' 1970-01-01T00:00:00.000Z',
            ver: '4.0',
            iKey: 'o:12345-12345',
            ext: {
                sdk: {
                    ver: 'Hello version 1.0',
                    seq: 1,
                    epoch: '0',
                    installId: 'TestDeviceId'
                },
                app: { sesId: '####' },
                user: { locale: 'en-US' },
                web: { domain: 'localhost' },
                intweb: { },
                utc: { popSample: 100 },
                loc: { tz: '-08:00' },
                metadata: {
                    f: {
                        value1: { a: { t: 6 } },
                        value5: { t: 6 },
                        evValue2: { t: 8193 }
                    }
                }
            },
            baseData: {
                properties: {
                    version: '##currentPluginVersions##'
                }
            },
            data: {
                baseType: 'testEventBaseType',
                value1: [1],
                value2: ['Hello'],
                value3: [['Hello']],
                value4: true,
                value5: 42,
                value6: {
                    more: {
                        data: 'X'
                    }
                },
                evValue1: 'event Property',
                evValue2: 'event Property2'
            }
        };
    }
}
