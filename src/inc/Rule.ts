import { matchPath, type Path } from './matchPath.js';
import type { Route } from './FragmentPlugin.js';

export type { Path };

/**
 * Represents a Rule
 */
export default class Rule {

	protected matchesFrom;
	protected matchesTo;

	constructor(
		public from: Path,
		public to: Path,
		public fragments: string[],
		public name: string | undefined
	) {
		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
		this.fragments = fragments.map((selector) => selector.trim());
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
