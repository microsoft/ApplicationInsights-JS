// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Util } from '@microsoft/applicationinsights-common';

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
    border: 2px solid black;
    border-radius: 2px;
  }

  .${prefix}-my-logger div div::before {
    content: '';
    position: absolute;
    left: -1.25em;
    height: 100%;
    border-right: 2px dotted #CCCCCC;
  }

  .${prefix}-my-logger div div:hover::before {
    border-right: 2px solid #000;
  }

  .${prefix}-my-logger > div {
    display: block;
    position: relative;
  }

  .${prefix}-my-logger > div div {
    display: block;
    position: relative;
    margin-left: 2em;
    width: 100%;
  }

  .${prefix}-my-logger .expandable {
    cursor: pointer;
  }

  .${prefix}-my-logger > div div > span {
    width: 100%;
    display: block;
  }

  .${prefix}-my-logger .expandable.open::before {
    content: '[-] ';
    font-weight: bold;
  }

  .${prefix}-my-logger .expandable.closed::before {
    content: '[+] ';
    font-weight: bold;
  }

  .${prefix}-my-logger .obj-key:hover {
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

  @media only screen and (max-width: 600px) {
    .${prefix}-my-logger {
      width: 100%;
      min-width: 200px;
    }
  }
`;

export const permStyle = (prefix: string) => `
  .${prefix}-debug-bin-container {
    position: fixed;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }

  .${prefix}-debug-bin-parent,
  .${prefix}-debug-bin {
    position: fixed;
    right: 20px;
    margin: auto;
    padding: 10px;
    border-radius: 20px;
    min-height: 20px;
    min-width: 20px;
    pointer-events: auto;
    text-align: right;
    font-family: monospace;
    font-size: 16px;
    color: #FFFFFF;
    background-color: #000000;
    border: 2px solid #FFFFFF;
    transition: 2s color linear;
    cursor: pointer;
    opacity: 0.5;
    transition: .2s width ease-in-out, .2s height ease-in-out;
  }

  .${prefix}-debug-bin-parent:hover {
    opacity: 1;
  }

  .${prefix}-debug-bin-parent button {
    display: block;
    width: 100%;
    background-color: transparent;
    color: white;
    border: 2px solid #FFFFFF;
    border-radius: 1px;
    margin-bottom: 5px;
    margin-top: 10px;
    cursor: pointer;
  }

  .${prefix}-debug-bin-parent button:hover {
    background-color: #888888;
  }

  .${prefix}-debug-bin-parent .el-name {
    text-align: left;
  }

  .${prefix}-debug-bin-parent .el-value {
    display: inline-block;
    transform: scale(1);
    transition: 2s transform linear, 0s 2s font-weight linear;
  }

  .${prefix}-debug-bin-parent.notify::after {
    content: " (!)";
  }

  .${prefix}-debug-bin-parent .el-value.incremented {
    transform: scale(1.5);
    font-weight: bold;
    transition: 0s transform linear, 0s font-weight linear;
  }

  .${prefix}-debug-bin > span {
    text-align: right;
    color: white;
  }

  .${prefix}-debug-bin-parent:hover > span::before,
  .${prefix}-debug-bin:hover > span::before {
    content: attr(data-name) ": ";
  }
`
