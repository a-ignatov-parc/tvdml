import assign from 'object-assign';

import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';

import CustomNode from './custom-node';

export function createComponent(spec) {
	return new CustomNode(FactoryComponent, spec);
}

export class Component {
	constructor(props) {
		this._queue = null;
		this.type = 'Widget';
		this.props = this._props = assign({}, this.constructor.defaultProps, props);
		this.state = {};
	}

	init(options) {
		this._vdom = render.call(this);
		this._rootNode = createElement(this._vdom, options);
		this.componentWillMount();

		setTimeout(this.componentDidMount.bind(this), 0);
		return this._rootNode;
	}

	update(previous, domNode) {
		const props = this._props;

		this._queue = {};
		this._rootNode = domNode;
		this._vdom = previous._vdom;
		this.componentWillReceiveProps(props);

		const {state} = this._queue;
		this._queue = null;

		update.call(this, props, assign({}, previous.state, state));
	}

	updateProps(nextProps) {
		this._props = nextProps;
		this.update(this, this._rootNode);
	}

	destroy(domNode) {
		this.componentWillUnmount();
		this._rootNode = null;
		this._queue = null;
		this._vdom = null;
	}

	setState(newState = {}, callback) {
		const nextState = typeof(newState) === 'function'
			? newState(this.state, this.props)
			: assign({}, this.state, newState);

		if (this._queue) {
			this._queue.state = nextState;
			return;
		}

		update.call(this, null, nextState);

		if (typeof(callback) === 'function') {
			callback();
		}
	}

	forceUpdate(callback) {
		update.call(this, null, null, true);

		if (typeof(callback) === 'function') {
			callback();
		}
	}

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
	let result;

	this._queue = {};

	try {
		result = this.render();
	} catch(error) {
		console.error(error);
	}

	if (this._queue.state) {
		throw `You can't use setState during rendering phase`;
	}

	this._queue = null;
	return result;
}

function update(nextProps, nextState, force) {
	const prevProps = this.props;
	const prevState = this.state;

	nextProps || (nextProps = prevProps);
	nextState || (nextState = prevState);

	const shouldUpdate = force || this.shouldComponentUpdate(nextProps, nextState);

	this.props = nextProps;
	this.state = nextState;

	if (shouldUpdate) {
		const prev = this._vdom;
		const next = render.call(this);
		const update = diff(prev, next);

		this._vdom = next;
		this.componentWillUpdate(nextProps, nextState);

		this._rootNode = patch(this._rootNode, update);
		this.componentDidUpdate(prevProps, prevState);
	}
}

const excludeList = [
	'init',
	'update',
	'destroy',
	'setState',
	'updateProps',
	'forceUpdate',
];

export class FactoryComponent extends Component {
	constructor(spec, props) {
		super(props);

		Object
			.keys(spec)
			.filter(name => {
				let isExcluded = !!~excludeList.indexOf(name);
				if (isExcluded) throw `Can't override system method "${name}"`;
				return !isExcluded;
			})
			.forEach(name => this[name] = spec[name].bind(this));
	}

	init(options) {
		this.props = assign({}, this._props, this.getDefaultProps());
		this.state = assign({}, this.getInitialState());

		return super.init(options);
	}

	getDefaultProps() {}

	getInitialState() {}
}
