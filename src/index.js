import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Rule from './inc/Rule.js';

export default class extends Plugin {
	name = 'FragmentPlugin';

	matchingRule = undefined;
	currentRoute = undefined;
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
			({ from, to, fragments, name }) => new Rule(from, to, fragments, name)
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
		this.matchingRule = this.findMatchingRule({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 * @param {PointerEvent} event
	 */
	onClickLink = (event) => {
		this.matchingRule = this.findMatchingRule({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (!this.matchingRule) return;

		// Add a generic `is-fragment` class for identifying fragment visits
		document.documentElement.classList.add('is-fragment');

		// Add the transitionClass of the current rule
		document.documentElement.classList.add(`is-fragment--${this.matchingRule.name}`);

		// Add an attribute `[data-fragment-direction]` for directional styling
		document.documentElement.setAttribute('data-fragment-direction', this.matchingRule.matchedDirection);

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
		if (!this.matchingRule) return;

		// Remove the current rule's transitionClass
		document.documentElement.classList.remove(`is-fragment--${this.matchingRule.name}`);

		// Remove the general `is-fragment` class
		document.documentElement.classList.remove('is-fragment');

		// Remove the fragment direction attribute
		document.documentElement.removeAttribute('data-fragment-direction');

		// Reset the current rule
		this.matchingRule = null;
	};

	/**
	 * Set the current Rule if any matches
	 *
	 * @param {object} A route in the shape of {from: string;, to: string;}
	 * @returns {Rule|undefined}
	 */
	findMatchingRule(route) {
		return this.rules.findLast((fragment) => fragment.matches(route));
	}

	/**
	 * Replace the content
	 *
	 * @param {object} page
	 * @returns
	 */
	replaceContent = async (page) => {
		// If one of the rules matched, replace only that fragment
		if (this.matchingRule != null) {
			this.replaceFragments(page, this.matchingRule);
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
	replaceFragments(page, rule) {
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');

		rule.fragments.forEach((selector, index) => {
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
