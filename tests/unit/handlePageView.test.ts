import { describe, expect, it, vi } from 'vitest';
import { getPluginInstance, stubGlobalDocument } from './inc/helpers.js';
import { handlePageView } from '../../src/inc/functions.js';
import type { FragmentElement } from '../../src/index.js';

describe('handlePageView()', () => {
	it('should prepare fragment elements', () => {
		const url = '/page/?foo=bar';
		const containers = ['#fragment-1', '#fragment-2'];
		const fragmentPlugin = getPluginInstance({
			rules: [
				{
					from: '(.*)',
					to: '(.*)',
					containers
				}
			]
		});
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const fragments = [...document.querySelectorAll<FragmentElement>('[data-swup-fragment]')];

		expect(fragments).not.to.be.empty;

		fragments.forEach((fragment, index) => {
			expect(fragment.hasAttribute('data-swup-fragment')).toBe(true);
			expect(fragment.__swupFragment).toEqual({ url, selector: containers[index] });
		});
	});

	it('should handle user-provided data attributes', () => {
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

		expect(console.log).toBeCalledWith(
			`fragment url /other-url/ for #fragment-1 provided by server`
		);

		expect(link.pathname).toEqual('/other-url/');
	});

	it('should handle <dialog> fragment elements', () => {
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
				<dialog open id="fragment-1"></div>
			</div>`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const fragment = document.querySelector<HTMLDialogElement & FragmentElement>(`#fragment-1`);
		expect(fragment?.__swupFragment?.modalShown).toEqual(true);
	});

	it("should ignore fragments outside of swup's main containers", () => {
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
			<div id="fragment-1"></div>
			<div id="swup"></div>
			`,
			{ url }
		);
		handlePageView(fragmentPlugin);

		const el = document.querySelector('#fragment-1');
		expect(el).toBeTruthy();
		expect(el!.hasAttribute('data-swup-fragment')).toEqual(false);
	});
});
