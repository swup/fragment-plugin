import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { getMountedPluginInstance, stubGlobalDocument, spyOnConsole } from './inc/helpers.js';
import { getFragmentVisitContainers, handlePageView } from '../../src/inc/functions.js';

const fragmentPlugin = getMountedPluginInstance({
	rules: [
		{
			from: '(.*)',
			to: '(.*)',
			containers: ['#fragment-1', '#fragment-2', '#fragment-3']
		}
	]
});

describe('getFragmentVisitContainers()', () => {
	beforeEach(() => {
		spyOnConsole();
		stubGlobalDocument(
			/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
				<div id="fragment-3" data-swup-fragment-url="/page-2/"></div>
			</div>
			<div id="fragment-outside"></div>`,
			{ url: '/page-1/' }
		);
		handlePageView(fragmentPlugin);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should get the correct containers for a fragment visit', () => {
		const console = spyOnConsole();

		const fragmentContainers = getFragmentVisitContainers(
			{ from: '/page-1/', to: '/page-2/' },
			['#fragment-1', '#fragment-2', '#fragment-3', '#fragment-outside', '#fragment-missing'],
			fragmentPlugin.swup,
			fragmentPlugin.logger
		);

		expect(fragmentContainers).toEqual(['#fragment-1', '#fragment-2']);
		expect(console.log).toBeCalledWith(`ignoring fragment #fragment-3 as it already matches the current URL`); // prettier-ignore
		expect(console.log).toBeCalledWith(`#fragment-missing missing in current document`);
		expect(console.error).toBeCalledWith(`#fragment-outside is outside of swup's default containers`); // prettier-ignore
	});

	it('should get the correct containers when navigating to the same URL', () => {
		const fragmentContainers = getFragmentVisitContainers(
			{ from: '/page-1/', to: '/page-1/' },
			['#fragment-1', '#fragment-2', '#fragment-3', '#fragment-outside', '#fragment-missing'],
			fragmentPlugin.swup,
			fragmentPlugin.logger
		);

		expect(fragmentContainers).toEqual(['#fragment-1', '#fragment-2', '#fragment-3']);
	});
});
