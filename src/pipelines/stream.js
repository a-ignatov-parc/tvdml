import assign from 'object-assign';
import {Promise} from 'es6-promise';

export default class Stream {
	constructor(options = {}) {
		assign(this, options.extend);
		this.options = options;
		this.forks = [];
	}

	pipe(handler) {
		if (!this.isHandlerValid(handler)) {
			const error = new TypeError(`Unsupported handler type`);
			error.code = 'EUNSUPPORTEDHANDLER';
			throw error;
		}

		const {stream, resolver} = this.createTransform(handler);
		resolver && this.forks.push(resolver);
		return stream;
	}

	isHandlerValid(handler) {
		return handler instanceof this.constructor || typeof(handler) === 'function';
	}

	createTransform(handler) {
		if (handler instanceof this.constructor) {
			return {stream: this.pipe(handler.sink.bind(handler))};
		} else {
			const stream = new this.constructor(this.options);
			const resolver = (step, payload) => {
				return Promise
					.resolve(payload)
					.then(handler)
					.then(stream._sink.bind(stream, step + 1));
			};

			return {stream, resolver};
		}
	}

	sink(payload) {
		return this._sink(0, payload);
	}

	_sink(step = 0, payload) {
		return Promise
			.all(this.forks.map(resolver => {
				return Promise
					.resolve(payload)
					.then(this.handleSinkByStep(step))
					.then(resolver.bind(resolver, step));
			}))
			.then(forks => payload);
	}

	handleSinkByStep(step) {
		return payload => {
			const {onSinkStep} = this.options;
			if (typeof(onSinkStep) === 'function') return onSinkStep(step, payload);
			return payload;
		};
	}
}
