// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React, { ErrorInfo } from "react";
import { SeverityLevel, IAppInsights } from "@microsoft/applicationinsights-common";

export interface IAppInsightsErrorBoundaryProps {
    appInsights: IAppInsights
    onError: React.ComponentType<any>
}

export interface IAppInsightsErrorBoundaryState {
    hasError: boolean
}

export default class AppInsightsErrorBoundary extends React.Component<IAppInsightsErrorBoundaryProps, IAppInsightsErrorBoundaryState> {
    state = { hasError: false };

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ hasError: true });
        this.props.appInsights.trackException({
            error: error,
            exception: error,
            severityLevel: SeverityLevel.Error,
            properties: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            const { onError } = this.props;
            return React.createElement(onError);
        }

        return this.props.children;
    }
}