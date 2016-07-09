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
		.forEach(({tag, attrs = {}, events = {}, children}) => {
			const element = document.ownerDocument.createElement(tag);

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
			document.appendChild(element);
		});

	return document;
}

function stringToDocument(string) {
	return parser.parseFromString(string, 'application/xml');
}

function createEmptyDocument() {
	return DOMImplementationRegistry.getDOMImplementation().createDocument();
}
