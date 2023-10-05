import FragmentPlugin from './SwupFragmentPlugin.js';
export default FragmentPlugin;
import type { Route, FragmentVisit } from './inc/defs.js';
export type { Options, Rule, FragmentElement, FragmentVisit } from './inc/defs.js';

declare module 'swup' {
	export interface Swup {
		getFragmentVisit?: (route: Route) => FragmentVisit | undefined;
	}
	export interface Visit {
		fragmentVisit?: FragmentVisit;
	}
	export interface CacheData {
		fragmentHtml?: string;
	}
}
