import type { Context as SwupContext } from 'swup';
import SwupFragmentPlugin from '../SwupFragmentPlugin.js';
import SwupModalOrigin from './SwupModalOrigin.js';

/**
 * Handle fragments marked with [data-swup-fragment-modal]
 */
export function handleModals(fragmentPlugin: SwupFragmentPlugin): void {
	document
		.querySelectorAll('[data-swup-fragment-modal][data-swup-fragment-selector]')
		.forEach((el) => {
			createModal(el, fragmentPlugin);
		});
}

/**
 * Creates a modal
 *
 * - moves the element to the root (body) of the document
 * - injects an origin for the modal, so that we can pull it back in later right before the next `content:replace`
 */
export const createModal = (el: Element, { logger }: SwupFragmentPlugin): void => {
	// Bail early if the fragment isn't a modal
	if (!el.matches('[data-swup-fragment-modal]')) return;

	// Remove the attribute to avoid duplicate initialization
	el.removeAttribute('data-swup-fragment-modal');

	// Get the selector
	const selector = el.getAttribute('data-swup-fragment-selector')!;

	// Create the origin
	const origin = document.createElement('swup-modal-origin') as SwupModalOrigin;
	origin.logger = logger;
	origin.modal = selector;
	el.before(origin);

	// Move the element to the <body>
	document.body.prepend(el);
};

/**
 * Pull modals back to their origins
 */
export const cleanupModals = (context: SwupContext): void => {
	const containers = context.containers;

	document.querySelectorAll<SwupModalOrigin>('swup-modal-origin').forEach((origin) => {

		// We only want to clean-up the modal, if it will be replaced during this visit
		const doCleanup = containers.some((containerSelector) => {
			if (containerSelector === origin.modal) return true;
			if (origin.closest(containerSelector)) return true;
			return false;
		});

		if (!doCleanup) return;

		const modal = document.querySelector(origin.modal);
		if (!modal) return;

		origin.replaceWith(modal);
	});
};
