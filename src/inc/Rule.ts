import { matchPath, classify, type Path } from 'swup';
import type { Route } from '../SwupFragmentPlugin.js';
import type { ConsolaInstance } from 'consola';
import { dedupe } from './functions.js';
import Logger from './Logger.js';

/**
 * Represents a Rule
 */
export default class Rule {
	readonly matchesFrom;
	readonly matchesTo;

	from: Path;
	to: Path;
	fragments: string[];
	name?: string;

	constructor(from: Path, to: Path, rawFragments: string[], name?: string, logger?: Logger) {
		this.from = from;
		this.to = to;
		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
		this.fragments = this.parseFragments(rawFragments, logger);
		if (name) this.name = classify(name);
	}

	/**
	 * Converts any provided fragments option into an array of fragment objects
	 */
	parseFragments(rawFragments: string[], logger?: Logger): string[] {
		// trim selectors
		const fragments = rawFragments.map((selector) => selector.trim());
		fragments.forEach((selector) => {
			const result = this.validateSelector(selector);
			if (result instanceof Error) logger?.error(result);
		});
		return dedupe(fragments);
	}

	/**
	 * Validate a fragment selector
	 *
	 * - only IDs are allowed
	 * - no nested selectors
	 */
	validateSelector(selector: string): true | Error {
		if (!selector.startsWith('#'))
			return new Error(`fragment selectors must be IDs: ${selector}`);
		if (selector.match(/\s|>/))
			return new Error(`fragment selectors must not be nested: ${selector}`);
		return true;
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
