/* global describe it */

import assert from 'assert';
import { JSDOM } from 'jsdom';

import createElement from '@a-ignatov-parc/virtual-dom/create-element';

import createComponent from '../src/render/component';
import { vdomToDocument } from '../src/render/document';

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
  it('initial render lifecycle', () => {
    const dom = new JSDOM('');
    const lifecycleCallOrder = [];

    const vdom = createComponent({
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

      componentWillReceiveProps() {
        lifecycleCallOrder.push(COMPONENT_WILL_RECEIVE_PROPS);
      },

      shouldComponentUpdate() {
        lifecycleCallOrder.push(SHOULD_COMPONENT_UPDATE);
        return true;
      },

      componentWillUpdate() {
        lifecycleCallOrder.push(COMPONENT_WILL_UPDATE);
      },

      componentDidUpdate() {
        lifecycleCallOrder.push(COMPONENT_DID_UPDATE);
      },

      componentWillUnmount() {
        lifecycleCallOrder.push(COMPONENT_WILL_UNMOUNT);
      },

      render() {
        lifecycleCallOrder.push(RENDER);
        return null;
      },
    });

    const renderedDocument = vdomToDocument(vdom, null, dom.window.document);

    assert.deepEqual(
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
