// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CoreUtils } from '@microsoft/applicationinsights-core-js';
import { Util } from '@microsoft/applicationinsights-common';
import { FilterList } from './filterList';

const MAX_DEPTH = 8;

export const isArray = (obj: any): obj is any[] => {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

const toggleClassName = (el: HTMLElement, className:string) => {
  const idx = el.className.indexOf(className);
  if (idx === -1) {
    el.className += className;
  } else {
    el.className = el.className.substring(0, idx) + el.className.substring(idx + className.length);
  }
}

const traverseAndReplace = (target: Object, maxDepth: number, currentDepth: number, thingsReferenced?: string[]): Object => {
  const out = {};

  if (!thingsReferenced) { thingsReferenced = []; }
  if (CoreUtils.isObject(target)) {
    for (const key of CoreUtils.objKeys(target)) {
      if (CoreUtils.arrIndexOf(thingsReferenced, target[key]) !== -1) {
        out[key] = `<circular (${key})>`;
      }
      else if (target[key] !== null && CoreUtils.isObject(target[key])) {
        if (currentDepth >= maxDepth) {
          out[key] = '<max allowed depth reached>';
        } else {
          thingsReferenced.push(target[key]);
          out[key] = traverseAndReplace(target[key], maxDepth, currentDepth + 1, thingsReferenced);
          thingsReferenced.pop();
        }
      }
      else {
        out[key] = target[key];
      }
    }
  }

  return out;
}



export class LoggingElement {
  public lastSelectedElement: HTMLElement;
  public lastSelectedObject: Object;

  public el: HTMLElement;
  private filter: FilterList;
  private textFilter: string = '';
  private trackers: string[];
  private msgTracker: Array<[string, HTMLElement, string]> = [];

  constructor(parent: HTMLElement, prefix: string, trackers: string[]) {
    const _self = this;
    _self.el = document.createElement("div");
    _self.el.className = `${prefix}-my-logger`;
    _self.trackers = trackers.slice(0);

    const controlDiv = document.createElement("div");
    controlDiv.className = 'controls';

    const copyButton = document.createElement("button");
    copyButton.innerText = "copy current node";
    copyButton.className = "copy-btn";
    copyButton.onclick = _self.copySelectedTree;
    copyButton.ontouchend = _self.copySelectedTree;

    controlDiv.appendChild(copyButton);

    _self.filter = new FilterList(controlDiv, _self.trackers, _self.render);

    const textFilterInput = document.createElement("input");
    textFilterInput.className = 'text-filter-input';
    textFilterInput.setAttribute("placeholder", "filter text");
    textFilterInput.onchange = (evt: Event) => {
      _self.textFilter = (evt.target as HTMLInputElement).value;
      _self.render();
    }

    controlDiv.appendChild(textFilterInput);

    _self.el.appendChild(controlDiv);

    parent.appendChild(_self.el);
  }

  public newLogEntry = (target: Object, key?: string, level?: number, kind?: string) => {
    const _self = this;
    const el = _self.ObjectToElements(target, key, level);
    toggleClassName(el, ' tree-root');
    _self.msgTracker.push([kind, el, JSON.stringify(traverseAndReplace(target, MAX_DEPTH, level)).replace(/"/g, '')]);
    _self.render();
  }

  // git push -f origin MSDAReba/debugplugin

  public ObjectToElements = (target: Object, key?: string, level?: number): HTMLElement => {
    const _self = this;

    if (!level) { level = 0; }
    let isObj = CoreUtils.isObject(target);
    const isErr = target['baseType'] === 'ExceptionData';

    const currentLine = document.createElement('span');
    if (isObj) {
      currentLine.className = 'obj-key expandable closed';
      currentLine.innerText = `${key ? key : 'obj'}: `;
      if (isArray(target)) {
        currentLine.innerText += `[${CoreUtils.objKeys(target).length}]`;
      } else {
        currentLine.innerText += `{${CoreUtils.objKeys(target).length}}`;
      }
    } else {
      currentLine.className = 'obj-key';
      currentLine.innerText = `${key ? key : 'obj'}: ${target.toString()}`;
    }

    const children: HTMLElement[] = [];
    let openState = false;

    const keys = CoreUtils.objKeys(target);
    if (keys.length === 0) { keys.push('<empty>'); }
    if (level >= MAX_DEPTH) { keys.unshift('<maxdepth>'); }
    for (const key of keys) {
      if (key === '<maxdepth>') {
        const builder = document.createElement("div");
        builder.className = 'empty';
        builder.innerText = '<max allowed depth reached>';
        children.push(builder);
        break;
      }
      else if (key === '<empty>') {
        const builder = document.createElement("div");
        builder.className = 'empty';
        builder.innerText = '<empty>';
        children.push(builder);
      }
      else if (target[key] !== null && CoreUtils.isObject(target[key])) {
        children.push(_self.ObjectToElements(target[key], key, level + 1))
      } else {
        const builder = document.createElement("div");
        builder.setAttribute("tabindex", "0");
        builder.onclick = (evt: MouseEvent) => {
          evt.stopPropagation();
        }
        builder.ontouchend = (evt: TouchEvent) => {
          evt.stopPropagation();
        }
        builder.onkeydown = (evt: KeyboardEvent) => {
          evt.stopPropagation();
          this.navHandler(evt);
        }
        builder.onfocus = (evt: Event) => {
          this.focusHandler(evt, target, level);
        }

        const outerSpan = document.createElement("span");
        const keySpan = document.createElement("span");
        keySpan.className = 'key';
        keySpan.textContent = `${key}: `;
        outerSpan.appendChild(keySpan);

        const valueSpan = document.createElement("span");
        if (CoreUtils.isFunction(target[key])) {
          const fnStr = target[key].toString();
          const fnHead = fnStr.match(/^([^{]+)/)[1];
          valueSpan.textContent = `${fnHead}{...}`;
        } else {
          valueSpan.textContent = `${target[key]}`;
        }
        valueSpan.className = `${typeof target[key]}`;
        outerSpan.appendChild(valueSpan);
        builder.appendChild(outerSpan);
        children.push(builder);
      }
    }

    const rootDiv = document.createElement("div");

    rootDiv.appendChild(currentLine);
    rootDiv.setAttribute("tabindex", "0");
    if (isObj) {
      if (isErr) { rootDiv.className = 'exception' }
      const openHandler = (evt: Event, forceState?: boolean) => {
        evt.stopPropagation();
        if (Util.getIEVersion()) {
          this.focusHandler(evt, target, level);
        }
        if (forceState !== undefined && openState === forceState) {
          return;
        }
        if (this.lastSelectedElement === rootDiv) {
          if (openState) {
            // rootDiv.innerHTML = '';
            for (const child of children) {
              rootDiv.removeChild(child);
            }
            // rootDiv.appendChild(currentLine);
            openState = false;
            currentLine.className = 'obj-key expandable closed'
          }
          else {
            openState = true;
            for (const child of children) {
              rootDiv.appendChild(child);
            }
            currentLine.className = 'obj-key expandable open'
          }
        }
      }

      rootDiv.onkeydown = (evt: KeyboardEvent) => {
        this.navHandler(evt, openHandler, openState);
      }
      rootDiv.onclick = (evt: MouseEvent) => {
        openHandler(evt);
      }
      rootDiv.ontouchend = (evt: TouchEvent) => {
        openHandler(evt);
      }
      rootDiv.onfocus = (evt: Event) => {
        this.focusHandler(evt, target, level);
      }
    }

    return rootDiv;
  }

  public copySelectedTree = () => {
    const _self = this;
    const toCopy: Object = _self.lastSelectedObject;
    if (!toCopy) { return; }

    const textArea = document.createElement("textarea");
    textArea.innerText = JSON.stringify(toCopy);
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.parentElement.removeChild(textArea);
  }

  private render = () => {
    const _self = this;
    const filter = _self.filter.getCurrentFilter();
    const textFilter = _self.textFilter;
    for (const [type, el, objStr] of _self.msgTracker) {
      if (el.parentElement) { el.parentElement.removeChild(el); }
      if (textFilter.length && objStr.indexOf(textFilter) === -1) {
        continue;
      }
      // TODO: make this if statement better if possible
      if (_self.trackers.indexOf(type) !== -1) {
        if (filter.indexOf(type) === -1) {
          _self.el.appendChild(el);
        }
      } else if (filter.indexOf('other') === -1) {
        _self.el.appendChild(el);
      }
    }
  }

  private focusHandler = (evt: Event, target: Object, level: number) => {
    const _self = this;
    if (_self.lastSelectedElement) {
      toggleClassName(_self.lastSelectedElement, ' last-selected-element');
    }
    _self.lastSelectedElement = (evt.target as HTMLElement);
    for (let i = 0; i < 10; i++) {
      if (_self.lastSelectedElement.tagName === "DIV") { break; }
      _self.lastSelectedElement = _self.lastSelectedElement.parentElement;
    }
    _self.lastSelectedElement.className += ' last-selected-element';
    _self.lastSelectedObject = traverseAndReplace(target, MAX_DEPTH, level);
  }

  private navHandler = (evt: KeyboardEvent, openHandler?: (evt: Event, forceState?: boolean) => void, currentState?: boolean) => {
    const el = evt.target as HTMLElement;
    switch(evt.which) {
      // Enter
      case 13: (openHandler) ? openHandler(evt) : void 0; break;
      // ArrowUp
      case 38:
        evt.preventDefault();
        const prev = el.previousElementSibling as HTMLElement;
        if (prev && prev.tagName !== 'BUTTON') { prev.focus(); }
        break;
      // ArrowDown
      case 40:
        evt.preventDefault();
        const next = el.nextElementSibling as HTMLElement;
        if (next) { next.focus(); }
        break;
      // ArrowRight
      case 39:
        if (openHandler) {
          openHandler(evt, true);
          if (currentState) {
            (el.firstElementChild.nextSibling as HTMLElement).focus();
          }
        }
        break;
      // ArrowLeft
      case 37:
        if (openHandler) { openHandler(evt, false); }
        if (!currentState) { (el.parentElement as HTMLElement).focus(); }
        break;
      // c
      case 67:
        if (evt.ctrlKey) {
          this.copySelectedTree();
          (evt.target as HTMLElement).focus();
        }
        break;
    }
  }
}