import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {noop} from './utils';

export function createPipeline(options = {}) {
	const {
		chain = [],
		passthrough,
	} = this || {};

	const pipeline = (...args) => (payload) => {
		return chain
			.reduce((target, handler, i) => {
				return target
					.then((options.onSinkStep || onSinkStep).bind(null, i))
					.then(handler);
			}, Promise.resolve(assign({}, payload, {args})))
			.catch(error => console.error(error));
	};

	return assign(pipeline, {
		pipe(handler) {
			if (typeof(handler.pipe) === 'function') {
				handler = handler();
			}

			if (passthrough) {
				chain.push(handler);
				return this;
			}

			return createPipeline.call({chain: chain.concat(handler)}, options);
		},

		sink(payload) {
			return pipeline()(payload);
		},
	});
}

export function createPassThroughPipeline(options) {
	return createPipeline.call({passthrough: true}, options);
}

export function passthrough(handler = noop()) {
	return payload => {
		return Promise
			.resolve(handler(payload))
			.then(extra => {
				if (extra == null || typeof(extra) !== 'object') return payload;
				return assign({}, payload, extra);
			});
	};
}

function onSinkStep(step, payload) {
	return payload;
}
