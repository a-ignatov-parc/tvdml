import {Promise} from 'es6-promise';

export function noop() {
	return () => {};
}

export function promisedTimeout(timeout) {
	return new Promise(resolve => setTimeout(resolve, timeout));
}

export class Symbol {
	constructor(name) {
		this.name = name;
	}

	toString() {
		return this.name;
	}
}
