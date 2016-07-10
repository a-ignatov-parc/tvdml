import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {createPipeline} from './pipeline';

let hasModal = false;

const parser = new DOMParser();

const eventMapper = {
	'onSelect': 'select',
};

export function render(template) {
	return createPipeline().pipe(payload => {
		let document = createDocument(template, payload);
		document.route = payload.route;

		if (hasModal) removeModal();

		if (payload.document) {
			navigationDocument.replaceDocument(document, payload.document);
		} else {
			navigationDocument.pushDocument(document);
		}

		return assign({}, payload, {document});
	});
}

export function renderModal(template) {
	return createPipeline()
		.pipe(payload => {
			if (!hasModal) return payload;

			removeModal();
			return new Promise(resolve => setTimeout(() => resolve(payload), 500));
		})
		.pipe(payload => {
			let document = createDocument(template, payload);
			document.route = payload.route;
			navigationDocument.presentModal(document);
			hasModal = true;
			return payload;
		});
}

function removeModal() {
	hasModal = false;
	navigationDocument.dismissModal();
}

function createDocument(template, payload) {
	if (typeof(template) === 'function') {
		template = template(payload);
	}

	if (template == null) {
		return createEmptyDocument();
	}

	if (typeof(template) === 'string') {
		return stringToDocument(template);
	}

	if (typeof(template) === 'object') {
		return uvdomToDocument(template);
	}

	return null;
}

function uvdomToDocument(uvdom, document = createEmptyDocument()) {
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
						element.setAttribute(name, attrs[name])
					});

				Object
					.keys(events)
					.forEach(name => {
						let eventName = eventMapper[name] || name;
						element.addEventListener(eventName, events[name]);
					});

				uvdomToDocument(children, element);
			}

			element != null && document.appendChild(element);
		});

	return document;
}

function stringToDocument(string) {
	return parser.parseFromString(string, 'application/xml');
}

function createEmptyDocument() {
	const document = DOMImplementationRegistry
		.getDOMImplementation()
		.createDocument();

	for (let i = 0, length = document.childNodes.length; i < length; i++) {
		document.removeChild(document.childNodes.item(i));
	}

	return document;
}
