import { IPageViewTelemetry, IMetricTelemetry } from "@microsoft/applicationinsights-common";
import * as React from "react";
import ReactPlugin from "../src/ReactPlugin";
import withAITracking from "../src/withAITracking";
import { TestComponent } from "./TestComponent";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

let reactPlugin: ReactPlugin;
let TestComponentWithTracking;
let trackedTestComponentUnmount;
let trackMetricSpy;
let orgWarn = console && console.warn;

describe("withAITracking(TestComponent)", () => {

  beforeEach(() => {
    if (orgWarn) {
      console.warn = (msg) => { /* Swallow */ }
    }
    reactPlugin = new ReactPlugin();
    TestComponentWithTracking = withAITracking(reactPlugin, TestComponent);
    const testComponentWithTracking = render(<TestComponentWithTracking />);
    trackedTestComponentUnmount = testComponentWithTracking.unmount;
    trackMetricSpy = reactPlugin.trackMetric = jest.fn();
  });

  afterEach(() => {
    if (orgWarn) {
      console.warn = orgWarn;
    }
  });

  it("should wrap <TestComponent />", () => {
    expect(screen.getByText('TestComponent')).toBeInTheDocument();
  });

 it("shouldn't call trackMetric if there's no user interaction", () => {
    trackedTestComponentUnmount();
    expect(trackMetricSpy).toHaveBeenCalledTimes(0);
  });

  
  it("should call trackMetric if there is user interaction", () => {
    userEvent.click(screen.getByText('TestComponent'));
    trackedTestComponentUnmount();
    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: expect.any(Number),
      name: "React Component Engaged Time (seconds)",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "TestComponent" });
  });

  it("should use the passed component name in trackMetric", () => {
    trackedTestComponentUnmount();
    const TestComponentWithTrackingCustomName = withAITracking(reactPlugin, TestComponent, "MyCustomName");
    const { container, unmount } = render(<TestComponentWithTrackingCustomName />);
    userEvent.click(screen.getByText('TestComponent'));
    unmount();

    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: expect.any(Number),
      name: "React Component Engaged Time (seconds)",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "MyCustomName" });
  });
});
