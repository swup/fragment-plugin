import { describe, expect, it } from 'vitest';
import { toggleFragmentVisitClass } from '../../src/inc/functions.js';
import { stubGlobalDocument } from './inc/helpers.js';
import { FragmentVisit } from '../../src/index.js';

describe('toggleFragmentVisitClass()', () => {
	it("should toggle a fragment visit's name on the classList of all fragment elements", () => {
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>`);

		const fragmentVisit: FragmentVisit = {
			name: 'test',
			containers: ['#fragment-1', '#fragment-2'],
			scroll: false
		};

		toggleFragmentVisitClass(fragmentVisit, true);
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(true);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(true);

		toggleFragmentVisitClass(fragmentVisit, false);
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(false);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(false);
	});

	it("should't add classes if the current fragment visit doesn't have a `name`", () => {
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
			</div>`);

		const fragmentVisit: FragmentVisit = {
			containers: ['#fragment-1', '#fragment-2'],
			scroll: false
		};

		toggleFragmentVisitClass(fragmentVisit, true);
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(false);
	});
});
