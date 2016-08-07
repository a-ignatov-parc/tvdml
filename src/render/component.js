import assign from 'object-assign';

import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';

import {passthrough, createPipeline} from '../pipeline';
import {render as createRender} from '../render';

export default function createComponent(lifecycle) {
	return createPipeline().pipe(createRender(new Component(lifecycle)));
}

const excludeList = [
	'setState',
];

export class Component {
	constructor(lifecycle) {
		Object
			.keys(lifecycle)
			.filter(name => !~excludeList.indexOf(name))
			.forEach(name => this[name] = lifecycle[name].bind(this));
	}

	init(props, container) {
		this._queue = null;
		this._container = container;

		let document = this._container.ownerDocument;

		document.renderComponentWithProps = renderComponent.bind(this);
		document.destroyComponent = destroy.bind(this);

		this.props = assign({}, props, this.getDefaultProps());
		this.state = assign({}, this.getInitialState());

		this._vdom = render.call(this);
		this._rootNode = createElement(this._vdom, {document});
		this.componentWillMount();

		this._container.appendChild(this._rootNode);
		this.componentDidMount();
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

function destroy() {
	this.componentWillUnmount();
	this._container = null;
	this._rootNode = null;
	this._queue = null;
	this._vdom = null;
}

function renderComponent(props) {
	this._queue = {};
	this.componentWillReceiveProps(props);

	let {state} = this._queue;

	this._queue = null;
	update.call(this, props, state);
}
