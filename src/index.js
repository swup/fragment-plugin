import Plugin from '@swup/plugin';
import { pathToRegexp } from 'path-to-regexp';
import { Location } from 'swup';

export default class extends Plugin {
	name = 'FragmentPlugin';

	currentUrls = {
		from: '',
		to: ''
	};

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
		this.routes = this.options.routes.map(this.prepareRoute);
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const { swup } = this;

		this.originalReplaceContent = swup.replaceContent;
		swup.replaceContent = this.replaceContent;

		swup.on('transitionStart', this.onTransitionStart);
		swup.on('clickLink', this.onClickLink);
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const { swup } = this;

		swup.replaceContent = this.originalReplaceContent;

		swup.off('transitionStart', this.onTransitionStart);
	}

	/**
	 * Store the current page URL on `transitionStart`
	 */
	onTransitionStart = (event) => {
		this.currentUrls.from = this.swup.currentPageUrl;
		// If this is a popstate event, the target URL is already active in the browser
		if (event instanceof PopStateEvent) {
			this.currentUrls.to = this.swup.getCurrentUrl();
		}
	};

	/**
	 * Update the `to` url when clicking a link
	 * @param {PointerEvent} event
	 */
	onClickLink = (event) => {
		this.currentUrls.to = Location.fromElement(event.delegateTarget).url;
	};

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
			return pathToRegexp(path, [], { start: false });
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
		const matchingRoute = this.routes.findLast((route) => route.matches(this.currentUrls));

		// If one of the routes matched, do a dynamic replace
		if (matchingRoute != null) {
			return this.replaceContainers(page, matchingRoute.containers);
		}

		// No route matched. Run the default replaceContent
		await this.originalReplaceContent(page);

		// Return an instantly resolved promise
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

		containers.forEach((selector) => {
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
			console.log('replaced:', currentElement);
			return;
		});

		return Promise.resolve();
	}
}
