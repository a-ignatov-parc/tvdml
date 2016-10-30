import assign from 'object-assign';
import {Promise} from 'es6-promise';

export default class Pipeline {
	constructor(options = {}) {
		assign(this, options.extend);
		this.options = options;
		this.pipelines = [];
	}

	pipe(handler) {
		let pipeline;

		if (!(handler instanceof Pipeline) && typeof(handler) !== 'function') {
			const error = new TypeError(`Unsupported handler type`);
			error.code = 'EUNSUPPORTEDHANDLER';
			throw error;
		}

		if (handler instanceof Pipeline) {
			pipeline = handler;
			handler = payload => payload;
		} else {
			pipeline = new this.constructor(this.options);
		}
		this.pipelines.push({pipeline, handler});
		return pipeline;
	}

	sink(payload) {
		return this._sink(0, payload);
	}

	_sink(step = 0, payload) {
		return Promise.all(this.pipelines.map(({pipeline, handler}) => {
			return Promise
				.resolve(payload)
				.then(payload => {
					const {onSinkStep} = this.options;
					if (typeof(onSinkStep) === 'function') return onSinkStep(step, payload);
					return payload;
				})
				.then(handler)
				.then(pipeline._sink.bind(pipeline, step + 1));
		}));
	}
}
