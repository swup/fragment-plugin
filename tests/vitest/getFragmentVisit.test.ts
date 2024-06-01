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
		stubGlobalDocument(
			/*html*/ `<div id="swup" class="transition-main"><div id="fragment-1"></div></div>`
		);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});
	it('should be callable as public API', () => {
		const fragmentVisit = fragmentPlugin.getFragmentVisit({ from: '/page-1/', to: '/page-2/' });

		expect(fragmentVisit).toEqual({
			containers: ['#fragment-1'],
			name: undefined,
			scroll: false,
			focus: undefined
		});
	});

	it('should return undefined if there is no matching rule', () => {
		const fragmentVisit = fragmentPlugin.getFragmentVisit({ from: '/foo/', to: '/bar/' });

		expect(fragmentVisit).toBeUndefined();
	});
});
