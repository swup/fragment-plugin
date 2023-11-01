import { describe, expect, it } from 'vitest';
import { getPluginInstance, stubGlobalDocument } from './inc/helpers.js';
import { handlePageView } from '../../src/inc/functions.js';
import type { FragmentElement } from '../../src/index.js';

describe('handlePageView()', () => {
	it('should prepare fragment elements', () => {
		const url = '/page/?foo=bar';
		const fragmentPlugin = getPluginInstance({
			rules: [
				{
					from: '(.*)',
					to: '(.*)',
					containers: ['#fragment-1', '#fragment-2']
				}
			]
		});
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1"></div>
				<div id="fragment-2" data-swup-fragment-url="/provided/"></div>
			</div>`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const [fragment1, fragment2] = [...document.querySelectorAll<FragmentElement>('[data-swup-fragment]')];

		expect(fragment1).toBeDefined();
		expect(fragment2).toBeDefined();

		expect(fragment1.hasAttribute('data-swup-fragment')).toBe(true);
		expect(fragment2.hasAttribute('data-swup-fragment')).toBe(true);

		expect(fragment1.__swupFragment).toEqual({
			url,
			selector: '#fragment-1'
		});

		expect(fragment2.__swupFragment).toEqual({
			url: '/provided/',
			selector: '#fragment-2'
		});
	});

	it('should handle links to fragments', () => {
		const url = '/';
		const fragmentPlugin = getPluginInstance({
			rules: [
				{
					from: '(.*)',
					to: '(.*)',
					containers: ['#fragment-1']
				}
			]
		});
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1" data-swup-fragment-url="/other-url/"></div>
				<a data-swup-link-to-fragment="#fragment-1"></a>
			</div>`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const link = document.querySelector<HTMLAnchorElement>(`a[data-swup-link-to-fragment]`)!;

		expect(link.pathname).toEqual('/other-url/');
	})
});
