import { IPageViewTelemetry, IMetricTelemetry } from "@microsoft/applicationinsights-common";
import * as React from "react";
import ReactPlugin from "../src/ReactPlugin";
import withAITracking from "../src/withAITracking";
import { TestComponent } from "./TestComponent";
import * as Enzyme from 'enzyme'
import * as Adapter from 'enzyme-adapter-react-16'

Enzyme.configure({
  adapter: new Adapter(),
});
let reactPlugin: ReactPlugin;
let TestComponentWithTracking;
let trackedTestComponentWrapper;
let trackMetricSpy;

describe("withAITracking(TestComponent)", () => {

  beforeEach(() => {
    reactPlugin = new ReactPlugin();
    TestComponentWithTracking = withAITracking(reactPlugin, TestComponent);
    trackedTestComponentWrapper = () => Enzyme.shallow(<TestComponentWithTracking />);
    trackMetricSpy = reactPlugin.trackMetric = jest.fn();
  });

  it("should wrap <TestComponent />", () => {
    const component = trackedTestComponentWrapper();
    expect(component.find(TestComponent).length).toBe(1);
  });

  it("shouldn't call trackMetric if there's no user interaction", () => {
    const component = trackedTestComponentWrapper();
    component.unmount();
    expect(trackMetricSpy).toHaveBeenCalledTimes(0);
  });

  it("should call trackMetric if there is user interaction", () => {
    const component = trackedTestComponentWrapper();
    component.simulate("keydown");
    component.unmount();

    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: expect.any(Number),
      name: "React Component Engaged Time (seconds)",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "TestComponent" });
  });

  it("should use the passed component name in trackMetric", () => {
    const TestComponentWithTrackingCustomName = withAITracking(reactPlugin, TestComponent, "MyCustomName");
    const component = Enzyme.shallow(<TestComponentWithTrackingCustomName />);
    component.simulate("mousemove");
    component.unmount();

    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: expect.any(Number),
      name: "React Component Engaged Time (seconds)",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "MyCustomName" });
  });
});
