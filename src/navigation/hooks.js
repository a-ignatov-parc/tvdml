import {broadcast} from '../event-bus';

let enabled = false;
let modalDocument = null;

const handlers = {
	presentModal(document) {
		if (modalDocument) {
			destroyComponents(modalDocument);
			modalDocument.removeEventListener('unload', handleUnload);
		}
		modalDocument = document;
		document.addEventListener('unload', handleUnload);
	},

	dismissModal(custom) {
		if (modalDocument && custom) {
			destroyComponents(modalDocument);
			modalDocument.removeEventListener('unload', handleUnload);
		}
		modalDocument = null;
	},

	insertBeforeDocument(document, beforeDocument) {
		document.addEventListener('unload', handleUnload);
	},

	pushDocument(document) {
		document.addEventListener('unload', handleUnload);
	},

	replaceDocument(document, oldDocument) {
		destroyComponents(oldDocument);
		oldDocument.removeEventListener('unload', handleUnload);
		document.addEventListener('unload', handleUnload);
	},

	clear() {
		navigationDocument.documents.forEach(document => {
			destroyComponents(document);
			document.removeEventListener('unload', handleUnload);
		});
	},

	popDocument() {
		let document = navigationDocument.documents.pop()

		destroyComponents(document);
		document.removeEventListener('unload', handleUnload);
	},

	popToDocument(document) {
		let index = navigationDocument.documents.indexOf(document);

		navigationDocument.documents
			.slice(index + 1)
			.forEach(document => {
				destroyComponents(document);
				document.removeEventListener('unload', handleUnload);
			});
	},

	popToRootDocument() {
		navigationDocument.documents
			.slice(1)
			.forEach(document => {
				destroyComponents(document);
				document.removeEventListener('unload', handleUnload);
			});
	},

	removeDocument(document) {
		destroyComponents(document);
		document.removeEventListener('unload', handleUnload);
	},
};

const methodsToPatch = Object.keys(handlers);

const originalMethods = methodsToPatch
	.map(name => ({name, method: navigationDocument[name]}))
	.reduce((result, {name, method}) => {
		result[name] = method;
		return result;
	}, {});

export function enable() {
	if (enabled) {
		throw 'Hooks already enabled';
	}

	methodsToPatch.forEach(name => {
		navigationDocument[name] = function TVDMLWrapper() {
			handlers[name] && handlers[name].apply(this, arguments);
			return originalMethods[name].apply(this, arguments);
		}
	});

	enabled = true;
}

export function disable() {
	if (!enabled) {
		throw `Hooks aren't enabled`;
	}

	methodsToPatch.forEach(name => navigationDocument[name] = originalMethods[name]);
	enabled = false;
}

function handleUnload({target: {ownerDocument: document}}) {
	destroyComponents(document);
	broadcast('uncontrolled-document-pop', {document});
}

function destroyComponents(document) {
	document.destroyComponent && document.destroyComponent();
}
