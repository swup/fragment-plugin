export default class TeleportBaseElement extends HTMLElement {
	get selector() {
		return this.getAttribute('selector');
	}

	set selector(val) {
		if (!val) {
			this.removeAttribute('selector');
			return;
		}
		this.setAttribute('selector', val);
	}

	static get observedAttributes() {
		return ['selector'];
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		switch (name) {
			case 'selector':
				this.selector = newValue;
				break;
		}
	}
}
