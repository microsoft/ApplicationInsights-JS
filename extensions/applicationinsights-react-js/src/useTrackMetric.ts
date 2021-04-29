import { useEffect, useRef } from "react";
import { dateNow } from "@microsoft/applicationinsights-core-js";
import ReactPlugin from "./ReactPlugin";

interface ITrackedData {
  hookTimestamp: number;
  firstActiveTimestamp: number;
  totalIdleTime: number;
  lastActiveTimestamp: number;
  idleStartTimestamp: number;
  idleCount: number;
  idleTimeout: number;
}

function getEngagementTimeSeconds(trackedData: ITrackedData) {
  return (
    (dateNow() -
      trackedData.firstActiveTimestamp -
      trackedData.totalIdleTime -
      trackedData.idleCount * trackedData.idleTimeout) /
    1000
  );
}

const useComponentTracking = (
  reactPlugin: ReactPlugin,
  componentName: string
) => {
  const tracking = useRef<ITrackedData>({
    hookTimestamp: dateNow(),
    firstActiveTimestamp: 0,
    totalIdleTime: 0,
    lastActiveTimestamp: 0,
    idleStartTimestamp: 0,
    idleCount: 0,
    idleTimeout: 5000
  });
  const savedCallback = useRef<() => void>();

  const callback = () => {
    let trackedData = tracking.current;
    if (
      trackedData.lastActiveTimestamp > 0 &&
      trackedData.idleStartTimestamp === 0 &&
      dateNow() - trackedData.lastActiveTimestamp >= trackedData.idleTimeout
    ) {
      trackedData.idleStartTimestamp = dateNow();
      trackedData.idleCount++;
    }
  };
  const delay = 100;

  savedCallback.current = callback;

  // Set up the interval.
  useEffect(() => {
    let id = setInterval(savedCallback.current, delay);
    return () => {
      clearInterval(id);

      let trackedData = tracking.current;
      if (trackedData.hookTimestamp === 0) {
        throw new Error(
          "useAppInsights:unload hook: hookTimestamp is not initialized."
        );
      }

      if (trackedData.firstActiveTimestamp === 0) {
        return;
      }

      const engagementTime = getEngagementTimeSeconds(trackedData);
      const metricData = {
        average: engagementTime,
        name: "React Component Engaged Time (seconds)",
        sampleCount: 1
      };

      const additionalProperties = { "Component Name": componentName };
      reactPlugin.trackMetric(metricData, additionalProperties);
    };
  }, []);

  const trackActivity = () => {
    let trackedData = tracking.current;
    if (trackedData.firstActiveTimestamp === 0) {
      trackedData.firstActiveTimestamp = dateNow();
      trackedData.lastActiveTimestamp = trackedData.firstActiveTimestamp;
    } else {
      trackedData.lastActiveTimestamp = dateNow();
    }

    if (trackedData.idleStartTimestamp > 0) {
      const lastIdleTime =
        trackedData.lastActiveTimestamp - trackedData.idleStartTimestamp;
      trackedData.totalIdleTime += lastIdleTime;
      trackedData.idleStartTimestamp = 0;
    }
  };

  return trackActivity;
};

export default useComponentTracking;
