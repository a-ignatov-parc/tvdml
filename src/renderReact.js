/* global navigationDocument */

import React from 'react';
import ReactFiberReconciler from 'react-reconciler';

import { createPipeline } from './pipelines';
import { createEmptyDocument } from './render/document';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_TYPE_NODE = 10;
const DOCUMENT_FRAGMENT_NODE = 11;

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

const emptyObject = {};

function getOwnerDocumentFromRootContainer(rootContainerElement) {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
}

function createElement(type, props, rootContainerElement, parentNamespace) {
  console.log(
    'createElement',
    type,
    props,
    rootContainerElement,
    parentNamespace,
  );

  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  const domElement = ownerDocument.createElement(type);
  return domElement;
}

function createTextNode(text, rootContainerElement) {
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  const textNode = ownerDocument.createTextNode(text);
  return textNode;
}

function setInitialProperties(domElement, tag, rawProps, rootContainerElement) {
  console.log('setInitialProperties', domElement, tag, rawProps);
}

const TVMLRenderer = ReactFiberReconciler({
  getRootHostContext(rootContainerInstance) {
    const nodeType = rootContainerInstance.nodeType;

    let namespace;

    switch (nodeType) {
      case DOCUMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE: {
        let root = rootContainerInstance.documentElement;
        namespace = root ? root.namespaceURI : HTML_NAMESPACE;
        break;
      }
      default: {
        namespace = HTML_NAMESPACE;
        break;
      }
    }
    return namespace;
  },

  getChildHostContext(parentHostContext, type) {
    return HTML_NAMESPACE;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit() {
    // noop
  },

  resetAfterCommit() {
    // noop
  },

  createInstance(type, props, rootContainerInstance, hostContext) {
    const domElement = createElement(
      type,
      props,
      rootContainerInstance,
      hostContext,
    );

    return domElement;
  },

  appendInitialChild(parentInstance, child) {
    console.log('appendInitialChild', parentInstance, child);
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren(domElement, type, props, rootContainerInstance) {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return false;
  },

  prepareUpdate(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    hostContext,
  ) {
    console.log(
      'prepareUpdate',
      domElement,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
    );

    return null;
  },

  shouldSetTextContent(type, props) {
    return false;
  },

  shouldDeprioritizeSubtree(type, props) {
    return false;
  },

  createTextInstance(text, rootContainerInstance, hostContext) {
    const textNode = createTextNode(text, rootContainerInstance);
    return textNode;
  },

  now: () => Date.now(),

  useSyncScheduling: true,

  mutation: {
    commitMount(domElement, type, newProps) {
      console.log(
        'commitMount',
        domElement,
        type,
        newProps,
      );
    },

    commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
      console.log(
        'commitUpdate',
        domElement,
        updatePayload,
        type,
        oldProps,
        newProps,
      );
    },

    resetTextContent(domElement) {
      domElement.textContent = '';
    },

    commitTextUpdate(textInstance, oldText, newText) {
      textInstance.nodeValue = newText;
    },

    appendChild(parentInstance, child) {
      parentInstance.appendChild(child);
    },

    appendChildToContainer(container, child) {
      if (container.nodeType === COMMENT_NODE) {
        container.parentNode.insertBefore(child, container);
      } else {
        container.appendChild(child);
      }
    },

    insertBefore(parentInstance, child, beforeChild) {
      parentInstance.insertBefore(child, beforeChild);
    },

    insertInContainerBefore(container, child, beforeChild) {
      if (container.nodeType === COMMENT_NODE) {
        container.parentNode.insertBefore(child, beforeChild);
      } else {
        container.insertBefore(child, beforeChild);
      }
    },

    removeChild(parentInstance, child) {
      parentInstance.removeChild(child);
    },

    removeChildFromContainer(container, child) {
      if (container.nodeType === COMMENT_NODE) {
        container.parentNode.removeChild(child);
      } else {
        container.removeChild(child);
      }
    },
  },
});

export function renderModalReact(Component) {
  console.log('renderModalReact', Component);
}

export function renderReact(Component) {
  return createPipeline()
    .pipe(payload => {
      const document = createEmptyDocument();
      const root = TVMLRenderer.createContainer(document, false, false);
      const children = React.createElement(Component, payload);

      console.log('renderReact', payload, document, root, children);

      TVMLRenderer.updateContainer(children, root, null, () => {
        navigationDocument.pushDocument(document);
      });
    });
}
