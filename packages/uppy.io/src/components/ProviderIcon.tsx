import React, { useState } from 'react';
import { UppyContextProvider, ProviderIcon } from '@uppy/react';
import { Uppy } from 'uppy';

import { BrowserWindow } from './BrowserWindow';

import '@uppy/react/css/style.css';

import styles from './provider-icon.module.css';

export default function ProviderIconDemo() {
	const [uppy] = useState(() => new Uppy());

	const providers = [
		{ id: 'device', name: 'Device' },
		{ id: 'camera', name: 'Camera' },
		{ id: 'screen-capture', name: 'Screen Capture' },
		{ id: 'audio', name: 'Audio' },
		{ id: 'dropbox', name: 'Dropbox' },
		{ id: 'facebook', name: 'Facebook' },
		{ id: 'instagram', name: 'Instagram' },
		{ id: 'onedrive', name: 'OneDrive' },
		{ id: 'googlephotos', name: 'Google Photos' },
		{ id: 'googledrive', name: 'Google Drive' },
	] as const;

	return (
		<BrowserWindow>
			<UppyContextProvider uppy={uppy}>
				<div className={styles.wrapper}>
					{providers.map((provider) => (
						<div key={provider.id} className={styles.iconContainer}>
							<ProviderIcon provider={provider.id} />
							<p className={styles.providerName}>{provider.name}</p>
						</div>
					))}
				</div>
			</UppyContextProvider>
		</BrowserWindow>
	);
}
