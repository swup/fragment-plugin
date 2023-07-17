import Logger from "./Logger.js";

/**
 * Acts as the origin for modals
 */
export default class extends HTMLElement {

	logger?: Logger;

	/**
	 * Make it easier to access "selector"
	 */
	get modal(): string {
		return this.getAttribute('selector') || '';
	}

	set modal(value: string) {
		if (value == null) {
			this.removeAttribute("modal");
			return;
		}
		this.setAttribute("modal", value);
	}

	/**
	 * Observe the attribute "selector"
	 */
	static get observedAttributes(): string[] {
		return ['modal'];
	}

	/**
	 * Invoked every time an observed attribute is changed
	 */
	attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
		switch (name) {
			case 'modal':
				this.validateModal(newValue);
				break;
		}
	}

	/**
	 * Makes sure the provided selector actually matches an element in the current DOM
	 */
	validateModal(selector?: string) {
		if (!selector) return;
		const target = document.querySelector(selector);
		if (target == null) {
			console.log(this.logger);
			this.logger?.error(`<swup-modal-origin>: '${selector}' doesn't match an element`);
		}
	}
}
