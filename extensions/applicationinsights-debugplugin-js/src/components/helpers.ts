import { CoreUtils } from '@microsoft/applicationinsights-core-js';

const MAX_DEPTH = 8;

export const isArray = (obj: any): obj is any[] => {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

const traverseAndReplace = (target: Object, maxDepth: number, currentDepth: number, thingsReferenced?: string[]): Object => {
  const out = {};

  if (!thingsReferenced) { thingsReferenced = []; }
  if (CoreUtils.isTypeof(target, "object")) {
    for (const key of CoreUtils.objKeys(target)) {
      if (CoreUtils.arrIndexOf(thingsReferenced, target[key]) !== -1) {
        out[key] = `<circular (${key})>`;
      }
      else if (target[key] !== null && CoreUtils.isTypeof(target[key], 'object')) {
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

  constructor(parent: HTMLElement) {
    const s = this;
    s.el = document.createElement("div");
    s.el.className = 'my-logger';

    const copyButton = document.createElement("button");
    copyButton.innerText = "copy current node";
    copyButton.onclick = s.copySelectedTree;

    s.el.appendChild(copyButton);

    parent.appendChild(s.el);
  }

  public newLogEntry = (target: Object, key?: string, level?: number) => {
    this.el.appendChild(this.ObjectToElements(target, key, level));
  }

  // git push -f origin MSDAReba/debugplugin

  public ObjectToElements = (target: Object, key?: string, level?: number): HTMLElement => {
    const s = this;

    if (!level) { level = 0; }
    let isObj = CoreUtils.isTypeof(target, "object");

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
      else if (target[key] !== null && CoreUtils.isTypeof(target[key], "object")) {
        children.push(s.ObjectToElements(target[key], key, level + 1))
      } else {
        const builder = document.createElement("div");
        const outerSpan = document.createElement("span");
        const keySpan = document.createElement("span");
        keySpan.className = 'key';
        keySpan.textContent = `${key}: `;
        outerSpan.appendChild(keySpan);

        const valueSpan = document.createElement("span");
        if (CoreUtils.isTypeof(target[key], "function")) {
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
    if (isObj) {
      rootDiv.onclick = (evt: MouseEvent) => {
        evt.stopPropagation();
        if (s.lastSelectedElement) {
          s.lastSelectedElement.className = '';
        }
        s.lastSelectedElement = (evt.target as HTMLElement).parentElement;
        for (let i = 0; i < 10; i++) {
          if (s.lastSelectedElement.tagName === "DIV") { break; }
          s.lastSelectedElement = s.lastSelectedElement.parentElement;
        }
        s.lastSelectedElement.className = 'last-selected-element';
        s.lastSelectedObject = traverseAndReplace(target, MAX_DEPTH, level);

        if ((evt.target as HTMLElement).parentElement === rootDiv) {
          if (openState) {
            rootDiv.innerHTML = '';
            rootDiv.appendChild(currentLine);
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
    }

    return rootDiv;
  }

  public copySelectedTree = () => {
    const s = this;
    const toCopy: Object = s.lastSelectedObject;
    console.log(toCopy);
    if (!toCopy) { return; }

    const textArea = document.createElement("textarea");
    textArea.innerText = JSON.stringify(toCopy);
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.parentElement.removeChild(textArea);
  }
}