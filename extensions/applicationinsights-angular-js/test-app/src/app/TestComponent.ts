import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
    template: `Search`
})
export class SearchComponent {
}

@Component({
    template: `Home`
})
export class HomeComponent {
}

@Component({
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
}

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full'},
    { path: 'home', component: HomeComponent },
    { path: 'search', component: SearchComponent }
];
