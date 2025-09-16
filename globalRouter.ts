// globalRouter.ts
import { Router } from "expo-router";

let globalRouter: Router | null = null;
let pendingPath: string | null = null;

export function setGlobalRouter(router: Router) {
  globalRouter = router;
  if (pendingPath) {
    globalRouter.replace(pendingPath as any);
    pendingPath = null;
  }
}

export function navigateGlobal(path: string) {
  if (globalRouter) {
    globalRouter.replace("./app/index");
  } else {
    pendingPath = path;
  }
}
