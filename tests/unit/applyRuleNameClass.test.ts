import { describe, expect, it } from 'vitest';
import { applyRuleNameClass } from '../../src/inc/functions.js';
import { stubGlobalDocument } from './inc/helpers.js';
import Swup from 'swup';

describe('applyRuleNameClass()', () => {
	it('should add a rule\'s name class', () => {
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>`
		);
		const swup = new Swup();
		// @ts-expect-error createVisit is protected
		const visit = swup.createVisit({});
		visit.fragmentVisit = {
			name: 'test',
			containers: ['#fragment-1', '#fragment-2'],
			scroll: false
		}
		applyRuleNameClass(visit, 'add');
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(true);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(true);

		applyRuleNameClass(visit, 'remove');
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(false);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(false);
	});
});
