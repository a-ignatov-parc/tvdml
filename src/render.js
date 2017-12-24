/* global navigationDocument, DOMImplementationRegistry */

import React from 'react';

import ReactTVML from './react-tvml';
import { subscribe } from './event-bus';
import { promisedTimeout } from './utils';
import { passthrough, createPipeline } from './pipelines';

const RENDERING_ANIMATION = 600;

let modalDocument = null;

function createDocument() {
  return DOMImplementationRegistry.getDOMImplementation().createDocument();
}

subscribe('uncontrolled-document-pop').pipe(({ document }) => {
  if (document === modalDocument) {
    modalDocument = null;
  }
});

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

export function renderModal(Component) {
  return createPipeline()
    .pipe(passthrough((payload = {}) => {
      if (!modalDocument) {
        const { route } = payload;
        const document = createDocument();
        const lastDocument = navigationDocument.documents.pop();

        document.modal = true;
        document.prevRouteDocument = lastDocument;
        document.route = `${route || (lastDocument || {}).route}-modal`;

        modalDocument = document;

        navigationDocument.presentModal(document);

        document.isAttached = true;
      }

      const element = React.createElement(Component, payload);

      ReactTVML.render(element, modalDocument);
    }));
}

export function render(Component) {
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

      const element = React.createElement(Component, payload);

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
        document = createDocument();

        document.route = route
          || (!navigationDocument.documents.length && 'main');

        document.prevRouteDocument = menuBar
          ? menuBar.ownerDocument
          : navigationDocument.documents.pop();
      }

      ReactTVML.render(element, document);

      if (isMenuDocument) {
        if (!menuItemDocument) {
          menuBar.setDocument(document, menuItem);
        }
      } else if (!document.isAttached) {
        if (redirect) {
          const index = navigationDocument.documents.indexOf(document);
          const prevDocument = navigationDocument.documents[index - 1];

          if (prevDocument) {
            navigationDocument.replaceDocument(document, prevDocument);
          }
        } else {
          navigationDocument.pushDocument(document);
        }
      }

      document.isAttached = true;

      return {
        document,
        redirect: false,
      };
    }))
    .pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)));
}
