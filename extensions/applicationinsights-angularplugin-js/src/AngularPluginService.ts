import { Injectable } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import AngularPlugin from './AngularPlugin';
import { IMetricTelemetry } from '@microsoft/applicationinsights-common';
import { CoreUtils } from "@microsoft/applicationinsights-core-js";

const RESOLVEEND = "ResolveEnd";

@Injectable({
    providedIn: 'root'
})
export class AngularPluginService {
    private _prevMountTimestamp: number = 0;
    private _mountTimestamp: number = 0;
    private _prevComponentName: string ='';
    private _componentName: string = '';
    private angularPlugin: AngularPlugin;
    private router: Router;
    
    // "router: any" to avoid build error - Types have separate declarations of a private property 'rootComponentType'.
    init(angularPlugin: AngularPlugin, router: any): void {
        this.angularPlugin = angularPlugin;
        this.router = router;
        this.router.events.subscribe((event) => {
            if (event.constructor.name === RESOLVEEND) {
                const resolveEndEvent = event as ResolveEnd;
                this._prevMountTimestamp = this._mountTimestamp;
                this._mountTimestamp = CoreUtils.dateNow();
                this._prevComponentName = this._componentName;
                this._componentName = resolveEndEvent.state.root.firstChild.routeConfig.component && resolveEndEvent.state.root.firstChild.routeConfig.component.name || '';
            }
        });
    }

    trackMetric() {
        if (this._mountTimestamp === 0) {
            throw new Error('AngularPluginService: mountTimestamp is not initialized.');
        }

        const componentLifeTime = CoreUtils.dateNow() - this._prevMountTimestamp;
        const metricData: IMetricTelemetry = {
            average: componentLifeTime,
            name: 'Angular Component Existed Time (seconds)'
        };

        const additionalProperties: { [key: string]: any } = { 'Component Name': this._prevComponentName };
        this.angularPlugin.trackMetric(metricData, additionalProperties);
    }
}
