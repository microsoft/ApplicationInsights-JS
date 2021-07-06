import React from "react";
import ReactPlugin from "../src/ReactPlugin";
import AppInsightsErrorBoundary from "../src/AppInsightsErrorBoundary";
import { TestComponent, ErrorTestComponent } from "./TestComponent";
import { render} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

let reactPlugin: ReactPlugin;
let trackExceptionSpy;
let orgWarn = console && console.warn;

describe("<AppInsightsErrorBoundary />", () => {
  beforeEach(() => {
    if (orgWarn) {
      console.warn = (msg) => { /* Swallow */ }
    }
    reactPlugin = new ReactPlugin();
    trackExceptionSpy = reactPlugin.trackException = jest.fn();
  });

  afterEach(() => {
    if (orgWarn) {
      console.warn = orgWarn;
    }
  });

  it("should render a non-erroring component", () => {
    const aiErrorBoundry = render(
      <AppInsightsErrorBoundary
        appInsights={reactPlugin}
        onError={() => <div></div>}
      >
        <TestComponent />
      </AppInsightsErrorBoundary>
    );
    const testComponent = render(<TestComponent />);
    expect(aiErrorBoundry.container).toEqual(testComponent.container);
  });

  it("should catch the error and render the alternative component", async () => {
    const orgError = console && console.error;
    if (orgError) {
      console.error = msg => { /* Do Nothing */ };
    }

    try {
      const ErrorDisplay = () => <div>Error</div>;
      const aiErrorBoundry = render(
        <AppInsightsErrorBoundary
          appInsights={reactPlugin}
          onError={ErrorDisplay}
        >
          <ErrorTestComponent />
        </AppInsightsErrorBoundary>
      );
      const errorDisplay = render(<ErrorDisplay />);
      expect(aiErrorBoundry.container).toEqual(errorDisplay.container);
    } finally {
      if (orgError) {
        console.error = orgError;
      }
    }
  });

  it("should catch the error and track exception", async () => {
    const orgError = console && console.error;
    if (orgError) {
      console.error = msg => { /* Do Nothing */ };
    }

    try {
      const ErrorDisplay = () => <div>Error</div>;
      const aiErrorBoundry = render(
        <AppInsightsErrorBoundary
          appInsights={reactPlugin}
          onError={ErrorDisplay}
        >
          <ErrorTestComponent />
        </AppInsightsErrorBoundary>
      );
      expect(trackExceptionSpy).toHaveBeenCalledTimes(1);
    } finally {
      if (orgError) {
        console.error = orgError;
      }
    }
  });
});
