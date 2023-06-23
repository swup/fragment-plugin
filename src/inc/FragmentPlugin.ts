import PluginBase from '@swup/plugin';
import { Location } from 'swup';
import Rule from './Rule.js';
import Swup, { Handler, Plugin } from 'swup';

/**
 * Re-Export the Rule class
 */
export type { Rule };

/**
 * A union type for pathToRegexp. It accepts strings,
 * arrays of strings or regular expressions.
 * @see https://github.com/pillarjs/path-to-regexp#path-to-regexp-1
 */
export type Path = string | string[] | RegExp;

/**
 * Represents a route from one to another URL
 */
export type Route = {
	from: string;
	to: string;
};

/**
 * This is being used in the type PluginOptions
 */
type RuleOptions = {
	from: Path;
	to: Path;
	fragments: string[];
	name?: string;
};

/**
 * The Plugin Options
 */
type PluginOptions = {
	rules: RuleOptions[];
	debug?: boolean;
};

/**
 * The context, available throughout every transition
 */
type Context = {
	route?: Route;
	matchedRule?: Rule;
	validFragments?: string[];
};

/**
 * The main plugin class
 */
export default class FragmentPlugin extends PluginBase {
	name = 'FragmentPlugin';

	rules: Rule[] = [];

	options: PluginOptions;
	originalReplaceContent?: Swup['replaceContent'];
	scrollPlugin?: Plugin;

	context: Context = {};

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: PluginOptions) {
		super();

		const defaults: PluginOptions = {
			rules: [],
			debug: false
		};

		this.options = {
			...defaults,
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
		swup.on('contentReplaced', this.onContentReplaced);

		this.updateFragmentUrlAttributes();
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const { swup } = this;

		swup.replaceContent = this.originalReplaceContent!;
		this.originalReplaceContent = undefined;

		swup.off('popState', this.onPopState);
		swup.off('clickLink', this.onClickLink);
		swup.off('transitionStart', this.onTransitionStart);
		swup.off('transitionEnd', this.onTransitionEnd);
		swup.off('contentReplaced', this.onContentReplaced);

		this.cleanupFragmentUrls();
	}

	/**
	 * Set the current fragment on PopState.
	 * The browser URL has already changed during PopState
	 */
	onPopState = () => {
		this.preparePageVisit({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 */
	onClickLink: Handler<'clickLink'> = (event) => {
		this.preparePageVisit({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget as HTMLAnchorElement).url
		});
	};

	/**
	 * Prepares a page visit
	 */
	preparePageVisit({ from, to }: Route): void {
		this.context = Object.freeze(this.createContext({ from, to }));
		this.addClassToUnchangedFragments(to);
	}

	/**
	 * Handles a visit from a URL to another URL
	 */
	createContext({ from, to }: Route): Context {
		const context: Context = {
			route: { from, to },
			matchedRule: this.getFirstMatchingRule({ from, to }),
			validFragments: []
		};

		if (!context.matchedRule) return context;

		context.validFragments = context.matchedRule.fragments.filter((selector) =>
			this.validateFragment(selector, to, { silent: false })
		);

		this.log('Context:', context);

		return context;
	}

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (this.context.matchedRule) {
			this.setAnimationAttributes(this.context.matchedRule);
			this.disableScrollPlugin();
		}
	};

	/**
	 * Set the animation attributes for a rule, for scoped styling
	 */
	setAnimationAttributes(rule: Rule) {
		document.documentElement.setAttribute('data-fragment-visit', rule.name || '');
	}

	/**
	 * Add the class ".swup-fragment-unchanged" to fragments that match a given URL
	 */
	addClassToUnchangedFragments = (url: string) => {
		// First, remove the class from all elements
		document.querySelectorAll<HTMLElement>('.swup-fragment-unchanged').forEach((el) => {
			el.classList.remove('swup-fragment-unchanged');
		});
		// Then, add the class to every element that matches the given URL
		document.querySelectorAll<HTMLElement>('[data-swup-fragment-url]').forEach((el) => {
			const fragmentUrl = el.getAttribute('data-swup-fragment-url');
			el.classList.toggle('swup-fragment-unchanged', fragmentUrl === url);
		});
	};

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		this.cleanupAnimationAttributes();
		this.restoreScrollPlugin();
	};

	/**
	 * Do stuff everytime swup replaces the content
	 */
	onContentReplaced = () => {
		const targetAttribute = 'data-swup-fragment-target';
		const links = document.querySelectorAll<HTMLAnchorElement>(`a[${targetAttribute}]`);
		links.forEach((el) => {
			const selector = el.getAttribute(targetAttribute);
			if (!selector)
				return this.log(
					`[${targetAttribute}] needs to contain a valid selector`,
					selector,
					'warn'
				);

			const target = document.querySelector(selector);
			if (!target)
				return this.log(`No element found for [${targetAttribute}]:`, selector, 'warn');

			const fragmentUrl = target.getAttribute('data-swup-fragment-url');
			if (!fragmentUrl)
				return this.log(
					"Targeted element doesn't have a [data-swup-fragme-url]",
					target,
					'warn'
				);

			el.href = fragmentUrl;
		});
	};

	/**
	 * Disable ScrollPlugin for fragment visits
	 */
	disableScrollPlugin() {
		// We still want scrolling if there is a hash in the target link
		if (this.swup.scrollToElement) return;

		this.scrollPlugin = this.swup.findPlugin('ScrollPlugin');
		if (this.scrollPlugin) this.swup.unuse(this.scrollPlugin);
	}

	/**
	 * Re-enable ScrollPlugin after each transition
	 */
	restoreScrollPlugin() {
		if (this.scrollPlugin) this.swup.use(this.scrollPlugin);
		this.scrollPlugin = undefined;
	}

	/**
	 * Removes all fragment-related animation attributes from the `html` element
	 */
	cleanupAnimationAttributes() {
		document.documentElement.removeAttribute('data-fragment-visit');
	}

	/**
	 * Get the first matching rule for a given route
	 */
	getFirstMatchingRule(route: Route): Rule | undefined {
		return this.rules.find((rule) => rule.matches(route));
	}

	/**
	 * Replace the content
	 */
	replaceContent = async (page: any /* @TODO fix type */) => {
		// If there are fragments to replace
		if (this.context.validFragments?.length) {
			this.replaceFragments(page, this.context.validFragments);
			document.title = page.title;
			return Promise.resolve();
		}

		// No rule matched. Run the default replaceContent
		await this.originalReplaceContent!(page);
		// Save the current URL for all fragments
		this.updateFragmentUrlAttributes();
		return Promise.resolve();
	};

	/**
	 * Replace fragments for a given rule
	 */
	replaceFragments(page: any /* @TODO fix type */, fragments: string[]): void {
		const currentUrl = this.swup.getCurrentUrl();
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');
		const replacedElements: Element[] = [];

		// Step 1: replace all fragments from the rule
		fragments.forEach((selector, index) => {
			const currentFragment = window.document.querySelector(selector);

			// Bail early if there is no match for the selector in the current dom
			if (!currentFragment) {
				this.log('Fragment missing in current document:', selector, 'warn');
				return;
			}

			const newFragment = incomingDocument.querySelector(selector);

			// Bail early if there is no match for the selector in the incoming dom
			if (!newFragment) {
				this.log('Fragment missing in incoming document:', selector, 'warn');
				return;
			}

			newFragment.setAttribute('data-swup-fragment-url', currentUrl);
			currentFragment.replaceWith(newFragment);
			replacedElements.push(newFragment);
		});

		this.log('Replaced:', replacedElements);
	}

	/**
	 * Validate a fragment for a target URL
	 */
	validateFragment(selector: string, targetUrl: string, { silent = true } = {}): boolean {
		const el = document.querySelector(selector);

		if (!el) {
			!silent && this.log('Fragment missing in current document:', selector, 'warn');
			return false;
		}

		if (this.elementMatchesFragmentUrl(el, targetUrl)) {
			!silent &&
				this.log(`Ignoring fragment:`, {
					reason: 'Already matches the target URL',
					el,
					targetUrl
				});
			return false;
		}

		return true;
	}

	/**
	 * Checks if an element's [data-swup-fragment-url] matches a given URL
	 */
	elementMatchesFragmentUrl(el: Element, url: string): boolean {
		const fragmentUrl = el.getAttribute('data-swup-fragment-url');
		return !fragmentUrl ? false : this.isEqualUrl(fragmentUrl, url);
	}

	/**
	 * Compare two urls for equality
	 *
	 * All these URLs would be considered the same:
	 *
	 * - /test
	 * - /test/
	 * - /test?foo=bar&baz=boo
	 * - /test/?baz=boo&foo=bar
	 */
	isEqualUrl(url1: string, url2: string) {
		return this.normalizeUrl(url1) === this.normalizeUrl(url2);
	}

	/**
	 * Normalize a URL
	 */
	normalizeUrl(url: string) {
		if (!url.trim()) return url;

		const removeTrailingSlash = (str: string) => (str.endsWith('/') ? str.slice(0, -1) : str);

		const location = Location.fromUrl(url);
		location.searchParams.sort();

		return removeTrailingSlash(location.pathname) + location.search;
	}

	/**
	 * Adds [data-swup-fragment-url] to all fragments that don't already contain that attribute
	 */
	updateFragmentUrlAttributes() {
		this.rules.forEach(({ fragments: selectors }) => {
			selectors.forEach((selector) => {
				const fragment = document.querySelector(selector);
				if (!fragment) return;
				if (fragment.matches('[data-swup-fragment-url]')) return;
				fragment.setAttribute('data-swup-fragment-url', this.swup.getCurrentUrl());
			});
		});
	}

	/**
	 * Removes [data-swup-fragment-url] from all elements
	 */
	cleanupFragmentUrls() {
		document.querySelectorAll('[data-swup-fragment-url]').forEach((el) => {
			el.removeAttribute('data-swup-fragment-url');
		});
	}

	/**
	 * Log to console, if debug is `true`
	 */
	log(message: string, context?: any, type: 'log' | 'warn' | 'error' = 'log') {
		if (!this.options.debug) return;
		console[type](`[@swup/fragment-plugin] ${message}`, context);
	}
}
