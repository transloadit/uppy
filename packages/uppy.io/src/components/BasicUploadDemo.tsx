import React, { useState } from 'react';
import {
	UppyContextProvider,
	Dropzone,
	FilesList,
	UploadButton,
} from '@uppy/react';
import { Tus, Uppy } from 'uppy';

import { BrowserWindow } from './BrowserWindow';

import '@uppy/react/dist/styles.css';

export default function BasicUploadDemo() {
	const [uppy] = useState(() =>
		new Uppy().use(Tus, {
			endpoint: 'https://tusd.tusdemo.net/files/',
		}),
	);

	return (
		<BrowserWindow>
			<UppyContextProvider uppy={uppy}>
				<div style={{ padding: '16px' }}>
					<Dropzone />
					<div style={{ marginTop: '16px' }}>
						<FilesList />
					</div>
					<div style={{ marginTop: '16px' }}>
						<UploadButton />
					</div>
				</div>
			</UppyContextProvider>
		</BrowserWindow>
	);
}
