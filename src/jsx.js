/* global DataItem */

import h from '@a-ignatov-parc/virtual-dom/h';

import CustomNode from './render/custom-node';

class Ref {
  constructor(handler) {
    this.handler = handler;
  }

  hook(node) {
    if (typeof this.handler === 'function') {
      this.handler(node);
    }
  }
}

export default function createElement(tag, attrs, ...children) {
  const node = { tag };

  if (attrs) {
    Object
      .keys(attrs)
      .forEach((name) => {
        if (name === 'key') {
          node.key = attrs[name];
        } else if (name === 'ref') {
          node.ref = new Ref(attrs[name]);
        } else if (name === 'content' && tag === 'style') {
          node.content = attrs[name];
        } else if (name === 'dataItem') {
          const value = attrs[name];

          if (value instanceof DataItem) {
            node.dataItem = value;
          } else {
            node.dataItem = new DataItem();
            Object
              .keys(value)
              .forEach(propName => {
                node.dataItem.setPropertyPath(propName, value[propName]);
              });
          }
        } else if (typeof attrs[name] === 'function') {
          if (!node.events) node.events = {};
          node.events[name] = attrs[name];
        } else {
          if (!node.attrs) node.attrs = {};
          node.attrs[name] = attrs[name];
        }
      });
  }

  if (children.length === 1) {
    const [first] = children;
    node.children = first;
  } else if (children.length > 1) {
    node.children = children;
  }

  if (node.tag instanceof CustomNode) {
    return node.tag.toNode(node.attrs);
  } else if (typeof node.tag === 'function') {
    return node.tag(node);
  }

  const props = {
    tvml: true,
    key: node.key,
    ref: node.ref,
    events: node.events,
    attributes: node.attrs,
    dataItem: node.dataItem,
  };

  if (node.content) {
    props.innerHTML = node.content;
  }

  return h(node.tag, props, node.children);
}
