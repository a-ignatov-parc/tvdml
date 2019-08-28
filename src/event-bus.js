/* global App */
import { createStream } from './pipelines';
import { Symbol } from './utils';

const subscriptions = {};

export const event = {
  EXIT: new Symbol('onExit'),
  ERROR: new Symbol('onError'),
  LAUNCH: new Symbol('onLaunch'),
  RELOAD: new Symbol('onReload'),
  RESUME: new Symbol('onResume'),
  SUSPEND: new Symbol('onSuspend'),
};

export function subscribe(name) {
  if (!subscriptions[name]) {
    subscriptions[name] = [];
  }

  const stream = createStream({
    extend: {
      unsubscribe() {
        const index = subscriptions[name].indexOf(this);
        if (index !== -1) {
          subscriptions[name].splice(index, 1);
        }
      },
    },
  });

  subscriptions[name].push(stream);

  return stream;
}

export function broadcast(name, data) {
  console.info(`broadcast: ${name}`, data);
  (subscriptions[name] || []).forEach(stream => stream.sink(data));
}

Object.keys(event).forEach(id => {
  const symbol = event[id];
  const name = symbol.toString();
  App[name] = options => {
    console.info('Fired handler for app lifecycle', name, options);
    if (name === 'onLaunch') {
      App.launched = true;
    }
    broadcast(symbol, options);
  };
});
