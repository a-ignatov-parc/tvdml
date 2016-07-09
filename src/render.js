import assign from 'object-assign';
import {createPipeline} from './pipeline';

const parser = new DOMParser();

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

function uvdomToDocument(uvdom) {
	const document = createEmptyDocument();

	console.log('uvdomToDocument', uvdom);

	return document;
}

function stringToDocument(string) {
	return parser.parseFromString(string, 'application/xml');
}

function createEmptyDocument() {
	return DOMImplementationRegistry.getDOMImplementation().createDocument();
}


// const document = DOMImplementationRegistry
// 	.getDOMImplementation()
// 	.createDocument();

// const element = document.createElement('alertTemplate');

// document.appendChild(element);
