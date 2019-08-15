import { provideRouter, RouterConfig }  from '@angular/router';

import { HomeRoutes } from './home/home.routes';
import { AboutRoutes }       from './about/about.routes';

export const routes: RouterConfig = [
  ...AboutRoutes,
  ...HomeRoutes
];

export const APP_ROUTER_PROVIDERS = [
  provideRouter(routes)
];
