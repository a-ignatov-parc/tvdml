import * as hooks from './navigation/hooks';
import { subscribe, broadcast } from './event-bus';

export { subscribe };
export * from './render';
export * from './pipelines';
export * from './navigation';
export { default as ReactTVML } from './react-tvml';

subscribe('uncontrolled-document-pop').pipe(({ document }) => {
  const {
    modal,
    route,
    prevRouteDocument,
  } = document;

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
