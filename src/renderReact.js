/* global navigationDocument */

import React from 'react';
import ReactFiberReconciler from 'react-reconciler';

import { broadcast } from './event-bus';
import { promisedTimeout } from './utils';
import { createEmptyDocument } from './render/document';
import { passthrough, createPipeline } from './pipelines';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_TYPE_NODE = 10;
const DOCUMENT_FRAGMENT_NODE = 11;

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

const CHILDREN = 'children';

const RENDERING_ANIMATION = 600;

const isEventNameRegex = /^on[A-Z]/;

const supportedEventMapping = {
  onPlay: 'play',
  onSelect: 'select',
  onChange: 'change',
  onHighlight: 'highlight',
  onHoldselect: 'holdselect',
};

function getOwnerDocumentFromRootContainer(rootContainerElement) {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
}

function createElement(type, props, rootContainerElement, parentNamespace) {
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  const domElement = ownerDocument.createElement(type);
  return domElement;
}

function createTextNode(text, rootContainerElement) {
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  const textNode = ownerDocument.createTextNode(text);
  return textNode;
}

function setInitialProperties(domElement, type, props, rootContainerElement) {
  console.log('setInitialProperties', domElement, type, props);

  Object
    .keys(props)
    .forEach(propName => {
      const propValue = props[propName];

      if (propName === CHILDREN) {
        if (type === 'style') {
          domElement.innerHTML = propValue;
        } else if (typeof propValue === 'string') {
          if (propValue !== '') domElement.textContent = propValue;
        } else if (typeof propValue === 'number') {
          domElement.textContent = `${propValue}`;
        }
      } else if (isEventNameRegex.test(propName)) {
        const eventName = supportedEventMapping[propName];

        if (eventName && typeof propValue === 'function') {
          domElement.addEventListener(eventName, propValue);
        }
      } else if (propValue != null) {
        domElement.setAttribute(propName, propValue);
      }
    });

  if (type === 'menuItem') {
    domElement.addEventListener('select', ({ target: menuItem }) => {
      const menuBar = menuItem.parentNode;
      const feature = menuBar.getFeature('MenuBarDocument');

      broadcast('menu-item-select', {
        menuItem,
        menuBar: feature,
      });
    });
  }
}

function diffProperties(
  domElement,
  type,
  oldProps,
  newProps,
  rootContainerInstance,
) {
  let updatePayload = null;

  Object
    .keys(oldProps)
    .forEach(propName => {
      const propValue = oldProps[propName];
      const shouldSkip = newProps.hasOwnProperty(propName)
        || !oldProps.hasOwnProperty(propName)
        || oldProps[propName] == null;

      if (shouldSkip) return;
      (updatePayload = updatePayload || []).push(propName, null);
    });

  Object
    .keys(newProps)
    .forEach(propName => {
      const propValue = newProps[propName];
      const oldPropValue = oldProps != null ? oldProps[propName] : undefined;

      const shouldSkip = !newProps.hasOwnProperty(propName)
        || propValue === oldPropValue
        || (propValue == null && oldPropValue == null);

      if (shouldSkip) return;
      if (propName === CHILDREN) {
        const shouldUpdate = oldPropValue !== propValue
          && (
            typeof propValue === 'string'
            || typeof propValue === 'number'
          );

        if (shouldUpdate) {
          (updatePayload = updatePayload || []).push(propName, '' + propValue);
        }
      } else {
        (updatePayload = updatePayload || []).push(propName, propValue);
      }
    });

  if (updatePayload) {
    console.log(
      'diffProperties',
      domElement,
      type,
      oldProps,
      newProps,
      updatePayload,
    );
  }

  return updatePayload;
}

function updateProperties(domElement, updatePayload, type, oldProps, newProps) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propName = updatePayload[i];
    const propValue = updatePayload[i + 1];

    console.log(
      'updateProperties',
      domElement,
      type,
      propName,
      propValue,
      oldProps,
      newProps,
    );

    if (propName === CHILDREN) {
      if (type === 'style') {
        domElement.innerHTML = propValue;
      } else {
        domElement.textContent = propValue;
      }
    } else if (isEventNameRegex.test(propName)) {
      const eventName = supportedEventMapping[propName];

      if (eventName) {
        if (oldProps[propName] !== newProps[propName]) {
          domElement.removeEventListener(eventName, oldProps[propName]);
        }

        if (typeof propValue === 'function') {
          domElement.addEventListener(eventName, propValue);
        }
      }
    } else {
      if (propValue === null || typeof propValue === 'undefined') {
        domElement.removeAttribute(propName);
      } else {
        domElement.setAttribute(propName, propValue);
      }
    }
  }
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
    return diffProperties(
      domElement,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
    );
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
      updateProperties(domElement, updatePayload, type, oldProps, newProps);
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
    .pipe(passthrough((payload) => {
      const {
        route,
        redirect,
        navigation = {},
      } = payload;

      const { menuBar, menuItem } = navigation;

      let { document } = payload;

      if (!document) {
        document = createEmptyDocument();

        const root = TVMLRenderer.createContainer(
          document, // container
          false, // isAsync
          false, // hydrate
        );

        Object.assign(document, {
          route,
          reactRoot: root,

          render(children, callback) {
            TVMLRenderer.updateContainer(children, root, null, callback);
          },

          unmount(callback) {
            TVMLRenderer.updateContainer(null, root, null, callback);
          },
        });
      }

      /**
       * If we received dismissed document it means that user pressed menu
       * button and our pipeline is canceled. Now we must silently succeed
       * the rest of the pipeline without rendering anything.
       */
      if (document.possiblyDismissedByUser) return null;

      document.render(React.createElement(Component, payload));

      if (!document.isAttached) {
        if (redirect) {
          const index = navigationDocument.documents.indexOf(document);
          const prevDocument = navigationDocument.documents[index - 1];

          if (prevDocument) {
            navigationDocument.replaceDocument(document, prevDocument);
          }
        } else {
          navigationDocument.pushDocument(document);
        }

        document.isAttached = true;
      }

      return {
        document,
        redirect: false,
      };
    }))
    .pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)));
}
