import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Rule from './Rule.js';
import Swup, { Handler } from 'swup';

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
export default class FragmentPlugin extends Plugin {
	name = 'FragmentPlugin';

	currentRule: Rule | undefined;
	rules: Rule[] = [];
	defaults: PluginOptions = {
		rules: [],
		debug: false
	};
	options: PluginOptions;
	originalReplaceContent: Swup['replaceContent'] | undefined;
	originalScrollTo: any;

	/**
	 * Constructor. The options are NOT optional
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

		this.cleanupFragmentUrls();
	}

	/**
	 * Set the current fragment on PopState.
	 * The browser URL has already changed during PopState
	 */
	onPopState = () => {
		this.currentRule = this.getFirstMatchingRule({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 */
	onClickLink: Handler<'clickLink'> = (event) => {
		this.currentRule = this.getFirstMatchingRule({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget as HTMLAnchorElement).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (this.currentRule) {
			this.setAnimationAttributes(this.currentRule);
			this.disableScrollingBehavior();
		}
	};

	/**
	 * Set the animation attributes for a rule, for scoped styling
	 */
	setAnimationAttributes(rule: Rule) {
		document.documentElement.setAttribute('data-fragment-visit', rule.name || '');
	}

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		this.cleanupAnimationAttributes();
		this.restoreScrollingBehavior();
		// Reset the current rule
		this.currentRule = undefined;
	};

	/**
	 * Disable scrolling for fragment visits
	 */
	disableScrollingBehavior() {
		// We still want scrolling if there is a hash in the target link
		if (this.swup.scrollToElement) return;

		/**
		 * @TODO: Find a way for scroll plugin to inject it's methods' types
		 * into the Swup type. Until then, disable type checking for swup.scrollTo
		 */
		// @ts-ignore
		this.originalScrollTo = this.swup.scrollTo;
		// @ts-ignore
		this.swup.scrollTo = () => {};
	}

	/**
	 * Restore the default scrolling behavior
	 */
	restoreScrollingBehavior() {
		if (!this.originalScrollTo) return;
		// @ts-ignore
		this.swup.scrollTo = this.originalScrollTo;
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
			if (currentFragment.getAttribute('data-swup-fragment-url') === currentUrl) {
				this.log('URL unchanged:', currentFragment);
				return;
			}

			const isEqualInnerHTML = this.isEqualInnerHTML(currentFragment, newFragment);
			this.log(`${selector} is equal:`, isEqualInnerHTML);

			// Bail early if the fragment's contents are unchanged
			if (isEqualInnerHTML) {
				this.log('Fragment content unchanged:', currentFragment);
				return;
			}

			newFragment.setAttribute('data-swup-fragment-url', currentUrl);
			currentFragment.replaceWith(newFragment);
			replacedElements.push(newFragment);
		});

		this.log('replaced:', replacedElements);
	}

	/**
	 * Check if two elements contain the same innerHTML
	 */
	isEqualInnerHTML(el1: Element, el2: Element): boolean {
		const dummy1 = document.createElement('div');
		dummy1.innerHTML = el1.innerHTML;

		const dummy2 = document.createElement('div');
		dummy2.innerHTML = el2.innerHTML;

		return dummy1.isEqualNode(dummy2);
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
	log(message: string, context: any, type: 'log' | 'warn' | 'error' = 'log') {
		if (!this.options.debug) return;
		console[type](`[@swup/fragment-plugin] ${message}`, context);
	}
}
