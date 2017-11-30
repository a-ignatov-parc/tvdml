/* global describe it */

import assert from 'assert';
import { JSDOM } from 'jsdom';

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

        assert.equal(this.props, undefined, `
          "this.props" in "getDefaultProps" lifecycle hook should be undefined.
        `);

        assert.equal(this.state, undefined, `
          "this.state" in "getDefaultProps" lifecycle hook should be undefined.
        `);

        return { b: 1, c: 1 };
      },

      getInitialState() {
        lifecycleCallOrder.push(GET_INITIAL_STATE);

        assert.equal(this.state, undefined, `
          "this.state" in "getInitialState" lifecycle hook should be undefined.
        `);

        assert.deepEqual(this.props, { a: 1, b: 2, c: 1 }, `
          "this.props" in "getInitialState" lifecycle hook should result
          in combination of the incoming props and props resolved
          in "getDefaultProps".
        `);

        return { d: 1 };
      },

      componentWillMount() {
        lifecycleCallOrder.push(COMPONENT_WILL_MOUNT);

        assert.deepEqual(this.props, { a: 1, b: 2, c: 1 }, `
          "this.props" in "componentWillMount" lifecycle hook should be same
          as in "getInitialState" hook.
        `);

        assert.deepEqual(this.state, { d: 1 }, `
          "this.state" in "componentWillMount" lifecycle hook should
          be same as resolved in "getInitialState".
        `);
      },

      componentDidMount() {
        lifecycleCallOrder.push(COMPONENT_DID_MOUNT);

        assert.deepEqual(this.props, { a: 1, b: 2, c: 1 }, `
          "this.props" in "componentDidMount" lifecycle hook should be same
          as in "componentWillMount" hook.
        `);

        assert.deepEqual(this.state, { d: 1 }, `
          "this.state" in "componentDidMount" lifecycle hook should be same
          as in "componentWillMount" hook.
        `);
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

    vdomToDocument(vdom, { a: 1, b: 2 }, dom.window.document);

    assert.deepEqual(lifecycleCallOrder, [
      GET_DEFAULT_PROPS,
      GET_INITIAL_STATE,
      COMPONENT_WILL_MOUNT,
      RENDER,
      COMPONENT_DID_MOUNT,
    ], 'lifecycle order should be as expected');
  });
});
