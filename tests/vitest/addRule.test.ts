import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
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

describe('addRule()', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should be callable as public API', () => {
		fragmentPlugin.addRule(
			{ from: '/page-3/', to: '/page-4/', containers: ['#fragment-2'] },
			'start'
		);
		fragmentPlugin.swup.addRule?.(
			{ from: '/page-5/', to: '/page-6/', containers: ['#fragment-3'] },
			'end'
		);

		expect(fragmentPlugin.rules).toMatchObject([
			{
				from: '/page-3/',
				to: '/page-4/',
				containers: ['#fragment-2']
			},
			{
				from: '/page-1/',
				to: '/page-2/',
				containers: ['#fragment-1']
			},
			{
				from: '/page-5/',
				to: '/page-6/',
				containers: ['#fragment-3']
			}
		]);
	});

	it.only('should throw if adding a rule with an invalid "at" argument', () => {
		const console = spyOnConsole();
		// @ts-expect-error
		fragmentPlugin.addRule({ from: '/foo/', to: '/bar/', containers: ['#test'] }, 'high');

		expect(console.error).toBeCalledWith(new Error(`addRule(rule, at): 'at' must either be 'start' or 'end'`)); // prettier-ignore
	});
});
