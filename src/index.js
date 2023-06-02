import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Route from './inc/Route.js';

export default class extends Plugin {
	name = 'FragmentPlugin';

	currentRoute = null;
	routes = [];

	/**
	 * Constructor
	 * @param {?object} options the plugin options
	 */
	constructor(options = {}) {
		super();

		const defaultOptions = {
			routes: []
		};

		this.options = {
			...defaultOptions,
			...options
		};

		this.routes = this.options.routes.map(
			({ between, and, replace }) => new Route(between, and, replace)
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
	 * Set the current route on PopState.
	 * The browser URL has already changed during PopState
	 */
	onPopState = () => {
		this.setCurrentRoute({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current route when clicking a link
	 * @param {PointerEvent} event
	 */
	onClickLink = (event) => {
		this.setCurrentRoute({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (!this.currentRoute) return;
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
		this.currentRoute = null;
		document.documentElement.classList.remove('is-fragment');
	};

	/**
	 * Set the current Route if any matches
	 *
	 * @param {object} {from: string, to: string}
	 */
	setCurrentRoute({ from, to }) {
		this.currentRoute = this.routes.findLast((route) => route.matches({ from, to })) || null;
	}

	/**
	 * Replace the content
	 *
	 * @param {object} page
	 * @returns
	 */
	replaceContent = async (page) => {
		// If one of the routes matched, replace the fragments from that route
		if (this.currentRoute != null) {
			this.replaceFragments(page, this.currentRoute.fragments);
			// Update the browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No route matched. Run the default replaceContent
		await this.originalReplaceContent(page);
		return Promise.resolve();
	};

	/**
	 * Replace fragments from the incoming page
	 *
	 * @param {object} page
	 * @param {array} selectors
	 * @returns
	 */
	replaceFragments(page, selectors) {
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');

		selectors.forEach((selector, index) => {
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
