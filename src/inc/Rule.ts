import { matchPath, classify, type Path } from 'swup';
import type { Route } from '../SwupFragmentPlugin.js';
import { uniqueArray } from './functions.js';
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

	constructor(from: Path, to: Path, rawFragments: string[], name?: string) {
		this.from = from;
		this.to = to;
		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
		this.fragments = this.parseFragments(rawFragments);
		if (name) this.name = classify(name);
	}

	/**
	 * Converts any provided fragments option into an array of fragment objects
	 */
	parseFragments(rawFragments: string[]): string[] {
		// trim selectors
		const fragments = rawFragments.map((selector) => selector.trim());
		/**
		 * Remove duplicates
		 * @see https://stackoverflow.com/a/67322087/586823
		 */
		return uniqueArray(fragments);
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
