export const tempStyle = `
  .my-logger {
    width: 80%;
    min-width: 200px;
    height: 80%;
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    font-family: monospace;
    font-size: 16px;
    overflow-y: scroll;
    border: 2px solid black;
    border-radius: 2px;
  }

  .my-logger div div::before {
    content: '';
    position: absolute;
    left: -1.25em;
    height: 100%;
    border-right: 2px dotted #CCCCCC;
  }

  .my-logger div div:hover::before {
    border-right: 2px solid #000;
  }

  .my-logger > div {
    display: block;
    position: relative;
  }

  .my-logger > div div {
    display: block;
    position: relative;
    margin-left: 2em;
  }

  .my-logger .expandable {
    cursor: pointer;
  }

  .my-logger .expandable.open::before {
    content: '[-] ';
    font-weight: bold;
  }

  .my-logger .expandable.closed::before {
    content: '[+] ';
    font-weight: bold;
  }

  .my-logger .obj-key:hover {
    text-decoration: underline;
  }

  .my-logger :not(div span.obj-key) {
    font-weight: bold;
    pointer-events: none;
  }
  .my-logger .object {pointer-events: auto;}
  .my-logger .function {color: #881391;}
  .my-logger .string {color: #CB3632;}
  .my-logger .number {color: #1C00CF;}
  .my-logger .key {color: #881391; font-weight: bold;}
  .my-logger .empty {color: #AAAAAA; font-style: italic;}

  .last-selected-element > span {
    display: block;
    background-color: black;
    border-radius: 2px;
    color: white
  }
  .last-selected-element > span > span,
  .last-selected-element > span > span[class] {
    color: white;
  }
`;

export const permStyle = `
  .debug-bin-container {
    position: fixed;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }

  .debug-bin-parent,
  .debug-bin {
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
  }

  .debug-bin-parent:hover {
    opacity: 1;
  }

  .debug-bin-parent .el-name {
    text-align: left;
  }

  .debug-bin-parent .el-value {
    display: inline-block;
    transform: scale(1);
    transition: 2s transform linear, 0s 2s font-weight linear;
  }

  .debug-bin-parent.notify::after {
    content: " (!)";
  }

  .debug-bin-parent .el-value.incremented {
    transform: scale(1.5);
    font-weight: bold;
    transition: 0s transform linear, 0s font-weight linear;
  }

  .debug-bin > span {
    text-align: right;
    color: white;
  }

  .debug-bin-parent:hover > span::before,
  .debug-bin:hover > span::before {
    content: attr(data-name) ": ";
  }

  @keyframes notify {
    0% {transform: scale(1);}
    50% {transform: scale(1.5);}
    100% {transform: scale(1);}
  }
`