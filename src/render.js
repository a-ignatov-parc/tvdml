/* global navigationDocument, DOMImplementationRegistry */

import ReactTVML from './react-tvml';
import { subscribe } from './event-bus';
import { promisedTimeout } from './utils';
import { passthrough, createPipeline } from './pipelines';

const RENDERING_ANIMATION = 600;

let modalDocument = null;

subscribe('uncontrolled-document-dismissal').pipe((document) => {
  if (document === modalDocument) {
    modalDocument = null;
  }
});

export function createEmptyDocument() {
  return DOMImplementationRegistry.getDOMImplementation().createDocument();
}

export function dismissModal() {
  return createPipeline()
    .pipe(passthrough(() => {
      if (!modalDocument) return null;
      modalDocument = null;
      navigationDocument.dismissModal(true);
      return promisedTimeout(RENDERING_ANIMATION);
    }));
}

export function removeModal() {
  return dismissModal().sink();
}

export function renderModal(renderFactory) {
  return createPipeline()
    .pipe(passthrough((payload = {}) => {
      if (!modalDocument) {
        const { route } = payload;
        const document = createEmptyDocument();
        const prevRouteDocument = navigationDocument.documents.pop();

        let prevRouteDocumentRoute = prevRouteDocument.route;

        const prevDocumentElement = prevRouteDocument.documentElement;
        const menuBar = prevDocumentElement
          .getElementsByTagName('menuBar')
          .item(0);

        if (menuBar) {
          const menuBarDocument = menuBar.getFeature('MenuBarDocument');
          const menuItem = menuBarDocument.getSelectedItem();
          prevRouteDocumentRoute = menuBarDocument.getDocument(menuItem).route;
        }

        document.modal = true;
        document.prevRouteDocument = prevRouteDocument;
        document.route = `${route || prevRouteDocumentRoute}-modal`;

        modalDocument = document;

        navigationDocument.presentModal(document);

        document.isAttached = true;
      }

      const element = renderFactory(payload);

      ReactTVML.render(element, modalDocument);
    }));
}

export function render(renderFactory) {
  return createPipeline()
    .pipe(passthrough((payload = {}) => {
      const {
        route,
        redirect,
        navigation = {},
      } = payload;

      const { menuBar, menuItem } = navigation;
      const isMenuDocument = menuBar && menuItem;
      const menuItemDocument = isMenuDocument && menuBar.getDocument(menuItem);

      const element = renderFactory(payload);

      let { document } = payload;

      if (document) {
        /**
         * If we received dismissed document it means that user pressed menu
         * button and our pipeline is canceled. Now we must silently succeed
         * the rest of the pipeline without rendering anything.
         */
        if (document.possiblyDismissedByUser) return null;
      } else if (menuItemDocument) {
        document = menuItemDocument;
      } else {
        document = createEmptyDocument();

        document.route = route
          || (!navigationDocument.documents.length && 'main');

        document.prevRouteDocument = menuBar
          ? menuBar.ownerDocument
          : navigationDocument.documents.pop();
      }

      if (isMenuDocument) {
        if (!menuItemDocument) {
          menuBar.setDocument(document, menuItem);
        }
      } else if (!document.isAttached) {
        if (redirect) {
          const lastDocument = navigationDocument.documents.pop();

          if (lastDocument) {
            navigationDocument.replaceDocument(document, lastDocument);
          }
        } else {
          navigationDocument.pushDocument(document);
        }
      }

      document.isAttached = true;

      ReactTVML.render(element, document);

      return {
        document,
        redirect: false,
      };
    }))
    .pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)));
}
