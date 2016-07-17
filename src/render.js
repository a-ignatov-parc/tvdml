import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {broadcast} from './event-bus';
import {promisedTimeout} from './utils';
import {passthrough, createPipeline} from './pipeline';

let hasModal = false;
let documentSwitching = Promise.resolve();

const RENDERING_ANIMATION = 500;

const parser = new DOMParser();

const eventMapper = {
	'onSelect': 'select',
};

export function render(template) {
	return createPipeline()
		.pipe(parseDocument(template))
		.pipe(passthrough(payload => {
			let {
				route,
				navigation = {},
				parsedDocument: document,
				document: renderedDocument,
			} = payload;

			let {menuBar, menuItem} = navigation;

			document.route = route;

			if (hasModal) removeModal();

			if (menuBar && menuItem) {
				menuBar.setDocument(document, menuItem);
			} else if (renderedDocument) {
				navigationDocument.replaceDocument(document, renderedDocument);
			} else {
				navigationDocument.pushDocument(document);
			}

			return {document};
		}))
		.pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)))
		.pipe(passthrough(({redirect}) => {
			if (redirect) {
				let {documents} = navigationDocument;
				let document = documents[documents.length - 2];

				document && navigationDocument.removeDocument(document);
			}

			return {redirect: false};
		}));
}

export function renderModal(template) {
	return createPipeline()
		.pipe(passthrough(() => {
			if (!hasModal) return;
			removeModal();
			return promisedTimeout(RENDERING_ANIMATION);
		}))
		.pipe(parseDocument(template))
		.pipe(passthrough(({parsedDocument: document, route}) => {
			hasModal = true;
			document.route = route;
			navigationDocument.presentModal(document);
		}));
}

export function parseDocument(template) {
	return createPipeline().pipe(payload => assign({}, payload, {
		parsedDocument: createDocument(template, payload)
	}));
}

export function removeModal() {
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
						if (typeof(attrs[name]) !== 'undefined') {
							element.setAttribute(name, attrs[name]);
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
