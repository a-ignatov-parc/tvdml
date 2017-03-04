import * as hooks from './navigation/hooks';
import {subscribe, broadcast} from './event-bus';

export {subscribe};
export * from './render';
export * from './pipelines';
export * from './navigation';
export {Promise} from 'es6-promise';
export {default as jsx} from './jsx';
export {default as createPlayer} from './render/player';
export {createComponent, Component} from './render/component';

subscribe('uncontrolled-document-pop').pipe(({document}) => {
	let {
		modal,
		route,
		prevRouteDocument,
	} = document;

	let prevDocument = modal ? document : prevRouteDocument;

	let {
		modal: prevModal,
		route: prevRoute,
	} = prevDocument;

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
