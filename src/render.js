import assign from 'object-assign';
import {createPipeline} from './pipeline';

const parser = new DOMParser();

const eventMapper = {
	'onSelect': 'select',
};

export default function(template) {
	return createPipeline().pipe(payload => {
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

		return assign({}, payload, {document});
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
