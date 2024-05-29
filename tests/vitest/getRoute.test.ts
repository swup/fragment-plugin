import { describe, expect, it } from 'vitest';
import { getRoute, stubVisit } from '../../src/inc/functions.js';
import Swup from 'swup';

describe('getRoute()', () => {
	it('should get the route from a visit', () => {
		const route = { from: '/page-1/', to: '/page-2/' };
		const visit = stubVisit(route);
		expect(getRoute(visit)).toEqual(route);
	});

	it('should return undefined for incomplete visits', () => {
		const withEmptyTo = stubVisit({ to: '' });
		expect(getRoute(withEmptyTo)).toEqual(undefined);

		const withEmptyFrom = stubVisit({ from: '', to: '/page-2/' });
		expect(getRoute(withEmptyFrom)).toEqual(undefined);
	});
});
