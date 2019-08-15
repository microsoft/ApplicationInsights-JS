import { RouterConfig } from '@angular/router';
import { HomeComponent } from './home.component';

export const HomeRoutes: RouterConfig = [
  {
    path: '',
    redirectTo: '/home',
    terminal: true
  },
  {
    path: 'home',
    component: HomeComponent
  }
];
