import Stream from './stream';

export default class Pipeline extends Stream {
  constructor(options, pipeline = []) {
    super(options);
    this.pipeline = pipeline;
  }

  isHandlerValid(handler) {
    return handler instanceof Stream || typeof handler === 'function';
  }

  createTransform(handler) {
    let tail = handler;

    if (handler instanceof this.constructor) {
      tail = handler.pipeline;
    } else if (handler instanceof Stream) {
      tail = payload => handler.sink(payload);
    }

    const stream = new this.constructor(this.options, this.pipeline.concat(tail));
    return { stream };
  }

  _sink(step = 0, ctx, payload) {
    return this.pipeline.reduce((result, handler, pipelineStep) => {
      return result
        .then(this.handleSinkByStep(pipelineStep, ctx))
        .then(handler)
        .then(this.handleSinkByStepEnd(pipelineStep, ctx));
    }, Promise.resolve(payload));
  }
}
