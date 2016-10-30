import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {noop} from './utils';

import Pipeline from './pipeline/simple';
import PassthroughPipeline from './pipeline/passthrough';

export function createPipeline2(options) {
	return new Pipeline(options);
}

export function createPassThroughPipeline2(options) {
	return new PassthroughPipeline(options);
}

export function createPipeline(options = {}, params) {
	const {
		chain = [],
		passthrough,
	} = params || {};

	const pipeline = (...args) => (payload) => {
		return chain
			.reduce((target, handler, i) => {
				return target
					.then((options.onSinkStep || onSinkStep).bind(null, i))
					.then(handler);
			}, Promise.resolve(assign({}, payload, {args})))
			.catch(error => console.error(error));
	};

	return assign(pipeline, options.extend, {
		pipe(handler) {
			if (typeof(handler.pipe) === 'function') {
				handler = handler();
			}

			if (passthrough) {
				chain.push(handler);
				return this;
			}

			return createPipeline(options, {chain: chain.concat(handler)});
		},

		sink(payload) {
			return pipeline()(payload);
		},
	});
}

export function createPassThroughPipeline(options) {
	return createPipeline(options, {passthrough: true});
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
