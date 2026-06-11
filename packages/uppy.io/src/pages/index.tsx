import React, { useState, Fragment } from 'react';

import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';

import {
	Uppy,
	Webcam,
	Zoom,
	Dropbox,
	OneDrive,
	Unsplash,
	Url,
	Box,
	Audio,
	ScreenCapture,
	ImageEditor,
	Tus,
	GoogleDrivePicker,
	GooglePhotosPicker,
} from 'uppy';
import Dashboard from '@uppy/react/dashboard';

import Comparison from './comparison.md';

import IconReact from '../../static/img/react.svg';
import IconVue from '../../static/img/vue.svg';
import IconSvelte from '../../static/img/svelte.svg';
import IconAngular from '../../static/img/angular.svg';
import IconUpload from '../../static/img/upload.svg';
import IconChat from '../../static/img/chat.svg';
import IconLanguage from '../../static/img/language.svg';
import IconSparkles from '../../static/img/sparkles.svg';
import IconFolder from '../../static/img/folder.svg';
import IconWrench from '../../static/img/wrench.svg';
import IconUppy from '../../static/img/uppy.svg';

import 'uppy/dist/uppy.min.css';

import styles from './index.module.css';

const companionUrl = 'https://companion.uppy.io';
const endpoint = 'https://tusd.tusdemo.net/files/';
const googlePickerClientId =
	'458443975467-fiplebcb8bdnplqo8hlfs9pagmseo5nk.apps.googleusercontent.com';
const googlePickerApiKey = 'AIzaSyC6m6CZEFiTtSkBfNf_-PvtCxmDMiAgfag';
const googlePickerAppId = '458443975467';

const dashboardCode = `import { Uppy, Dashboard, RemoteSources, ImageEditor, Webcam, Tus } from 'uppy'

const uppy = new Uppy()
  .use(Dashboard, { target: '.DashboardContainer', inline: true })
  .use(Tus, { endpoint: '${endpoint}' })
  .use(RemoteSources, { companionUrl: '${companionUrl}' })
  .use(Webcam)
  .use(ImageEditor)
`;

const reactCode = `import React, { useState } from 'react'
import { Uppy } from '@uppy/core'
import { UppyContextProvider, Dropzone, FilesList, UploadButton } from '@uppy/react'

function Component () {
  const [uppy] = useState(() => new Uppy())
  return (
    <UppyContextProvider value={uppy}>
      <Dropzone />
      <FilesList />
      <UploadButton />
    </UppyContextProvider>
  )
}
`;

const vueCode = `<script setup>
import { Uppy } from '@uppy/core'
import { UppyContextProvider, Dropzone, FilesList, UploadButton } from '@uppy/vue'

const uppy = new Uppy()
</script>

<template>
  <UppyContextProvider :uppy="uppy">
    <Dropzone />
    <FilesList />
    <UploadButton />
  </UppyContextProvider>
</template>
`;

const angularCode = `import { NgModule } from '@angular/core'
import { UppyAngularDashboardModule } from '@uppy/angular'

import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    UppyAngularDashboardModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
class {}
`;

const svelteCode = `
<script lang="ts">
import { Uppy } from '@uppy/core'
import { UppyContextProvider, Dropzone, FilesList, UploadButton } from '@uppy/vue'

const uppy = new Uppy()
</script>

<template>
  <UppyContextProvider {uppy}>
    <Dropzone />
    <FilesList />
    <UploadButton />
  </UppyContextProvider>
</template>
`;

const providersIcons = [
	'box.svg',
	'unsplash.svg',
	'googledrive.svg',
	'dropbox.svg',
	'instagram.svg',
	'onedrive.svg',
];

const frameworks = [
	{ name: 'React', Icon: IconReact, code: reactCode },
	{ name: 'Vue', Icon: IconVue, code: vueCode },
	{ name: 'Svelte', Icon: IconSvelte, code: svelteCode },
	{ name: 'Angular', Icon: IconAngular, code: angularCode },
];

export default function Home(): JSX.Element {
	const [framework, setFramework] = useState(frameworks[0].name);

	return (
		<Layout description="Description will go into a meta tag in <head />">
			<header className={styles.header}>
				<Heading as="h1">
					Sleek, modular open source JavaScript file uploader
				</Heading>

				<p>
					Uppy fetches files locally and from remote places like Dropbox or
					Instagram. With its seamless integration, reliability and ease of use,
					Uppy is truly your best friend in file uploading.
				</p>

				<Link className={styles.button} to="/docs/quick-start">
					Get started
				</Link>

				<figure className={styles.quote}>
					<blockquote cite="https://stackshare.io/posts/top-developer-tools-2017">
						<p>“Top 10 tools of the year”</p>
					</blockquote>
					<figcaption>
						<Link
							href="https://stackshare.io/posts/top-developer-tools-2017"
							rel="noopener"
							target="_blank"
						>
							Stackshare
						</Link>
					</figcaption>
				</figure>

				<figure className={styles.quote}>
					<blockquote cite="https://books.producthunt.com/bestof2017">
						<p>“The best product launches”</p>
					</blockquote>
					<figcaption>
						<Link
							href="https://books.producthunt.com/bestof2017"
							rel="noopener"
							target="_blank"
						>
							Product Hunt
						</Link>
					</figcaption>
				</figure>

				<figure className={styles.quote}>
					<blockquote cite="https://twitter.com/smashingmag/status/1097870169043546112">
						<p>“Soooo useful”</p>
					</blockquote>
					<figcaption>
						<Link
							href="https://twitter.com/smashingmag/status/1097870169043546112"
							rel="noopener"
							target="_blank"
						>
							Smashing Magazine
						</Link>
					</figcaption>
				</figure>
			</header>

			<main className={styles.main}>
				<section className={styles['section-dashboard']}>
					<Heading as="h2">
						The all you need Dashboard — powerful, responsive, and pluggable.
					</Heading>
					<p>
						Add files from remote sources, edit images, generate thumbnails, and
						more.
					</p>
					<div className={styles.dashboard}>
						<div className={styles['dashboard-inner']}>
							<BrowserOnly>
								{() => {
									const uppy = new Uppy({ debug: true })
										.use(Webcam)
										.use(ScreenCapture)
										.use(Audio)
										.use(ImageEditor, {})
										.use(Tus, { endpoint })
										.use(Dropbox, { companionUrl })
										.use(Url, { companionUrl })
										.use(OneDrive, { companionUrl })
										.use(Unsplash, { companionUrl })
										.use(Box, { companionUrl })
										.use(Zoom, { companionUrl })
										.use(GoogleDrivePicker, {
											companionUrl,
											clientId: googlePickerClientId,
											apiKey: googlePickerApiKey,
											appId: googlePickerAppId,
										})
										.use(GooglePhotosPicker, {
											companionUrl,
											clientId: googlePickerClientId,
										});

									// Expose for easier debugging
									globalThis.uppy = uppy;

									return (
										<Dashboard
											uppy={uppy}
											height={400}
											plugins={[
												'Webcam',
												'Dropbox',
												'Url',
												'OneDrive',
												'Unsplash',
												'Box',
												'ImageEditor',
											]}
										/>
									);
								}}
							</BrowserOnly>
						</div>
						<CodeBlock language="js">{dashboardCode}</CodeBlock>
					</div>
					<div
						aria-hidden
						className={`${styles.upload} ${styles['upload-one']}`}
					>
						<IconUppy />
						<div></div>
					</div>
					<div
						aria-hidden
						className={`${styles.upload} ${styles['upload-two']}`}
					>
						<div></div>
					</div>
				</section>

				<section className={styles['section-companion']}>
					<div className={styles.companion}>
						{providersIcons.map((file) => (
							<div className={styles.provider} key={file}>
								<img src={`img/${file}`} />
							</div>
						))}
					</div>
					<Heading as="h2">
						Bring in the files from the cloud with Companion.
					</Heading>
					<p>
						Companion is a hosted, standalone, or middleware server to{' '}
						<strong>
							take away the complexity of authentication and the cost of
							downloading files
						</strong>{' '}
						from remote sources, such as Instagram, Google Drive, and others.
					</p>
					<p>
						This means a 5GB video isn’t eating into your users’ data plans and
						you don’t have to worry about OAuth.
					</p>
					<Link className={styles.button} to="/docs/companion">
						Learn more
					</Link>
				</section>

				<section className={styles['section-stack']}>
					<div>
						<Heading as="h2">Integrate Uppy into your existing stack.</Heading>
						<p>
							Uppy can seamlessly integrate in your existing stack. Plug the pup
							in the framework of your choosing.
						</p>
						<Link
							className={styles.button}
							to={`/docs/${framework.toLowerCase()}`}
						>
							{framework} docs
						</Link>
					</div>
					<div className={styles['frameworks-wrapper']}>
						<div className={styles.frameworks}>
							{frameworks.map(({ name, Icon }) => (
								<Fragment key={name}>
									<input
										type="radio"
										id={name}
										className={styles['framework-input']}
										name="framework"
										value={name}
										checked={name === framework}
										onChange={(event) => setFramework(event.target.value)}
									/>
									<label htmlFor={name}>
										<Icon />
										<span>{name}</span>
									</label>
								</Fragment>
							))}
						</div>
						<CodeBlock language="js">
							{frameworks.find((f) => f.name === framework).code}
						</CodeBlock>
					</div>
				</section>

				<section className={styles['section-much-more']}>
					<Heading as="h2">And much more</Heading>
					<ul>
						<li>
							<span>
								<IconUpload />
							</span>
							<span>
								Large uploads survive network hiccups thanks to resumable file
								uploads via the open <Link href="https://tus.io/">Tus</Link>{' '}
								standard
							</span>
						</li>
						<li>
							<span>
								<IconSparkles />
							</span>
							<span>
								Works great with the file encoding and processing backend from{' '}
								<Link href="https://transloadit.com/">Transloadit</Link>.
							</span>
						</li>
						<li>
							<span>
								<IconChat />
							</span>
							<span>
								Open source and driven by the community. We listen closely and
								adjust the project based on your feedback
							</span>
						</li>
						<li>
							<span>
								<IconFolder />
							</span>
							<span>
								File recovery, such as after a browser crash or accidental
								navigation, via{' '}
								<Link to="/docs/golden-retriever">Golden Retriever</Link>
							</span>
						</li>
						<li>
							<span>
								<IconLanguage />
							</span>
							<span>Speaks multiple languages (i18n)</span>
						</li>
						<li>
							<span>
								<IconWrench />
							</span>
							<span>Built with accessibility in mind</span>
						</li>
					</ul>
					<div>
						<Link className={styles.button} to="/docs/quick-start">
							Get started
						</Link>
					</div>
				</section>

				<section>
					<Heading as="h2">Comparison of uploaders</Heading>
					<Link to="/docs/comparison">View full comparison table</Link>
				</section>
			</main>
		</Layout>
	);
}
