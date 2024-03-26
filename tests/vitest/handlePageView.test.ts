import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMountedPluginInstance, spyOnConsole, stubGlobalDocument } from './inc/helpers.js';
import { handlePageView } from '../../src/inc/functions.js';
import type { FragmentElement } from '../../src/index.js';

const fragmentPlugin = getMountedPluginInstance({
	rules: [
		{
			from: '(.*)',
			to: '(.*)',
			containers: ['#fragment-1', '#fragment-2']
		}
	]
});

describe('handlePageView()', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});
	it('should prepare fragment elements', () => {
		const url = '/page/?foo=bar';
		stubGlobalDocument(
			/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const [fragment1, fragment2] = document.querySelectorAll<FragmentElement>('[data-swup-fragment]'); // prettier-ignore

		expect(fragment1?.__swupFragment).toEqual({ url, selector: '#fragment-1' });
		expect(fragment2?.__swupFragment).toEqual({ url, selector: '#fragment-2' });
	});

	it('should handle user-provided data attributes', () => {
		const console = spyOnConsole();
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1" data-swup-fragment-url="/fragment-url/"></div>
				<a data-swup-link-to-fragment="#fragment-1"></a>
			</div>`);

		handlePageView(fragmentPlugin);

		const link = document.querySelector<HTMLAnchorElement>(`a[data-swup-link-to-fragment]`)!;

		expect(console.log).toBeCalledWith(`fragment url /fragment-url/ for #fragment-1 provided by server`); // prettier-ignore
		expect(link.pathname).toEqual('/fragment-url/');
	});

	it('should handle <dialog> fragment elements', () => {
		stubGlobalDocument(
			/*html*/ `<div id="swup" class="transition-main"><dialog open id="fragment-1"></div></div>`
		);
		handlePageView(fragmentPlugin);

		const dialog = document.querySelector<HTMLDialogElement & FragmentElement>('#fragment-1');
		expect(dialog?.__swupFragment?.modalShown).toEqual(true);
	});

	it("should ignore fragments outside of swup's main containers", () => {
		stubGlobalDocument(
			/*html*/ `<div id="swup" class="transition-main"></div><div id="fragment-1"></div>`
		);
		handlePageView(fragmentPlugin);

		const el = document.querySelector('#fragment-1');
		expect(el?.hasAttribute('data-swup-fragment')).toEqual(false);
	});
});
