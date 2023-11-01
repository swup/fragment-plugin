import { describe, expect, it, vi } from 'vitest';
import { getPluginInstance, stubGlobalDocument } from './inc/helpers.js';
import { getFragmentVisitContainers, handlePageView } from '../../src/inc/functions.js';
import type { FragmentElement } from '../../src/index.js';

describe('getFragmentVisitContainers()', () => {
	it('should get the right fragments', () => {
		const url = '/page-1/';
		const fragmentPlugin = getPluginInstance({
			rules: [
				{
					from: '(.*)',
					to: '(.*)',
					containers: ['#fragment-1', '#fragment-2', '#fragment-3']
				}
			]
		});
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
				<div id="fragment-3" data-swup-fragment-url="/page-2/"></div>
			</div>
			<div id="fragment-outside"></div>`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const f = document.querySelector<FragmentElement>('#fragment-3')!;
		console.log(f.__swupFragment);

		const visitContainers = getFragmentVisitContainers(
			{ from: '/page-1/', to: '/page-2/' },
			['#fragment-1', '#fragment-2', '#fragment-3', '#fragment-outside', '#fragment-missing'],
			fragmentPlugin.swup,
			fragmentPlugin.logger
		);

		expect(visitContainers).toEqual(['#fragment-1', '#fragment-2']);

		expect(console.log).toBeCalledWith(`#fragment-missing missing in current document`);
		// prettier-ignore
		expect(console.error).toBeCalledWith(`#fragment-outside is outside of swup's default containers`);
		// prettier-ignore
		expect(console.log).toBeCalledWith(`ignoring fragment #fragment-3 as it already matches the current URL`);

		const visitContainersIsReload = getFragmentVisitContainers(
			{ from: '/page-1/', to: '/page-1/' },
			['#fragment-1', '#fragment-2', '#fragment-3', '#fragment-outside', '#fragment-missing'],
			fragmentPlugin.swup,
			fragmentPlugin.logger
		);
		expect(visitContainersIsReload).toEqual(['#fragment-1', '#fragment-2', '#fragment-3']);
	});
});
