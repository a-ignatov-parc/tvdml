/* global App, navigationDocument */
import { createStream } from './pipelines';
import { Symbol } from './utils';

const routes = {};

export const route = {
  NOT_FOUND: new Symbol('Not found'),
};

export function handleRoute(routeName) {
  if (!routeName) {
    throw new Error('Route handler need route to process');
  }
  if (routes[routeName]) {
    throw new Error(
      `Handler for "${routeName.toString()}" is already specified`,
    );
  }

  routes[routeName] = createStream({
    onSinkStepEnd(step, payload, ctx) {
      if (!ctx.documents) {
        ctx.documents = [];
      }

      const hasDocument = payload && payload.document;
      if (hasDocument && ctx.documents.indexOf(payload.document) === -1) {
        ctx.documents.push(payload.document);
      }
      return payload;
    },

    onSinkComplete(payload, { documents }) {
      if (documents.length === 0) {
        console.warn(
          `Navigation to route "${routeName.toString()}" ended without rendering any navigation record!`,
        );
      } else if (documents.length > 1) {
        console.warn(
          `Navigation to route "${routeName.toString()}" ended with rendering more than one navigation record!`,
        );
      }

      if (documents[0].route !== routeName) {
        console.warn(
          `Navigation to route "${routeName.toString()}" ended with unexpected navigation document "${
            documents[0].route
          }"!`,
        );
      }

      return payload;
    },
  });

  return routes[routeName];
}

export function dismissRoute(routeName) {
  if (!routeName) {
    throw new Error('Route handler need route to process');
  }

  if (!routes[routeName]) {
    throw new Error(`Handler for "${routeName}" isn't specified`);
  }

  delete routes[routeName];
}

export function navigate(routeName, params, isRedirect = false) {
  if (!App.launched) {
    throw new Error("Can't process navigation before app is launched");
  }

  const targetRoute = routes[routeName];
  if (targetRoute) {
    return targetRoute.sink({
      route: routeName,
      navigation: params,
      redirect: isRedirect,
    });
  }

  // use toString as route may be a Symbol
  console.error(`Unable to resolve route "${routeName.toString()}"`);
  if (routeName !== route.NOT_FOUND) {
    return navigate(route.NOT_FOUND, params);
  }

  return Promise.reject();
}

export function redirect(routeName, params) {
  return navigate(routeName, params, true);
}

export function navigateBack() {
  if (navigationDocument.documents.length > 1) {
    navigationDocument.documents.pop();
  }
}
