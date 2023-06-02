import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Rule from './inc/Rule.js';

export default class extends Plugin {
	name = 'FragmentPlugin';

	currentRule = null;
	rules = [];

	/**
	 * Constructor
	 * @param {?object} options the plugin options
	 */
	constructor(options = {}) {
		super();

		const defaultOptions = {
			rules: []
		};

		this.options = {
			...defaultOptions,
			...options
		};

		this.rules = this.options.rules.map(
			({ between, and, replace }) => new Rule(between, and, replace)
		);
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const { swup } = this;

		this.originalReplaceContent = swup.replaceContent;
		swup.replaceContent = this.replaceContent;

		swup.on('popState', this.onPopState);
		swup.on('clickLink', this.onClickLink);
		swup.on('transitionStart', this.onTransitionStart);
		swup.on('transitionEnd', this.onTransitionEnd);
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const { swup } = this;

		swup.replaceContent = this.originalReplaceContent;

		swup.off('popState', this.onPopState);
		swup.off('clickLink', this.onClickLink);
		swup.off('transitionStart', this.onTransitionStart);
		swup.off('transitionEnd', this.onTransitionEnd);
	}

	/**
	 * Set the current fragment on PopState.
	 * The browser URL has already changed during PopState
	 */
	onPopState = () => {
		this.setCurrentRule({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 * @param {PointerEvent} event
	 */
	onClickLink = (event) => {
		this.setCurrentRule({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (!this.currentRule) return;

		// Add a generic `is-fragment` class for identifying fragment visits
		document.documentElement.classList.add('is-fragment-visit');

		// Add a class for every fragment in the current rule
		// e.g. "is-fragment--my-fragment"
		this.currentRule.selectors.forEach((selector) => {
			document.documentElement.classList.add(`is-fragment--${selector.replace(/^#/, '-')}`);
		});

		this.disableScrollPluginForCurrentVisit();
	};

	/**
	 * Disable the scroll plugin for fragment visits
	 */
	disableScrollPluginForCurrentVisit() {
		// We still want scrolling if there is a hash in the target link
		if (this.swup.scrollToElement) return;

		const scrollPlugin = this.swup.findPlugin('ScrollPlugin');
		if (scrollPlugin) scrollPlugin.ignorePageVisit = true;
	}

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		if (!this.currentRule) return;
		// Remove specific fragment classes
		this.currentRule.selectors.forEach((selector) => {
			document.documentElement.classList.remove(`is-fragment--${selector.replace(/^#/, '-')}`);
		});
		// Remove the general `is-fragment` class
		document.documentElement.classList.remove('is-fragment-visit');
		// Reset the current rule
		this.currentRule = null;
	};

	/**
	 * Set the current Rule if any matches
	 *
	 * @param {object} {from: string, to: string}
	 */
	setCurrentRule({ from, to }) {
		this.currentRule = this.rules.findLast((fragment) => fragment.matches({ from, to })) || null;
	}

	/**
	 * Replace the content
	 *
	 * @param {object} page
	 * @returns
	 */
	replaceContent = async (page) => {
		// If one of the rules matched, replace only that fragment
		if (this.currentRule != null) {
			this.replaceFragments(page, this.currentRule);
			// Update the browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No fragment matched. Run the default replaceContent
		await this.originalReplaceContent(page);
		return Promise.resolve();
	};

	/**
	 * Replace fragments from the incoming page, based on the current rule
	 *
	 * @param {object} page
	 * @param {Rule}
	 * @returns
	 */
	replaceFragments(page, fragment) {
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');

		fragment.selectors.forEach((selector, index) => {
			const incomingElement = incomingDocument.querySelector(selector);
			if (!incomingElement) {
				console.warn('[swup] Container missing in incoming document:', selector);
				return;
			}
			const currentElement = window.document.querySelector(selector);
			if (!currentElement) {
				console.warn('[swup] Container missing in current document:', selector);
				return;
			}
			currentElement.replaceWith(incomingElement);
		});
	}
}
