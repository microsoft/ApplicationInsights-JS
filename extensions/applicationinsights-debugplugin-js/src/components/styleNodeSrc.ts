// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Util } from '@microsoft/applicationinsights-common';

const BG_INFO = '#F0F6FF',
      BG_ERROR = '#FEF0F1',
      ICON_ERROR = '#E00B1C',
      BTN_PRIMARY = '#0078d4',
      BTN_HOVER = '#106EBE',
      BTN_ACTIVE = '#005A9E',
      TEXT_PRIMARY = '#323130',
      BORDER_GREY_160 = '1px solid #605E5C',
      BORDER_GREY_60 = '1px solid #B3B0AD';

console.log(Util.getIEVersion());

export const tempStyle = (prefix: string) => `
  .${prefix}-my-logger {
    width: 80%;
    min-width: 600px;
    height: 80%;
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    font-family: monospace;
    font-size: 16px;
    overflow-y: scroll;
    overflow-x: ${(Util.getIEVersion()) ? 'scroll' : 'hidden'};
    border: ${BORDER_GREY_160};
    border-radius: 2px;
  }

  .${prefix}-my-logger div:focus {
    outline: 2px solid black;
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `.${prefix}-my-logger .tree-root div::before {
      content: '';
      position: absolute;
      left: -1.25em;
      height: 100%;
      border-right: 2px dotted #CCCCCC;
    }`
  }

  .${prefix}-my-logger .tree-root div:hover::before {
    border-right: 2px solid #000;
  }

  .${prefix}-my-logger > div {
    display: block;
    position: relative;
  }

  .${prefix}-my-logger > div:not(.controls) div {
    display: block;
    position: relative;
    margin-left: 2em;
    width: 100%;
  }

  .${prefix}-my-logger .expandable {
    cursor: pointer;
  }

  .${prefix}-my-logger > .tree-root div > span {
    width: 100%;
    display: block;
  }

  .${prefix}-my-logger .exception {
    background-color: ${BG_ERROR};
    color: ${TEXT_PRIMARY};
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `.${prefix}-my-logger .expandable.open::before {
      content: '[-] ';
      font-weight: bold;
    }

    .${prefix}-my-logger .expandable.closed::before {
      content: '[+] ';
      font-weight: bold;
    }`
  }

  .${prefix}-my-logger div:hover > .obj-key {
    text-decoration: underline;
  }

  .${prefix}-my-logger :not(div span.obj-key) {
    font-weight: bold;
    pointer-events: none;
  }
  .${prefix}-my-logger .object {pointer-events: auto;}
  .${prefix}-my-logger .function {color: #881391;}
  .${prefix}-my-logger .string {color: #CB3632;}
  .${prefix}-my-logger .number {color: #1C00CF;}
  .${prefix}-my-logger .key {color: #881391; font-weight: bold;}
  .${prefix}-my-logger .empty {color: #AAAAAA; font-style: italic;}

  .${prefix}-last-selected-element > span {
    display: block;
    background-color: black;
    border-radius: 2px;
    color: white
  }
  .${prefix}-last-selected-element > span > span,
  .${prefix}-last-selected-element > span > span[class] {
    color: white;
  }

  .${prefix}-my-logger .controls {
    padding: 3px 20px;
    z-index: 1;
  }

  .${prefix}-my-logger .copy-btn {
    display: inline-block;
    background-color: ${BTN_PRIMARY};
    color: #FFFFFF;
    border-radius: 2px;
    cursor: pointer;
    border: none;
    padding: 3px 20px;
    height: 24px;
  }

  .${prefix}-my-logger .copy-btn:hover {
    background-color: ${BTN_HOVER};
  }

  .${prefix}-my-logger .copy-btn:active {
    background-color: ${BTN_ACTIVE};
  }

  .${prefix}-my-logger .filterlist {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    width: 180px;
    min-height: 24px;
    margin-left: 10px;
    user-select: none;
    cursor: pointer;
  }
  .${prefix}-my-logger .filterlist-input {
    position: relative;
    padding: 3px 8px;
    border: ${BORDER_GREY_60};
    border-radius: 2px;
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `.${prefix}-my-logger .filterlist-input::after {
      content: '';
      width: 8px;
      height: 8px;
      position: absolute;
      right: 8px;
      top: 5px;
      margin: auto;
      transform: rotate(45deg);
      border: ${BORDER_GREY_160};
      border-top: none;
      border-left: none;
    }`
  }

  .${prefix}-my-logger .filterlist-input:focus {
    border: ${BORDER_GREY_60}
  }

  .${prefix}-my-logger .filterlist-dropdown {
    position: absolute;
    top: 100%;
    margin: auto;
    background-color: #FFFFFF;
    overflow: hidden;
    min-width: 180px;
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.16);
  }

  .${prefix}-my-logger .filterlist-toggle {
    position: relative;
    padding: 3px 8px;
    height: 32px;
    width: 100%;
    ${(Util.getIEVersion()) ? '' : 'box-sizing: border-box;'}
  }

  .${prefix}-my-logger .filterlist-toggle:focus {
    outline: none;
    border: ${BORDER_GREY_60};
  }

  .${prefix}-my-logger .text-filter-input {
    font-family: monospace;
    margin-left: 10px;
    padding: 3px 8px;
    width: 180px;
    height: 24px;
    border-radius: 2px;
    border: ${BORDER_GREY_160};
  }

  .${prefix}-my-logger .text-filter-input:focus {
    border: ${BORDER_GREY_60};
  }

  .${prefix}-my-logger .label {
    vertical-align: middle;
    width: 80%;
    display: inline-block;
  }

  .${prefix}-my-logger .checkbox {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 2px;
    vertical-align: middle;
    margin-right: 8px;
    ${(Util.getIEVersion()) ? '' : 'box-sizing: border-box;'}
  }

  .${prefix}-my-logger .checkbox.on {
    background-color: #0078D4;
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `.${prefix}-my-logger .checkbox.on::after {
      content: '';
      width: 5px;
      height: 10px;
      display: inline-block;
      margin: 2px 6px;
      padding: 0;
      transform: rotate(45deg);
      border: 1px solid #FFFFFF;
      border-top: none;
      border-left: none;
    }`
  }


  .${prefix}-my-logger .checkbox.off {
    border: ${BORDER_GREY_160};
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `@media only screen and (max-width: 600px) {
      .${prefix}-my-logger {
        width: 100%;
        min-width: 200px;
      }
    }`
  }

`;

export const permStyle = (prefix: string) => `
  .${prefix}-debug-bin-container {
    position: fixed;
    ${Util.getIEVersion() && Util.getIEVersion() < 9
      ? `width: 100%;
      height: 100%;
      top: 0;
      left: 0;`
      : `width: 100vw;
      height: 100vh;`
    }
    pointer-events: none;
  }

  .${prefix}-debug-bin-parent {
    position: fixed;
    right: 20px;
    margin: auto;
    padding: 10px;
    border-radius: 2px;
    min-height: 20px;
    min-width: 20px;
    overflow: hidden;
    pointer-events: auto;
    text-align: right;
    font-family: monospace;
    font-size: 16px;
    color: #FFFFFF;
    background-color: ${BTN_PRIMARY};
    border: 2px solid #FFFFFF;
    transition: 2s color linear;
    cursor: pointer;
    transition: .2s width ease-in-out, .2s height ease-in-out;
    ${(Util.getIEVersion()) ? '' : 'box-sizing: border-box;'}
  }

  .${prefix}-debug-bin-parent.active {
    background-color: ${BG_INFO};
    color: ${TEXT_PRIMARY};
  }

  .${prefix}-debug-bin-parent:focus {
    border: ${BORDER_GREY_160};
    outline: none;
  }

  .${prefix}-debug-bin-parent.notify {
    background-color: ${ICON_ERROR};
  }

  .${prefix}-debug-bin-parent button {
    display: block;
    width: 100%;
    background-color: ${BTN_PRIMARY};
    color: #FFFFFF;
    border-radius: 2px;
    margin-bottom: 5px;
    margin-top: 10px;
    cursor: pointer;
    border: none;
    padding: 3px 20px;
    height: 24px;
  }

  .${prefix}-debug-bin-parent button:hover {
    background-color: ${BTN_HOVER};
  }

  .${prefix}-debug-bin-parent button:active {
    background-color: ${BTN_ACTIVE};
  }

  .${prefix}-debug-bin-parent .el-name {
    text-align: left;
  }

  .${prefix}-debug-bin-parent .el-value {
    display: inline-block;
    transform: scale(1);
    transition: 2s transform linear, 0s 2s font-weight linear;
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `.${prefix}-debug-bin-parent.notify::after {
      content: " (!)";
    }`
  }

  .${prefix}-debug-bin-parent .el-value.incremented {
    transform: scale(1.5);
    font-weight: bold;
    transition: 0s transform linear, 0s font-weight linear;
  }

  ${Util.getIEVersion() && Util.getIEVersion() < 9
    ? ''
    : `.${prefix}-debug-bin-parent:focus > span::before,
    .${prefix}-debug-bin-parent:hover > span::before,
    .${prefix}-debug-bin-parent.active > span::before {
      content: attr(data-name) ": ";
    }`
  }
`
