import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Fragment from './inc/Fragment.js';

export default class extends Plugin {
	name = 'FragmentPlugin';

	currentFragment = null;
	fragments = [];

	/**
	 * Constructor
	 * @param {?object} options the plugin options
	 */
	constructor(options = {}) {
		super();

		const defaultOptions = {
			fragments: []
		};

		this.options = {
			...defaultOptions,
			...options
		};

		this.fragments = this.options.fragments.map(
			({ between, and, replace }) => new Fragment(between, and, replace)
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
		this.setCurrentFragment({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 * @param {PointerEvent} event
	 */
	onClickLink = (event) => {
		this.setCurrentFragment({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (!this.currentFragment) return;
		document.documentElement.classList.add('is-fragment');

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
		this.currentFragment = null;
		document.documentElement.classList.remove('is-fragment');
	};

	/**
	 * Set the current Fragment if any matches
	 *
	 * @param {object} {from: string, to: string}
	 */
	setCurrentFragment({ from, to }) {
		this.currentFragment = this.fragments.findLast((fragment) => fragment.matches({ from, to })) || null;
	}

	/**
	 * Replace the content
	 *
	 * @param {object} page
	 * @returns
	 */
	replaceContent = async (page) => {
		// If one of the fragments matched, replace only that fragment
		if (this.currentFragment != null) {
			this.replaceFragment(page, this.currentFragment);
			// Update the browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No fragment matched. Run the default replaceContent
		await this.originalReplaceContent(page);
		return Promise.resolve();
	};

	/**
	 * Replace a fragment from the incoming page
	 *
	 * @param {object} page
	 * @param {Fragment}
	 * @returns
	 */
	replaceFragment(page, fragment) {
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
			incomingElement.setAttribute('data-swup-fragment', String(index + 1));
			currentElement.replaceWith(incomingElement);
		});
	}
}
