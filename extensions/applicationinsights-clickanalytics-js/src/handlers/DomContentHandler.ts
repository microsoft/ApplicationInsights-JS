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
        id: 'data-bi-id',
        areaName: 'data-bi-area',
        slotNumber: 'data-bi-slot',
        contentName: 'data-bi-name',
        contentSource: 'data-bi-source',
        templateName: 'data-bi-view',
        productId: 'data-bi-product',
        contentType: 'data-bi-type',
        parentId: 'data-bi-parentid',
        parentName: 'data-bi-parentname'
    },
    shortNames: {
        isShortNames: true,
        id: 'data-bi-id',
        areaName: 'data-bi-an',
        slotNumber: 'data-bi-sn',
        contentName: 'data-bi-cn',
        contentSource: 'data-bi-cs',
        templateName: 'data-bi-tn',
        productId: 'data-bi-pid',
        contentType: 'data-bi-ct',
        parentId: 'data-bi-pi',
        parentName: 'data-bi-pn'
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
            // Collect the awa-* tags.
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
                _bracketIt(this._config.biBlobAttributeTag));
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
     * All attributes with data-bi prefix are collected.  'data-bi' prefix is removed from the key name.
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

        // element has no tags - look for the closest upper element with tags
        if (!this._isTracked(element)) {
            // capture config.biBlobAttributeTag blob from element or hierarchy
            biBlobElement = _findClosestByAttribute(element, this._config.biBlobAttributeTag);
            if (biBlobElement) {
                biBlobValue = biBlobElement.getAttribute(this._config.biBlobAttributeTag);
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
                // Get the element if it has any data-bi tag defined.  If not traverse up the DOM to find the closest parent with data-bi tag defined
                contentElement = _walkUpDomChainWithElementValidation(element, this._isTrackedWithDataBi);
                elementContent = extend(elementContent, this._populateElementContentwithDataBi(contentElement, element));
            }
        } else if (this._isTrackedWithDataM(element)) {
            biBlobElement = element;
            biBlobValue = biBlobElement.getAttribute(this._config.biBlobAttributeTag);
            try {
                elementContent = JSON.parse(biBlobValue);
            } catch (e) {
                this._traceLogger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _ExtendedInternalMessageId.CannotParseBiBlobValue, "Can not parse " + biBlobValue
                )
            }
        } else if (this._isTrackedWithDataBi(element)) {
            // Get the element if it has any data-bi tag defined.  If not traverse up the DOM to find the closest parent with data-bi tag defined
            contentElement = element;
            elementContent = extend(elementContent, this._populateElementContentwithDataBi(contentElement, element));
        }
        _removeInvalidElements(elementContent);
        /*
        if (this._config.autoCapture.lineage && eventType == EventType.PAGE_ACTION) {
            elementContent = extend(elementContent, this.getLineageDetails(element));
        }
        */
        if (this._config.autoPopulateParentIdAndParentName) {
            elementContent = extend(elementContent, this._getParentDetails(biBlobElement ? biBlobElement : contentElement, elementContent));
        }
        return elementContent;
    }

    private _populateElementContentwithDataBi(contentElement: Element, element: Element) {
        var elementContent: any = {};
        if (!contentElement) {
            // None of the element and its parent has any tags, collect standard HTML attribute for contentName when useDefaultContentName flag is true 
            if (this._config.useDefaultContentName) {
                contentElement = element;
            } else {
                return elementContent
            }
        }

        // Get the closest element with attribute data-bi-area.
        var areaElement = _findClosestByAttribute(contentElement, this._contentBlobFieldNames.areaName);
        var areaContent = extend({}, this._getAreaContent(areaElement));

        var customizedContentName = this._config.callback.contentName ? this._config.callback.contentName(contentElement, this._config.useDefaultContentName) : "";
        var defaultContentName = this._getDefaultContentName(contentElement, this._config.useDefaultContentName);

        elementContent = {
            id: contentElement.getAttribute(this._contentBlobFieldNames.id) || contentElement.id || '',
            aN: areaContent.areaName,
            sN: contentElement.getAttribute(this._contentBlobFieldNames.slotNumber),
            cN: customizedContentName || contentElement.getAttribute(this._contentBlobFieldNames.contentName) || defaultContentName || contentElement.getAttribute('alt') || '',
            cS: contentElement.getAttribute(this._contentBlobFieldNames.contentSource) || areaContent.contentSource,
            tN: areaContent.templateName,
            pid: contentElement.getAttribute(this._contentBlobFieldNames.productId),
            cT: contentElement.getAttribute(this._contentBlobFieldNames.contentType) || areaContent.type,
            pI: contentElement.getAttribute(this._contentBlobFieldNames.parentId),
            pN: contentElement.getAttribute(this._contentBlobFieldNames.parentName)
        };

        // Validate to ensure the minimum required field 'contentName/cN' is present.  
        // The content schema defines id, aN and sN as required fields.  However, 
        /// requiring these fields would result in majority of adopter's content from being collected.
        // Just throw a warning and continue collection.
        if (!elementContent.id || !elementContent.aN || !elementContent.sN || !elementContent.cN) {
            this._traceLogger.throwInternal(
                LoggingSeverity.WARNING,
                _ExtendedInternalMessageId.InvalidContentBlob, 'Invalid content blob.  Missing required attributes (id, aN/area, sN/slot), cN/contentName. ' +
                ' Content information will still be collected!'
            )
        }

        // use legacy fullNames for the content blob if configured so.
        if (!this._contentBlobFieldNames.isShortNames) {
            elementContent = {
                contentId: elementContent.id,
                areaName: elementContent.aN,
                slotNumber: elementContent.sN,
                contentName: elementContent.cN,
                contentSource: elementContent.cS,
                templateName: elementContent.tN,
                productId: elementContent.pid,
                contentType: elementContent.cT,
                parentId: elementContent.pI,
                parentName: elementContent.pN
            };
        }

        // Collect all other data-bi attributes and name them w/o the data-bi prefix.
        for (var i = 0, attrib; i < contentElement.attributes.length; i++) {
            attrib = contentElement.attributes[i];

            if (attrib.name === this._contentBlobFieldNames.id ||
                attrib.name === this._contentBlobFieldNames.areaName ||
                attrib.name === this._contentBlobFieldNames.slotNumber ||
                attrib.name === this._contentBlobFieldNames.contentName ||
                attrib.name === this._contentBlobFieldNames.contentSource ||
                attrib.name === this._contentBlobFieldNames.templateName ||
                attrib.name === this._contentBlobFieldNames.productId ||
                attrib.name === this._contentBlobFieldNames.contentType ||
                attrib.name === this._contentBlobFieldNames.parentId ||
                attrib.name === this._contentBlobFieldNames.parentName ||
                attrib.name.indexOf('data-bi-') === -1) {
                continue;
            }

            var attribName = attrib.name.replace('data-bi-', '');
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
     * extracts area content from element
     * @param areaElement An html element
     * @returns A JSON object representing the content.
     */
    private _getAreaContent(areaElement: Element) {
        if (areaElement) {
            return {
                areaName: areaElement.getAttribute(this._contentBlobFieldNames.areaName),
                templateName: areaElement.getAttribute(this._contentBlobFieldNames.templateName),
                contentSource: areaElement.getAttribute(this._contentBlobFieldNames.contentSource),
                product: areaElement.getAttribute(this._contentBlobFieldNames.productId),
                type: areaElement.getAttribute(this._contentBlobFieldNames.contentType)
            };
        }
    }

    /**
     * Gets the default content name.
     * @param element - An html element
     * @param useDefaultContentName -Flag indicating if an element is market PII.
     * @returns Content name
     */
    /*ignore jslint start*/
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
    /*ignore jslint end*/

    /**
     * Computes the parentId and parentName of a given element.
     * @param element - An html element
     * @returns An object containing the closest parentId and parentName, can be empty if nothing was found
     */
    private _getParentDetails(element: Element, elementContent: Object): IContent {
        var parentIdKey = this._contentBlobFieldNames.isShortNames ? _keyName.shortKeys.parentId : _keyName.longKeys.parentId;
        var parentNameKey = this._contentBlobFieldNames.isShortNames ? _keyName.shortKeys.parentName : _keyName.longKeys.parentName;
        var parentId = elementContent[parentIdKey];
        var parentName = elementContent[parentNameKey];
        var parentInfo = {};

        if (parentId || parentName || !element) {
            return parentInfo;
        }

        return this._populateParentInfo(element, parentIdKey, parentNameKey);
    }

    /**
     * Check if the user wants to track the element, which means if the element has any tags
     * @param element - An html element
     * @returns true if any data-bi- tag or data-m tag exist, otherwise return false 
     */
    private _isTrackedWithDataM(element: Element): boolean {
        var attrs = element.attributes;
        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].name.indexOf('data-m') >= 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the user wants to track the element, which means if the element has any tags
     * @param element - An html element
     * @returns true if any data-bi- tag or data-m tag exist, otherwise return false 
     */
    private _isTrackedWithDataBi(element: Element): boolean {
        var attrs = element.attributes;
        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].name.indexOf('data-bi-') >= 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the user wants to track the element, which means if the element has any tags
     * @param element - An html element
     * @returns true if any data-bi- tag or data-m tag exist, otherwise return false 
     */
    private _isTracked(element: Element): boolean {
        var attrs = element.attributes;
        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].name.indexOf('data-m') >= 0 || attrs[i].name.indexOf('data-bi-') >= 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if parent info already set up, if so take and put into content, if not walk up the DOM to find correct info
     * @param element - An html element that the user wants to track
     * @returns n object containing the parent info, can be empty if nothing was found
     */
    private _populateParentInfo(element: Element, parentIdKey: string, parentNameKey: string): IContent {
        var parentInfo: IContent = {};
        var elementBiDataAttribute = this._config.biBlobAttributeTag; // data-m
        var parentId;
        var parentName;

        // if the user does not set up parent info, walk to the DOM, find the closest parent element (with tags) and populate the info
        var closestParentElement = _walkUpDomChainWithElementValidation(element.parentElement, this._isTracked);
        if (closestParentElement) {
            var dataAttr = closestParentElement.getAttribute(elementBiDataAttribute) || element[elementBiDataAttribute];
            if (dataAttr) {
                try {
                    var telemetryObject = JSON.parse(dataAttr);
                } catch (e) {
                    this._traceLogger.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _ExtendedInternalMessageId.CannotParseDataAttribute, "Can not parse " + dataAttr
                    )
                }
                if (telemetryObject) {
                    parentId = telemetryObject.id;
                    parentName = telemetryObject.cN;
                }
            } else {
                parentId = closestParentElement.getAttribute(this._contentBlobFieldNames.id);
                parentName = closestParentElement.getAttribute(this._contentBlobFieldNames.contentName);
            }
            if (parentId) { parentInfo[parentIdKey] = parentId; }
            if (parentName) { parentInfo[parentNameKey] = parentName; }
        }

        return parentInfo;
    }

    
}
