import { describe, expect, it, vi, afterEach } from 'vitest';
import { getMountedPluginInstance, spyOnConsole } from './inc/helpers.js';

const fragmentPlugin = getMountedPluginInstance({
	rules: [
		{
			from: '/page-1/',
			to: '/page-2/',
			containers: ['#fragment-1']
		}
	]
});

describe('get and set fragment rules', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return raw rules', () => {
		expect(fragmentPlugin.getRules()).toEqual([
			{
				from: '/page-1/',
				to: '/page-2/',
				containers: ['#fragment-1']
			}
		]);
	});

	it('should be possible to modify rules at runtime', () => {
		const console = spyOnConsole();
		const { swup } = fragmentPlugin;

		/** Add a rule using the plugin's API, *after* the existing rules */
		fragmentPlugin.setRules([
			...fragmentPlugin.getRules(),
			{
				from: '/foo/',
				to: '/bar/',
				containers: ['#fragment-1'],
				name: 'from-plugin'
			}
		]);

		/** Add a rule using swup's API, *before* the existing rules */
		swup.setFragmentRules?.([
			{
				from: '/foo/',
				to: '/bar/',
				containers: ['#fragment-1'],
				name: 'from-swup'
			},
			...swup.getFragmentRules?.() || [],
		]);

		const fromPlugin = fragmentPlugin.getRules();
		const fromSwup = swup.getFragmentRules?.();

		/** make sure the method exists on swup as well */
		expect(fromPlugin).toEqual(fromSwup);

		expect(fromPlugin).toEqual([
			{
				from: '/foo/',
				to: '/bar/',
				containers: ['#fragment-1'],
				name: 'from-swup'
			},
			{
				from: '/page-1/',
				to: '/page-2/',
				containers: ['#fragment-1']
			},
			{
				from: '/foo/',
				to: '/bar/',
				containers: ['#fragment-1'],
				name: 'from-plugin'
			}
		]);
	});
});
