import type { Path } from 'swup';

/** Represents a route from one to another URL */
export type Route = {
	from: string;
	to: string;
};

/** The interface for an augmented Fragment Element */
export interface FragmentElement extends Element {
	__swupFragment?: {
		url?: string;
		selector?: string;
		modalShown?: boolean;
	};
}

/** A fragment rule */
export type Rule = {
	from: Path;
	to: Path;
	containers: string[];
	name?: string;
	scroll?: boolean | string;
	focus?: boolean | string;
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
