import { describe, expect, it } from 'vitest';
import { getRoute } from '../../src/inc/functions.js';
import Swup from 'swup';

describe('getRoute()', () => {
	it('should get the route from a visit', () => {
		const swup = new Swup();
		const route = { from: '/page-1/', to: '/page-2/' };
		// @ts-expect-error createVisit is protected
		const visit = swup.createVisit(route);
		expect(getRoute(visit)).toEqual(route);
	});

	it('should return undefined for incomplete visits', () => {
		const swup = new Swup();
		// @ts-expect-error createVisit is protected
		const withoutTo = swup.createVisit({ to: '' });
		expect(getRoute(withoutTo)).toEqual(undefined);

		// @ts-expect-error createVisit is protected
		const withoutFrom = swup.createVisit({ from: '', to: '/page-2/' });
		expect(getRoute(withoutFrom)).toEqual(undefined);
	});
});
