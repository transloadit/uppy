import Core from 'uppy/lib/core';
import Dashboard from 'uppy/lib/plugins/Dashboard';

(() => {
	const uppy = Core();
	uppy.use(Dashboard, {});
})();
