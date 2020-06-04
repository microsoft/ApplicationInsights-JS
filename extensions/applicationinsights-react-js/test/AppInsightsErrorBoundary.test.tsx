import React from "react";
import ReactPlugin from "../src/ReactPlugin";
import AppInsightsErrorBoundary from "../src/AppInsightsErrorBoundary";
import * as Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { TestComponent, ErrorTestComponent } from "./TestComponent";

Enzyme.configure({
  adapter: new Adapter()
});
let reactPlugin: ReactPlugin;
let trackExceptionSpy;

describe("<AppInsightsErrorBoundary />", () => {
  beforeEach(() => {
    reactPlugin = new ReactPlugin();
    trackExceptionSpy = reactPlugin.trackException = jest.fn();
  });

  it("should render a non-erroring component", () => {
    const component = Enzyme.mount(
      <AppInsightsErrorBoundary
        appInsights={reactPlugin}
        onError={() => <div></div>}
      >
        <TestComponent />
      </AppInsightsErrorBoundary>
    );
    expect(component.html()).toEqual(Enzyme.shallow(<TestComponent />).html());
  });

  it("should catch the error and render the alternative component", () => {
    const ErrorDisplay = () => <div>Error</div>;

    const component = Enzyme.mount(
      <AppInsightsErrorBoundary
        appInsights={reactPlugin}
        onError={ErrorDisplay}
      >
        <ErrorTestComponent />
      </AppInsightsErrorBoundary>
    );
    expect(component.html()).toEqual(Enzyme.shallow(<ErrorDisplay />).html());
  });

  it("should catch the error and track exception", () => {
    const ErrorDisplay = () => <div>Error</div>;

    const component = Enzyme.mount(
      <AppInsightsErrorBoundary
        appInsights={reactPlugin}
        onError={ErrorDisplay}
      >
        <ErrorTestComponent />
      </AppInsightsErrorBoundary>
    );
    expect(trackExceptionSpy).toHaveBeenCalledTimes(1);
  });
});
