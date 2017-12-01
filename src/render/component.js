/* eslint-disable no-underscore-dangle */

import diff from '@a-ignatov-parc/virtual-dom/diff';
import patch from '@a-ignatov-parc/virtual-dom/patch';
import createElement from '@a-ignatov-parc/virtual-dom/create-element';

import Text from '@a-ignatov-parc/virtual-dom/vnode/vtext';

import CustomNode from './custom-node';

const excludeList = [
  'init',
  'update',
  'destroy',
  'setState',
  'updateProps',
];

function render() {
  const hasOuterQueue = !!this._queue;

  let result;

  if (!hasOuterQueue) this._queue = {};

  try {
    result = this.render();
  } catch (error) {
    console.error(error);
  }

  if (this._queue.state) {
    throw new Error('You can\'t use setState during rendering phase');
  }

  if (!hasOuterQueue) this._queue = null;

  if (typeof result === 'boolean' || result === null) {
    return new Text('');
  }

  if (typeof result === 'string' || typeof result === 'number') {
    return new Text(result);
  }

  return result;
}

function update(nextProps, nextState) {
  const prevProps = this.props;
  const prevState = this.state;

  // eslint-disable-next-line no-param-reassign
  if (!nextProps) nextProps = prevProps;

  // eslint-disable-next-line no-param-reassign
  if (!nextState) nextState = prevState;

  const shouldUpdate = this.shouldComponentUpdate(nextProps, nextState);

  this.props = nextProps;
  this.state = nextState;

  if (shouldUpdate) {
    this._queue = {};

    const prev = this._vdom;

    this.componentWillUpdate(nextProps, nextState);

    const next = render.call(this);
    const updateTree = diff(prev, next);

    this._vdom = next;
    this._rootNode = patch(this._rootNode, updateTree);
    this._queue = null;

    this.componentDidUpdate(prevProps, prevState);
  }
}

export class Component {
  constructor(props, spec) {
    Object
      .keys(spec)
      .filter((name) => {
        // eslint-disable-next-line no-bitwise
        const isExcluded = !!~excludeList.indexOf(name);

        if (isExcluded) {
          throw new Error(`Can't override system method "${name}"`);
        }
        return !isExcluded;
      })
      .forEach((name) => {
        this[name] = spec[name].bind(this);
      });

    this._props = { ...props };
    this.type = 'Widget';
  }

  init(options) {
    this._queue = null;

    this.props = { ...this.getDefaultProps.call(null), ...this._props };
    this.state = { ...this.getInitialState() };

    this.componentWillMount();
    this._vdom = render.call(this);
    this._rootNode = createElement(this._vdom, options);

    return this._rootNode;
  }

  update(previous, domNode) {
    const props = this._props;

    this._queue = {};
    this._rootNode = domNode;
    this._vdom = previous._vdom;
    this.componentWillReceiveProps(props);

    const { state } = this._queue;
    this._queue = null;

    update.call(this, props, { ...previous.state, ...state });
  }

  updateProps(nextProps) {
    this._props = nextProps;
    this.update(this, this._rootNode);
  }

  destroy() {
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

  componentWillReceiveProps() {}

  shouldComponentUpdate() {
    return true;
  }

  render() {
    return null;
  }

  componentWillUpdate() {}

  componentDidUpdate() {}

  componentWillUnmount() {}
}

export default function createComponent(spec) {
  return new CustomNode(Component, spec);
}
