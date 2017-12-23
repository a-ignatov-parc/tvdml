/* global navigationDocument, DOMImplementationRegistry */

import React from 'react';

import ReactTVML from './react-tvml';
import { promisedTimeout } from './utils';
import { passthrough, createPipeline } from './pipelines';

const RENDERING_ANIMATION = 600;

export function renderModalReact(Component) {
  console.info('renderModalReact', Component);
}

export function render(Component) {
  return createPipeline()
    .pipe(passthrough((payload) => {
      const {
        route,
        redirect,
        navigation = {},
      } = payload;

      const { menuBar, menuItem } = navigation;

      console.info(1, menuBar, menuItem);

      let { document } = payload;

      if (!document) {
        document = DOMImplementationRegistry
          .getDOMImplementation()
          .createDocument();

        document.route = route;
      }

      /**
       * If we received dismissed document it means that user pressed menu
       * button and our pipeline is canceled. Now we must silently succeed
       * the rest of the pipeline without rendering anything.
       */
      if (document.possiblyDismissedByUser) return null;

      const element = React.createElement(Component, payload);

      ReactTVML.render(element, document);

      if (!document.isAttached) {
        if (redirect) {
          const index = navigationDocument.documents.indexOf(document);
          const prevDocument = navigationDocument.documents[index - 1];

          if (prevDocument) {
            navigationDocument.replaceDocument(document, prevDocument);
          }
        } else {
          navigationDocument.pushDocument(document);
        }

        document.isAttached = true;
      }

      return {
        document,
        redirect: false,
      };
    }))
    .pipe(passthrough(() => promisedTimeout(RENDERING_ANIMATION)));
}
