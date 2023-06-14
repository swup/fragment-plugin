import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Rule from './Rule.js';
import type { Handler } from 'swup';

/**
 * A union type for pathToRegexp. It accepts strings,
 * arrays of strings or regular expressions.
 * @see https://github.com/pillarjs/path-to-regexp#path-to-regexp-1
 */
export type Path = string | string[] | RegExp;

export type Direction = 'forwards' | 'backwards';

interface FragmentElement extends Element {
	__fragmentInfo: {
		url: string;
		selector: string;
	};
}

export type Route = {
	from: string;
	to: string;
};

type RuleOptions = {
	from: Path;
	to: Path;
	direction?: Direction;
	fragments: string[];
	name?: string;
	revalidate?: string[];
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
	// @TODO use proper type
	originalReplaceContent: any;

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
			({ from, to, direction, fragments, name, revalidate }) =>
				new Rule(from, to, direction, fragments, name, revalidate)
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

		// Add an attribute `[data-fragment-direction]` for directional styling
		if (rule.matchedDirection) {
			document.documentElement.setAttribute('data-fragment-direction', rule.matchedDirection);
		}
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
		// Remove the current rule's attribute
		document.documentElement.removeAttribute('data-fragment-visit');

		// Remove the fragment direction attribute
		document.documentElement.removeAttribute('data-fragment-direction');
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
		await this.originalReplaceContent(page);
		return Promise.resolve();
	};

	/**
	 * Replace fragments for a given rule
	 */
	replaceFragments(page: any /* @TODO fix type */, rule: Rule): void {
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');
		const replacedElements: FragmentElement[] = [];

		// Mark existing fragments as stale
		document
			.querySelectorAll('[data-fragment]:not([data-stale-fragment])')
			.forEach((el) => el.setAttribute('data-stale-fragment', ''));

		// Step 1: replace all fragments from the rule
		rule.fragments.forEach((selector, index) => {
			const currentFragment = window.document.querySelector(
				selector
			) as FragmentElement | null;

			// Bail early if there is no match for the selector in the current dom
			if (!currentFragment) {
				console.warn('[swup] Container missing in current document:', selector);
				return;
			}

			const newFragment = this.replaceFragment(incomingDocument, currentFragment, selector);
			if (newFragment) replacedElements.push(newFragment);
		});

		// Step 2: Replace all invalid stale fragments
		this.getInvalidStaleFragments(rule).forEach((fragment) => {
			const newFragment = this.replaceFragment(
				incomingDocument,
				fragment,
				fragment.__fragmentInfo.selector
			);
			if (newFragment) replacedElements.push(newFragment);
		});

		console.log('replaced fragments:', replacedElements);
	}

	/**
	 * Replace a fragment from an incoming document
	 */
	replaceFragment(
		incomingDocument: Document,
		fragment: FragmentElement,
		selector: string
	): FragmentElement | undefined {
		const newFragment = incomingDocument.querySelector(selector) as FragmentElement | null;

		// Bail early if there is no match for the selector in the incoming dom
		if (!newFragment) {
			console.warn('[swup] Container missing in incoming document:', selector);
			return;
		}

		// Bail early if the fragment's innerHTML hasn't changed
		// if (this.isEqualInnerHTML(fragment, newFragment)) return;

		newFragment.setAttribute('data-fragment', '');
		newFragment.__fragmentInfo = {
			url: this.swup.getCurrentUrl(),
			selector
		};
		fragment.replaceWith(newFragment);
		return newFragment;
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
	 * Get invalid fragments from the current DOM.
	 */
	getInvalidStaleFragments(rule: Rule) {
		const currentUrl = this.swup.getCurrentUrl();

		// Get the regex from the rule that matches the current URL
		const regexForCurrentUrl = rule.toRegEx.test(currentUrl) ? rule.toRegEx : rule.fromRegEx;

		const candidates: FragmentElement[] = [];

		rule.revalidate.forEach((selector) => {
			const el = window.document.querySelector(`${selector}[data-stale-fragment]`) as FragmentElement | null;
			if (el) candidates.push(el);
		});

		return (
			candidates
				// The fragment's url matches the given rule's route for the current URL
				.filter((fragment) => regexForCurrentUrl.test(fragment.__fragmentInfo.url))
				// The fragment's url is NOT exactly equal to the current URL
				.filter((fragment) => fragment.__fragmentInfo.url !== currentUrl)
				// The fragment doesn't contain another fragment
				.filter((fragment) => !fragment.querySelector('[data-fragment]'))
		);
	}
}
