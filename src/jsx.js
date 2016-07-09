export default function jsxToUVDOM(tag, attrs, ...children) {
	const node = {tag};

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

	if (children.length === 1) {
		node.children = children[0];
	} else if (children.length > 1) {
		node.children = children;
	}

	return node;
}
