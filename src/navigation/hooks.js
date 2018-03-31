/* global navigationDocument */

import ReactTVML from '../react-tvml';
import { broadcast } from '../event-bus';

let enabled = false;
let modalDocument = null;

function unmount(document) {
  /**
   * Mark document as removed by menu button press.
   * This is just a guess but still can be handy.
   */
  document.possiblyDismissedByUser = true;
  document.isAttached = false;
  ReactTVML.unmountComponentAtNode(document);
}

function handleUnload({ target: { ownerDocument: document } }) {
  unmount(document);
  broadcast('uncontrolled-document-dismissal', document);
}

const handlers = {
  presentModal(document) {
    if (modalDocument) {
      unmount(modalDocument);
      modalDocument.removeEventListener('unload', handleUnload);
    }
    modalDocument = document;
    document.addEventListener('unload', handleUnload);
  },

  dismissModal(custom) {
    if (modalDocument && custom) {
      unmount(modalDocument);
      modalDocument.removeEventListener('unload', handleUnload);
    }
    modalDocument = null;
  },

  insertBeforeDocument(document) {
    document.addEventListener('unload', handleUnload);
  },

  pushDocument(document) {
    document.addEventListener('unload', handleUnload);
  },

  replaceDocument(document, oldDocument) {
    unmount(oldDocument);
    oldDocument.removeEventListener('unload', handleUnload);
    document.addEventListener('unload', handleUnload);
  },

  clear() {
    navigationDocument.documents.forEach((document) => {
      unmount(document);
      document.removeEventListener('unload', handleUnload);
    });
  },

  popDocument() {
    const document = navigationDocument.documents.pop();

    unmount(document);
    document.removeEventListener('unload', handleUnload);
  },

  popToDocument(document) {
    const index = navigationDocument.documents.indexOf(document);

    navigationDocument.documents
      .slice(index + 1)
      .forEach((documentItem) => {
        unmount(documentItem);
        documentItem.removeEventListener('unload', handleUnload);
      });
  },

  popToRootDocument() {
    navigationDocument.documents
      .slice(1)
      .forEach((document) => {
        unmount(document);
        document.removeEventListener('unload', handleUnload);
      });
  },

  removeDocument(document) {
    unmount(document);
    document.removeEventListener('unload', handleUnload);
  },
};

const methodsToPatch = Object.keys(handlers);

const originalMethods = methodsToPatch
  .map(name => ({ name, method: navigationDocument[name] }))
  .reduce((result, { name, method }) => {
    result[name] = method;
    return result;
  }, {});

export function enable() {
  if (enabled) {
    throw new Error('Hooks already enabled');
  }

  methodsToPatch.forEach((name) => {
    navigationDocument[name] = function TVDMLWrapper(...args) {
      if (handlers[name]) handlers[name].apply(this, args);
      return originalMethods[name].apply(this, args);
    };
  });

  enabled = true;
}

export function disable() {
  if (!enabled) {
    throw new Error('Hooks aren\'t enabled');
  }

  methodsToPatch.forEach((name) => {
    navigationDocument[name] = originalMethods[name];
  });

  enabled = false;
}
