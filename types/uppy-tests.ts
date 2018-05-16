import Uppy = require('./');

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
