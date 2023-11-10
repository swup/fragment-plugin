import Swup from 'swup';
import SwupFragmentPlugin from '@swup/fragment-plugin';

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
