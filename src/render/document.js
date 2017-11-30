/* global DOMImplementationRegistry */

import createElement from '@a-ignatov-parc/virtual-dom/create-element';

import CustomNode from './custom-node';
import { Component } from './component';
import { broadcast } from '../event-bus';
import { noop } from '../utils';

const DEFAULT_HANDLER = 'default';

/**
 * Because TVJS doesn't expose node types we need to hardcode them.
 *
 * Node types taken from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 */
const ELEMENT_NODE = 1;
// const TEXT_NODE = 3;
// const PROCESSING_INSTRUCTION_NODE = 7;
// const COMMENT_NODE = 8;
// const DOCUMENT_NODE = 9;
// const DOCUMENT_TYPE_NODE = 10;
// const DOCUMENT_FRAGMENT_NODE = 11;

function createDefaultHandler(handlerName) {
  return function defaultHandler(...args) {
    const [event] = args;
    const { events = {} } = event.target;
    const handler = events[handlerName];

    if (typeof handler === 'function') {
      handler.apply(this, args);
    }
  };
}

const handlers = {
  play: {
    [DEFAULT_HANDLER]: createDefaultHandler('onPlay'),
  },

  select: {
    [DEFAULT_HANDLER]: createDefaultHandler('onSelect'),

    menuItem({ target: menuItem }) {
      const menuBar = menuItem.parentNode;
      const feature = menuBar.getFeature('MenuBarDocument');

      broadcast('menu-item-select', {
        menuItem,
        menuBar: feature,
      });
    },
  },

  change: {
    [DEFAULT_HANDLER]: createDefaultHandler('onChange'),
  },

  highlight: {
    [DEFAULT_HANDLER]: createDefaultHandler('onHighlight'),
  },

  holdselect: {
    [DEFAULT_HANDLER]: createDefaultHandler('onHoldselect'),
  },
};

const eventsList = [
  'play',
  'select',
  'change',
  'highlight',
  'holdselect',
];

export function createEmptyDocument() {
  const document = DOMImplementationRegistry
    .getDOMImplementation()
    .createDocument();

  document.extra = {};

  // eslint-disable-next-line no-plusplus
  for (let i = document.childNodes.length; i; i--) {
    document.removeChild(document.childNodes.item(i - 1));
  }

  return document;
}

function createEventHandler(handlersCollection = {}) {
  return function eventHandler(...args) {
    const [event] = args;
    const { target } = event;
    const { tagName } = target;

    const handler = handlersCollection[tagName]
      || handlersCollection[DEFAULT_HANDLER]
      || noop();

    return handler.apply(this, args);
  };
}

export function vdomToDocument(vdom, payload, targetDocument) {
  const { navigation } = payload || {};
  const { menuBar, menuItem } = navigation || {};

  let vnode;

  if (vdom instanceof CustomNode) {
    vnode = vdom.toNode(payload);
  } else {
    vnode = vdom;
  }

  if (menuItem) {
    const menuItemDocument = menuBar.getDocument(menuItem);

    if (menuItemDocument && menuItemDocument.updateComponent) {
      menuItemDocument.updateComponent(payload);
      return menuItemDocument;
    }
  }

  const document = targetDocument || createEmptyDocument();
  const childNode = createElement(vnode, { document });

  const menuBars = childNode.nodeType === ELEMENT_NODE
    ? childNode.getElementsByTagName('menuBar')
    : [];

  if (menuBars.length) {
    document.menuBarDocument = menuBars.item(0).getFeature('MenuBarDocument');
  } else if (vnode instanceof Component) {
    document.didMount = vnode.componentDidMount.bind(vnode);
    document.updateComponent = vnode.updateProps.bind(vnode);
    document.destroyComponent = vnode.destroy.bind(vnode, childNode);
  }

  document.appendChild(childNode);

  eventsList.forEach((eventName) => {
    document.addEventListener(
      eventName,
      createEventHandler(handlers[eventName]),
    );
  });

  return document;
}
