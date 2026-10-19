import React, { useState } from 'react';
import {
	UppyContextProvider,
	UploadButton as UppyUploadButton,
	useFileInput,
} from '@uppy/react';
import { Tus, Uppy } from 'uppy';

import { BrowserWindow } from './BrowserWindow';

import '@uppy/react/css/style.css';

import styles from './button.module.css';

function FileInput() {
	const { getInputProps, getButtonProps } = useFileInput();
	return (
		<div style={{ margin: '1rem 0' }}>
			<input style={{ display: 'none' }} {...getInputProps()} />
			<button {...getButtonProps()}>Add files</button>
		</div>
	);
}

export default function UploadButton() {
	const [uppy] = useState(() =>
		new Uppy().use(Tus, {
			endpoint: 'https://tusd.tusdemo.net/files/',
		}),
	);

	return (
		<BrowserWindow>
			<UppyContextProvider uppy={uppy}>
				<div className={styles.wrapper}>
					<FileInput />
					<UppyUploadButton />
				</div>
			</UppyContextProvider>
		</BrowserWindow>
	);
}
