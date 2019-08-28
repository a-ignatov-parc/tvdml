/* global navigationDocument, DOMImplementationRegistry */
import ReactTVML from './react-tvml';
import { subscribe } from './event-bus';
import { promisedTimeout } from './utils';
import { passthrough, createPipeline } from './pipelines';
import { navigate } from './navigation';

const RENDERING_ANIMATION = 600;

let mainMenu;
let mainMenuDoc;
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

export function render(renderFactory) {
  return createPipeline()
    .pipe(
      passthrough((payload = {}) => {
        let { document, route } = payload;

        // If we received dismissed document it means that user pressed menu
        // button and our pipeline is canceled. Now we must silently succeed
        // the rest of the pipeline without rendering anything.
        if (document && document.possiblyDismissedByUser) {
          return null;
        }

        // get a possible corresponding menu item
        let menuItem;
        if (mainMenu) {
          const items = mainMenu.getElementsByTagName('menuItem');
          for (let i = 0; i < items.length; i += 1) {
            const item = items.item(i);
            if (item.getAttribute('route') === route) {
              menuItem = item;
              if (!document) {
                document = mainMenuDoc.getDocument(item);
              }
              break;
            }
          }
        }

        // we have to always end up with a valid document
        if (!document) {
          if (!route && navigationDocument.documents.length === 0) {
            route = 'main';
          }
          document = createEmptyDocument();
          document.route = route;
          document.prevRouteDocument = mainMenu
            ? mainMenu.ownerDocument
            : getLastDocument();

          if (menuItem) {
            mainMenuDoc.setDocument(document, menuItem);
            document.isAttached = true;
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

        // render stuff
        const element = renderFactory(payload);
        ReactTVML.render(element, document);

        // set selection
        if (menuItem) {
          setTimeout(() => mainMenuDoc.setSelectedItem(menuItem), 1);
        }

        // grab the main menu
        if (route === 'main' && !mainMenu) {
          const list = document.documentElement.getElementsByTagName('menuBar');
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

subscribe('menu-item-select').pipe(({ menuItem }) => {
  const routeName = menuItem.getAttribute('route');
  if (routeName) {
    navigate(routeName);
  }
});
