import ReactFiberReconciler from 'react-reconciler';

import { broadcast } from '../event-bus';

import {
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './node-types';

const NAMESPACE = 'http://www.w3.org/1999/xhtml';

const STYLE = 'style';
const CHILDREN = 'children';

const eventNameRegex = /^on[A-Z]/;

const supportedEventMapping = {
  onPlay: 'play',
  onSelect: 'select',
  onChange: 'change',
  onHighlight: 'highlight',
  onHoldselect: 'holdselect',
};

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
        } else if (typeof propValue === 'string') {
          if (propValue !== '') domElement.textContent = propValue;
        } else if (typeof propValue === 'number') {
          domElement.textContent = `${propValue}`;
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
      } else {
        domElement.textContent = propValue;
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
    } else if (propValue === null || typeof propValue === 'undefined') {
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

  useSyncScheduling: true,

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
