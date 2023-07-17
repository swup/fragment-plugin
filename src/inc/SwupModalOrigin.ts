import Logger from "./Logger.js";

/**
 * Acts as the origin for modals
 */
export default class ModalOriginElement extends HTMLElement {

	logger?: Logger;
	modalElement?: Element;

	/**
	 * Make it easier to access "selector"
	 */
	get selector(): string {
		return this.getAttribute('selector') || '';
	}

	set selector(value: string) {
		if (value == null) {
			this.removeAttribute("selector");
			return;
		}
		this.setAttribute("selector", value);
	}

	/**
	 * Observe the attribute "selector"
	 */
	static get observedAttributes(): string[] {
		return ['selector'];
	}

	/**
	 * Invoked every time an observed attribute is changed
	 */
	attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
		switch (name) {
			case 'selector':
				this.validateSelector(newValue);
				break;
		}
	}

	/**
	 * Makes sure the provided selector actually matches an element in the current DOM
	 */
	validateSelector(selector?: string) {
		if (!selector) return;
		const target = document.querySelector(selector);
		if (target == null) {
			console.log(this.logger);
			this.logger?.error(`<swup-modal-origin>: '${selector}' doesn't match an element`);
		}
	}
}
