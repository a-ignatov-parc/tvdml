export default class CustomNode {
	constructor(Constructor, lifecycle) {
		this.Constructor = Constructor;
		this.lifecycle = lifecycle;
	}

	toNode(payload, ownerDocument) {
		let {Constructor, lifecycle} = this;
		return new Constructor(payload, lifecycle, ownerDocument);
	}
}
