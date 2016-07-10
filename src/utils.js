import {Promise} from 'es6-promise';

export function noop() {
	return () => {};
}

export function promisedTimeout(timeout) {
	return new Promise(resolve => setTimeout(resolve, timeout));
}
