import {passthrough, createStream} from './pipelines';
import {broadcast, subscribe} from './event-bus';
import {render} from './render';
import {Symbol} from './utils';

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
			if (!ctx.documents) ctx.documents = [];
			if (payload && payload.document && !~ctx.documents.indexOf(payload.document)) {
				ctx.documents.push(payload.document);
			}
			return payload;
		},

		onSinkComplete(payload, ctx) {
			const {documents} = ctx;

			if (!documents.length) {
				console.warn(`Navigation to route "${routeName}" ended without rendering any navigation record!`);
			}

			if (documents.length > 1) {
				console.warn(`Navigation to route "${routeName}" ended with rendering more than one navigation record!`);
			}

			if (documents[0].route !== routeName) {
				console.warn(`Navigation to route "${routeName}" ended with unexpected navigation document "${documents[0].route}"!`);
			}

			return payload;
		}
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

export function navigate(routeName, params, redirect = false) {
	if (!launched) {
		throw new Error(`Can't process navigation before app is launched`);
	}

	const targetRoute = routes[routeName];

	if (targetRoute) {
		return targetRoute.sink({
			redirect,
			route: routeName,
			navigation: params,
		});
	}

	console.error(`Unable to resolve route "${routeName}"`);

	if (routeName !== route.NOT_FOUND) {
		return navigate(route.NOT_FOUND, params);
	}
}

export function redirect(routeName, params) {
	return navigate(routeName, params, true);
}

Object
	.keys(event)
	.forEach(id => {
		const symbol = event[id];
		const name = symbol.toString();

		App[name] = options => {
			console.info('Fired handler for app lifecycle', name, options);

			if (name === 'onLaunch') {
				sessionStorage.setItem('startParams', JSON.stringify(options));
				launched = true;
			}
			broadcast(symbol);
		}
	});

subscribe('menu-item-select').pipe(({menuItem, menuBar}) => {
	const route = menuItem.getAttribute('route');

	if (route) {
		navigate(route, {menuItem, menuBar});
	}
});
