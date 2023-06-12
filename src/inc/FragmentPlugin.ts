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
	 * @param {?object} options the plugin options
	 */
	constructor(options: Partial<PluginOptions> = {}) {
		super();

		this.options = {
			...this.options,
			...options
		};

		this.rules = this.options.rules.map(
			({ from, to, direction, fragments, name }) =>
				new Rule(from, to, direction, fragments, name)
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
		if (!this.selectedRule) return;

		// Add an attribute `[data-fragment-visit="my-rule-name"]` for scoped styling
		document.documentElement.setAttribute('data-fragment-visit', this.selectedRule.name || '');

		// Add an attribute `[data-fragment-direction]` for directional styling
		if (this.selectedRule.matchedDirection) {
			document.documentElement.setAttribute(
				'data-fragment-direction',
				this.selectedRule.matchedDirection
			);
		}

		this.disableScrollPluginForCurrentVisit();
	};

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
		if (!this.selectedRule) return;

		// Remove the current rule's attribute
		document.documentElement.removeAttribute('data-fragment-visit');

		// Remove the fragment direction attribute
		document.documentElement.removeAttribute('data-fragment-direction');

		// Reset the current rule
		this.selectedRule = undefined;
	};

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
	 * Replace fragments from a given rule
	 */
	replaceFragments(page: any /* @TODO fix type */, rule: Rule): void {
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

			// Bail early if the two fragments have identical attribute values 'data-fragment-hash'
			if (this.isSameFragmentHash(currentElement, incomingElement)) return;

			currentElement.replaceWith(incomingElement);
		});
	}
	/**
	 * Check if two elements have an identical attribute `data-fragment-hash`
	 */
	isSameFragmentHash(el1: Element, el2: Element) {
		const hash1 = el1.getAttribute('data-fragment-hash');
		const hash2 = el2.getAttribute('data-fragment-hash');
		return hash1 && hash2 && hash1 === hash2;
	}
}

/**
 * - Allow one-directional routes
 * - Ignore fragments where [data-fragment-hash] is the same
 */
