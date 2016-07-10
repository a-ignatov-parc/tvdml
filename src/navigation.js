/** @jsx jsx */

import {createPassThroughPipeline} from './pipeline';
import Blank from './components/blank';
import {Promise} from 'es6-promise';
import {render} from './render';
import jsx from './jsx';

let launched = false;

const routes = {};

const DOCUMENT_ANIMATION_TIMING = 500;

export const route = {
	EXIT: Symbol('onExit'),
	ERROR: Symbol('onError'),
	LAUNCH: Symbol('onLaunch'),
	RELOAD: Symbol('onReload'),
	RESUME: Symbol('onResume'),
	SUSPEND: Symbol('onSuspend'),
	NOT_FOUND: Symbol('Not found'),
};

const routeMapping = {
	onExit: route.EXIT,
	onError: route.ERROR,
	onLaunch: route.LAUNCH,
	onReload: route.RELOAD,
	onResume: route.RESUME,
	onSuspend: route.SUSPEND,
};

const nameMapping = Object
	.keys(routeMapping)
	.concat(Object.keys(route))
	.reduce((result, name) => {
		result[routeMapping[name] || route[name]] = name;
		return result;
	}, {});

export function handleRoute(routeName) {
	if (!routeName) {
		throw new Error('Route handler need route to process');
	}

	if (typeof(routeName) === 'function' && !route[routeName]) {
		throw new Error(`Route handler can't process unknown custom handler`);
	}

	if (routes[routeName]) {
		throw new Error(`Handler for "${routeName}" is already specified`);
	}

	return routes[routeName] = createPassThroughPipeline({
		onSinkStep(step, payload) {
			let current = getActiveDocument();

			if (step && current.route !== routeName) {
				throw `Processing route "${nameMapping[routeName] || routeName}" isn't active. Terminating pipeline...`;
			}

			return payload;
		}
	})
	.pipe(render(<Blank />))
	.pipe((payload) => new Promise(resolve => setTimeout(() => resolve(payload), DOCUMENT_ANIMATION_TIMING)));
}

export function navigate(routeName, params) {
	if (!launched) {
		throw new Error(`Can't process navigation before app is launched`);
	}

	let targetRoute = routes[routeName];

	if (targetRoute) {
		return targetRoute.sink({
			route: routeName,
			navigation: params,
		});
	}

	if (routeName !== route.NOT_FOUND) {
		return navigate(route.NOT_FOUND, params);
	}

	console.error(`Unable to resolve route "${nameMapping[routeName] || routeName}"`);
}

Object
	.keys(routeMapping)
	.forEach(name => {
		let symbol = routeMapping[name];

		App[name] = options => {
			console.info('Fired handler for app lifecycle', name, options);

			if (name === 'onLaunch') {
				sessionStorage.setItem('startParams', JSON.stringify(options));
				launched = true;
			}
			navigate(symbol);
		}
	});
