import {passthrough, createPassThroughPipeline} from './pipeline';
import {broadcast, subscribe} from './event-bus';
import {Promise} from 'es6-promise';
import createElement from './jsx';
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

	return routes[routeName] = createPassThroughPipeline({
		onSinkStep(step, payload) {
			let current = getActiveDocument();

			if (step && current && current.route !== routeName) {
				throw `Processing route "${routeName}" isn't active. Terminating pipeline...`;
			}
			return payload;
		}
	})
	.pipe(render(createElement('document')));
}

export function navigate(routeName, params, redirect = false) {
	if (!launched) {
		throw new Error(`Can't process navigation before app is launched`);
	}

	let targetRoute = routes[routeName];

	if (targetRoute) {
		return targetRoute.sink({
			route: routeName,
			navigation: params,
			redirect,
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
		let symbol = event[id];
		let name = symbol.toString();

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
	let route = menuItem.getAttribute('route');

	if (route) {
		navigate(route, {menuItem, menuBar});
	}
});
