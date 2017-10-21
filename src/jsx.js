import h from 'virtual-dom/h';

import CustomNode from './render/custom-node';

export default function createElement(tag, attrs, ...children) {
  let node = {tag};

  if (attrs) {
    Object
      .keys(attrs)
      .forEach(name => {
        if (name === 'key') {
          node.key = attrs[name];
        } else if (name === 'ref') {
          node.ref = new Ref(attrs[name]);
        } else if (name === 'content' && tag === 'style') {
          node.content = attrs[name];
        } else if (typeof(attrs[name]) === 'function') {
          node.events || (node.events = {});
          node.events[name] = attrs[name];
        } else {
          node.attrs || (node.attrs = {});
          node.attrs[name] = attrs[name];
        }
      });
  }

  if (children.length === 1) {
    node.children = children[0];
  } else if (children.length > 1) {
    node.children = children;
  }

  if (node.tag instanceof CustomNode) {
    return node.tag.toNode(node.attrs);
  } else if (typeof(node.tag) === 'function') {
    return node.tag(node);
  }

  let props = {
    tvml: true,
    key: node.key,
    ref: node.ref,
    events: node.events,
    attributes: node.attrs,
  };

  if (node.content) {
    props.innerHTML = node.content;
  }

  return h(node.tag, props, node.children);
}

class Ref {
  constructor(handler) {
    this.handler = handler;
  }

  hook(node, propertyName, previousValue) {
    if (typeof(this.handler) === 'function') {
      this.handler(node);
    }
  }
}
