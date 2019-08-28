import Stream from './pipelines/stream';
import Pipeline from './pipelines/pipeline';
import { noop } from './utils';

export function createStream(options) {
  return new Stream(options);
}

export function createPipeline(options) {
  return new Pipeline(options);
}

export function passthrough(handler = noop()) {
  return payload =>
    Promise.resolve(handler(payload)).then(extra =>
      extra && typeof extra === 'object' ? { ...payload, ...extra } : payload,
    );
}
