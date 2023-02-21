import type { ROLES } from "@/enums/ROLES";
import { useAccountService } from "@/modules/account/accountService";
import { routes } from "@/routes";
import { feedback } from "@/utils/feedback";
import { applicationTitle } from "@/utils/globalProperties";
import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordNormalized,
} from "vue-router";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export const defaultRoute = import.meta.env.VITE_ADMIN_PANEL
  ? { user: "/", visitor: "login" }
  : { user: "/", visitor: "login" };

const settings = { implicitLoadingBar: true };
const loadingBar = feedback.loadingBar;

const createAuthorization =
  (roles: string[], isLoggedIn: boolean) =>
  (route: RouteLocationNormalized | RouteRecordNormalized) =>
    route.meta.authorize?.({ roles, isLoggedIn }) ?? true;

router.beforeEach((to, from, next) => {
  const { roles, isLoggedIn } = useAccountService();
  const authorize = createAuthorization(roles, isLoggedIn);
  const referrer = router.referrer;
  router.referrer = from;

  const isFound = !!to.matched.length;
  const isAuthorized = to.matched.every(authorize);
  const isValid = isFound && isAuthorized;

  if (to.meta.loadingBar ?? settings.implicitLoadingBar) {
    loadingBar.start();
    setTimeout(() => (isValid ? loadingBar.finish() : loadingBar.error()));
  }

  return isValid
    ? next()
    : referrer && authorize(from)
    ? next(from)
    : referrer && authorize(referrer)
    ? next(referrer)
    : next(isLoggedIn ? defaultRoute.user : defaultRoute.visitor);
});

router.afterEach((to) => {
  document.title = to.matched.reduce((a, c) => {
    if (typeof c.meta.title === "function") return c.meta.title(to);
    else if (typeof c.meta.title === "string") return c.meta.title;
    else return a;
  }, applicationTitle);
});

export type RouteBreadcrumb = {
  label: string;
  to: { name: string } | { path: string };
};
declare module "vue-router" {
  interface RouteMeta {
    authorize?: (options: {
      roles: typeof ROLES.values | string[];
      isLoggedIn: boolean;
    }) => boolean;
    breadcrumbs?: (route: RouteLocationNormalized) => RouteBreadcrumb[];
    title?: string | ((route: RouteLocationNormalized) => string);
    loadingBar?: boolean;
  }
  interface Router {
    referrer?: RouteLocationNormalized;
  }
}
