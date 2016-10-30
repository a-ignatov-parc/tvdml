import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {noop} from './utils';

import Pipeline from './pipeline/simple';
import PassthroughPipeline from './pipeline/passthrough';

export function createPipeline(options) {
	return new Pipeline(options);
}

export function createPassThroughPipeline(options) {
	return new PassthroughPipeline(options);
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
