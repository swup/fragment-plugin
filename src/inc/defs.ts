import type { Path, Visit } from 'swup';

/** Represents a route from one to another URL */
export type Route = {
	from: string;
	to: string;
};

/** The interface for an augmented Fragment Element */
export interface FragmentElement extends HTMLElement {
	__swupFragment?: {
		url?: string;
		selector?: string;
		modalShown?: boolean;
	};
}

export type RulePredicate = (visit: Visit) => boolean;

/** A fragment rule */
export type Rule = {
	from: Path;
	to: Path;
	containers: string[];
	name?: string;
	scroll?: boolean | string;
	focus?: boolean | string;
	if?: RulePredicate;
};

/** The plugin options */
export type Options = {
	rules: Rule[];
	debug: boolean;
};

/** A fragment visit object */
export type FragmentVisit = {
	name?: string;
	containers: string[];
	scroll: boolean | string;
	focus?: boolean | string;
};
