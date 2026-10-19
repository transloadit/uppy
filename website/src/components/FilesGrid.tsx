import React, { useEffect, useState } from 'react';
import { UppyContextProvider, FilesGrid } from '@uppy/react';
import { Uppy } from 'uppy';

import { BrowserWindow } from './BrowserWindow';

import '@uppy/react/css/style.css';

import styles from './files-grid.module.css';

type UploadableFile = Parameters<InstanceType<typeof Uppy>['addFile']>[0];

const fakeFiles = [
	{
		id: '2',
		name: 'how-to-talk-to-cats.pdf',
		type: 'application/pdf',
		size: 1024 * 1024 * 0.5,
		data: new Blob([new ArrayBuffer(1024 * 1024 * 0.5)], {
			type: 'application/pdf',
		}),
		source: 'Local',
		isRemote: false,
	},
	{
		id: '3',
		name: 'tutorial-running-arch-linux-as-a-dog.mp4',
		type: 'video/mp4',
		size: 1024 * 1024 * 23,
		data: new Blob([new ArrayBuffer(1024 * 1024 * 23)], {
			type: 'video/mp4',
		}),
		source: 'Local',
		isRemote: false,
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
] satisfies UploadableFile[];

export default function FilesGridDemo() {
	const [files, setFiles] = useState<UploadableFile[]>([]);
	const [uppy] = useState(() => {
		const uppy = new Uppy();
		return uppy;
	});

	useEffect(() => {
		setFiles(fakeFiles);
	}, [uppy]);

	useEffect(() => {
		files.forEach((file) => uppy.addFile(file));
	}, [files]);

	return (
		<BrowserWindow>
			<UppyContextProvider uppy={uppy}>
				<div className={styles.wrapper}>
					<FilesGrid columns={4} />
				</div>
			</UppyContextProvider>
		</BrowserWindow>
	);
}
