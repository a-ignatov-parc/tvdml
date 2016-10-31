import {createStream} from './pipelines';

const subscriptions = {};

export function subscribe(name) {
	if (!subscriptions[name]) {
		subscriptions[name] = [];
	}

	const stream = createStream({
		extend: {
			unsubscribe() {
				const index = subscriptions[name].indexOf(stream);

				if (~index) {
					subscriptions[name].splice(index, 1);
				}
			}
		}
	});

	subscriptions[name].push(stream);

	return stream;
}

export function broadcast(name, data) {
	(subscriptions[name] || []).forEach(stream => stream.sink(data));
}
