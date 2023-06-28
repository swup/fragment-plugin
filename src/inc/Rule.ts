import { matchPath, Path } from './matchPath.js';
import type { Route } from './FragmentPlugin.js';
export type { Path };

/**
 * Represents a Rule
 */
export default class Rule {
	fragments: string[] = [];
	name: string | undefined;

	matchesFrom;
	matchesTo;

	constructor(from: Path, to: Path, fragments: string[], name: string | undefined) {
		this.name = name;

		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);

		this.fragments = fragments.map((selector) => selector.trim());
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
