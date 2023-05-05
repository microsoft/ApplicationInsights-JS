/**
* @copyright Microsoft 2020
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity, getDocument, hasDocument, isNullOrUndefined, objExtend
} from "@microsoft/applicationinsights-core-js";
import { IClickAnalyticsConfiguration, IContent, IContentHandler } from "../Interfaces/Datamodel";
import { isValueAssigned, removeInvalidElements, walkUpDomChainWithElementValidation } from "../common/Utils";

const MAX_CONTENTNAME_LENGTH = 200;

export class DomContentHandler implements IContentHandler {

    /**
     * @param config - ClickAnalytics configuration object
     * @param traceLogger - Trace logger to log to console.
     */
    constructor(protected _config: IClickAnalyticsConfiguration, protected _traceLogger: IDiagnosticLogger) {

        dynamicProto(DomContentHandler, this, (_self) => {

            _self.getMetadata = (): { [name: string]: string } => {
                let dataTags = (_self._config || {}).dataTags;
                let metaTags = {};
                if (hasDocument()) {
                    metaTags = isValueAssigned(dataTags.metaDataPrefix) ? _getMetaDataFromDOM(dataTags.captureAllMetaDataContent, dataTags.metaDataPrefix, false) :
                        _getMetaDataFromDOM(dataTags.captureAllMetaDataContent ,"", false);
                }
                return metaTags;
            };

            _self.getElementContent = (element: Element): IContent => {
        
                if (!element) {
                    return {};
                }
        
                let dataTags = (_self._config || {}).dataTags;
                let elementContent: any = {};
                let biBlobValue;
                let parentDataTagPrefix;
                const dataTagPrefix:string = dataTags.customDataPrefix;
                const aiBlobAttributeTag:string = dataTagPrefix + dataTags.aiBlobAttributeTag;
                if(isValueAssigned(dataTags.parentDataTag)) {
                    parentDataTagPrefix = dataTagPrefix + dataTags.parentDataTag;
                }
                
                if (!_isTracked(element, dataTagPrefix, aiBlobAttributeTag)) {
                    // capture blob from element or hierarchy
                    biBlobValue = element.getAttribute(aiBlobAttributeTag);
                    if (biBlobValue) {
                        try {
                            elementContent = JSON.parse(biBlobValue);
                        } catch (e) {
                            _throwInternal(_self._traceLogger,
                                eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.CannotParseAiBlobValue, "Can not parse " + biBlobValue
                            );
                        }
                    } else {
                        // traverse up the DOM to find the closest parent with data-* tag defined
                        //contentElement = walkUpDomChainWithElementValidation(element, _self._isTracked, dataTagPrefix);
                        elementContent = objExtend(elementContent, _populateElementContent(element, dataTagPrefix, parentDataTagPrefix, aiBlobAttributeTag));
                    }
                } else {
                    elementContent = objExtend(elementContent, _populateElementContentwithDataTag(element, dataTagPrefix, parentDataTagPrefix, aiBlobAttributeTag));
                }

                removeInvalidElements(elementContent);

                if (parentDataTagPrefix) {
                    elementContent = objExtend(elementContent, _getParentDetails(element, elementContent, dataTagPrefix, aiBlobAttributeTag ));
                }
        
                return elementContent;
            };
        
            /**
             * Capture current level Element content
             */
            function _captureElementContentWithDataTag(contentElement: Element, elementContent: any, dataTagPrefix: string) {

                for (var i = 0, attrib; i < contentElement.attributes.length; i++) {
                    attrib = contentElement.attributes[i];

                    if ( attrib.name.indexOf(dataTagPrefix) !== 0 ) {
                        continue;
                    }

                    var attribName = attrib.name.replace(dataTagPrefix, "");
                    elementContent[attribName] = attrib.value;
                }
            }

            /**
             * Walk Up the DOM to capture Element content
             */
            function _walkUpDomChainCaptureData(el: Element, elementContent: any, dataTagPrefix: string, parentDataTagPrefix: string, aiBlobAttributeTag: string ): void {
                let element = el;
                let parentDataTagFound: boolean = false;
                let elementLevelFlag: boolean = false; // Use this flag to capture 'id' only at the incoming html element level.

                while(!isNullOrUndefined(element) && !isNullOrUndefined(element.attributes)) {
                    let attributes=element.attributes;

                    for (let i = 0; i < attributes.length; i++) {
                        const attrib = attributes[i];
            
                        if ( attrib.name.indexOf(dataTagPrefix) !== 0 ) {
                            continue;
                        }

                        if (attrib.name.indexOf(parentDataTagPrefix) === 0) {
                            parentDataTagFound = true;
                        }
                        
                        // Todo handle blob data
                        if (attrib.name.indexOf(aiBlobAttributeTag) === 0) {
                            continue;
                        }

                        const attribName = attrib.name.replace(dataTagPrefix, "");
                        if (elementLevelFlag && attribName === "id") {
                            continue; // skip capturing id if not at the first level.
                        }

                        if (!isValueAssigned(elementContent[attribName])) {
                            elementContent[attribName] = attrib.value;
                        }
                    }
            
                    // break after current level;
                    if (parentDataTagFound) {
                        break;
                    }

                    elementLevelFlag = true; // after the initial level set this flag to true.
                    element = (element.parentNode as Element);
                }
            }

            /**
             * Capture Element content along with Data Tag attributes and values
             */
            function _populateElementContent(element: Element, dataTagPrefix: string, parentDataTagPrefix: string, aiBlobAttributeTag: string) {
                
                let elementContent: any = {};
                if(!element) {
                    return elementContent;
                }

                let htmlContent = _getHtmlIdAndContentName(element);
                elementContent = {
                    id: htmlContent.id || "",
                    contentName: htmlContent.contentName || ""
                };
                
                if(isValueAssigned(parentDataTagPrefix)) {
                    _walkUpDomChainCaptureData(element, elementContent, dataTagPrefix, parentDataTagPrefix, aiBlobAttributeTag);
                }

                // Validate to ensure the minimum required field 'id' or 'contentName' is present.
                // The content schema defines id, aN and sN as required fields.  However,
                // requiring these fields would result in majority of adopter's content from being collected.
                // Just throw a warning and continue collection.
                if (!elementContent.id && !elementContent.contentName) {
                    _throwInternal(_traceLogger,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.InvalidContentBlob, "Invalid content blob.  Missing required attributes (id, contentName. " +
                        " Content information will still be collected!"
                    )
                }

                return elementContent;
            }

            /**
             * Capture Element content along with Data Tag attributes and values
             */
            function _populateElementContentwithDataTag(element: Element, dataTagPrefix: string, parentDataTagPrefix: string, aiBlobAttributeTag: string) {
                let dataTags = (_self._config || {}).dataTags;
                let elementContent: any = {};
                if(!element) {
                    return elementContent;
                }
                
                let htmlContent = _getHtmlIdAndContentName(element);
                
                if(isValueAssigned(parentDataTagPrefix)) {
                    _walkUpDomChainCaptureData(element, elementContent, dataTagPrefix, parentDataTagPrefix, aiBlobAttributeTag);
                } else {
                    _captureElementContentWithDataTag(element, elementContent, dataTagPrefix);
                }
                    
                
                if (dataTags.useDefaultContentNameOrId) {
                    if(!isValueAssigned(elementContent.id)) {
                        elementContent.id = htmlContent.id || "";
                    }

                    elementContent.contentName = htmlContent.contentName || "";
                }
                
                // Validate to ensure the minimum required field 'id' or 'contentName' is present.
                // The content schema defines id, aN and sN as required fields.  However,
                // requiring these fields would result in majority of adopter's content from being collected.
                // Just throw a warning and continue collection.
                if (!elementContent.id && !elementContent.contentName) {
                    _throwInternal(_traceLogger,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.InvalidContentBlob, "Invalid content blob.  Missing required attributes (id, contentName. " +
                        " Content information will still be collected!"
                    )
                }

                return elementContent;
            }


            /**
             * Retrieve a specified metadata tag value from the DOM.
             * @param captureAllMetaDataContent - Flag to capture all metadata content
             * @param prefix - Prefix to search the metatags with.
             * @param removePrefix - Specifies if the prefix must be excluded from key names in the returned collection.
             * @returns Metadata collection/property bag
             */
            function _getMetaDataFromDOM(captureAllMetaDataContent:boolean, prefix: string, removePrefix: boolean): { [name: string]: string } {
                var metaElements: any;
                var metaData = {};
                if (hasDocument()) {
                    metaElements = getDocument().querySelectorAll("meta");
                    for (var i = 0; i < metaElements.length; i++) {
                        var meta = metaElements[i];
                        if (meta.name) {
                            if(captureAllMetaDataContent || meta.name.indexOf(prefix) === 0) {
                                const name = removePrefix ? meta.name.replace(prefix, "") : meta.name;
                                metaData[name] = meta.content;
                            }
                        }
                    }
                }

                return metaData;
            }

            /**
             * Gets the default content name.
             * @param element - An html element
             * @param useDefaultContentNameOrId -Flag indicating if an element is market PII.
             * @returns Content name
             */
            function _getDefaultContentName(element: any, useDefaultContentName: boolean) {
                if (useDefaultContentName === false || !element.tagName) {
                    return "";
                }

                var doc = getDocument() || ({} as Document);
                var contentName;
                switch (element.tagName) {
                case "A":
                    contentName = doc.all ? element.innerText || element.innerHTML : element.text || element.innerHTML;
                    break;
                case "IMG":
                case "AREA":
                    contentName = element.alt;
                    break;
                default:
                    contentName = element.value || element.name || element.alt || element.innerText || element.id;
                }

                return contentName.substring(0, MAX_CONTENTNAME_LENGTH);
            }

            /**
             * Check if the user wants to track the element, which means if the element has any tags with data-* or customDataPrefix
             * @param element - An html element
             * @returns true if any data-* exist, otherwise return false
             */
            function _isTracked(element: Element, dataTag: string, aiBlobAttributeTag: string): boolean {
                const attrs = element.attributes;
                let dataTagFound = false;
                for (let i = 0; i < attrs.length; i++) {
                    const attributeName = attrs[i].name;
                    if(attributeName === aiBlobAttributeTag) {
                        // ignore if the attribute name is equal to aiBlobAttributeTag
                        return false;
                    } else if (attributeName.indexOf(dataTag) === 0) {
                        dataTagFound = true;
                    }
                }
                return dataTagFound;
            }

            function _getHtmlIdAndContentName(element:Element) {
                let dataTags = (_self._config || {}).dataTags;
                let callback = (_self._config || {}).callback;
                let htmlContent: any = {};
                if(!element) {
                    return htmlContent;
                }

                if (dataTags.useDefaultContentNameOrId) {
                    const customizedContentName = callback.contentName ? callback.contentName(element, dataTags.useDefaultContentNameOrId) : "";
                    const defaultContentName = _getDefaultContentName(element, dataTags.useDefaultContentNameOrId);

                    htmlContent = {
                        id: element.id,
                        contentName: customizedContentName || defaultContentName || element.getAttribute("alt")
                    };
                }

                return htmlContent;
            }

            /**
            * Computes the parentId of a given element.
            * @param element - An html element
            * @returns An object containing the closest parentId , can be empty if nothing was found
            */
            function _getParentDetails(element: Element, elementContent: any, dataTagPrefix: string, aiBlobAttributeTag: string): IContent {
                const parentId = elementContent["parentid"];
                const parentName = elementContent["parentname"];
                let parentInfo = {};

                if (parentId || parentName || !element) {
                    return parentInfo;
                }

                return _populateParentInfo(element, dataTagPrefix, aiBlobAttributeTag);
            }
            /**
            * Check if parent info already set up, if so take and put into content, if not walk up the DOM to find correct info
            * @param element - An html element that the user wants to track
            * @returns An object containing the parent info, can be empty if nothing was found
            */
            function _populateParentInfo(element: Element, dataTagPrefix: string, aiBlobAttributeTag: string): IContent {
                let parentInfo: IContent = {};
                let parentId;

                // if the user does not set up parent info, walk to the DOM, find the closest parent element (with tags) and populate the info
                const closestParentElement = walkUpDomChainWithElementValidation(element.parentElement, _isTracked, dataTagPrefix);
                if (closestParentElement) {
                    const dataAttr = closestParentElement.getAttribute(aiBlobAttributeTag) || element[aiBlobAttributeTag];
                    if (dataAttr) {
                        try {
                            var telemetryObject = JSON.parse(dataAttr);
                        } catch (e) {
                            _throwInternal(_traceLogger,
                                eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.CannotParseAiBlobValue, "Can not parse " + dataAttr
                            );
                        }
                        if (telemetryObject) {
                            parentId = telemetryObject.id;
                        }
                    } else {
                        parentId = closestParentElement.getAttribute(dataTagPrefix+"id");
                    }
                }
                if (parentId) {
                    parentInfo["parentid"] = parentId;
                } else {
                    let htmlContent= _getHtmlIdAndContentName(element.parentElement);
                    parentInfo["parentid"] = htmlContent.id;
                    parentInfo["parentname"] = htmlContent.contentName;
                }

                return parentInfo;
            }
        });
    }

    /**
     * Collect metatags from DOM.
     * Collect data from meta tags.
     * @returns {object} - Metatags collection/property bag
     */
    public getMetadata(): { [name: string]: string } {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Collect data-* attributes for the given element.
     * All attributes with data-* prefix or user provided customDataPrefix are collected.'data-*' prefix is removed from the key name.
     * @param element - The element from which attributes need to be collected.
     * @returns String representation of the Json array of element attributes
     */
    public getElementContent(element: Element): IContent {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
