import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { getMountedPluginInstance, stubGlobalDocument } from './inc/helpers.js';

const fragmentPlugin = getMountedPluginInstance({
	rules: [
		{
			from: '/page-1/',
			to: '/page-2/',
			containers: ['#fragment-1']
		}
	]
});

describe('getFragmentVisit()', () => {
	beforeEach(() => {
		stubGlobalDocument(/*html*/ `<div id="swup"><div id="fragment-1"></div></div>`);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});
	it('should be callable as public API', () => {
		const fromPlugin = fragmentPlugin.getFragmentVisit({ from: '/page-1/', to: '/page-2/' });
		const fromSwup = fragmentPlugin.swup.getFragmentVisit?.({ from: '/page-1/',to: '/page-2/' }); // prettier-ignore

		expect(fromPlugin).toEqual({
			containers: ['#fragment-1'],
			name: undefined,
			scroll: false,
			focus: undefined
		});

		/** make sure the method exists on swup as well */
		expect(fromPlugin).toEqual(fromSwup);
	});

	it('should return undefined if there is no matching rule', () => {
		const fragmentVisit = fragmentPlugin.getFragmentVisit({ from: '/foo/', to: '/bar/' });

		expect(fragmentVisit).toBeUndefined();
	});
});