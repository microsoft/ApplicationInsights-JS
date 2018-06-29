import { IChannelControls } from "applicationinsights-core-js";

export interface IChannelControlsAI extends IChannelControls {
    flush();
}