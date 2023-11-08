import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getMountedPluginInstance, spyOnConsole } from './inc/helpers.js';

const defaultRule = {
	from: '/page-1/',
	to: '/page-2/',
	containers: ['#default']
};
const fragmentPlugin = getMountedPluginInstance({
	rules: [defaultRule]
});
const { swup } = fragmentPlugin;

describe('modify fragment rules', () => {
	beforeEach(() => {
		spyOnConsole();
		/** Reset the rules */
		fragmentPlugin.setRules([defaultRule]);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return unparsed raw rules', () => {
		expect(fragmentPlugin.getRules()).toEqual([defaultRule]);
	});

	it('should provide API methods on the swup instance', () => {
		expect(swup.getFragmentRules).toBeTypeOf('function');
		expect(swup.setFragmentRules).toBeTypeOf('function');
		expect(swup.prependFragmentRule).toBeTypeOf('function');
		expect(swup.appendFragmentRule).toBeTypeOf('function');
	});

	it('should provide access to prependRule() and appendRule()', () => {
		const prependRule = {
			from: '/corge/',
			to: '/grault/',
			containers: ['#corgegrault']
		};
		const appendRule = {
			from: '/garply/',
			to: '/waldo/',
			containers: ['#garplywaldo']
		};

		swup.prependFragmentRule?.(prependRule);
		swup.appendFragmentRule?.(appendRule);

		expect(swup.getFragmentRules?.()).toEqual([prependRule, defaultRule, appendRule]);
	});

	it('should provide access to getRules() and setRules()', () => {
		/** Add a rule using the plugin's API, *after* the existing rules */
		const appendRule = {
			from: '/foo/',
			to: '/bar/',
			containers: ['#foobar'],
			name: 'from-plugin'
		};
		fragmentPlugin.setRules([...fragmentPlugin.getRules(), appendRule]);

		/** Add a rule using swup's API, *before* the existing rules */
		const prependRule = {
			from: '/baz/',
			to: '/bat/',
			containers: ['#bazbat'],
			name: 'from-swup'
		};
		swup.setFragmentRules?.([prependRule, ...(swup.getFragmentRules?.() || [])]);

		expect(swup.getFragmentRules?.()).toEqual([prependRule, defaultRule, appendRule]);
	});

	it('should remove rules', () => {
		swup.appendFragmentRule?.({
			from: '/foo/',
			to: '/bar/',
			containers: ['#foobar'],
			name: 'remove-me'
		});
		const rules = swup.getFragmentRules?.() || [];
		swup.setFragmentRules?.(rules.filter((rule) => rule.name !== 'remove-me'));
		expect(swup.getFragmentRules?.()).toEqual([defaultRule]);
	});
});
