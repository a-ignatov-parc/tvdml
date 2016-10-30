import {createStream} from './pipelines';

const subscriptions = {};

export function subscribe(name) {
	if (!subscriptions[name]) {
		subscriptions[name] = [];
	}

	const pipeline = createStream({
		extend: {
			unsubscribe() {
				const index = subscriptions[name].indexOf(pipeline);

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
