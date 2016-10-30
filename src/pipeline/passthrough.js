import Pipeline from './simple';

export default class PassthroughPipeline extends Pipeline {
	pipe(handler) {
		const pipeline = super.pipe(handler);
		pipeline.sink = this.sink.bind(this);
		return pipeline;
	}
}
