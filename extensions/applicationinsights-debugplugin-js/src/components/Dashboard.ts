import { arrForEach } from '@microsoft/applicationinsights-core-js';
import dynamicProto from "@microsoft/dynamicproto-js";
import { tempStyle } from './styleNodeSrc';
import { FilterList } from './filterList';
import { LogEntry } from './LogEntry';
import { copySelectedTree } from './helpers';

export interface IDashboardConfig {
    prefix: string;
    trackers: string[];
    excludeKeys: string[],
    maxMessages: number,
    includeFunctions: boolean
}

export class Dashboard {
    constructor(config: IDashboardConfig) {
        let msgTracker: LogEntry[] = [];

        let textFilter: string ='';

        /**
         * the root element of the logger
         */
        let rootElement: HTMLDivElement;

        /**
         * the style that is only on the webpage when the log is active
         */
        let tempStyleEl: HTMLStyleElement;

        let filterList: FilterList;

        let loggerEl: HTMLElement;

        dynamicProto(Dashboard, this, (_self) => {
            let prefix = config.prefix;
            let trackers = config.trackers;
            const rootEl = rootElement = document.createElement("div");
            rootEl.className = `${prefix}-dbg-lgr-dashboard`;

            tempStyleEl = document.createElement("style");
            tempStyleEl.innerHTML = tempStyle(prefix);

            // TODO: research more accessibility (aria)
            rootEl.style.position = 'fixed';
            rootEl.style.width = '100vw';
            rootEl.style.height = '100vh';
            rootEl.style.backgroundColor = '#ffffff';
            rootEl.style.opacity = '1';
            rootEl.style.pointerEvents = 'auto';
            rootEl.style.top = '-100%';
            rootEl.style.transition = '.2s top cubic-bezier(0.87, 0, 0.13, 1)';

            const logHeading = document.createElement("h1");
            logHeading.textContent = 'dashboard';
            logHeading.style.fontFamily = "monospace";
            logHeading.style.textAlign = 'center';
            rootEl.appendChild(logHeading);

            _createLogger(rootEl, prefix, trackers);

            _self.getElm = () => {
                return rootEl;
            };

            _self.isDisplayed = () => {
                return !!(rootEl.parentElement || rootEl.parentNode);
            };

            _self.getTextFilter = () => {
                return textFilter;
            };

            _self.setTextFilter = (value: string) => {
                if (value !== textFilter) {
                    textFilter = value;
                    _self.render();
                }
            };

            _self.getTrackers = () => {
                return trackers;
            };

            _self.newLogEntry = (target: Object, tm: number, key?: string, level?: number, kind?: string, keep?: boolean) => {
                const _self = this;
                msgTracker.push(new LogEntry(target, tm, key, level, kind, keep));
                if (msgTracker.length > config.maxMessages) {
                    let lp = 0;
                    while (lp < msgTracker.length) {
                        let entry = msgTracker[lp];
                        if (!entry.isKeep()) {
                            let el = entry.getEl();
                            if (el && el.parentElement) {
                                el.parentElement.removeChild(el);
                            }
                            msgTracker.splice(lp, 1);
                            break;
                        }

                        lp++;
                    }
                }
                _self.render();
            };

            _self.show = () => {
                if (!this.isDisplayed()) {
                    document.body.appendChild(rootEl);
                    document.head.appendChild(tempStyleEl);
                    rootEl.style.top = '0%';
                    rootEl.style.pointerEvents = 'auto';
                    _self.render();
                }
            };

            _self.hide = () => {
                if (_self.isDisplayed()) {
                    rootEl.style.top = '-100%';
                    rootEl.style.pointerEvents = 'none';
                    document.head.removeChild(tempStyleEl);
                    document.body.removeChild(rootEl);
                }
            };

            _self.render = () => {
                if (_self.isDisplayed()) {
                    const excludedTypes = filterList.getCurrentFilter();
                    arrForEach(msgTracker, (entry) => {
                        let el = entry.getEl();
                        if (el && el.parentElement) {
                            el.parentElement.removeChild(el);
                        }

                        if (!entry.isMatch(textFilter, config.excludeKeys, config.includeFunctions)) {
                            return;
                        }

                        let type = entry.getKind();
                        let allowOther = excludedTypes.indexOf('other') === -1;     // Other types are not excluded
                        if (trackers.indexOf(type) === -1 && !allowOther) {
                            // Not a tracked type and we are not allowing other types
                            return;
                        } else if (excludedTypes.indexOf(type) !== -1) {
                            // This type is explicitly excluded
                            return;
                        }

                        let newEl = entry.render(textFilter, config.excludeKeys, config.includeFunctions);
                        if (newEl) {
                            loggerEl.appendChild(newEl);
                        }
                    });
                }
            };

            function clearEvents() {
                let newEvents: LogEntry[] = [];
                arrForEach(msgTracker, (entry) => {
                    if (entry.isKeep()) {
                        newEvents.push(entry);
                    } else {
                        let el = entry.getEl();
                        if (el && el.parentElement) {
                            el.parentElement.removeChild(el);
                        }
                    }
                });

                msgTracker = newEvents;
                _self.render();
            }

            function closeDashboard() {
                _self.hide();
            }

            function _createLogger(hostDiv: HTMLElement, prefix: string, trackers: string[]) {
                loggerEl = document.createElement("div");
                loggerEl.className = `${prefix}-dbg-lgr`;
        
                const controlDiv = document.createElement("div");
                controlDiv.className = `controls`;

                const textFilterInput = document.createElement("input");
                textFilterInput.className = 'text-filter-input';
                textFilterInput.setAttribute("placeholder", "filter text");
                textFilterInput.onchange = (evt: Event) => {
                    _self.setTextFilter(textFilterInput.value)
                }
        
                textFilterInput.onblur = (evt: Event) => {
                    _self.setTextFilter(textFilterInput.value)
                }
        
                textFilterInput.onkeyup = (evt: Event) => {
                    if (keyupTimer != null) {
                        clearTimeout(keyupTimer);
                    }
        
                    let newValue = textFilterInput.value;
                    if (newValue !== _self.getTextFilter()) {
                        keyupTimer = setTimeout(() => {
                            keyupTimer = null;
                            _self.setTextFilter(textFilterInput.value)
                        }, 200);
                    }
                }

                controlDiv.appendChild(textFilterInput);

                const copyButton = document.createElement("button");
                copyButton.innerText = "copy current node";
                copyButton.className = "btn-secondary";
                copyButton.onclick = copySelectedTree;
                copyButton.ontouchend = copySelectedTree;
        
                let keyupTimer: any = null;
        
                filterList = new FilterList(controlDiv, trackers.slice(0), () => _self.render());

                controlDiv.appendChild(copyButton);

                const clearEventsBtn = document.createElement("button");
                clearEventsBtn.innerText = "clear events";
                clearEventsBtn.className = "btn-secondary";
                clearEventsBtn.onclick = clearEvents;
                clearEventsBtn.ontouchend = clearEvents;
        
                controlDiv.appendChild(clearEventsBtn);

                const closeEventsBtn = document.createElement("button");
                closeEventsBtn.id = "close-dashboard";
                closeEventsBtn.innerText = "close dashboard";
                closeEventsBtn.className = "btn-primary";
                closeEventsBtn.onclick = closeDashboard;
                closeEventsBtn.ontouchend = closeDashboard;
        
                controlDiv.appendChild(closeEventsBtn);
        
                hostDiv.appendChild(controlDiv);
        
                hostDiv.appendChild(loggerEl);
            }
        });
    }

    public getElm(): HTMLElement {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public isDisplayed(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public getTextFilter(): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public setTextFilter(value: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getTrackers(): string[] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public newLogEntry(target: Object, tm: number, key?: string, level?: number, kind?: string, keep?: boolean) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public render(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public show(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public hide(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}