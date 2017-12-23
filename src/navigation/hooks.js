/* global navigationDocument */

import { broadcast } from '../event-bus';

let enabled = false;
let modalDocument = null;

function destroyComponents(document) {
  /**
   * Mark document as removed by menu button press.
   * This is just a guess but still can be handy.
   */
  // eslint-disable-next-line no-param-reassign
  document.possiblyDismissedByUser = true;
  if (document.unmount) document.unmount();
}

function handleUnload({ target: { ownerDocument: document } }) {
  destroyComponents(document);
  broadcast('uncontrolled-document-pop', { document });
}

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

  insertBeforeDocument(document) {
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
    navigationDocument.documents.forEach((document) => {
      destroyComponents(document);
      document.removeEventListener('unload', handleUnload);
    });
  },

  popDocument() {
    const document = navigationDocument.documents.pop();

    destroyComponents(document);
    document.removeEventListener('unload', handleUnload);
  },

  popToDocument(document) {
    const index = navigationDocument.documents.indexOf(document);

    navigationDocument.documents
      .slice(index + 1)
      .forEach((documentItem) => {
        destroyComponents(documentItem);
        documentItem.removeEventListener('unload', handleUnload);
      });
  },

  popToRootDocument() {
    navigationDocument.documents
      .slice(1)
      .forEach((document) => {
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
  .map(name => ({ name, method: navigationDocument[name] }))
  .reduce((result, { name, method }) => {
    // eslint-disable-next-line no-param-reassign
    result[name] = method;
    return result;
  }, {});

export function enable() {
  if (enabled) {
    throw new Error('Hooks already enabled');
  }

  const shouldMountComponentFor = {
    presentModal: true,
    pushDocument: true,
    replaceDocument: true,
    insertBeforeDocument: true,
  };

  methodsToPatch.forEach((name) => {
    navigationDocument[name] = function TVDMLWrapper(...args) {
      if (handlers[name]) handlers[name].apply(this, args);

      const result = originalMethods[name].apply(this, args);
      const [document] = args;

      if (shouldMountComponentFor[name] && document.didMount) {
        document.didMount();
      }

      return result;
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
