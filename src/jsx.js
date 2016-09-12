import h from 'virtual-dom/h';

import CustomNode from './render/custom-node';

const cumulativeTypes = ['string', 'number'];

export default function createElement(tag, attrs, ...children) {
	let node = {tag};
	let vnode;

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

	children = children.reduce((result, item, i) => {
		// Processing tvml special case when multiple TextNodes always merged into one and this 
		// behaviour breaks virtual-dom diff mechanism.
		if (i && ~cumulativeTypes.indexOf(typeof(item)) && typeof(result[result.length - 1]) === 'string') {
			result[result.length - 1] += `${item}`;
		} else if (typeof(item) !== 'boolean') {
			// Numbers always should be added as strings.
			if (typeof(item) === 'number') {
				item = `${item}`;
			}
			result.push(item);
		}
		return result;
	}, []);

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
		key: node.key,
		ref: node.ref,
		events: node.events,
		attributes: node.attrs,
	};

	if (node.content) {
		props.innerHTML = node.content;
	}

	vnode = h(node.tag, props, node.children);

	// Fixing HTML namespace rules for handling tagName.
	vnode.tagName = node.tag;

	return vnode;
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
