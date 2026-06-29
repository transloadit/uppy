import React, { useEffect, useState } from 'react';
import { UppyContextProvider, Thumbnail, useUppyState } from '@uppy/react';
import { Uppy } from 'uppy';

import { BrowserWindow } from './BrowserWindow';

import '@uppy/react/css/style.css';

import styles from './thumbnail.module.css';

export default function ThumbnailDemo() {
	const [uppy] = useState(() => new Uppy());
	const files = useUppyState(uppy, (state) => Object.values(state.files));

	useEffect(() => {
		// Add fake image file
		const imageFile = {
			id: 'fake-image-1',
			name: 'sample-image.jpg',
			type: 'image/jpeg',
			size: 12345,
			data: new Blob(['fake image data'], { type: 'image/jpeg' }),
			source: 'Local',
			isRemote: false,
		};

		// Add fake PDF file
		const pdfFile = {
			id: 'fake-pdf-1',
			name: 'document.pdf',
			type: 'application/pdf',
			size: 54321,
			data: new Blob(['fake pdf data'], { type: 'application/pdf' }),
			source: 'Local',
			isRemote: false,
		};

		uppy.addFile(imageFile);
		uppy.addFile(pdfFile);
	}, [uppy]);

	return (
		<BrowserWindow>
			<UppyContextProvider uppy={uppy}>
				<div className={styles.wrapper}>
					{files.map((file) => (
						<div key={file.id}>
							<Thumbnail file={file} images={false} />
							<p>{file.type}</p>
						</div>
					))}
				</div>
			</UppyContextProvider>
		</BrowserWindow>
	);
}
