/* global navigationDocument, DOMImplementationRegistry */

import ReactTVML from './react-tvml';

import { promisedTimeout } from './utils';
import { passthrough, createPipeline } from './pipelines';

const RENDERING_ANIMATION = 600;

export function renderModalReact(Component) {
  console.log('renderModalReact', Component);
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

      let { document } = payload;

      if (!document) {
        document = DOMImplementationRegistry
          .getDOMImplementation()
          .createDocument();

        const root = TVMLRenderer.createContainer(
          document, // container
          false, // isAsync
          false, // hydrate
        );

        Object.assign(document, {
          route,
          reactRoot: root,

          render(children, callback) {
            TVMLRenderer.updateContainer(children, root, null, callback);
          },

          unmount(callback) {
            TVMLRenderer.updateContainer(null, root, null, callback);
          },
        });
      }

      /**
       * If we received dismissed document it means that user pressed menu
       * button and our pipeline is canceled. Now we must silently succeed
       * the rest of the pipeline without rendering anything.
       */
      if (document.possiblyDismissedByUser) return null;

      document.render(React.createElement(Component, payload));

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
