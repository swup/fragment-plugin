/**
 * A custom element that acts as a slot for an incoming fragment.
 *
 * Automatically disables eventual swup animations, as this element is not visible
 */
export default class extends HTMLElement {
	shadowRoot: ShadowRoot;

	constructor() {
		super();

		this.shadowRoot = this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(getStyles());

		// The slot should be hidden from screen readers
		if (!this.hasAttribute('aria-hidden')) this.setAttribute('aria-hidden', 'true');
	}
}

/**
 * Scope the styles to the :host for a cleaner experience
 */
function getStyles() {
	const template = document.createElement('template');
	template.innerHTML = /*html*/ `
		<style>
		:host {
			transition-duration: 10ms;
			animation-duration: 10ms;
			/*
			 * @TODO: see if "display: block" makes sense in production.
			 * The default for custom elements is "display: inline"
			 */
			display: block;
		}
		</style>
  	`;
	return template.content.cloneNode(true);
}
