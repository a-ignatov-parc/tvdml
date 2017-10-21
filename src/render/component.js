import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';

import CustomNode from './custom-node';

export default function createComponent(spec) {
  return new CustomNode(Component, spec);
}

const excludeList = [
  'init',
  'update',
  'destroy',
  'setState',
  'updateProps',
];

export class Component {
  constructor(props, spec) {
    Object
      .keys(spec)
      .filter(name => {
        let isExcluded = !!~excludeList.indexOf(name);
        if (isExcluded) throw `Can't override system method "${name}"`;
        return !isExcluded;
      })
      .forEach(name => this[name] = spec[name].bind(this));

    this._props = { ...props };
    this.type = 'Widget';
  }

  init(options) {
    this._queue = null;

    this.props = { ...this._props, ...this.getDefaultProps() };
    this.state = { ...this.getInitialState() };

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

    update.call(this, props, { ...previous.state, ...state });
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

  setState(newState = {}) {
    const nextState = { ...this.state, ...newState };

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

function update(nextProps, nextState) {
  const prevProps = this.props;
  const prevState = this.state;

  nextProps || (nextProps = prevProps);
  nextState || (nextState = prevState);

  const shouldUpdate = this.shouldComponentUpdate(nextProps, nextState);

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
