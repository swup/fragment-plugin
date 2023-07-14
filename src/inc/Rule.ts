import { matchPath, classify, type Path } from 'swup';
import type { Route, Fragment } from '../SwupFragmentPlugin.js';
/**
 * Represents a Rule
 */
export default class Rule {
	readonly matchesFrom;
	readonly matchesTo;

	from: Path;
	to: Path;
	fragments: Fragment[];
	name?: string;

	constructor(
		from: Path,
		to: Path,
		fragments: (string | Fragment)[],
		name?: string
	) {
		this.from = from;
		this.to = to;
		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
		this.fragments = this.parseFragments(fragments);
		if (name) this.name = classify(name);
	}

	/**
	 * Converts any provided fragments option into an array of fragment objects
	 */
	parseFragments(providedFragments: (string | Fragment)[]): Fragment[] {
		// ensure ojects
		const fragments = providedFragments.map((fragment) => {
			return typeof fragment === 'string' ? { selector: fragment } : fragment;
		});

		// Sanitize values
		fragments.forEach((fragment) => {
			fragment.selector = fragment.selector.trim();
			if (fragment.appendTo) fragment.appendTo = fragment.appendTo.trim();
		});

		/**
		 * Remove duplicates
		 * @see https://stackoverflow.com/a/67322087/586823
		 */
		const unique = fragments.filter(
			(fragment, index) =>
				fragments.findIndex((f) => fragment.selector === f.selector) === index
		);

		return unique;
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
