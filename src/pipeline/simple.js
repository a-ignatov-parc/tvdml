import assign from 'object-assign';
import {Promise} from 'es6-promise';

// Need to implement:
// + options.extend
// - options.onSinkStep

export default class Pipeline {
	constructor(options = {}) {
		assign(this, options.extend);
		this.options = options;
		this.pipelines = [];
	}

	pipe(handler) {
		let pipeline;

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
		return this._sink(payload);
	}

	_sink(payload) {
		return Promise.all(this.pipelines.map(({pipeline, handler}) => {
			return Promise
				.resolve(payload)
				.then(handler)
				.then(pipeline._sink.bind(pipeline));
		}));
	}
}
