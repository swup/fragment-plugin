import PluginBase from '@swup/plugin';
import { Location } from 'swup';
import Rule from './Rule.js';
import Swup, { Handler, Plugin } from 'swup';

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
 * The main plugin class
 */
export default class FragmentPlugin extends PluginBase {
	name = 'FragmentPlugin';

	currentRule: Rule | undefined;
	rules: Rule[] = [];
	defaults: PluginOptions = {
		rules: [],
		debug: false
	};
	options: PluginOptions;
	originalReplaceContent: Swup['replaceContent'] | undefined;
	scrollPlugin: Plugin | undefined;

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: PluginOptions) {
		super();

		this.options = {
			...this.defaults,
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

		this.setFragmentUrls();
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
		this.updateCurrentRule({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 */
	onClickLink: Handler<'clickLink'> = (event) => {
		this.updateCurrentRule({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget as HTMLAnchorElement).url
		});
	};

	/**
	 * Updates the current rule
	 */
	updateCurrentRule({ from, to }: Route) {
		this.currentRule = this.getFirstMatchingRule({ from, to });
		this.markUnchangedFragments(to);
	}

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (this.currentRule) {
			this.setAnimationAttributes(this.currentRule);
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
	 * Add a class to unchanged fragments
	 */
	markUnchangedFragments = (url: string) => {
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
		// Reset the current rule
		this.currentRule = undefined;
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
		// If one of the rules matched, replace only the fragments from that rule
		if (this.currentRule != null) {
			this.replaceFragments(page, this.currentRule);
			// Update the browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No rule matched. Run the default replaceContent
		await this.originalReplaceContent!(page);
		// Save the current URL for all fragments
		this.setFragmentUrls();
		return Promise.resolve();
	};

	/**
	 * Replace fragments for a given rule
	 */
	replaceFragments(page: any /* @TODO fix type */, rule: Rule): void {
		const currentUrl = this.swup.getCurrentUrl();
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');
		const replacedElements: Element[] = [];

		// Step 1: replace all fragments from the rule
		rule.fragments.forEach((selector, index) => {
			const currentFragment = window.document.querySelector(selector);

			// Bail early if there is no match for the selector in the current dom
			if (!currentFragment) {
				this.log('Container missing in current document:', selector, 'warn');
				return;
			}

			const newFragment = incomingDocument.querySelector(selector);

			// Bail early if there is no match for the selector in the incoming dom
			if (!newFragment) {
				this.log('Container missing in incoming document:', selector, 'warn');
				return;
			}

			// Bail early if the URL of the current fragment is equal to the current browser URL
			if (
				this.isEqualUrl(
					String(currentFragment.getAttribute('data-swup-fragment-url')),
					currentUrl
				)
			) {
				this.log('URL unchanged:', currentFragment);
				return;
			}

			newFragment.setAttribute('data-swup-fragment-url', currentUrl);
			currentFragment.replaceWith(newFragment);
			replacedElements.push(newFragment);
		});

		this.log('replaced:', replacedElements);
	}

	/**
	 * Compare two urls for equality
	 */
	isEqualUrl(url1: string, url2: string) {
		const loc1 = Location.fromUrl(url1);
		loc1.searchParams.sort();

		const loc2 = Location.fromUrl(url2);
		loc2.searchParams.sort();

		const path1 = this.removeTrailingSlash(loc1.pathname) + loc1.search;
		const path2 = this.removeTrailingSlash(loc2.pathname) + loc2.search;

		return path1 === path2;
	}

	removeTrailingSlash(str: string): string {
		return str.endsWith('/') ? str.slice(0, -1) : str;
	}

	/**
	 * Adds [data-swup-fragment-url] to all fragments that don't already contain that attribute
	 */
	setFragmentUrls() {
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
