import h from 'virtual-dom/h';

const cumulativeTypes = ['string', 'number'];

export default function createElement(tag, attrs, ...children) {
	let node = {tag};
	let vnode;

	if (attrs) {
		Object
			.keys(attrs)
			.forEach(name => {
				if (typeof(attrs[name]) === 'function') {
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
		if (i && ~cumulativeTypes.indexOf(typeof(item)) && typeof(result[i - 1]) === 'string') {
			result[i - 1] += `${item}`;
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

	if (typeof(node.tag) === 'function') {
		return node.tag(node);
	}

	vnode = h(node.tag, {
		events: node.events,
		attributes: node.attrs,
	}, node.children);

	// Fixing HTML namespace rules for handling tagName.
	vnode.tagName = node.tag;

	return vnode;
}
