/**
 * DomContentHandler.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2020
 */
import {
    _bracketIt, _findClosestByAttribute, _removeInvalidElements,
    _walkUpDomChainWithElementValidation, _isElementDnt,
    isDocumentObjectAvailable, extend, _ExtendedInternalMessageId, isValueAssigned
} from '../common/Utils';
import { IDiagnosticLogger, LoggingSeverity, getDocument, CoreUtils} from "@microsoft/applicationinsights-core-js";
import { IClickAnalyticsConfiguration, IContent, IContentHandler } from '../Interfaces/Datamodel';

const MAX_CONTENTNAME_LENGTH = 200;

export class DomContentHandler implements IContentHandler {

    /**
     * @param config - ClickAnalytics configuration object
     * @param traceLogger - Trace logger to log to console.
     */
    constructor(protected _config: IClickAnalyticsConfiguration, protected _traceLogger: IDiagnosticLogger) {
    }

    /**
     * Collect metatags from DOM.
     * Collect data from meta tags.
     * @returns {object} - Metatags collection/property bag
     */
    public getMetadata(): { [name: string]: string } {
        
        let metaTags = {};
        if (isDocumentObjectAvailable) {
            metaTags = isValueAssigned(this._config.dataTags.metaDataPrefix) ? this._getMetaDataFromDOM(this._config.dataTags.captureAllMetaDataContent ,this._config.dataTags.metaDataPrefix, false) : 
            this._getMetaDataFromDOM(this._config.dataTags.captureAllMetaDataContent ,'', false);
        }
        return metaTags;
    }

    /**
     * Collect data-* attributes for the given element.
     * All attributes with data-* prefix or user provided customDataPrefix are collected.'data-*' prefix is removed from the key name.
     * @param element - The element from which attributes need to be collected.
     * @returns String representation of the Json array of element attributes
     */
    public getElementContent(element: Element): IContent {
        
        if (!element) {
            return {};
        }

        let elementContent: any = {};
        let biBlobElement;
        let biBlobValue;
        let contentElement;
        let parentDataTagPrefix;
        const dataTagPrefix:string = this._config.dataTags.customDataPrefix;
        const aiBlobAttributeTag:string = dataTagPrefix + this._config.dataTags.aiBlobAttributeTag;
        if(isValueAssigned(this._config.dataTags.parentDataTag)) {
            parentDataTagPrefix = dataTagPrefix + this._config.dataTags.parentDataTag;
        }
        
        if (!this._isTracked(element, dataTagPrefix, aiBlobAttributeTag)) {
            // capture blob from element or hierarchy
            biBlobElement = _findClosestByAttribute(element, aiBlobAttributeTag);
            if (biBlobElement) {
                biBlobValue = biBlobElement.getAttribute(aiBlobAttributeTag);
            }
            if (biBlobValue) {
                try {
                    elementContent = JSON.parse(biBlobValue);
                } catch (e) {
                    this._traceLogger.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _ExtendedInternalMessageId.CannotParseAiBlobValue, "Can not parse " + biBlobValue
                    )
                }
            } else {
                // traverse up the DOM to find the closest parent with data-* tag defined
                contentElement = _walkUpDomChainWithElementValidation(element, this._isTracked, dataTagPrefix);
                elementContent = extend(elementContent, this._populateElementContentwithDataTag( contentElement, element, dataTagPrefix, parentDataTagPrefix));
            }
        } else {
            contentElement = element;
            elementContent = extend(elementContent, this._populateElementContentwithDataTag(contentElement, element, dataTagPrefix, parentDataTagPrefix));   
        }
        _removeInvalidElements(elementContent);
        return elementContent;
    }

    /**
     * Capture current level Element content
     */
    private _captureElementContent(contentElement: Element, elementContent: any, dataTagPrefix: string) {

        for (var i = 0, attrib; i < contentElement.attributes.length; i++) {
            attrib = contentElement.attributes[i];

            if ( attrib.name.indexOf(dataTagPrefix) !== 0 ) {
                continue;
            }

            var attribName = attrib.name.replace(dataTagPrefix, '');
            elementContent[attribName] = attrib.value;
        }
    }

    /**
     * Walk Up the DOM to capture Element content
     */
    private _walkUpDomChainCaptureData(el: Element, elementContent: any, dataTagPrefix: string, parentDataTagPrefix: string ): void {
        let element = el;
        let parentDataTagFound: boolean = false;
        while(!CoreUtils.isNullOrUndefined(element) && !CoreUtils.isNullOrUndefined(element.attributes)) {
            let attributes=element.attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attrib = attributes[i];
    
                if ( attrib.name.indexOf(dataTagPrefix) !== 0 ) {
                    continue;
                }

                if( attrib.name.indexOf(parentDataTagPrefix) === 0) {
                    parentDataTagFound = true;
                }
    
                const attribName = attrib.name.replace(dataTagPrefix, '');
                if(!isValueAssigned(elementContent[attribName])) {
                    elementContent[attribName] = attrib.value;
                }
            }
    
            // break after current level;
            if(parentDataTagFound) {
                break;
            }
    
            element = (element.parentNode as Element);
        }
    }

    /**
     * Capture Element content along with Data Tag attributes and values
     */
    private _populateElementContentwithDataTag(contentElement: Element, element: Element, dataTagPrefix: string, parentDataTagPrefix: string) {
        
        let elementContent: any = {};
        if (!contentElement) {
            // None of the element and its parent has any tags, collect standard HTML attribute for contentName when useDefaultContentName flag is true 
            if (this._config.dataTags.useDefaultContentName) {
                contentElement = element;
            } else {
                return elementContent
            }
        }
        
        var customizedContentName = this._config.callback.contentName ? this._config.callback.contentName(contentElement, this._config.dataTags.useDefaultContentName) : "";
        var defaultContentName = this._getDefaultContentName(contentElement, this._config.dataTags.useDefaultContentName);

        elementContent = {
            id: contentElement.id || '',
            contentName: customizedContentName || defaultContentName || contentElement.getAttribute('alt') || '',
        };

        // Validate to ensure the minimum required field 'contentName' is present.  
        // The content schema defines id, aN and sN as required fields.  However, 
        // requiring these fields would result in majority of adopter's content from being collected.
        // Just throw a warning and continue collection.
        if (!elementContent.id || !elementContent.contentName) {
            this._traceLogger.throwInternal(
                LoggingSeverity.WARNING,
                _ExtendedInternalMessageId.InvalidContentBlob, 'Invalid content blob.  Missing required attributes (id, contentName. ' +
                ' Content information will still be collected!'
            )
        }
        
        isValueAssigned(parentDataTagPrefix) ? 
            this._walkUpDomChainCaptureData(contentElement, elementContent, dataTagPrefix, parentDataTagPrefix) : 
            this._captureElementContent(contentElement, elementContent, dataTagPrefix);

        return elementContent;
    }


    /**
     * Retrieve a specified metadata tag value from the DOM.
     * @param captureAllMetaDataContent - Flag to capture all metadata content
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
        if (useDefaultContentName === false || !element.tagName) {
            return '';
        }

        var doc = getDocument() || ({} as Document);
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
     * Check if the user wants to track the element, which means if the element has any tags with data-* or customDataPrefix
     * @param element - An html element
     * @returns true if any data-* exist, otherwise return false 
     */
    private _isTracked(element: Element, dataTag: string, aiBlobAttributeTag: string): boolean {
        const attrs = element.attributes;
        let dataTagFound = false;
        for (let i = 0; i < attrs.length; i++) {
            if(attrs[i].name === aiBlobAttributeTag) {
                // ignore if the attribute name is equal to aiBlobAttributeTag
                return false;
            } else if (attrs[i].name.indexOf(dataTag) === 0) { 
                dataTagFound = true;
            }
        }
        return dataTagFound;
    }  
}
