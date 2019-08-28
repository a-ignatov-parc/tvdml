import * as hooks from './navigation/hooks';
import { event, broadcast, subscribe } from './event-bus';

export { event, subscribe };
export * from './render';
export * from './pipelines';
export * from './navigation';
export { default as ReactTVML } from './react-tvml';

subscribe('uncontrolled-document-dismissal').pipe(document => {
  let { prevRouteDocument } = document;
  if (!prevRouteDocument) {
    return;
  }

  const menuBar = prevRouteDocument.documentElement
    .getElementsByTagName('menuBar')
    .item(0);
  if (menuBar) {
    const menuBarDocument = menuBar.getFeature('MenuBarDocument');
    const menuItem = menuBarDocument.getSelectedItem();
    prevRouteDocument = menuBarDocument.getDocument(menuItem);
  }

  const { route: prevRoute, modal: prevModal } = prevRouteDocument;
  const { modal, route } = document;

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
