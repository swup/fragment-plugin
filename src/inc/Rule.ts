import { matchPath, classify, type Path } from 'swup';
import type { Route, Fragment, FragmentOptions } from '../SwupFragmentPlugin.js';
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
		fragmentOptions: FragmentOptions[],
		name?: string
	) {
		this.from = from;
		this.to = to;
		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
		this.fragments = this.parseFragmentOptions(fragmentOptions);
		if (name) this.name = classify(name);
	}

	/**
	 * Converts any provided fragments option into an array of fragment objects
	 */
	parseFragmentOptions(fragmentOptions: FragmentOptions[]): Fragment[] {
		// Ensure ojects
		const objects = fragmentOptions.map((option) => {
			return typeof option === 'string' ? { selector: option } : option;
		});

		// Mixin defaults
		const defaults: Fragment = {
			selector: '',
			teleport: false
		}
		const fragments = objects.map((fragment) => {
			return {
				...defaults,
				...fragment
			}
		})

		// Sanitize values
		fragments.forEach((fragment) => {
			fragment.selector = fragment.selector.trim();
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
