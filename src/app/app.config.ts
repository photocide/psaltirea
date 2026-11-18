import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
} from "@angular/router";
import { routes } from "./app.routes";

/** Application providers for routing, route inputs, and global browser errors. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
  ],
};
