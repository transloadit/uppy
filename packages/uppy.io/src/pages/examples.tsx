import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { useLocalStorage } from '@uidotdev/usehooks';

import Layout from '@theme/Layout';
import Admonition from '@theme/Admonition';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Dashboard from '@uppy/react/dashboard';
import {
	Audio,
	Box,
	Dropbox,
	GoogleDrive,
	GoogleDrivePicker,
	GooglePhotosPicker,
	GoldenRetriever,
	ImageEditor,
	Instagram,
	OneDrive,
	ScreenCapture,
	Tus,
	Unsplash,
	Uppy as UppyCore,
	Url,
	Webcam,
	Zoom,
} from 'uppy';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import locales from '../locales.js';

import 'uppy/dist/uppy.min.css';

import styles from './examples.module.css';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

const restrictions = {
	maxFileSize: 1000000,
	maxNumberOfFiles: 3,
	minNumberOfFiles: 2,
	allowedFileTypes: ['image/*', 'video/*'],
	requiredMetaFields: ['caption'],
};

type Action = { type: string; checked?: boolean; value: string };
type State = {
	small: boolean;
	restrictions?: typeof restrictions;
	disabled: boolean;
	theme: string;
	// theme: 'light' | 'dark' | 'auto';
	plugins: string[];
};

const initialState: State = {
	small: false,
	restrictions: null,
	disabled: false,
	theme: 'light',
	plugins: [
		'Webcam',
		'GoogleDrivePicker',
		'GooglePhotosPicker',
		'Dropbox',
		'Url',
		'OneDrive',
		'Unsplash',
		'Box',
		'ImageEditor',
	],
};

function reducer(state: State, action: Action) {
	switch (action.type) {
		case 'small':
			return { ...state, small: action.checked };
		case 'theme':
			return { ...state, theme: action.checked ? 'dark' : 'light' };
		case 'disabled':
			return { ...state, disabled: action.checked };
		case 'restrictions':
			return {
				...state,
				restrictions: action.checked ? restrictions : undefined,
			};
		case 'plugins':
			if (action.checked) {
				return { ...state, plugins: [...state.plugins, action.value] };
			}
			return {
				...state,
				plugins: state.plugins.filter((p) => p !== action.value),
			};
		default:
			return state;
	}
}

const options = [
	{
		heading: 'Remote sources',
		options: [
			// {
			// 	label: 'Google Drive',
			// 	value: 'GoogleDrive',
			// 	type: 'plugins',
			// 	title:
			// 		'Temporarily disabled until our credentials are approved again. You can still use the plugin yourself.',
			// 	disabled: true,
			// },
			{
				label: 'Google Drive Picker',
				value: 'GoogleDrivePicker',
				type: 'plugins',
			},
			{
				label: 'Google Photos Picker',
				value: 'GooglePhotosPicker',
				type: 'plugins',
			},
			{
				label: 'Dropbox',
				value: 'Dropbox',
				type: 'plugins',
			},
			{
				label: 'Instagram',
				value: 'Instagram',
				type: 'plugins',
				title:
					'Temporarily disabled until our credentials are approved again. You can still use the plugin yourself.',
				disabled: true,
			},
			{ label: 'Url', value: 'Url', type: 'plugins' },
			{
				label: 'OneDrive',
				value: 'OneDrive',
				type: 'plugins',
			},
			{
				label: 'Unsplash',
				value: 'Unsplash',
				type: 'plugins',
			},
			{ label: 'Box', value: 'Box', type: 'plugins' },
			{ label: 'Zoom', value: 'Zoom', type: 'plugins' },
		],
	},
	{
		heading: 'Local sources',
		options: [
			{
				label: 'Webcam',
				value: 'Webcam',
				type: 'plugins',
			},
			{
				label: 'Audio',
				value: 'Audio',
				type: 'plugins',
			},
			{
				label: 'Screencast',
				value: 'ScreenCapture',
				type: 'plugins',
			},
		],
	},
	{
		heading: 'Dashboard',
		options: [
			{ label: 'Small', type: 'small' },
			{ label: 'Disabled', type: 'disabled' },
			{ label: 'Dark mode', type: 'theme' },
		],
	},
	{
		heading: 'Miscellaneous',
		options: [
			{ label: 'Restrictions', type: 'restrictions' },
			{ label: 'Golden Retriever', value: 'GoldenRetriever', type: 'plugins' },
		],
	},
];

const Uppy = ({ state, locale }) => {
	const disabled = (value: string) =>
		options.some((section) =>
			section.options.some(
				(option) => value === option.value && option.disabled,
			),
		);
	const createUppy = useCallback(() => {
		const uppy = new UppyCore({
			restrictions: state.restrictions,
			locale,
			debug: true,
		})
			.use(ImageEditor, {})
			.use(Tus, { endpoint });

		if (state.plugins.includes('Box') && !disabled('Box')) {
			uppy.use(Box, { companionUrl });
		}
		if (state.plugins.includes('Instagram') && !disabled('Instagram')) {
			uppy.use(Instagram, { companionUrl });
		}
		if (state.plugins.includes('Url') && !disabled('Url')) {
			uppy.use(Url, { companionUrl });
		}
		if (state.plugins.includes('Zoom') && !disabled('Zoom')) {
			uppy.use(Zoom, { companionUrl });
		}
		if (state.plugins.includes('OneDrive') && !disabled('OneDrive')) {
			uppy.use(OneDrive, { companionUrl });
		}
		if (state.plugins.includes('Unsplash') && !disabled('Unsplash')) {
			uppy.use(Unsplash, { companionUrl });
		}
		if (state.plugins.includes('Webcam') && !disabled('Webcam')) {
			uppy.use(Webcam);
		}
		if (state.plugins.includes('ScreenCapture') && !disabled('ScreenCapture')) {
			uppy.use(ScreenCapture);
		}
		if (state.plugins.includes('Audio') && !disabled('Audio')) {
			uppy.use(Audio);
		}
		if (state.plugins.includes('GoogleDrive') && !disabled('GoogleDrive')) {
			uppy.use(GoogleDrive, {
				companionUrl,
				companionKeysParams: {
					key: 'unused-key',
					credentialsName: 'unused-credentials',
				},
			});
		}
		if (
			state.plugins.includes('GoogleDrivePicker') &&
			!disabled('GoogleDrivePicker')
		) {
			uppy.use(GoogleDrivePicker, {
				companionUrl,
				clientId: googlePickerClientId,
				apiKey: googlePickerApiKey,
				appId: googlePickerAppId,
			});
		}
		if (
			state.plugins.includes('GooglePhotosPicker') &&
			!disabled('GooglePhotosPicker')
		) {
			uppy.use(GooglePhotosPicker, {
				companionUrl,
				clientId: googlePickerClientId,
			});
		}
		if (state.plugins.includes('Dropbox') && !disabled('Dropbox')) {
			uppy.use(Dropbox, { companionUrl });
		}
		if (
			state.plugins.includes('GoldenRetriever') &&
			!disabled('GoldenRetriever')
		) {
			uppy.use(GoldenRetriever);
		}

		// Expose for easier debugging
		globalThis.uppy = uppy;

		return uppy;
	}, [state, locale]);

	const [uppy, setUppy] = useState(() => createUppy());

	useEffect(() => setUppy(createUppy()), [createUppy]);

	return (
		<div className={styles['uppy-wrapper']}>
			<Dashboard
				uppy={uppy}
				width={state.small ? 400 : '100%'}
				height={state.small ? 400 : 570}
				theme={state.theme}
				disabled={state.disabled}
				note={
					state.restrictions ?
						'Images and video only, 2–3 files, up to 1 MB'
					:	null
				}
				metaFields={
					state.restrictions ?
						[{ id: 'caption', name: 'Caption', placeholder: 'Add a Caption' }]
					:	undefined
				}
			/>
		</div>
	);
};

const companionUrl = 'https://companion.uppy.io';
// const companionUrl = 'http://localhost:3020';
const endpoint = 'https://tusd.tusdemo.net/files/';
const googlePickerClientId =
	'458443975467-fiplebcb8bdnplqo8hlfs9pagmseo5nk.apps.googleusercontent.com';
const googlePickerApiKey = 'AIzaSyC6m6CZEFiTtSkBfNf_-PvtCxmDMiAgfag';
const googlePickerAppId = '458443975467';

export default function Examples() {
	// Silly trick to please Docusaurus with client-side hooks such as useLocalStorage
	return <BrowserOnly>{() => <Page />}</BrowserOnly>;
}

function Page() {
	const [state, setPersistentState] = useLocalStorage(
		'uppy-examples-state',
		initialState,
	);
	const [locale, setLocale] = useState(null);
	const dispatch = useCallback(
		(action: Action) => setPersistentState(reducer(state, action)),
		[state],
	);

	return (
		<Layout>
			<main className={styles['main']}>
				<Heading className={styles['h1']} as="h1">
					Examples
				</Heading>
				<Admonition type="note">
					Check out our{' '}
					<Link
						href="https://github.com/transloadit/uppy/tree/main/examples"
						target="_blank"
						rel="noopener"
					>
						GitHub examples
					</Link>{' '}
					folder for many more examples.
				</Admonition>
				<p>Uppy offers three ways to build user interfaces:</p>
				<ul>
					<li>
						<b>Pre-composed, plug-and-play components.</b> Mainly Dashboard and
						DragDrop. The downside is that you can’t customize the UI.
					</li>
					<li>
						<b>Headless components.</b> Smaller componentes, easier to override
						the styles or compose them together with your own components.
					</li>
					<li>
						<b>Hooks.</b> Attach our logic to your own components, no
						restrictions, create a tailor-made UI.
					</li>
				</ul>
				<div className={styles['dashboard-docs-stackblitz']}>
					<Heading as="h2">Dashboard</Heading>
					<p>
						<Link to="/docs/dashboard">Docs</Link> •{' '}
						<Link
							target="_blank"
							rel="noopener"
							href="https://stackblitz.com/edit/vitejs-vite-zaqyaf?file=main.js"
						>
							StackBlitz
						</Link>
					</p>
				</div>
				<p>
					Dashboard is the full-featured UI for Uppy that shows nice file
					previews and upload progress, lets you edit metadata, and unites
					acquire plugins, such as Google Drive and Webcam, under one roof.
				</p>
				<section className={styles['options-and-uppy']}>
					<div className={styles['options']}>
						{options.map((section) => {
							return (
								<div key={section.heading}>
									<Heading className={styles['h3']} as="h3">
										{section.heading}
									</Heading>
									<div
										wrapper-for={section.heading}
										className={styles['options-inner']}
									>
										{section.options.map(
											({ label, value, type, disabled, title }) => (
												<div key={label}>
													<input
														type="checkbox"
														id={label}
														value={type}
														title={title}
														checked={
															// Forgive me for this logic
															disabled ? false
															: Array.isArray(state[type]) ?
																state[type].includes(value)
															: type === 'theme' ?
																state.theme === 'dark'
															:	state[type]
														}
														disabled={disabled}
														onChange={(event) =>
															dispatch({
																type: type,
																checked: event.target.checked,
																value,
															})
														}
													/>
													<label title={title} htmlFor={label}>
														{label}
													</label>
												</div>
											),
										)}
									</div>
								</div>
							);
						})}

						<div className={styles['options-locale']}>
							<Heading className={styles['h3']} as="h3">
								Locale
							</Heading>
							<select
								name="locale"
								onChange={(e) => {
									setLocale(
										locales.find((locale) => locale.name === e.target.value)
											.locale,
									);
								}}
							>
								{locales.map(({ name }) => {
									return (
										<option key={name} value={name}>
											{name}
										</option>
									);
								})}
							</select>
						</div>
					</div>
					<div className={styles['dashboard-inner']}>
						<BrowserOnly>
							{() => <Uppy state={state} locale={locale} />}
						</BrowserOnly>
					</div>
				</section>
				<section className={styles['stackblitz-section']}>
					<Heading as="h2">Headless components and hooks</Heading>
					<p>For when you want a more custom, flexible UI.</p>

					<div>
						<Tabs>
							<TabItem value="react" label="React">
								<iframe
									style={{ width: '100%', height: '600px' }}
									src="https://stackblitz.com/github/transloadit/uppy/tree/main/examples/react?embed=1&view=editor&showSidebar=1&hideTerminal=1&ctl=1&file=src%2FApp.tsx"
								></iframe>
							</TabItem>
							<TabItem value="vue" label="Vue">
								<iframe
									style={{ width: '100%', height: '600px' }}
									src="https://stackblitz.com/github/transloadit/uppy/tree/main/examples/vue?embed=1&view=editor&showSidebar=1&hideTerminal=1&ctl=1&file=src%2FApp.vue"
								></iframe>
							</TabItem>
							<TabItem value="svelte" label="Svelte">
								<iframe
									style={{ width: '100%', height: '600px' }}
									src="https://stackblitz.com/github/transloadit/uppy/tree/main/examples/sveltekit?embed=1&view=editor&showSidebar=1&hideTerminal=1&ctl=1&file=src%2Froutes%2F%2Bpage.svelte"
								></iframe>
							</TabItem>
						</Tabs>
					</div>
				</section>
			</main>
		</Layout>
	);
}
