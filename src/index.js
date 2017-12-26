import * as hooks from './navigation/hooks';
import { subscribe, broadcast } from './event-bus';

export { subscribe };
export * from './render';
export * from './pipelines';
export * from './navigation';
export { default as ReactTVML } from './react-tvml';

subscribe('uncontrolled-document-dismissal').pipe((document) => {
  const {
    modal,
    route,
  } = document;

  let { prevRouteDocument } = document;

  const prevDocumentElement = prevRouteDocument.documentElement;
  const menuBar = prevDocumentElement
    .getElementsByTagName('menuBar')
    .item(0);

  if (menuBar) {
    const menuBarDocument = menuBar.getFeature('MenuBarDocument');
    const menuItem = menuBarDocument.getSelectedItem();
    prevRouteDocument = menuBarDocument.getDocument(menuItem);
  }

  const {
    route: prevRoute,
    modal: prevModal,
  } = prevRouteDocument;

  broadcast('menu-button-press', {
    from: {
      route,
      document,
      modal: !!modal,
    },
    to: {
      route: prevRoute,
      document: prevRouteDocument,
      modal: !!prevModal,
    },
  });
});

hooks.enable();
