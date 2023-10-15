import Swup, { matchPath, classify, Location } from 'swup';
import type { Path } from 'swup';
import type { Route } from './defs.js';
import { dedupe, fragmentIsOutOfBounds, queryFragmentElement } from './functions.js';
import Logger, { highlight } from './Logger.js';
import { __DEV__ } from './env.js';
import type SwupFragmentPlugin from '../SwupFragmentPlugin.js';

/**
 * Represents a Rule
 */
export default class ParsedRule {
	readonly matchesFrom;
	readonly matchesTo;

	swup: Swup;
	from: Path;
	to: Path;
	containers: string[];
	name?: string;
	scroll: boolean | string = false;
	focus?: boolean | string;
	logger?: Logger;

	constructor(
		{ swup }: SwupFragmentPlugin,
		from: Path,
		to: Path,
		rawContainers: string[],
		name?: string,
		scroll?: boolean | string,
		focus?: boolean | string,
		logger?: Logger
	) {
		this.swup = swup;
		this.logger = logger;
		this.from = from || '';
		this.to = to || '';

		if (name) this.name = classify(name);
		if (typeof scroll !== 'undefined') this.scroll = scroll;
		if (typeof focus !== 'undefined') this.focus = focus;

		this.containers = this.parseContainers(rawContainers);

		if (__DEV__) {
			logger?.errorIf(!to, `Every fragment rule must contain a 'to' path`, this);
			logger?.errorIf(!from, `Every fragment rule must contain a 'from' path`, this);
		}

		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
	}

	/**
	 * Parse provided fragment containers
	 */
	parseContainers(rawContainers: string[]): string[] {
		if (!Array.isArray(rawContainers)) {
			if (__DEV__)
				this.logger?.error(`Every fragment rule must contain an array of containers`, this);
			return [];
		}
		// trim selectors
		const containers = rawContainers.map((selector) => selector.trim());
		containers.forEach((selector) => {
			const result = this.validateSelector(selector);
			this.logger?.errorIf(result instanceof Error, result);
		});
		return dedupe(containers);
	}

	/**
	 * Validate a fragment selector
	 *
	 * - only IDs are allowed
	 * - no nested selectors
	 */
	validateSelector(selector: string): true | Error {
		if (!selector.startsWith('#')) {
			return new Error(`fragment selectors must be IDs: ${selector}`);
		}

		if (selector.match(/\s|>/)) {
			return new Error(`fragment selectors must not be nested: ${selector}`);
		}

		if (fragmentIsOutOfBounds(selector, this.swup)) {
			return new Error(
				`${highlight(selector)} is outside of swup's default containers`
			);
		}

		return true;
	}

	/**
	 * Get debug info for logging
	 */
	getDebugInfo() {
		const { from, to, containers } = this;
		return {
			from: String(from),
			to: String(to),
			containers: String(containers)
		};
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route): boolean {
		const { url: fromUrl } = Location.fromUrl(route.from);
		const { url: toUrl } = Location.fromUrl(route.to);

		const matches = !!this.matchesFrom(fromUrl) && !!this.matchesTo(toUrl);
		if (!matches) return false;

		/** Don't match if any of the selectors doesn't match an element */
		const missingFragmentElements = this.containers.filter(
			(selector) => !queryFragmentElement(selector, this.swup)
		);
		if (missingFragmentElements.length) {
			if (__DEV__) {
				missingFragmentElements.forEach((selector) => {
					this.logger?.log(
						// prettier-ignore
						`skipping rule since ${highlight(selector)} didn't match anything:`,
						this.getDebugInfo()
					);
				});
			}
			return false;
		}

		return true;
	}
}
