const rules = [
	{
		from: ['/list/', '/list/filter/:filter'],
		to: ['/list/', '/list/filter/:filter'],
		containers: ['#list'],
		name: 'update-list'
	}
];
const swup = new Swup({
	plugins: [new SwupFragmentPlugin({ rules })]
});
window._swup = swup;

// swup.hooks.on('visit:start', async (visit) => {
// 	console.log(visit);
// });
