import {Promise} from 'es6-promise';
import {noop} from './utils';

import Stream from './pipelines/stream';
import Pipeline from './pipelines/pipeline';

export function createStream(options) {
  return new Stream(options);
}

export function createPipeline(options) {
  return new Pipeline(options);
}

export function passthrough(handler = noop()) {
  return payload => {
    return Promise
      .resolve(handler(payload))
      .then(extra => {
        if (extra == null || typeof(extra) !== 'object') return payload;
        return { ...payload, ...extra };
      });
  };
}
