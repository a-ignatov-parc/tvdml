import {noop} from '../utils';
import {uvdomToDocument} from '../render/document';

export default class Partial {
	constructor(target) {
		this.target = target;
		this.handlers = [];
		bindEvents(this.target, 'select', this.handlers);
	}

	onSelect(handler = noop()) {
		this.handlers.push(handler);

		return () => {
			let index = this.handlers.indexOf(handler);

			if (~index) {
				this.handlers.splice(index, 1);
			}
		}
	}

	update(template) {
		let document = this.target.ownerDocument;
		let fragment = document.createElement('fragment');

		if (template == null) {
			template = '';
		}

		if (typeof(template) === 'string') {
			fragment.innerHTML = template;
		}

		if (typeof(template) === 'object') {
			fragment = uvdomToDocument(template, fragment);
		}

		for (let i = this.target.childNodes.length; i; i--) {
			this.target.removeChild(this.target.childNodes.item(i - 1));
		}

		if (fragment.childNodes.length > 1) {
			throw `Can't render multiple nodes instead single target`;
		}

		let root = fragment.childNodes.item(0);

		if (root.nodeName !== this.target.nodeName) {
			throw `Rendering node isn't equal to target node`;
		}

		this.target.parentNode.replaceChild(root, this.target);
		this.target = root;

		bindEvents(this.target, 'select', this.handlers);
		return this.target;
	}
}

export function createPartial(target) {
	return new Partial(target);
}

function bindEvents(target, name, handlers) {
	target.addEventListener(name, event => handlers.forEach(handler => handler(event)));
}
