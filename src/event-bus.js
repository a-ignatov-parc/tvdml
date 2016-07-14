import {createPassThroughPipeline} from './pipeline';
import {Promise} from 'es6-promise';

const subscriptions = {};

export function subscribe(name) {
	if (!subscriptions[name]) {
		subscriptions[name] = [];
	}

	let pipeline = createPassThroughPipeline({
		extend: {
			unsubscribe() {
				let index = subscriptions[name].indexOf(pipeline);

				if (~index) {
					subscriptions[name].splice(index, 1);
				}
			}
		}
	});

	subscriptions[name].push(pipeline);

	return pipeline;
}

export function broadcast(name, data) {
	(subscriptions[name] || []).forEach(pipeline => pipeline.sink(data));
}
