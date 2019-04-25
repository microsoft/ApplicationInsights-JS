// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from "react";

export interface ITestComponentProps {
  prop1?: number;
  prop2?: string;
}

export class TestComponent extends React.Component<ITestComponentProps> {
  public render() {
    const { prop1, prop2 } = this.props;
    return (
      <div>
        prop1: {prop1}, prop2: {prop2}
      </div>
    );
  }
}

export default TestComponent;
