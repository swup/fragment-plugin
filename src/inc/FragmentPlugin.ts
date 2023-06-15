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

export type Direction = 'forwards' | 'backwards';

export type Route = {
	from: string;
	to: string;
};

type RuleOptions = {
	from: Path;
	to: Path;
	replace: string[];
	name?: string;
};

type PluginOptions = {
	rules: RuleOptions[];
};

export default class FragmentPlugin extends Plugin {
	name = 'FragmentPlugin';

	selectedRule: Rule | undefined = undefined;
	rules: Rule[] = [];
	options: PluginOptions = {
		rules: []
	};
	originalReplaceContent: Swup['replaceContent'] | undefined;

	/**
	 * Constructor
	 */
	constructor(options: PluginOptions) {
		super();

		this.options = {
			...this.options,
			...options
		};

		this.rules = this.options.rules.map(
			({ from, to, replace, name }) => new Rule(from, to, replace, name)
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

		this.prefillFragmentUrls();
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
		this.selectedRule = this.findSelectedRule({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 */
	onClickLink: Handler<'clickLink'> = (event) => {
		this.selectedRule = this.findSelectedRule({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget as HTMLAnchorElement).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (this.selectedRule) {
			this.setAnimationAttributes(this.selectedRule);
			this.disableScrollPluginForCurrentVisit();
		}
	};

	/**
	 * Set the animation attributes for a rule
	 */
	setAnimationAttributes(rule: Rule) {
		// Add an attribute `[data-fragment-visit="my-rule-name"]` for scoped styling
		document.documentElement.setAttribute('data-fragment-visit', rule.name || '');
	}

	/**
	 * Disable the scroll plugin for fragment visits
	 */
	disableScrollPluginForCurrentVisit() {
		// We still want scrolling if there is a hash in the target link
		if (this.swup.scrollToElement) return;

		const scrollPlugin = this.swup.findPlugin('ScrollPlugin') as any;
		if (scrollPlugin) scrollPlugin.ignorePageVisit = true;
	}

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		this.cleanupAnimationAttributes();
		// Reset the current rule
		this.selectedRule = undefined;
	};

	/**
	 * Removes all fragment-related animation attributes from the `html` element
	 */
	cleanupAnimationAttributes() {
		document.documentElement.removeAttribute('data-fragment-visit');
	}

	/**
	 * Set the current Rule if any matches
	 */
	findSelectedRule(route: Route): Rule | undefined {
		return this.rules.find((rule) => rule.matches(route));
	}

	/**
	 * Replace the content
	 */
	replaceContent = async (page: any /* @TODO fix type */) => {
		// If one of the rules matched, replace only the fragments from that rule
		if (this.selectedRule != null) {
			this.replaceFragments(page, this.selectedRule);
			// Update the browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No rule matched. Run the default replaceContent
		await this.originalReplaceContent!(page);
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
		rule.replace.forEach((selector, index) => {
			const currentFragment = window.document.querySelector(selector);

			// Bail early if there is no match for the selector in the current dom
			if (!currentFragment) {
				console.warn(
					'[swup-fragment-plugin] Container missing in current document:',
					selector
				);
				return;
			}

			const newFragment = incomingDocument.querySelector(selector);

			// Bail early if there is no match for the selector in the incoming dom
			if (!newFragment) {
				console.warn(
					'[swup-fragment-plugin] Container missing in incoming document:',
					selector
				);
				return;
			}

			// Bail early if the URL of the current fragment is equal to the current browser URL
			if (currentFragment.getAttribute('data-fragment-url') === currentUrl) {
				console.log('[swup-fragment-plugin] Fragment URL unchanged:', currentFragment);
				return;
			}

			// Bail early if the fragment hasn't changed
			// if (currentFragment.isEqualNode(newFragment)) {
			// 	console.log('[swup-fragment-plugin] Fragment unchanged:', currentFragment);
			// 	return;
			// }

			newFragment.setAttribute('data-fragment-url', currentUrl);
			currentFragment.replaceWith(newFragment);
			replacedElements.push(newFragment);
		});

		console.log('replaced:', replacedElements);
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
	 * Adds [data-fragment-url] to all fragments
	 */
	prefillFragmentUrls() {
		this.rules.forEach(({ replace: selectors }) => {
			selectors.forEach(selector => {
				const fragment = document.querySelector(selector);
				if (fragment) fragment.setAttribute('data-fragment-url', this.swup.getCurrentUrl());
			})
		});
	}

	/**
	 * Removes [data-fragment-url] from all elements
	 */
	cleanupFragmentUrls() {
		document.querySelectorAll('[data-fragment-url]').forEach((el) => {
			el.removeAttribute('data-fragment-url');
		})
	}
}
