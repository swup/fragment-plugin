import FragmentPlugin from './SwupFragmentPlugin.js';
export default FragmentPlugin;
import type { getFragmentVisit } from './inc/functions.js';
import type { Route, FragmentVisit } from './inc/defs.js';
export type { Options, Rule, FragmentElement, FragmentVisit } from './inc/defs.js';

declare module 'swup' {
	export interface Swup {
		getFragmentVisit?: (route: Route) => ReturnType<typeof getFragmentVisit>;
	}
	export interface Visit {
		fragmentVisit?: FragmentVisit;
	}
	export interface CacheData {
		fragmentHtml?: string;
	}
}
