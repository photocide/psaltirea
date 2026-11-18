import { Routes } from "@angular/router";
import { PsalmIndex } from "./pages/psalm-index";
import { PsalmReader } from "./pages/psalm-reader";
import { SearchPage } from "./pages/search-page";
import { SavedPage } from "./pages/saved-page";
import { PersonalPsalmPage } from "./pages/personal-psalm";
import { SavedPersonalPsalmPage } from "./pages/saved-personal-psalm";

/** Routes for reading, searching, saved items, and personal psalm editing. */
export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "psalmi" },
  { path: "psalmi", component: PsalmIndex },
  { path: "psalmi/:number", component: PsalmReader },
  { path: "cautare", component: SearchPage },
  { path: "psalmul-meu", component: PersonalPsalmPage },
  { path: "psalmul-meu/salvat", component: SavedPersonalPsalmPage },
  { path: "psalmul-meu/salvat/:id", component: SavedPersonalPsalmPage },
  { path: "psalmul-meu/salvat/:id/editare", component: PersonalPsalmPage },
  { path: "salvate", pathMatch: "full", redirectTo: "salvate/psalmi" },
  { path: "salvate/psalmi", component: SavedPage, data: { kind: "psalms" } },
  { path: "salvate/versete", component: SavedPage, data: { kind: "verses" } },
  { path: "**", redirectTo: "psalmi" },
];
