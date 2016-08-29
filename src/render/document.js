import createElement from 'virtual-dom/create-element';

import CustomNode from './custom-node';
import {broadcast} from '../event-bus';
import {noop} from '../utils';

const DEFAULT_HANDLER = 'default';

const handlers = {
	play: {
		[DEFAULT_HANDLER]: createDefaultHandler('onPlay'),
	},

	select: {
		[DEFAULT_HANDLER]: createDefaultHandler('onSelect'),

		menuItem({target: menuItem}) {
			let menuBar = menuItem.parentNode;
			let feature = menuBar.getFeature('MenuBarDocument');

			broadcast('menu-item-select', {
				menuItem,
				menuBar: feature,
			});
		},
	},

	highlight: {
		[DEFAULT_HANDLER]: createDefaultHandler('onHighlight'),
	},

	holdselect: {
		[DEFAULT_HANDLER]: createDefaultHandler('onHoldselect'),
	},
};

const eventsList = [
	'play',
	'select',
	'highlight',
	'holdselect',
];

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
	eventsList.forEach(eventName => {
		document.addEventListener(eventName, createEventHandler(handlers[eventName]))
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

function createEventHandler(handlersCollection = {}) {
	return function(event, ...args) {
		let {target} = event;
		let {tagName} = target;
		let handler = handlersCollection[tagName] || handlersCollection[DEFAULT_HANDLER] || noop();
		return handler.call(this, event, ...args);
	}
}

function createDefaultHandler(handlerName) {
	return function({target}) {
		let {events = {}} = target;
		let handler = events[handlerName];

		if (typeof(handler) === 'function') {
			handler.apply(this, arguments);
		}
	}
}
