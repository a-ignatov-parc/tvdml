import {broadcast} from '../event-bus';

const PARTIAL = 'partial';

const parser = new DOMParser();

const eventMapper = {
	'onSelect': 'select',
};

export function uvdomToDocument(uvdom, document = createEmptyDocument(), contextualPartialNodes) {
	let partialNodes = document.partialNodes || contextualPartialNodes;
	[]
		.concat(uvdom || [])
		.forEach((node) => {
			let element;

			if (node == null) return;

			if (typeof(node) === 'string') {
				element = document.ownerDocument.createTextNode(node);
			} else {
				if (typeof(node.tag) === 'function') {
					node = node.tag(node);
				}

				const {
					tag,
					attrs = {},
					events = {},
				} = node;

				element = document.ownerDocument.createElement(tag);

				const children = []
					.concat(node.children || [])
					.reduce((collection, child) => collection.concat(child), [])
					.map((child) => {
						if (typeof(child) === 'number') {
							return child.toString();
						}
						return child;
					})
					.filter((child) => {
						return typeof(child) === 'string' || (child && child.tag);
					});

				Object
					.keys(attrs)
					.forEach(name => {
						let value = attrs[name];

						if (typeof(value) !== 'undefined') {
							element.setAttribute(name, value);

							if (name === PARTIAL && value) {
								partialNodes[value] = element;
							}
						}
					});

				if (tag === 'menuBar') {
					let feature = element.getFeature('MenuBarDocument');

					element.addEventListener('select', ({target}) => {
						broadcast('menu-item-select', {
							menuItem: target,
							menuBar: feature,
						});
					});
				}

				Object
					.keys(events)
					.forEach(name => {
						let eventName = eventMapper[name] || name;
						element.addEventListener(eventName, events[name]);
					});

				uvdomToDocument(children, element, partialNodes);
			}

			element != null && document.appendChild(element);
		});

	return document;
}

export function stringToDocument(string) {
	return parser.parseFromString(string, 'application/xml');
}

export function createEmptyDocument() {
	const document = DOMImplementationRegistry
		.getDOMImplementation()
		.createDocument();

	document.partialNodes = {};

	for (let i = document.childNodes.length; i; i--) {
		document.removeChild(document.childNodes.item(i - 1));
	}

	return document;
}
