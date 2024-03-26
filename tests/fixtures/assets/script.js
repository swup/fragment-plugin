const rules = [
	{
		from: ['/list/', '/list/filter/:filter'],
		to: ['/list/', '/list/filter/:filter'],
		containers: ['#list'],
		name: 'update-list'
	},
	{
		from: ['/list/', '/list/filter/:filter'],
		to: '/detail/',
		containers: ['#detail'],
		name: 'open-detail'
	},
	{
		from: '/detail/',
		to: ['/list/', '/list/filter/:filter'],
		containers: ['#detail', '#list'],
		name: 'close-detail'
	}
];

const fragmentPlugin = new SwupFragmentPlugin({ rules });

const swup = new Swup({ plugins: [fragmentPlugin] });
window._fragmentPlugin = fragmentPlugin;
window._swup = swup;

const uniqueId = (length = 16) => {
	return parseInt(
		Math.ceil(Math.random() * Date.now())
			.toPrecision(length)
			.toString()
			.replace('.', '')
	);
};

const fragmentContainers = rules.reduce((acc, current) => [...acc, ...current.containers], []);
const allContainers = [...new Set([...swup.options.containers, ...fragmentContainers])];

/**
 * Add a unique id attribute to every provided selector.
 * This will help to identify persisted elements more easily
 */
function addUniqueIds(selectors) {
	selectors.forEach((selector) => {
		document.querySelector(selector)?.setAttribute('data-uniqueid', uniqueId());
	});
}

addUniqueIds(allContainers);
swup.hooks.on('content:replace', ({ containers }) => addUniqueIds(containers));

swup.hooks.on('visit:start', () => document.documentElement.setAttribute('aria-busy', 'true'));
swup.hooks.on('visit:end', () => document.documentElement.removeAttribute('aria-busy'));
