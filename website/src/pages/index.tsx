import React, { useState, Fragment } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
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

import InstallCommand from '../components/InstallCommand';
import AgentPrompt from '../components/AgentPrompt';

import IconUpload from '../../static/img/upload.svg';
import IconLanguage from '../../static/img/language.svg';
import IconSparkles from '../../static/img/sparkles.svg';
import IconFolder from '../../static/img/folder.svg';
import IconWrench from '../../static/img/wrench.svg';
import IconPencil from '../../static/img/pencil.svg';
import IconPointer from '../../static/img/pointer.svg';
import IconBlocks from '../../static/img/blocks.svg';
import IconBolt from '../../static/img/bolt.svg';

import 'uppy/dist/uppy.min.css';

import styles from './index.module.css';

const companionUrl = 'https://companion.uppy.io';
const endpoint = 'https://tusd.tusdemo.net/files/';
const googlePickerClientId =
	'458443975467-fiplebcb8bdnplqo8hlfs9pagmseo5nk.apps.googleusercontent.com';
const googlePickerApiKey = 'AIzaSyC6m6CZEFiTtSkBfNf_-PvtCxmDMiAgfag';
const googlePickerAppId = '458443975467';

/**
 * Package sets are taken verbatim from each framework's own docs page, so the
 * command here is the command you'd be told to run when you get there.
 */
const installTargets = [
	// No packages of its own: this one hands the whole job to an agent, so it
	// swaps the command line for the prompt panel.
	{ name: 'Build with Agents', agent: true },
	{
		name: 'Next.js',
		packages: '@uppy/core @uppy/dashboard @uppy/react',
		docs: '/docs/nextjs',
		docsLabel: 'Next.js',
	},
	{
		name: 'React',
		packages: '@uppy/react',
		docs: '/docs/react',
		docsLabel: 'React',
	},
	{
		name: 'Vue',
		packages: '@uppy/vue',
		docs: '/docs/vue',
		docsLabel: 'Vue',
	},
	{
		name: 'Svelte',
		packages: '@uppy/svelte',
		docs: '/docs/svelte',
		docsLabel: 'Svelte',
	},
	{
		name: 'Angular',
		packages: '@uppy/angular',
		docs: '/docs/angular',
		docsLabel: 'Angular',
	},
	{
		name: 'Vanilla',
		packages: '@uppy/core @uppy/dashboard',
		docs: '/docs/dashboard',
		docsLabel: 'Dashboard',
	},
];

/**
 * Ambient upload sparks: 1px pink lines rising behind the hero.
 *
 * Hand-authored so SSR and hydration agree, and clustered rather than evenly
 * pitched — an even pitch reads as a comb, which is the giveaway.
 *
 * Two rules hold across the set:
 *  - Length is motion blur, so it tracks speed: travel is a fixed 52rem, which
 *    makes `len ≈ 208 / dur`. Long lines are the fast ones.
 *  - Peak opacity is deliberately uncorrelated with length, so bright doesn't
 *    always mean long.
 *
 * A scattered quarter run at 2px rather than 1px: thicker reads as nearer, so
 * the field gets some depth instead of sitting on one plane.
 *
 * x = left %, len/w = px, dur/delay = seconds, o = peak opacity.
 */
const sparks = [
	{ x: 4, len: 65, dur: 3.2, delay: 0.0, o: 0.55, w: 1 },
	{ x: 6, len: 39, dur: 5.4, delay: 1.3, o: 0.9, w: 2 },
	{ x: 9, len: 51, dur: 4.1, delay: 2.9, o: 0.45, w: 1 },
	{ x: 11, len: 74, dur: 2.8, delay: 4.6, o: 0.7, w: 1 },
	{ x: 13, len: 35, dur: 6.0, delay: 5.8, o: 0.5, w: 2 },
	{ x: 19, len: 58, dur: 3.6, delay: 7.7, o: 0.85, w: 1 },
	{ x: 21, len: 42, dur: 4.9, delay: 9.1, o: 0.6, w: 1 },
	{ x: 24, len: 69, dur: 3.0, delay: 10.4, o: 0.55, w: 1 },
	{ x: 26, len: 80, dur: 2.6, delay: 12.0, o: 0.9, w: 1 },
	{ x: 31, len: 34, dur: 6.2, delay: 13.7, o: 0.45, w: 2 },
	{ x: 33, len: 56, dur: 3.7, delay: 14.9, o: 0.7, w: 1 },
	{ x: 36, len: 65, dur: 3.2, delay: 16.8, o: 0.5, w: 1 },
	{ x: 38, len: 39, dur: 5.4, delay: 18.2, o: 0.85, w: 2 },
	{ x: 44, len: 51, dur: 4.1, delay: 19.5, o: 0.6, w: 1 },
	{ x: 47, len: 74, dur: 2.8, delay: 21.1, o: 0.55, w: 1 },
	{ x: 49, len: 35, dur: 6.0, delay: 22.8, o: 0.9, w: 1 },
	{ x: 51, len: 58, dur: 3.6, delay: 24.0, o: 0.45, w: 1 },
	{ x: 55, len: 42, dur: 4.9, delay: 25.9, o: 0.7, w: 2 },
	{ x: 57, len: 69, dur: 3.0, delay: 27.3, o: 0.5, w: 1 },
	{ x: 60, len: 80, dur: 2.6, delay: 28.6, o: 0.85, w: 1 },
	{ x: 62, len: 34, dur: 6.2, delay: 30.2, o: 0.6, w: 1 },
	{ x: 68, len: 56, dur: 3.7, delay: 31.9, o: 0.55, w: 2 },
	{ x: 70, len: 65, dur: 3.2, delay: 33.1, o: 0.9, w: 1 },
	{ x: 73, len: 39, dur: 5.4, delay: 35.0, o: 0.45, w: 1 },
	{ x: 75, len: 51, dur: 4.1, delay: 36.4, o: 0.7, w: 1 },
	{ x: 79, len: 74, dur: 2.8, delay: 37.7, o: 0.5, w: 1 },
	{ x: 81, len: 35, dur: 6.0, delay: 39.3, o: 0.85, w: 2 },
	{ x: 84, len: 58, dur: 3.6, delay: 41.0, o: 0.6, w: 1 },
	{ x: 86, len: 42, dur: 4.9, delay: 42.2, o: 0.55, w: 1 },
	{ x: 91, len: 69, dur: 3.0, delay: 44.1, o: 0.9, w: 1 },
	{ x: 93, len: 80, dur: 2.6, delay: 45.5, o: 0.45, w: 2 },
	{ x: 96, len: 34, dur: 6.2, delay: 46.8, o: 0.7, w: 1 },
];

/**
 * The hand-off, drawn. The diagram is two owned lanes rather than one neutral
 * track, because the question it has to answer is "who does what": each lane is
 * a card holding its own logo and its own steps, so a step is read as that
 * side's work instead of floating between two marks. The mark alone heads the
 * lane — where the work runs is what the two cards and the hand-off already
 * say, so spelling it out in a caption was one label too many.
 *
 * A lane owning its logo is also what lets the pair stack on a narrow screen —
 * each lane is self-contained, so the row just becomes a column.
 *
 * `at` is how far along that lane's own rail the step sits. It is the only
 * number here: when the file gets there is derived from it in CSS, off the
 * lane's leg of the shared loop, so a station cannot light before the file
 * arrives and the two layouts can time themselves differently without this
 * having to know.
 *
 * Uppy's lone station sits at the middle of its rail, under the mark centred
 * above it, so the short lane reads as one deliberate step rather than as a
 * step that has drifted off-centre; Transloadit's three sixth the long rail,
 * which leaves the same margin at both ends of it.
 */
const lanes = [
	{
		owner: 'uppy',
		logo: { src: 'img/uppy.svg', alt: 'Uppy', width: 28, height: 28 },
		steps: [{ label: 'Upload', at: 50 }],
	},
	{
		owner: 'transloadit',
		logo: {
			src: 'img/transloadit.svg',
			alt: 'Transloadit',
			width: 112,
			height: 18,
		},
		steps: [
			{ label: 'Resize', at: 100 / 6 },
			{ label: 'Encode', at: 50 },
			{ label: 'Deliver', at: 500 / 6 },
		],
	},
];

const packageManagers = [
	{ name: 'npm', prefix: 'npm install' },
	{ name: 'yarn', prefix: 'yarn add' },
];

/**
 * Companion's sources, wrapping the Uppy mark — files coming in from everywhere,
 * through one uploader.
 *
 * Only sources with a mark worth recognising. WebDAV and import-from-URL are
 * protocols, and unlabelled a generic glyph says nothing; Google Drive Picker
 * shares Drive's mark, so it would have read as the same logo twice.
 *
 * Positions are percentages of the box the cluster draws in, solved offline
 * against a checker that rejects a layout unless: no tile overlaps another tile
 * or the core, no wire passes through a tile that isn't its own, no wire crosses
 * another wire, and nothing leaves the box. This set clears by 8.0 units between
 * tiles and 6.1 units between any wire and any other tile.
 *
 * The radii are deliberately uneven. A clean arc puts every tile in an exact
 * mirror pair about the horizontal axis, which is the strongest "generated" tell
 * there is — the checker also rejects layouts whose closest pair scores below 4
 * on mirror similarity. This one scores 4.7.
 *
 * Storage services run along the top of the sweep, media along the bottom.
 *
 * `mark` is the logo's width as a percentage of its tile, per brand. The ratios
 * between them come from measured ink coverage — solid shapes (Facebook,
 * Unsplash) read far heavier than a hairline wordmark (Box) at the same measured
 * size — and the whole set is then scaled to fill the tile.
 */
const sources = [
	{ file: 'onedrive.svg', name: 'OneDrive', x: 9.5, y: 23.6, mark: 53 },
	{ file: 'box.svg', name: 'Box', x: 32.8, y: 14.4, mark: 64 },
	{ file: 'googledrive.svg', name: 'Google Drive', x: 57.4, y: 12.7, mark: 51 },
	{ file: 'dropbox.svg', name: 'Dropbox', x: 75.9, y: 34.5, mark: 52 },
	{ file: 'googlephotos.svg', name: 'Google Photos', x: 79.4, y: 67, mark: 47 },
	{ file: 'facebook.svg', name: 'Facebook', x: 55.5, y: 83.6, mark: 33 },
	{ file: 'zoom.svg', name: 'Zoom', x: 31.9, y: 90.2, mark: 57 },
	{ file: 'unsplash.svg', name: 'Unsplash', x: 13.2, y: 73.1, mark: 32 },
];

/**
 * The cluster's geometry, shared by the tiles, the core and the wires that join
 * them, so the three can't drift apart — they did once, and the wires ended up
 * radiating from a point 11px away from the mark they were supposed to touch.
 *
 * Units are the box the SVG draws in: 100 wide by 88 tall. `x` is a percentage
 * of the width and `y` a percentage of the height, so `y * 0.88` converts.
 */
const BOX = { w: 100, h: 88 };
const CORE = { x: 39, y: BOX.h / 2, r: 11.5 };
const TILE_R = 7;

/**
 * A wire from the core's edge to one tile's edge, bowed rather than straight.
 * Every wire bends the same rotational way and by the same absolute amount:
 * a sag proportional to length made the long wires curve three times harder than
 * the short ones, so the set stopped reading as one hand.
 */
function wire({ x, y }: { x: number; y: number }) {
	const target = { x, y: (y / 100) * BOX.h };
	const dx = target.x - CORE.x;
	const dy = target.y - CORE.y;
	const len = Math.hypot(dx, dy);
	const ux = dx / len;
	const uy = dy / len;

	const from = {
		x: CORE.x + ux * (CORE.r + 1.5),
		y: CORE.y + uy * (CORE.r + 1.5),
	};
	const to = {
		x: target.x - ux * (TILE_R + 1.5),
		y: target.y - uy * (TILE_R + 1.5),
	};
	const bend = 1.8;
	const control = {
		x: (from.x + to.x) / 2 - uy * bend,
		y: (from.y + to.y) / 2 + ux * bend,
	};

	const r = (n: number) => Math.round(n * 10) / 10;
	return `M${r(from.x)} ${r(from.y)} Q${r(control.x)} ${r(control.y)} ${r(to.x)} ${r(to.y)}`;
}

const capabilities = [
	{
		Icon: IconUpload,
		title: 'Resumable uploads',
		body: (
			<>
				Large uploads survive network hiccups, thanks to the open{' '}
				<Link href="https://tus.io/">Tus</Link> standard.
			</>
		),
	},
	{
		Icon: IconFolder,
		title: 'Crash recovery',
		body: (
			<>
				Files come back after a browser crash or an accidental navigation, via{' '}
				<Link to="/docs/golden-retriever">Golden Retriever</Link>.
			</>
		),
	},
	{
		Icon: IconSparkles,
		title: 'Hand off to Transloadit',
		body: (
			<>
				Send files straight to{' '}
				<Link href="https://transloadit.com/">Transloadit</Link> for encoding
				and file processing.
			</>
		),
	},
	{
		Icon: IconPointer,
		title: 'Drag and drop',
		body: (
			<>
				Built into the Dashboard, or take{' '}
				<Link to="/docs/drag-drop">DragDrop</Link> on its own — and{' '}
				<Link to="/docs/drop-target">DropTarget</Link> makes any element a drop
				zone.
			</>
		),
	},
	{
		Icon: IconPencil,
		title: 'Edit before uploading',
		body: (
			<>
				Crop, rotate and resize in the browser with the{' '}
				<Link to="/docs/image-editor">Image Editor</Link>, and shrink files with{' '}
				<Link to="/docs/compressor">Compressor</Link>.
			</>
		),
	},
	{
		Icon: IconLanguage,
		// 40 packs in @uppy/locales, some of which are regional variants of the
		// same language — hence "locales" rather than a language count.
		title: 'Ships in 40 locales',
		body: (
			<>
				Drop in a <Link to="/docs/locales">locale pack</Link>, or override
				single strings to match your own copy.
			</>
		),
	},
	{
		Icon: IconBlocks,
		title: 'Modular by design',
		// Carries the "no paid edition" claim that left with the dropped tenth
		// item: MIT in the provenance note implies free, but it doesn't rule out
		// an enterprise tier, which is a live question when picking an uploader.
		body: (
			<>
				Every part is a <Link to="/docs/uppy">plugin</Link>, all of them
				included — there is no paid edition. Take the whole Dashboard, or wire
				up only the pieces you need.
			</>
		),
	},
	{
		Icon: IconBolt,
		title: 'No build step needed',
		body: (
			<>
				Load Uppy from the CDN with a <code>{'<script>'}</code> tag and skip the
				bundler entirely.
			</>
		),
	},
	{
		Icon: IconWrench,
		title: 'Accessible by default',
		body: (
			<>
				Keyboard navigation and screen readers are designed for, not bolted on.
			</>
		),
	},
];

export default function Home(): JSX.Element {
	const [target, setTarget] = useState(installTargets[0].name);
	const [manager, setManager] = useState(packageManagers[0].name);
	const activeTarget = installTargets.find((t) => t.name === target);
	const activeManager = packageManagers.find((p) => p.name === manager);

	return (
		<Layout description="Uppy is the open source JavaScript file uploader. Resumable uploads from disk, Dropbox or Google Drive, for React, Next.js, Vue, Svelte and Angular.">
			{/* Title is set verbatim rather than through Layout's title prop, which
			    would append " | Uppy" and undo the lockup. */}
			<Head>
				<title>
					{'Uppy by Transloadit - Open source JavaScript file uploader'}
				</title>
			</Head>

			{/* ---------------------------------------------------------------- Hero */}
			<header className={styles.hero}>
				<div className={styles.glow} aria-hidden />

				<div className={styles.sparks} aria-hidden>
					{sparks.map(({ x, len, dur, delay, o, w }) => (
						<span
							key={x}
							className={styles.spark}
							style={
								{
									left: `${x}%`,
									width: `${w}px`,
									height: `${len}px`,
									animationDuration: `${dur}s`,
									// Negative delay starts each track mid-flight, so the
									// field is already populated on first paint.
									animationDelay: `-${delay}s`,
									'--peak': o,
								} as React.CSSProperties
							}
						/>
					))}
				</div>

				<div className={styles.heroInner}>
					<img
						className={styles.mark}
						src="/img/logo.svg"
						alt=""
						width={64}
						height={64}
					/>

					<Heading as="h1" className={styles.title}>
						The open source JavaScript file uploader
					</Heading>

					<p className={styles.lede}>
						Sleek, modular and open source. Pulls files from disk, Dropbox or
						Drive, and resumes if the connection drops.
					</p>
				</div>

				{/* The product is the hero — it sits above the fold, working. */}
				<div className={styles.showcase}>
					<div className={styles.demoCol}>
						<div className={styles.demo}>
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
											width="100%"
											height={460}
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
					</div>

					{/* The install path sits beside the product: what it is on the
					    left, how you get it on the right. */}
					<div className={styles.install}>
						<div
							className={styles.targets}
							role="radiogroup"
							aria-label="Framework"
						>
							{installTargets.map(({ name }) => (
								<Fragment key={name}>
									<input
										type="radio"
										id={`target-${name}`}
										className={styles.targetInput}
										name="install-target"
										value={name}
										checked={name === target}
										onChange={(event) => setTarget(event.target.value)}
									/>
									<label htmlFor={`target-${name}`}>{name}</label>
								</Fragment>
							))}
						</div>

						{/* One box for both variants — see .installBody. */}
						<div className={styles.installBody}>
							{activeTarget.agent ?
								<AgentPrompt className={styles.heroAgent} />
							:	<>
									{/* The package manager is a property of the command, so it docks
								    to the field as a tab strip rather than repeating the pill
								    treatment used for the framework choice above. */}
									<div className={styles.field}>
										<div
											className={styles.managers}
											role="radiogroup"
											aria-label="Package manager"
										>
											{packageManagers.map(({ name }) => (
												<Fragment key={name}>
													<input
														type="radio"
														id={`pm-${name}`}
														className={styles.managerInput}
														name="package-manager"
														value={name}
														checked={name === manager}
														onChange={(event) => setManager(event.target.value)}
													/>
													<label htmlFor={`pm-${name}`}>{name}</label>
												</Fragment>
											))}
										</div>

										<InstallCommand
											command={`${activeManager.prefix} ${activeTarget.packages}`}
											className={styles.heroInstall}
										/>
									</div>

									<Link className={styles.installDocs} to={activeTarget.docs}>
										Then wire it up in the {activeTarget.docsLabel} docs{' '}
										<span aria-hidden>→</span>
									</Link>
								</>
							}
						</div>
					</div>
				</div>

				{/* Centred under both columns, because it applies to the whole thing:
				    what happens after the upload, for the projects that need it. */}
				<div className={styles.heroHandoff}>
					<p>Need to resize, encode, optimize, store or deliver your files?</p>
					<Link href="https://transloadit.com/">
						Try Transloadit <span aria-hidden>→</span>
					</Link>
				</div>
			</header>

			<main className={styles.main}>
				{/* ----------------------------------------------------- Companion */}
				{/* The page's one horizontal break: a change of ground marks the
				    shift from "here's the thing" to "here's how it gets files". */}
				<div className={styles.band}>
					<section className={`${styles.section} ${styles.split}`}>
						<div className={styles.sectionHead}>
							<p className={styles.eyebrow}>Companion</p>
							<Heading as="h2">Files from anywhere, without the OAuth</Heading>
							<p>
								Companion is a hosted, standalone or middleware server that
								takes away the complexity of authentication and the cost of
								downloading files from remote sources. A 5&nbsp;GB video never
								touches your user’s data plan, and you never touch an OAuth
								flow.
							</p>
							<Link className={styles.textLink} to="/docs/companion">
								Set up Companion <span aria-hidden>→</span>
							</Link>
						</div>

						{/* The logos are the content here, so each keeps its name as alt
						    text and the list says what it is — together that is the whole
						    of what a screen reader gets from this. */}
						<div className={styles.cluster}>
							{/* Wires first so the discs paint over their ends. The viewBox
							    matches the container's 5:4, so nothing is distorted. */}
							<svg
								className={styles.wires}
								viewBox="0 0 100 88"
								aria-hidden
								focusable="false"
							>
								{sources.map((source) => (
									<path key={source.file} d={wire(source)} />
								))}
							</svg>

							<ul
								className={styles.orbit}
								aria-label="Remote sources Companion can fetch from"
							>
								{sources.map(({ file, name, x, y, mark }) => (
									<li
										key={file}
										style={
											{
												left: `${x}%`,
												top: `${y}%`,
												'--mark': `${mark}%`,
											} as React.CSSProperties
										}
									>
										<img
											src={`img/${file}`}
											alt={name}
											width={28}
											height={28}
										/>
									</li>
								))}
							</ul>

							<div className={styles.clusterCore}>
								<img src="img/uppy.svg" alt="Uppy" width={40} height={40} />
							</div>
						</div>
					</section>
				</div>

				{/* -------------------------------------------------- Capabilities */}
				<section className={styles.section}>
					<div className={styles.sectionHead}>
						<p className={styles.eyebrow}>What ships with it</p>
						<Heading as="h2">The parts you’d otherwise build twice</Heading>
					</div>

					<ul className={styles.capabilities}>
						{capabilities.map(({ Icon, title, body }) => (
							<li key={title}>
								<Icon aria-hidden />
								<div>
									<Heading as="h3">{title}</Heading>
									<p>{body}</p>
								</div>
							</li>
						))}
					</ul>
				</section>

				{/* ------------------------------------------------------ Provenance */}
				{/* The page's own section signature — pink eyebrow, ink-900 heading,
				    ink-600 prose — at a smaller heading step, above a rule.
				
				    The card on the right draws the division of labour the paragraph
				    describes: two owned lanes with a file crossing them. */}
				<section className={`${styles.section} ${styles.provenance}`}>
					<div>
						<p className={styles.eyebrow}>Who makes Uppy</p>
						<Heading as="h2">Made by Transloadit</Heading>
						<p>
							Uppy is the open-source file uploader created and maintained by{' '}
							<Link href="https://transloadit.com/">Transloadit</Link>. We
							originally built it to solve browser-upload problems reported by
							Transloadit customers, then released it under the MIT License for
							everyone to use. Uppy works with many upload backends; with
							Transloadit, it is the official browser uploader and provides
							first-party support for resumable uploads, remote sources, and
							Assembly progress.
						</p>
					</div>

					<figure className={styles.lineage}>
						{/* Two territories with one line running through them: Uppy uploads
						    from the browser, then hands the file to Transloadit, which
						    resizes, encodes and delivers it. Not "the file arrives at
						    Transloadit" — that reading is what the lanes exist to prevent. */}
						<div className={styles.line}>
							{lanes.map(({ owner, logo, steps }) => (
								<div
									key={owner}
									className={styles.lineLane}
									data-owner={owner}
									// Where the file rests when motion is off — the lane's last
									// step, so the still frame reads as work completed.
									style={
										{
											'--park': `${steps[steps.length - 1].at}%`,
										} as React.CSSProperties
									}
								>
									{/* Mark then rail, the same way round in both lanes: each reads
									    "[who] — [what they do]". */}
									<span className={styles.lineLogo}>
										<img {...logo} />
									</span>

									<span className={styles.lineRail}>
										{steps.map(({ label, at }) => (
											<span
												key={label}
												className={styles.lineStation}
												style={
													{
														'--at-pos': `${at}%`,
														'--at-frac': at / 100,
													} as React.CSSProperties
												}
											>
												<i />
												<em>{label}</em>
											</span>
										))}

										<span className={styles.lineFile} aria-hidden>
											<svg viewBox="0 0 16 16">
												<path
													d="M3.5 1.5h5l4 4v9a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
													fill="currentColor"
												/>
												<path d="M8.5 1.5v4h4" fill="rgb(255 255 255 / 45%)" />
											</svg>
										</span>
									</span>
								</div>
							))}
						</div>

						<figcaption className={styles.srOnly}>
							Uppy uploads a file from the browser, then hands it to
							Transloadit, which resizes, encodes and delivers it in the cloud.
						</figcaption>
					</figure>
				</section>

				{/* ------------------------------------------------------- Closing */}
				{/* Inside <main>: left as a sibling it was page content sitting outside
				    every landmark, so landmark navigation skipped straight past it. */}
				<section className={styles.closing}>
					<div className={styles.closingInner}>
						<Heading as="h2">Start uploading in a minute</Heading>
						<p>One npm install, one plugin, and files are moving.</p>
						<div className={styles.actions}>
							<Link className={styles.primary} to="/docs/quick-start">
								Get started
								<svg viewBox="0 0 24 24" className={styles.chevron} aria-hidden>
									<path
										d="m9 6 6 6-6 6"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</Link>
						</div>
					</div>
				</section>
			</main>
		</Layout>
	);
}
