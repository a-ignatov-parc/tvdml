import {Promise} from 'es6-promise';

export default class Stream {
	constructor(options = {}) {
		Object.assign(this, options.extend);
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
			const resolver = (step, ctx, payload) => {
				return Promise
					.resolve(payload)
					.then(handler)
					.then(stream._sink.bind(stream, step + 1, ctx));
			};

			return {stream, resolver};
		}
	}

	sink(payload) {
		const ctx = {};

		return this._sink(0, ctx, payload)
			.then(this.handleSinkComplete(ctx))
			.catch(error => {
				console.error(error);
				return Promise.reject(error);
			});
	}

	_sink(step = 0, ctx, payload) {
		return Promise
			.all(this.forks.map(resolver => {
				return Promise
					.resolve(payload)
					.then(this.handleSinkByStep(step, ctx))
					.then(resolver.bind(resolver, step, ctx))
					.then(this.handleSinkByStepEnd(step, ctx));
			}))
			.then(forks => payload);
	}

	handleSinkByStep(step, ctx) {
		return payload => {
			const {onSinkStep} = this.options;
			if (typeof(onSinkStep) === 'function') return onSinkStep(step, payload, ctx);
			return payload;
		};
	}

	handleSinkByStepEnd(step, ctx) {
		return payload => {
			const {onSinkStepEnd} = this.options;
			if (typeof(onSinkStepEnd) === 'function') return onSinkStepEnd(step, payload, ctx);
			return payload;
		};
	}

	handleSinkComplete(ctx) {
		return payload => {
			const {onSinkComplete} = this.options;
			if (typeof(onSinkComplete) === 'function') return onSinkComplete(payload, ctx);
			return payload;
		};
	}
}
