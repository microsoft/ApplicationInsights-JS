// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMetricTelemetry } from '@microsoft/applicationinsights-common';
import { dateNow } from '@microsoft/applicationinsights-core-js';
import * as React from 'react';
import ReactPlugin from './ReactPlugin';

/**
 * Higher-order component base class to hook Application Insights tracking 
 * in a React component's lifecycle.
 */
export abstract class AITrackedComponentBase<P> extends React.Component<P> {
  protected _mountTimestamp: number = 0;
  protected _firstActiveTimestamp: number = 0;
  protected _idleStartTimestamp: number = 0;
  protected _lastActiveTimestamp: number = 0;
  protected _totalIdleTime: number = 0;
  protected _idleCount: number = 0;
  protected _idleTimeout: number = 5000;
  protected _intervalId?: any;
  protected _componentName: string;
  protected _reactPlugin: ReactPlugin;

  public constructor(props: P, reactPlugin: ReactPlugin, componentName: string) {
    super(props);

    this._reactPlugin = reactPlugin;
    this._componentName = componentName;
  }

  public componentDidMount() {
    this._mountTimestamp = dateNow();
    this._firstActiveTimestamp = 0;
    this._totalIdleTime = 0;
    this._lastActiveTimestamp = 0;
    this._idleStartTimestamp = 0;
    this._idleCount = 0;

    this._intervalId = setInterval(() => {
      if (this._lastActiveTimestamp > 0 && this._idleStartTimestamp === 0 && dateNow() - this._lastActiveTimestamp >= this._idleTimeout) {
        this._idleStartTimestamp = dateNow();
        this._idleCount++;
      }
    }, 100);
  }

  public componentWillUnmount() {
    if (this._mountTimestamp === 0) {
      throw new Error('withAITracking:componentWillUnmount: mountTimestamp is not initialized.');
    }
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }

    if (this._firstActiveTimestamp === 0) {
      return;
    }

    const engagementTime = this.getEngagementTimeSeconds();
    const metricData: IMetricTelemetry = {
      average: engagementTime,
      name: 'React Component Engaged Time (seconds)',
      sampleCount: 1
    };

    const additionalProperties: { [key: string]: any } = { 'Component Name': this._componentName };
    this._reactPlugin.trackMetric(metricData, additionalProperties);
  }

  protected trackActivity = (e: React.SyntheticEvent<any>): void => {
    if (this._firstActiveTimestamp === 0) {
      this._firstActiveTimestamp = dateNow();
      this._lastActiveTimestamp = this._firstActiveTimestamp;
    } else {
      this._lastActiveTimestamp = dateNow();
    }

    if (this._idleStartTimestamp > 0) {
      const lastIdleTime = this._lastActiveTimestamp - this._idleStartTimestamp;
      this._totalIdleTime += lastIdleTime;
      this._idleStartTimestamp = 0;
    }
  }

  private getEngagementTimeSeconds(): number {
    return (dateNow() - this._firstActiveTimestamp - this._totalIdleTime - this._idleCount * this._idleTimeout) / 1000;
  }
}

/**
 * Higher-order component function to hook Application Insights tracking 
 * in a React component's lifecycle.
 * 
 * @param reactPlugin ReactPlugin instance
 * @param Component the React component to be instrumented 
 * @param componentName (optional) component name
 * @param className (optional) className of the HOC div
 */
export default function withAITracking<P>(reactPlugin: ReactPlugin, Component: React.ComponentType<P>, componentName?: string, className?: string): React.ComponentClass<P> {

  if (componentName === undefined || componentName === null || typeof componentName !== 'string') {
    componentName = Component.prototype &&
      Component.prototype.constructor &&
      Component.prototype.constructor.name ||
      'Unknown';
  }

  if (className === undefined || className === null || typeof className !== 'string') {
    className = '';
  }

  return class extends AITrackedComponentBase<P> {

    public constructor(props: P) {
      super(props, reactPlugin, componentName);
    }

    public render() {
      return (
        <div
          onKeyDown={this.trackActivity}
          onMouseMove={this.trackActivity}
          onScroll={this.trackActivity}
          onMouseDown={this.trackActivity}
          onTouchStart={this.trackActivity}
          onTouchMove={this.trackActivity}
          className={className}
        >
          <Component {...this.props} />
        </div>
      );
    }
  }
}
