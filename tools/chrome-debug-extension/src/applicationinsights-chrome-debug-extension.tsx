// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import * as React from "react";
import * as ReactDOM from "react-dom";
import registerEventHandlers from "./background";
import { PopupApp } from "./popup";

// Exported so that
export { registerEventHandlers };

ReactDOM.render(<PopupApp />, document.getElementById("root") as HTMLElement);
