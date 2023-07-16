/**
 * Acts as a slot for fragments.
 *
 * Visually disables eventual swup animations, as this element is not visible
 */
export default class FragmentSlotElement extends HTMLElement {

	constructor() {
		super();
		this.style.animationDuration = '1ms';
		this.style.transitionDuration = '1ms';
		this.style.display = 'none';
	}

}
