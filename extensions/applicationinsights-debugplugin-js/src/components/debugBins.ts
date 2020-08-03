// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class DebugBinParent {
    public showChildren: boolean = false;

    private el: HTMLDivElement;
    private elSpan: HTMLSpanElement;
    private value: number = 0;
    constructor(
        private parent: HTMLDivElement,
        private children: Array<DebugBin | HTMLButtonElement>,
        bottomDistance: number,
        prefix: string
    ) {
        const _self = this;

        _self.el = document.createElement('div');
        _self.el.setAttribute('tabindex', '0');
        _self.el.className = `${prefix}-debug-bin-parent`;
        _self.el.style.bottom = `${20 + bottomDistance}px`;

        _self.elSpan = document.createElement('span');
        _self.elSpan.innerText = `${_self.value}`;
        _self.elSpan.setAttribute('data-name', 'AppInsights');
        _self.el.appendChild(_self.elSpan);

        _self.el.onclick = () => {
            _self.showChildren = !_self.showChildren;
            _self.el.className = (_self.showChildren) ? `${prefix}-debug-bin-parent active` : `${prefix}-debug-bin-parent`;
            _self.render();
        }

        _self.el.onkeydown = (evt: KeyboardEvent) => {
            if (evt.which === 13 || evt.which === 32) {
                evt.preventDefault();
                (evt.target as HTMLElement).click();
            }
        }

        _self.render();
    }

    addClassToEl(name: string) {
        const _self = this;
        if (_self.el.className.indexOf(name) === -1) {
            _self.el.className += ` ${name}`;
        }
    }

    addChild(bin: DebugBin | HTMLButtonElement) {
        this.children.push(bin);
    }

    addButton(handler: (evt: MouseEvent) => void, label: string) {
        const btn = document.createElement('button');
        btn.innerText = label;
        btn.onclick = handler;
        this.addChild(btn);
    }

    increment() {
        const _self = this;
        _self.elSpan.innerText = `${++_self.value}`;
    }

    render() {
        const _self = this;
        if (!_self.el.parentElement) {
            _self.parent.appendChild(_self.el);
        }
        for (const ch of _self.children) {
            if (ch instanceof DebugBin) {
                if (ch.el.parentElement !== _self.el && _self.showChildren) {
                    _self.el.appendChild(ch.el);
                }
                else if (ch.el.parentElement === _self.el && !_self.showChildren) {
                    _self.el.removeChild(ch.el);
                }
            }
            else {
                if (_self.showChildren) { _self.el.appendChild(ch); }
                else { _self.el.removeChild(ch); }
            }
        }
    }
}

export class DebugBin {
    public el: HTMLDivElement;
    private elName: HTMLSpanElement;
    private elValue: HTMLSpanElement;

    constructor(
        private name: string,
        private value: number,
        private parent: DebugBinParent,
        bottomDistance: number,
        backgroundColor?: string
    ) {
        const _self = this;
        parent.addChild(_self);

        _self.el = document.createElement('div');

        _self.elName = document.createElement('span');
        _self.elName.innerText = `${name}: `;
        _self.elName.className = 'el-name';
        _self.el.appendChild(_self.elName);

        _self.elValue = document.createElement('span');
        _self.elValue.innerText = `${value}`;
        _self.elValue.className = 'el-value';
        _self.el.appendChild(_self.elValue);
    }

    increment() {
        const _self = this;
        _self.elValue.innerText = `${++_self.value}`;
        _self.parent.increment();
        _self.elValue.className = 'el-value incremented';
        setTimeout(() => _self.elValue.className = 'el-value', 1);
    }
}