import { Component }          from '@angular/core';
import { ROUTER_DIRECTIVES }  from '@angular/router';

@Component({
  selector: 'my-app',
  template: `
    <h1 class="title">Angular Plugin Test</h1>
    <nav>
      <a [routerLink]="['/home']">Home</a>
      <a [routerLink]="['/about']">About</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  providers:  [],
  directives: [ROUTER_DIRECTIVES]
})
export class AppComponent {
}