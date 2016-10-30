import assign from 'object-assign';
import {broadcast} from './event-bus';
import {promisedTimeout} from './utils';
import {passthrough, createPipeline} from './pipelines';
import {vdomToDocument, createEmptyDocument} from './render/document';

let hasModal = false;

const RENDERING_ANIMATION = 500;

export function render(template) {
	return createPipeline()
		.pipe(parseDocument(template))
		.pipe(passthrough(payload => {
			let {
				route,
				redirect,
				navigation = {},
				parsedDocument: document,
				document: renderedDocument,
			} = payload;

			let {menuBar, menuItem} = navigation;
			let [
				prevRouteDocument,
				currentRouteDocument,
			] = [null, null]
				.concat(navigationDocument.documents)
				.slice(-2);

			document.route = route;
			document.prevRouteDocument = prevRouteDocument;

			if (prevRouteDocument === renderedDocument) {
				document.prevRouteDocument = null;
			}

			if (hasModal) removeModal();

			if (redirect) {
				renderedDocument = currentRouteDocument;
			}

			if (menuBar && menuItem) {
				menuBar.setDocument(document, menuItem);
			} else if (renderedDocument) {
				navigationDocument.replaceDocument(document, renderedDocument);
			} else {
				navigationDocument.pushDocument(document);
			}

			return {document, redirect: false};
		}))
		.pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)));
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
			document.modal = true;
			document.route = route || (navigationDocument.documents.pop() || {}).route;
			navigationDocument.presentModal(document);
		}));
}

export function parseDocument(template) {
	return createPipeline().pipe(passthrough(payload => ({
		parsedDocument: createDocument(template, payload)
	})));
}

export function removeModal() {
	hasModal = false;
	navigationDocument.dismissModal(true);
}

function createDocument(template, payload) {
	if (typeof(template) === 'string') {
		throw `String templates aren't supported. Use jsx templates.`
	}

	if (typeof(template) === 'function') {
		template = template(payload);
	}

	if (typeof(template) === 'object' && template) {
		return vdomToDocument(template, payload);
	}

	return createEmptyDocument();
}
