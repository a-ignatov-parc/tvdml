import assign from 'object-assign';
import {Promise} from 'es6-promise';
import {broadcast} from './event-bus';
import {promisedTimeout} from './utils';
import {passthrough, createPipeline} from './pipeline';

import {createPartial} from './render/partial';
import {
	uvdomToDocument,
	stringToDocument,
	createEmptyDocument,
} from './render/document';

let hasModal = false;

const RENDERING_ANIMATION = 500;

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
			document.partials = Object
				.keys(document.partialNodes)
				.map(name => ({name, node: document.partialNodes[name]}))
				.map(({name, node}) => ({name, node, partial: createPartial(node)}))
				.reduce((result, {name, partial}) => {
					result[name] = partial;
					return result;
				}, {});

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
	navigationDocument.dismissModal(true);
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
