import { createContext, useContext } from "react";
import ReactPlugin from "./ReactPlugin";

const AppInsightsContext = createContext<ReactPlugin>(undefined);

const useAppInsightsContext = () => useContext(AppInsightsContext);

export { AppInsightsContext, useAppInsightsContext };
