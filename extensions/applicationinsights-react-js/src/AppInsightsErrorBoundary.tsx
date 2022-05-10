// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from "react";
import { SeverityLevel } from "@microsoft/applicationinsights-common";
import ReactPlugin from "./ReactPlugin";

export interface IAppInsightsErrorBoundaryProps {
    appInsights: ReactPlugin
    onError: React.ComponentType<any>
    children: React.ReactElement
}

export interface IAppInsightsErrorBoundaryState {
    hasError: boolean
}

export default class AppInsightsErrorBoundary extends React.Component<IAppInsightsErrorBoundaryProps, IAppInsightsErrorBoundaryState> {
    state = { hasError: false };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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
