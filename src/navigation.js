/* global App */

import { createStream } from './pipelines';
import { broadcast, subscribe } from './event-bus';
import { Symbol } from './utils';

let launched = false;

const routes = {};

export const event = {
  EXIT: new Symbol('onExit'),
  ERROR: new Symbol('onError'),
  LAUNCH: new Symbol('onLaunch'),
  RELOAD: new Symbol('onReload'),
  RESUME: new Symbol('onResume'),
  SUSPEND: new Symbol('onSuspend'),
};

export const route = {
  NOT_FOUND: new Symbol('Not found'),
};

export function handleRoute(routeName) {
  if (!routeName) {
    throw new Error('Route handler need route to process');
  }

  if (routes[routeName]) {
    throw new Error(`Handler for "${routeName}" is already specified`);
  }

  routes[routeName] = createStream({
    onSinkStepEnd(step, payload, ctx) {
      const hasDocument = payload && payload.document;

      if (!ctx.documents) ctx.documents = [];

      // eslint-disable-next-line no-bitwise
      if (hasDocument && !~ctx.documents.indexOf(payload.document)) {
        ctx.documents.push(payload.document);
      }
      return payload;
    },

    onSinkComplete(payload, ctx) {
      const { documents } = ctx;

      if (!documents.length) {
        // eslint-disable-next-line max-len
        console.warn(`Navigation to route "${routeName}" ended without rendering any navigation record!`);
      }

      if (documents.length > 1) {
        // eslint-disable-next-line max-len
        console.warn(`Navigation to route "${routeName}" ended with rendering more than one navigation record!`);
      }

      if (documents[0].route !== routeName) {
        // eslint-disable-next-line max-len
        console.warn(`Navigation to route "${routeName}" ended with unexpected navigation document "${documents[0].route}"!`);
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
  if (!launched) {
    throw new Error('Can\'t process navigation before app is launched');
  }

  const targetRoute = routes[routeName];

  if (targetRoute) {
    return targetRoute.sink({
      route: routeName,
      navigation: params,
      redirect: isRedirect,
    });
  }

  console.error(`Unable to resolve route "${routeName}"`);

  if (routeName !== route.NOT_FOUND) {
    return navigate(route.NOT_FOUND, params);
  }

  return Promise.reject();
}

export function redirect(routeName, params) {
  return navigate(routeName, params, true);
}

Object
  .keys(event)
  .forEach((id) => {
    const symbol = event[id];
    const name = symbol.toString();

    App[name] = (options) => {
      console.info('Fired handler for app lifecycle', name, options);
      if (name === 'onLaunch') launched = true;
      broadcast(symbol, options);
    };
  });

subscribe('menu-item-select').pipe(({ menuItem, menuBar }) => {
  const routeValue = menuItem.getAttribute('route');
  if (routeValue) navigate(routeValue, { menuItem, menuBar });
});
