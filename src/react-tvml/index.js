/* global DataItem */

import ReactFiberReconciler from 'react-reconciler';

import { broadcast } from '../event-bus';

import {
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './node-types';

const NAMESPACE = 'http://www.w3.org/1999/xhtml';

const STYLE = 'style';
const CHILDREN = 'children';
const DATAITEM = 'dataItem';

/**
 * This props has special behaviour.
 *
 * If they are set to `true` or any truthy value then attribute value
 * will be set to `true` as a string.
 *
 * If they are set to `false` or any falsy value then attribute won't be
 * set at all. As if it was set to `undefined`.
 *
 * More info can be found here:
 * https://goo.gl/TG4fXG
 */
const booleanAttributes = [
  'allowsZooming',
  'aspectFill',
  'autoHighlight',
  'centered',
  'disabled',
  'handlesOverflow',
  'opaque',
  'showSpinner',
  'showsScrollIndicator',
  'secure',
];

const eventNameRegex = /^on[A-Z]/;

const supportedEventMapping = {
  onPlay: 'play',
  onSelect: 'select',
  onChange: 'change',
  onHighlight: 'highlight',
  onNeedsmore: 'needsmore',
  onHoldselect: 'holdselect',
};

function isTextNode(node) {
  return node && node.nodeType === TEXT_NODE;
}

function toDashCase(str) {
  return str.replace(/([A-Z])/g, match => `-${match[0].toLowerCase()}`);
}

function styleObjToString(styleObj) {
  return Object
    .keys(styleObj)
    .reduce((result, key) => {
      const value = styleObj[key];
      const hasValue = (typeof value === 'string' && value)
        || typeof value === 'number';

      if (hasValue) {
        result.push(`${toDashCase(key)}:${value}`);
      }
      return result;
    }, [])
    .join(';');
}

function getOwnerDocumentFromRootContainer(rootContainerElement) {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
}

function createElement(type, props, rootContainerElement) {
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  const domElement = ownerDocument.createElement(type);
  return domElement;
}

function createTextNode(text, rootContainerElement) {
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  const textNode = ownerDocument.createTextNode(text);
  return textNode;
}

function updateNodeValue(node) {
  if (node._handledTextNodes) {
    const newValue = node._handledTextNodes.map(({ value }) => value).join('');
    node.nodeValue = newValue;
  }
}

function setInitialProperties(
  domElement,
  type,
  props,
  // rootContainerElement,
) {
  Object
    .keys(props)
    .forEach((propName) => {
      const propValue = props[propName];

      if (propName === CHILDREN) {
        if (type === 'style') {
          domElement.innerHTML = propValue;
        }
      } else if (propName === DATAITEM) {
        if (propValue instanceof DataItem) {
          domElement.dataItem = propValue;
        } else if (propValue) {
          domElement.dataItem = new DataItem();
          Object
            .keys(propValue)
            .forEach((key) => {
              domElement.dataItem.setPropertyPath(key, propValue[key]);
            });
        }
      } else if (booleanAttributes.includes(propName)) {
        if (propValue) {
          domElement.setAttribute(propName, true);
        }
      } else if (eventNameRegex.test(propName)) {
        const eventName = supportedEventMapping[propName];

        if (eventName && typeof propValue === 'function') {
          domElement.addEventListener(eventName, propValue);
        }
      } else if (propValue != null) {
        let attrValue = propValue;

        if (propName === STYLE) {
          attrValue = styleObjToString(propValue);
        }

        domElement.setAttribute(propName, attrValue);
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
  // rootContainerInstance,
) {
  let updatePayload = null;

  Object
    .keys(oldProps)
    .forEach((propName) => {
      const propValue = oldProps[propName];
      const shouldSkip = newProps.hasOwnProperty(propName)
        || !oldProps.hasOwnProperty(propName)
        || propValue == null;

      if (shouldSkip) return;
      (updatePayload = updatePayload || []).push(propName, null);
    });

  Object
    .keys(newProps)
    .forEach((propName) => {
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
          (updatePayload = updatePayload || []).push(propName, `${propValue}`);
        }
      } else if (propName === DATAITEM) {
        if (oldPropValue !== propValue) {
          (updatePayload = updatePayload || []).push(propName, propValue);
        }
      } else if (booleanAttributes.includes(propName)) {
        const oldBoolValue = !!oldPropValue;
        const boolValue = !!propValue;

        if (oldBoolValue !== boolValue) {
          (updatePayload = updatePayload || []).push(propName, propValue);
        }
      } else if (propName === STYLE) {
        const oldStyleValue = styleObjToString(oldPropValue);
        const styleValue = styleObjToString(propValue);

        if (oldStyleValue !== styleValue) {
          (updatePayload = updatePayload || []).push(propName, propValue);
        }
      } else {
        (updatePayload = updatePayload || []).push(propName, propValue);
      }
    });

  return updatePayload;
}

function updateProperties(
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps,
) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propName = updatePayload[i];
    const propValue = updatePayload[i + 1];

    if (propName === CHILDREN) {
      if (type === 'style') {
        domElement.innerHTML = propValue;
      }
    } else if (propName === DATAITEM) {
      if (propValue == null) {
        delete domElement.dataItem;
      } else if (propValue instanceof DataItem) {
        domElement.dataItem = propValue;
      } else {
        domElement.dataItem = new DataItem();
        Object
          .keys(propValue)
          .forEach((key) => {
            domElement.dataItem.setPropertyPath(key, propValue[key]);
          });
      }
    } else if (booleanAttributes.includes(propName)) {
      if (propValue) {
        domElement.setAttribute(propName, true);
      } else {
        domElement.removeAttribute(propName);
      }
    } else if (eventNameRegex.test(propName)) {
      const eventName = supportedEventMapping[propName];

      if (eventName) {
        if (oldProps[propName] !== newProps[propName]) {
          domElement.removeEventListener(eventName, oldProps[propName]);
        }

        if (typeof propValue === 'function') {
          domElement.addEventListener(eventName, propValue);
        }
      }
    } else if (propValue == null) {
      domElement.removeAttribute(propName);
    } else {
      let attrValue = propValue;

      if (propName === STYLE) {
        attrValue = styleObjToString(propValue);
      }

      domElement.setAttribute(propName, attrValue);
    }
  }
}

const TVMLRenderer = ReactFiberReconciler({
  getRootHostContext(rootContainerInstance) {
    const { nodeType } = rootContainerInstance;
    let namespace;

    switch (nodeType) {
      case DOCUMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE: {
        const root = rootContainerInstance.documentElement;
        namespace = root ? root.namespaceURI : NAMESPACE;
        break;
      }
      default: {
        namespace = NAMESPACE;
        break;
      }
    }
    return namespace;
  },

  getChildHostContext(/* parentHostContext, type */) {
    return NAMESPACE;
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
    const target = parentInstance.lastChild;

    /**
     * TVML merge sibling text nodes into one but reconciler don't do this.
     * To workaround this issue we create references to each created text nodes
     * for later updates.
     */
    if (isTextNode(target) && isTextNode(child)) {
      if (!target._handledTextNodes) {
        target._handledTextNodes = [{
          node: target,
          value: target.nodeValue,
        }];
      }

      target._handledTextNodes.push({
        node: child,
        value: child.nodeValue,
      });

      child._targetTextNode = target;
    }

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
  ) {
    return diffProperties(
      domElement,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
    );
  },

  shouldSetTextContent(/* type, props */) {
    return false;
  },

  shouldDeprioritizeSubtree(/* type, props */) {
    return false;
  },

  createTextInstance(text, rootContainerInstance) {
    const textNode = createTextNode(text, rootContainerInstance);
    return textNode;
  },

  now: () => Date.now(),

  mutation: {
    commitMount(domElement, type, newProps) {
      console.info(
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
      let target;

      /**
       * If text node update is commited we need to check if there any
       * reference text nodes to figure out which one to update.
       */
      if (textInstance._targetTextNode) {
        target = textInstance._targetTextNode;
      } else if (textInstance._handledTextNodes) {
        target = textInstance;
      }

      if (target) {
        const nodes = target._handledTextNodes;
        const reference = nodes.find(({ node }) => node === textInstance);

        reference.value = newText;
        updateNodeValue(target);
      } else {
        textInstance.nodeValue = newText;
      }
    },

    appendChild(parentInstance, child) {
      const target = parentInstance.lastChild;

      /**
       * If we need to attach text node in update we performing same checks
       * as in `appendInitialChild`.
       */
      if (isTextNode(target) && isTextNode(child)) {
        if (!target._handledTextNodes) {
          target._handledTextNodes = [{
            node: target,
            value: target.nodeValue,
          }];
        }

        target._handledTextNodes.push({
          node: child,
          value: child.nodeValue,
        });

        child._targetTextNode = target;
      }

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
      /**
       * When in TVML text node is inserted before another text node its value
       * will be merged with existed and it will be removed.
       *
       * Check `appendInitialChild` for more info.
       */
      if (isTextNode(beforeChild) && isTextNode(child)) {
        if (!beforeChild._handledTextNodes) {
          beforeChild._handledTextNodes = [{
            node: beforeChild,
            value: beforeChild.nodeValue,
          }];
        }

        beforeChild._handledTextNodes.unshift({
          node: child,
          value: child.nodeValue,
        });

        child._targetTextNode = beforeChild;
      }

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
      /**
       * If we deleting text node with parent node then we just clearing any
       * references. No need to use `removeChild` because it was never attached
       * to document.
       *
       * Also we can't remove parent node with active references. But we can
       * empty its value.
       */
      if (child._targetTextNode) {
        const target = child._targetTextNode;
        const nodes = target._handledTextNodes;
        const referenceIndex = nodes.findIndex(({ node }) => node === child);

        nodes.splice(referenceIndex, 1);
        delete child._targetTextNode;
        updateNodeValue(target);
      } else if (child._handledTextNodes && child._handledTextNodes.length) {
        const nodes = child._handledTextNodes;
        const reference = nodes.find(({ node }) => node === child);

        reference.value = '';
        updateNodeValue(child);
      } else {
        parentInstance.removeChild(child);
      }
    },

    removeChildFromContainer(container, child) {
      if (container.nodeType === COMMENT_NODE) {
        container.parentNode.removeChild(child);
      } else {
        container.removeChild(child);
      }
    },
  },

  scheduleDeferredCallback(callback) {
    return setTimeout(() => {
      callback({
        timeRemaining() {
          return Infinity;
        },
      });
    });
  },

  cancelDeferredCallback(timeoutId) {
    clearTimeout(timeoutId);
  },

  useSyncScheduling: true,
});

class ReactRoot {
  constructor(container) {
    const root = TVMLRenderer.createContainer(
      container,
      false, // isAsync
      false, // hydrate
    );

    this._internalRoot = root;
  }

  render(children, callback) {
    const root = this._internalRoot;
    TVMLRenderer.updateContainer(children, root, null, callback);
  }

  unmount(callback) {
    const root = this._internalRoot;
    TVMLRenderer.updateContainer(null, root, null, callback);
  }
}

function createRoot(container) {
  let rootSibling = container.lastChild;

  while (rootSibling) {
    container.removeChild(rootSibling);
    rootSibling = container.lastChild;
  }

  return new ReactRoot(container);
}

const ReactTVML = {
  render(element, container, callback) {
    let root = container._reactRootContainer;

    if (!root) {
      // Initial mount
      root = createRoot(container);
      container._reactRootContainer = root;

      TVMLRenderer.unbatchedUpdates(() => {
        root.render(element, () => {
          if (typeof callback === 'function') {
            const { _internalRoot } = root;
            const instance = TVMLRenderer.getPublicRootInstance(_internalRoot);
            callback.call(instance);
          }
        });
      });
    } else {
      // Update
      root.render(element, () => {
        if (typeof callback === 'function') {
          const { _internalRoot } = root;
          const instance = TVMLRenderer.getPublicRootInstance(_internalRoot);
          callback.call(instance);
        }
      });
    }

    return TVMLRenderer.getPublicRootInstance(root._internalRoot);
  },

  unmountComponentAtNode(container) {
    if (container._reactRootContainer) {
      TVMLRenderer.unbatchedUpdates(() => {
        this.render(null, container, () => {
          container._reactRootContainer = null;
        });
      });
      return true;
    }
    return false;
  },
};

export default ReactTVML;
