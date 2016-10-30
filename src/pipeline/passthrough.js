import Pipeline from './simple';

export default class PassthroughPipeline extends Pipeline {
	constructor(...args) {
		super(...args);
		this.sink = super.sink.bind(this);
	}

	pipe(handler) {
		const pipeline = super.pipe(handler);
		pipeline.sink = this.sink;
		return pipeline;
	}
}
