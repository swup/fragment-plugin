const rules = [
	{
		from: ['/list/', '/list/filter/:filter'],
		to: ['/list/', '/list/filter/:filter'],
		containers: ['#list'],
		name: 'update-list'
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
document
	.querySelectorAll('[data-uniqueid]')
	.forEach((el) => el.setAttribute('data-uniqueid', uniqueId()));
