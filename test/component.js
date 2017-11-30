/* global describe it */

import assert from 'assert';
import { JSDOM } from 'jsdom';

import createElement from '@a-ignatov-parc/virtual-dom/create-element';

import createComponent from '../src/render/component';

const GET_DEFAULT_PROPS = 'getDefaultProps';
const GET_INITIAL_STATE = 'getInitialState';
const COMPONENT_WILL_MOUNT = 'componentWillMount';
const COMPONENT_DID_MOUNT = 'componentDidMount';
const COMPONENT_WILL_RECEIVE_PROPS = 'componentWillReceiveProps';
const SHOULD_COMPONENT_UPDATE = 'shouldComponentUpdate';
const RENDER = 'render';
const COMPONENT_WILL_UPDATE = 'componentWillUpdate';
const COMPONENT_DID_UPDATE = 'componentDidUpdate';
const COMPONENT_WILL_UNMOUNT = 'componentWillUnmount';

describe('Component', () => {
  it('lifecycle', () => {
    const dom = new JSDOM('');
    const { document } = dom.window;

    const lifecycleCallOrder = [];

    const element = createComponent({
      getDefaultProps() {
        lifecycleCallOrder.push(GET_DEFAULT_PROPS);
      },

      getInitialState() {
        lifecycleCallOrder.push(GET_INITIAL_STATE);
      },

      componentWillMount() {
        lifecycleCallOrder.push(COMPONENT_WILL_MOUNT);
      },

      componentDidMount() {
        lifecycleCallOrder.push(COMPONENT_DID_MOUNT);
      },

      render() {
        lifecycleCallOrder.push(RENDER);
        return null;
      },
    });

    const vdom = element.toNode();
    const childNode = createElement(vdom, { document });

    assert.equal(
      lifecycleCallOrder,
      [
        GET_DEFAULT_PROPS,
        GET_INITIAL_STATE,
        COMPONENT_WILL_MOUNT,
        RENDER,
        COMPONENT_DID_MOUNT,
      ],
      'lifecycle order should be as expected',
    );
  });
});
