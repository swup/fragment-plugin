import { matchPath, type Path } from 'swup';
import type { Route } from '../SwupFragmentPlugin.js';

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
		public name: string | undefined = 'fragment'
	) {
		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
		this.fragments = this.fragments.map((selector) => selector.trim());
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
