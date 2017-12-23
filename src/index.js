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

  const prevDocument = modal ? document : prevRouteDocument;
  const { route: prevRoute } = prevDocument;

  let { modal: prevModal } = prevDocument;

  if (modal) {
    prevModal = false;
  }

  broadcast('menu-button-press', {
    from: {
      route,
      document,
      modal: !!modal,
    },
    to: {
      route: prevRoute,
      document: prevDocument,
      modal: !!prevModal,
    },
  });
});

hooks.enable();
