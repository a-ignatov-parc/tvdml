/* global navigationDocument, DOMImplementationRegistry */

import ReactTVML from './react-tvml';
import { subscribe } from './event-bus';
import { promisedTimeout } from './utils';
import { passthrough, createPipeline } from './pipelines';

const RENDERING_ANIMATION = 600;

let modalDocument = null;
subscribe('uncontrolled-document-dismissal').pipe(document => {
  if (document === modalDocument) {
    modalDocument = null;
  }
});

export function createEmptyDocument() {
  return DOMImplementationRegistry.getDOMImplementation().createDocument();
}

export function renderModal(renderFactory) {
  return createPipeline().pipe(
    passthrough((payload = {}) => {
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
    }),
  );
}

export function dismissModal() {
  return createPipeline().pipe(
    passthrough(() => {
      if (!modalDocument) {
        return null;
      }
      modalDocument = null;
      navigationDocument.dismissModal(true);
      return promisedTimeout(RENDERING_ANIMATION);
    }),
  );
}

export function removeModal() {
  return dismissModal().sink();
}

function getLastDocument() {
  // the first document is the 'main' document, typically containing the menu
  // this way we avoid stuff from ever touching it
  const { length } = navigationDocument.documents;
  return length > 1 ? navigationDocument.documents[length - 1] : null;
}

let mainMenu;
let mainMenuDoc;

export function render(renderFactory) {
  return createPipeline()
    .pipe(
      passthrough((payload = {}) => {
        let { document, route } = payload;
        if (document) {
          // If we received dismissed document it means that user pressed menu
          // button and our pipeline is canceled. Now we must silently succeed
          // the rest of the pipeline without rendering anything.
          if (document.possiblyDismissedByUser) {
            return null;
          }
        } else {
          if (!route && navigationDocument.documents.length === 0) {
            route = 'main';
          }
          document = createEmptyDocument();
          document.route = route;
          document.prevRouteDocument = mainMenuDoc
            ? mainMenuDoc.ownerDocument
            : getLastDocument();
        }

        // does the route correspond to a menu item?
        if (mainMenu) {
          const menuItems = mainMenu.getElementsByTagName('menuItem');
          for (let i = 0; i < menuItems.length; i += 1) {
            const menuItem = menuItems.item(i);
            if (menuItem.getAttribute('route') === route) {
              mainMenuDoc.setDocument(document, menuItem);
              document.isAttached = true;
              break;
            }
          }
        }

        // make sure the document is always attached somewhere
        if (!document.isAttached) {
          const lastDocument = payload.redirect && getLastDocument();
          if (lastDocument) {
            navigationDocument.replaceDocument(document, lastDocument);
          } else {
            navigationDocument.pushDocument(document);
          }
          document.isAttached = true;
        }

        // finally render stuff
        const element = renderFactory(payload);
        ReactTVML.render(element, document);

        // grab the main menu
        if (route === 'main') {
          const list = document.getElementsByTagName('menuBar');
          if (list.length === 1) {
            mainMenu = list.item(0);
            mainMenuDoc = mainMenu.getFeature('MenuBarDocument');
          } else {
            console.warn('You should render a menuBar in the main document');
          }
        }

        return {
          document,
          redirect: false,
        };
      }),
    )
    .pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)));
}
