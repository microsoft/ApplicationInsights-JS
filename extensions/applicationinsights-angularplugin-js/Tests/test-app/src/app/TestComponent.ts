import { Component, HostListener, OnDestroy } from '@angular/core';
import { Routes } from '@angular/router';
import { AngularPluginService } from '../../../../src/AngularPluginService';

@Component({
    template: `Search`
})
export class SearchComponent implements OnDestroy {
    constructor(private angularPluginService: AngularPluginService){};
    @HostListener('window:beforeunload')
    ngOnDestroy() {
        this.angularPluginService.trackMetric();
    }
}

@Component({
    template: `Home`
})
export class HomeComponent implements OnDestroy {
    constructor(private angularPluginService: AngularPluginService){};
    @HostListener('window:beforeunload')
    ngOnDestroy() {
        this.angularPluginService.trackMetric();
    }
}

@Component({
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
    constructor(private angularPluginService: AngularPluginService){};
}

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full'},
    { path: 'home', component: HomeComponent },
    { path: 'search', component: SearchComponent }
];
