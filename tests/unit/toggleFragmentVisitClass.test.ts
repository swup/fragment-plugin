import { describe, expect, it } from 'vitest';
import { toggleFragmentVisitClass } from '../../src/inc/functions.js';
import { stubGlobalDocument } from './inc/helpers.js';
import Swup from 'swup';
import { FragmentVisit } from '../../src/index.js';

describe('toggleFragmentVisitClass()', () => {
	it('should add a rule\'s name class', () => {
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>`
		);
		const swup = new Swup();
		const fragmentVisit:FragmentVisit = {
			name: 'test',
			containers: ['#fragment-1', '#fragment-2'],
			scroll: false
		}
		toggleFragmentVisitClass(fragmentVisit, true);
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(true);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(true);

		toggleFragmentVisitClass(fragmentVisit, false);
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(false);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(false);
	});
});
