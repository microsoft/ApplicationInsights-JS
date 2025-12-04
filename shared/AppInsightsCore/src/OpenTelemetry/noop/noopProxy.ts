// import { arrIndexOf, objForEachKey, objGetOwnPropertyDescriptor } from "@nevware21/ts-utils";
// import { INoopProxyConfig, INoopProxyProp, NoopProxyProps } from "../interfaces/noop/INoopProxyConfig";

// interface IProxyLocalPropsDef {
//     /**
//      * The propertor descriptor for the property
//      */
//     pd: PropertyDescriptor;

//     /**
//      * Has this value been deleted (to block looking up the underlying instance)
//      */
//     del: boolean;
// }

// export function createNoopProxy<T>(config?: INoopProxyConfig<T>): T {
//     let isReadOnly = false;

//     // Used to store and overridden / added properties to the proxy
//     // This is assigned lazily based on specific operations
//     let localProps: { [key: string | symbol]: IProxyLocalPropsDef } = {};

//     // Used to store the current state of the config without overriding the original.
//     // this is assigned and used lazily, ensure to use _getFieldProps() to get the current state
//     // rather than directly accessing the `config` object
//     let localCfg: INoopProxyConfig<T> | undefined;

//     function _getFieldProps<K extends keyof T, V = INoopProxyProp<T[K]>>(key: K): V {
//         if (!config) {
//             // No Config provided so create an empty local one
//             localCfg = { props: {} as NoopProxyProps<T> };
//         }

//         return ((localCfg ? localCfg.props : config.props) || {} as NoopProxyProps<T>)[key] as V;
//     }

//     function _getLocalProp(name: keyof T) {
//         let localProp = localProps[name];
//         if (!localProp) {
//             let propConfig = _getFieldProps(name);
//             if (propConfig) {
//                 // Lazy add the property to the localProps
//                 localProp = localProps[name] = {
//                     pd: {
//                         configurable: true,
//                         enumerable: propConfig.e !== false
//                     } as PropertyDescriptor,
//                     del: !!propConfig.del
//                 } as IProxyLocalPropsDef;

//                 if (propConfig.del || objGetOwnPropertyDescriptor(propConfig, "v")) {
//                     localProp.pd.value = propConfig.del ? undefined : propConfig.v;
//                 } else {
//                     localProp.pd.get = () => {
//                         var theConfig = _getFieldProps(name);
//                         if (theConfig.g) {
//                             return theConfig.g();
//                         }

//                         return createNoopProxy(theConfig.cfg || {});
//                     };
//                 }
//             }
//         }

//         return localProp;
//     }

//     function _value(name: keyof T) {
//         let localProp = _getLocalProp(name);
//         if (localProp) {
//             if (localProp.del) {
//                 return undefined;
//             }

//             if(localProp.pd) {
//                 if (localProp.pd.get) {
//                     return localProp.pd.get();
//                 }

//                 return localProp.pd.value;
//             }
//         }

//         return createNoopProxy({});
//     }

//     var proxy = new Proxy({}, {
//         get: function (target, prop: string | symbol) {
//             return _value(prop as keyof T);
//         },
//         set: function (target, prop, value) {
//             // Do Nothing as a Noop Proxy
//             return !isReadOnly;
//         },
//         defineProperty: function (target, prop, descriptor) {
//             if (isReadOnly) {
//                 return false;
//             }

//             let localProp = _getLocalProp(prop as keyof T);
//             if (!localProp) {
//                 localProps[prop] = {
//                     pd: descriptor,
//                     del: false
//                 };
//             } else {
//                 localProp.pd = descriptor;
//                 localProp.del = false;
//             }
            
//             return true;
//         },
//         getOwnPropertyDescriptor: function (target, prop) {
//             let propConfig = _getLocalProp(prop as keyof T);
//             if (propConfig && propConfig.del) {
//                 return undefined;
//             }

//             return propConfig.pd;
//         },
//         has: function (target, prop) {
//             let propConfig = _getLocalProp(prop as keyof T);

//             return propConfig && !propConfig.del;
//         },
//         ownKeys: function (target) {
//             // Special case for directly accessing the original config properties
//             let keys: Array<string | symbol> = [];
//             if (config && config.props) {
//                 objForEachKey(config.props, (key, value) => {
//                     if (value && !value.del && value.e !== false) {
//                         keys.push(key);
//                     }
//                 });
//             }
//             objForEachKey(localProps, (key, value) => {
//                 if (value.del) {
//                     if (arrIndexOf(keys, key) !== -1) {
//                         keys.splice(arrIndexOf(keys, key), 1);
//                     }
//                 } else if (value.pd.enumerable && arrIndexOf(keys, key) === -1) {
//                     keys.push(key);
//                 }
//             });

//             return keys;
//         },
//         preventExtensions: function (target) {
//             isReadOnly = true;
//             return true;
//         },
//         isExtensible: function (target) {
//             return !isReadOnly;
//         },
//         deleteProperty: function (target, prop) {
//             if (isReadOnly) {
//                 return false;
//             }

//             let propConfig = _getLocalProp(prop as keyof T);
//             if (propConfig) {
//                 propConfig.del = true;
//                 propConfig.pd = undefined;
//             }

//             return true;
//         }
//     });

//     return proxy as T;
// }
