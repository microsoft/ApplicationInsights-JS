// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import * as React from 'react';
import { ExtensionPopupTelemetrySource } from './extensionPopupTelemetrySource';
import { TelemetryViewer } from './telemetryViewer';

export const PopupApp = (): React.ReactElement => {
  const [telemetrySource] = React.useState<ExtensionPopupTelemetrySource>(
    new ExtensionPopupTelemetrySource()
  );

  React.useEffect(() => {
    telemetrySource.startListening();

    return () => {
      telemetrySource.stopListening();
    };
  }, []);

  return <TelemetryViewer telemetrySource={telemetrySource} />;
};
