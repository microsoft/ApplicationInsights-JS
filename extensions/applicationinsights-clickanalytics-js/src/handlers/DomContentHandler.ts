/**
 * DomContentHandler.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */

import {
     _bracketIt, _findClosestByAttribute, _removeInvalidElements,
    _walkUpDomChainWithElementValidation, _isElementDnt, _isElementTrulyVisible,
    _getViewportBoundingRect, _getViewportDimensions, isDocumentObjectAvailable, extend, _ExtendedInternalMessageId, isValueAssigned
} from '../common/Utils';
import { EventType } from '../Enums';
import * as DataCollector from '../DataCollector';
import { IDiagnosticLogger, LoggingSeverity, getDocument } from "@microsoft/applicationinsights-core-js";
import { IClickAnalyticsConfiguration, IRectangle, IContent, IContentHandler} from '../Interfaces/Datamodel';


const doNotTrackFieldName = 'data-bi-dnt';
const MAX_CONTENTNAME_LENGTH = 200;

export var _contentBlobFieldNameObjects = {
    longNames: {
        isShortNames: false, 
    },
    shortNames: {
        isShortNames: true,
    }
};

export var _keyName = {
    longKeys: {
        parentId: 'parentId',
        parentName: 'parentName'
    },
    shortKeys: {
        parentId: 'pI',
        parentName: 'pN'
    }
}

export class DomContentHandler implements IContentHandler {

    protected _contentBlobFieldNames: any = null;

    /**
     * @param config - WebAnalytics configuration object
     * @param traceLogger - Trace logger to log to console.
     */
    constructor(protected _config: IClickAnalyticsConfiguration, protected _traceLogger: IDiagnosticLogger) {
        this._contentBlobFieldNames = _contentBlobFieldNameObjects.longNames;
    }

    /**
     * Collect metatags from DOM.
     * Collect data from meta tags. Assign specific field values
     * in the event object.Return an object that is a kvp of awa- and ms.tags.
     * @returns {object} - Metatags collection/property bag
     */
    public getMetadata(): { [name: string]: string } {
        
        let metaTags = {};
        if (isDocumentObjectAvailable) {
            metaTags = isValueAssigned(this._config.metaDataPrefix) ? this._getMetaDataFromDOM(this._config.captureAllMetaDataContent ,this._config.metaDataPrefix, false) : 
            this._getMetaDataFromDOM(this._config.captureAllMetaDataContent ,'', false);

        }
        return metaTags;
    }

    public getVisibleContent(): Array<IContent> {
        /// <summary> takes an array of elements and only pushes the visible ones to arrayOfContents </summary>
        /// <param type='object'> the list of elements </param>
        /// <param type='object'> the array to push in </param>

        let viewportDim = _getViewportDimensions();
        let viewportBoundingRect: IRectangle = _getViewportBoundingRect(viewportDim);

        // Select all elements that have data-bi-area/aN, data-bi-slot/sN or data-m (biAttributeName) defined in the viewPort.
        var elements: NodeListOf<Element> = null;
        if (isDocumentObjectAvailable) {
            elements = document.querySelectorAll(
                _bracketIt(this._contentBlobFieldNames.areaName) + ',' +
                _bracketIt(this._contentBlobFieldNames.slotNumber) + ',' +
                _bracketIt(this._config.aiBlobAttributeTag));
        }

        let arrayOfContents = [];

        if (elements) {
            for (var i = 0; i < elements.length; i++) {
                // DNT = Do Not Track
                var element = elements[i];
                if (!_isElementDnt(element, doNotTrackFieldName)) {
                    if (_isElementTrulyVisible(element, viewportBoundingRect)) {
                        var elementContent = this.getElementContent(element, EventType.CONTENT_UPDATE);
                        if (elementContent) {
                            arrayOfContents.push(elementContent);
                        }
                    }
                }
            }
        }
        return arrayOfContents;
    }

    /**
     * Collect data-bi attributes for the given element.
     * All attributes with data-* prefix or user provided contentNamePrefix are collected.  'data-*' prefix is removed from the key name.
     * @param element - The element from which attributes need to be collected.
     * @returns String representation of the Json array of element attributes
     */
    public getElementContent(element: Element, eventType: EventType): IContent {
        if (!element) {
            return {};
        }

        var elementContent: any = {};
        var biBlobElement;
        var biBlobValue;
        var contentElement;
        const dataTag:string = this._config.contentNamePrefix;

        
        if (!this._isTracked(element, dataTag, this._config.aiBlobAttributeTag)) {
            // capture config.biBlobAttributeTag blob from element or hierarchy
            biBlobElement = _findClosestByAttribute(element, this._config.aiBlobAttributeTag);
            if (biBlobElement) {
                biBlobValue = biBlobElement.getAttribute(this._config.aiBlobAttributeTag);
            }
            if (biBlobValue) {
                try {
                    elementContent = JSON.parse(biBlobValue);
                } catch (e) {
                    this._traceLogger.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _ExtendedInternalMessageId.CannotParseBiBlobValue, "Can not parse " + biBlobValue
                    )
                }
            } else {
                // traverse up the DOM to find the closest parent with data-* tag defined
                contentElement = _walkUpDomChainWithElementValidation(element, this._isTracked, dataTag);
                elementContent = extend(elementContent, this._populateElementContentwithDataTag(contentElement, element, dataTag));
            }
        } else {
            contentElement = element;
            elementContent = extend(elementContent, this._populateElementContentwithDataTag(contentElement, element, dataTag));   
        }
        _removeInvalidElements(elementContent);
        return elementContent;
    }

    private _populateElementContentwithDataTag(contentElement: Element, element: Element, dataTag: string) {
        var elementContent: any = {};
        if (!contentElement) {
            // None of the element and its parent has any tags, collect standard HTML attribute for contentName when useDefaultContentName flag is true 
            if (this._config.useDefaultContentName) {
                contentElement = element;
            } else {
                return elementContent
            }
        }
        
        var customizedContentName = this._config.callback.contentName ? this._config.callback.contentName(contentElement, this._config.useDefaultContentName) : "";
        var defaultContentName = this._getDefaultContentName(contentElement, this._config.useDefaultContentName);

        elementContent = {
            id: contentElement.getAttribute(this._contentBlobFieldNames.id) || contentElement.id || '',
            cN: customizedContentName || contentElement.getAttribute(this._contentBlobFieldNames.contentName) || defaultContentName || contentElement.getAttribute('alt') || '',
        };

        // Validate to ensure the minimum required field 'contentName/cN' is present.  
        // The content schema defines id, aN and sN as required fields.  However, 
        /// requiring these fields would result in majority of adopter's content from being collected.
        // Just throw a warning and continue collection.
        if (!elementContent.id || !elementContent.cN) {
            this._traceLogger.throwInternal(
                LoggingSeverity.WARNING,
                _ExtendedInternalMessageId.InvalidContentBlob, 'Invalid content blob.  Missing required attributes (id, cN/contentName. ' +
                ' Content information will still be collected!'
            )
        }

        // use legacy fullNames for the content blob if configured so.
        if (!this._contentBlobFieldNames.isShortNames) {
            elementContent = {
                contentId: elementContent.id,
                contentName: elementContent.cN,
            };
        }

        // Collect all other data-* attributes and name them w/o the data-* prefix.
        for (var i = 0, attrib; i < contentElement.attributes.length; i++) {
            attrib = contentElement.attributes[i];

            if ( attrib.name.indexOf(dataTag) !== 0 ) {
                continue;
            }

            var attribName = attrib.name.replace(dataTag, '');
            elementContent[attribName] = attrib.value;
            
        }
        return elementContent;
    }


    /**
     * Retrieve a specified metadata tag value from the DOM.
     * @param prefix - Prefix to search the metatags with.
     * @param removePrefix - Specifies if the prefix must be excluded from key names in the returned collection.
     * @returns Metadata collection/property bag
     */
    private _getMetaDataFromDOM(captureAllMetaDataContent:boolean, prefix: string, removePrefix: boolean): { [name: string]: string } {
        var metaElements: any;
        var metaData = {};
        if (isDocumentObjectAvailable) {
            metaElements = document.querySelectorAll('meta');
            for (var i = 0; i < metaElements.length; i++) {
                var meta = metaElements[i];
                if (meta.name) {
                    if(captureAllMetaDataContent || meta.name.indexOf(prefix) === 0) {
                        const name = removePrefix ? meta.name.replace(prefix, '') : meta.name;
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
     * @param useDefaultContentName -Flag indicating if an element is market PII.
     * @returns Content name
     */
    private _getDefaultContentName(element: any, useDefaultContentName: boolean) {
        if (useDefaultContentName === false || DataCollector._isPii(element) || !element.tagName) {
            return '';
        }

        var doc = getDocument() || <Document>{};
        var contentName;
        switch (element.tagName) {
            case 'A':
                contentName = doc.all ? element.innerText || element.innerHTML : element.text || element.innerHTML;
                break;
            case 'IMG':
            case 'AREA':
                contentName = element.alt;
                break;
            default:
                contentName = element.value || element.name || element.alt || element.innerText || element.id;
        }

        return contentName.substring(0, MAX_CONTENTNAME_LENGTH);
    }

    /**
     * Check if the user wants to track the element, which means if the element has any tags with data-*
     * @param element - An html element
     * @returns true if any data-* exist, otherwise return false 
     */
    private _isTracked(element: Element, dataTag: string, aiBlobAttributeTag: string): boolean {
        var attrs = element.attributes;
        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].name.indexOf(dataTag) === 0) {
                if(attrs[i].name === aiBlobAttributeTag) {
                    // ignore if the attribute name is equal to aiBlobAttributeTag
                    continue;
                }
                return true;
            }
        }
        return false;
    }  
}
