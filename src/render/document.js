import createElement from 'virtual-dom/create-element';

import CustomNode from './custom-node';
import {broadcast} from '../event-bus';

const eventMapper = {
	'onSelect': 'select',
};

const DEFAULT_HANDLER = 'default';

const handlers = {
	menuItem({target: menuItem}) {
		let menuBar = menuItem.parentNode;
		let feature = menuBar.getFeature('MenuBarDocument');

		broadcast('menu-item-select', {
			menuItem,
			menuBar: feature,
		});
	},

	[DEFAULT_HANDLER]({target}) {
		let {events = {}} = target;
		let {onSelect} = events;

		if (typeof(onSelect) === 'function') {
			onSelect.apply(this, ...arguments);
		}
	},
}

export function vdomToDocument(vdom, payload) {
	let document = createEmptyDocument();
	let vnode;

	if (vdom instanceof CustomNode) {
		vnode = vdom.toNode(payload);
	} else {
		vnode = vdom;
	}

	let childNode = createElement(vnode, {document});
	let menuBars = childNode.getElementsByTagName('menuBar');

	if (menuBars.length) {
		document.menuBarDocument = menuBars.item(0).getFeature('MenuBarDocument');
	}

	document.appendChild(childNode);
	document.addEventListener('select', function(event, ...args) {
		let {target} = event;
		let {tagName} = target;
		let handler = handlers[tagName] || handlers[DEFAULT_HANDLER];
		return handler.call(this, event, ...args);
	});

	return document;
}

export function createEmptyDocument() {
	const document = DOMImplementationRegistry
		.getDOMImplementation()
		.createDocument();

	document.extra = {};

	for (let i = document.childNodes.length; i; i--) {
		document.removeChild(document.childNodes.item(i - 1));
	}

	return document;
}
