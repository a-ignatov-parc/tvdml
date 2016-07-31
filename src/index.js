import * as hooks from './navigation/hooks';
import {subscribe, broadcast} from './event-bus';

export {subscribe};
export * from './render';
export * from './pipeline';
export * from './navigation';
export * from './render/partial';
export {Promise} from 'es6-promise';
export {default as jsx} from './jsx';

subscribe('uncontrolled-document-pop').pipe(({document}) => {
	let {
		modal,
		route,
		extra,
		prevRouteDocument,
	} = document;

	let {
		modal: prevModal,
		route: prevRoute,
		extra: prevExtra,
	} = modal ? document : prevRouteDocument;

	if (modal) {
		prevModal = false;
	}

	broadcast('menu-button-press', {
		from: {route, modal: !!modal, extra},
		to: {route: prevRoute, modal: !!prevModal, extra: prevExtra},
	});
});

hooks.enable();
