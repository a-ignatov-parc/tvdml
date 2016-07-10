import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {createPipeline} from './pipeline';

const parser = new DOMParser();

const eventMapper = {
	'onSelect': 'select',
};

const RENDERING_TIMEOUT = 500;

export default function(template) {
	return createPipeline().pipe(payload => {
		let defer = false;
		let document;

		if (typeof(template) === 'function') {
			template = template(payload);
		}

		if (template == null) {
			document = createEmptyDocument();
		} else if (typeof(template) === 'string') {
			document = stringToDocument(template);
		} else if (typeof(template) === 'object') {
			document = uvdomToDocument(template);
		}

		document.route = payload.route;

		let historyLength = navigationDocument.documents.length;

		if (payload.document) {
			navigationDocument.replaceDocument(document, payload.document);
		} else {
			navigationDocument.pushDocument(document);

			if (historyLength === navigationDocument.documents.length) {
				defer = true;
			}
		}

		const result = assign({}, payload, {document});

		if (defer) return deferResult(result);
		return result;
	});
}

function deferResult(result) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(result), RENDERING_TIMEOUT)
	});
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
