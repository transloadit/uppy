import Uppy = require('uppy');

(() => {
	const uppy = Uppy.Core({ autoProceed: false });
	uppy.use(Uppy.Dashboard, { trigger: '#up_load_file_01' });
	uppy.use(Uppy.DragDrop, { target: '#ttt' });
	uppy.use(Uppy.XHRUpload, {
		bundle: true,
		endpoint: 'xxx',
		fieldName: 'up_load_file'
	});
	uppy.run();
	uppy.on('upload-success', (fileCount, body, uploadurl) => {
		console.log(fileCount, body, uploadurl, ` files uploaded`);
	});
})();

(() => {
	const uppy = Uppy.Core({ autoProceed: false })
		.use(Uppy.Dashboard, { trigger: '#select-files' })
		.use(Uppy.GoogleDrive, { target: Uppy.Dashboard, serverUrl: 'https://server.uppy.io' })
		.use(Uppy.Instagram, { target: Uppy.Dashboard, serverUrl: 'https://server.uppy.io' })
		.use(Uppy.Webcam, { target: Uppy.Dashboard })
		.use(Uppy.Tus, { endpoint: 'https://master.tus.io/files/' })
		.run()
		.on('complete', (result) => {
			console.log('Upload result:', result);
		});
})();

(() => {
	const uppy = Uppy.Core();
	uppy.use(Uppy.DragDrop, { target: '.UppyDragDrop' });
	uppy.use(Uppy.Tus, { endpoint: '//master.tus.io/files/' });
	uppy.run();
})();
