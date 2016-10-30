import {Promise} from 'es6-promise';

import Stream from './stream';

export default class Pipeline extends Stream {
	constructor(options, pipeline = []) {
		super(options);
		this.pipeline = pipeline;
	}

	isHandlerValid(handler) {
		return handler instanceof this.constructor || handler instanceof Stream || typeof(handler) === 'function';
	}

	createTransform(handler) {
		let tail = handler;

		if (handler instanceof this.constructor) {
			tail = handler.pipeline;
		} else if (handler instanceof Stream) {
			tail = payload => handler.sink(payload);
		}

		const stream = new this.constructor(this.options, this.pipeline.concat(tail));
		return {stream};
	}

	_sink(step = 0, payload) {
		return this.pipeline.reduce((result, handler, step) => {
			return result
				.then(payload => {
					const {onSinkStep} = this.options;
					if (typeof(onSinkStep) === 'function') return onSinkStep(step, payload);
					return payload;
				})
				.then(handler);
		}, Promise.resolve(payload));
	}
}
