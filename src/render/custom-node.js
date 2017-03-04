export default class CustomNode {
	constructor(Constructor, lifecycle) {
		this.Constructor = Constructor;
		this.lifecycle = lifecycle;
	}

	toNode(payload) {
		let {Constructor, lifecycle} = this;
		return new Constructor(lifecycle, payload);
	}
}
