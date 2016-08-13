import assign from 'object-assign';

import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';

import CustomNode from './custom-node';

export default function createComponent(lifecycle) {
	return new CustomNode(Component, lifecycle);
}

const excludeList = [
	'init',
	'update',
	'destroy',
	'setState',
];

export class Component {
	constructor(props, lifecycle, ownerDocument) {
		Object
			.keys(lifecycle)
			.filter(name => {
				let isExcluded = !!~excludeList.indexOf(name);
				if (isExcluded) throw `Can't override system method "${name}"`;
				return !isExcluded;
			})
			.forEach(name => this[name] = lifecycle[name].bind(this));

		this._props = assign({}, props);
		this._owner = ownerDocument;

		this.type = 'Widget';
	}

	init() {
		this._queue = null;

		this.props = assign({}, this._props, this.getDefaultProps());
		this.state = assign({}, this.getInitialState());

		this._vdom = render.call(this);
		this._rootNode = createElement(this._vdom, {document: this._owner});
		this.componentWillMount();

		setTimeout(this.componentDidMount.bind(this), 0);
		return this._rootNode;
	}

	update(previous, domNode) {
		let props = this._props;

		this._queue = {};
		this._rootNode = domNode;
		this._vdom = previous._vdom;
		this.componentWillReceiveProps(props);

		let {state} = this._queue;
		this._queue = null;

		update.call(this, props, assign({}, previous.state, state));
	}

	destroy(domNode) {
		this.componentWillUnmount();
		this._rootNode = null;
		this._queue = null;
		this._vdom = null;
	}

	setState(newState = {}) {
		let nextState = assign({}, this.state, newState);

		if (this._queue) {
			this._queue.state = nextState;
			return;
		}

		update.call(this, null, nextState);
	}

	getDefaultProps() {}

	getInitialState() {}

	componentWillMount() {}

	componentDidMount() {}

	componentWillReceiveProps(nextProps) {}

	shouldComponentUpdate(nextProps, nextState) {
		return true;
	}

	render() {
		return null;
	}

	componentWillUpdate(nextProps, nextState) {}

	componentDidUpdate(prevProps, prevState) {}

	componentWillUnmount() {}
};

function render() {
	this._queue = {};

	let result = this.render();

	if (this._queue.state) {
		throw `You can't use setState during rendering phase`;
	}

	this._queue = null;
	return result;
}

function update(nextProps, nextState) {
	let prevProps = this.props;
	let prevState = this.state;

	nextProps || (nextProps = prevProps);
	nextState || (nextState = prevState);

	this.props = nextProps;
	this.state = nextState;

	if (this.shouldComponentUpdate(nextProps, nextState)) {
		let prev = this._vdom;
		let next = render.call(this);

		let update = diff(prev, next);
		this._vdom = next;
		this.componentWillUpdate(nextProps, nextState);

		patch(this._rootNode, update);
		this.componentDidUpdate(prevProps, prevState);
	}
}
