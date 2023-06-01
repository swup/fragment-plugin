import Plugin from '@swup/plugin';
import { pathToRegexp } from 'path-to-regexp';
import { Location } from 'swup';

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
			routes: [],
			pathToRegexpOptions: {}
		};

		this.options = {
			...defaultOptions,
			...options
		};
		this.routes = this.options.routes.map(this.prepareRoute);
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
		swup.on('animationOutStart', this.onAnimationOutStart);
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
		swup.on('animationOutStart', this.onAnimationOutStart);
		swup.on('transitionEnd', this.onTransitionEnd);
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
	 * Add a class during animations, if this is a fragment visit
	 */
	onAnimationOutStart = () => {
		if (this.currentRoute) {
			document.documentElement.classList.add('is-fragment');
		}
	}

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		this.currentRoute = null;
		document.documentElement.classList.remove('is-fragment');
	}

	/**
	 * Set the current Route if any matches
	 *
	 * @param {object} {from: string, to: string}
	 */
	setCurrentRoute({ from, to }) {
		this.currentRoute = this.routes.findLast((route) =>
			route.matches({ from, to })
		) || null;
	}

	/**
	 * Convert a string to a regex, with error handling
	 *
	 * @see https://github.com/pillarjs/path-to-regexp
	 *
	 * @param {path} string
	 * @returns
	 */
	convertToRegexp(path) {
		try {
			return pathToRegexp(path, [], this.options.pathToRegexpOptions);
		} catch (error) {
			console.warn(`Something went wrong while trying to convert ${path} to a regex:`);
			console.warn(error);
		}
		return path;
	}

	/**
	 * Prepare a route:
	 *
	 * - Ensure every route has a `from` and `to` regex
	 * - Inject a `matches` function
	 *
	 * @param {object} route
	 * @returns
	 */
	prepareRoute = (route) => {
		const isRegex = (str) => str instanceof RegExp;

		return {
			...route,
			...{
				regFrom: isRegex(route.from) ? route.from : this.convertToRegexp(route.from),
				regTo: isRegex(route.to) ? route.to : this.convertToRegexp(route.to),
				matches: function ({ from, to }) {
					// Return true if the route matches forwards
					if (this.regFrom.test(from) && this.regTo.test(to)) return true;
					// Return true if the route matches backwards
					if (this.regTo.test(from) && this.regFrom.test(to)) return true;
					// Finally, return false
					return false;
				}
			}
		};
	};

	/**
	 * Replace the content
	 *
	 * @param {object} page
	 * @returns
	 */
	replaceContent = async (page) => {

		// If one of the routes matched, do a dynamic replace
		if (this.currentRoute != null) {
			this.replaceContainers(page, this.currentRoute.containers);
			// Update browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No route matched. Run the default replaceContent
		await this.originalReplaceContent(page);
		return Promise.resolve();
	};

	/**
	 * Replace named containers from the incoming page
	 *
	 * @param {object} page
	 * @param {array} containers
	 * @returns
	 */
	replaceContainers(page, containers) {
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');

		containers.forEach((selector, index) => {
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
			incomingElement.setAttribute('data-swup-fragment', String(index+1));
			currentElement.replaceWith(incomingElement);
		});
	}
}
