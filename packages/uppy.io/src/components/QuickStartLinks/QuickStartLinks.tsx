import React from 'react';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

import IconNextjs from '../../../static/img/nextjs.svg';
import IconReact from '../../../static/img/react.svg';
import IconVue from '../../../static/img/vue.svg';
import IconSvelte from '../../../static/img/svelte.svg';
import IconAngular from '../../../static/img/angular.svg';
import IconReactRouter from '../../../static/img/react-router.svg';

import styles from './styles.module.css';

type Props = {
	items: Array<{
		name: string;
		description: string;
		link: string;
		icon?: React.ReactNode;
	}>;
};

export const QuickStartLinks = (props: Props) => {
	return (
		<section className={styles.section}>
			{props.items.map((item) => (
				<Link to={item.link}>
					<div className={styles.item}>
						<Heading as="h2">{item.name}</Heading>
						<p>{item.description}</p>
					</div>
				</Link>
			))}
		</section>
	);
};

export const Frameworks = () => {
	return (
		<section className={styles.section}>
			<Link to="/docs/nextjs">
				<div data-framework="nextjs" className={styles.item}>
					<IconNextjs />
					<div>
						<Heading as="h2">Next.js</Heading>
						<p>For App Router or Pages Router</p>
					</div>
				</div>
			</Link>

			<Link to="/docs/reactrouter">
				<div data-framework="reactrouter" className={styles.item}>
					<IconReactRouter />
					<div>
						<Heading as="h2">React Router</Heading>
						<p>Formerly known as Remix</p>
					</div>
				</div>
			</Link>

			<Link to="/docs/sveltekit">
				<div data-framework="svelte" className={styles.item}>
					<IconSvelte />
					<div>
						<Heading as="h2">SvelteKit</Heading>
						<p>The Svelte meta framework</p>
					</div>
				</div>
			</Link>

			<Link to="/docs/react">
				<div data-framework="react" className={styles.item}>
					<IconReact />
					<div>
						<Heading as="h2">React</Heading>
						<p>For Single Page Apps</p>
					</div>
				</div>
			</Link>

			<Link to="/docs/vue">
				<div data-framework="vue" className={styles.item}>
					<IconVue />
					<div>
						<Heading as="h2">Vue</Heading>
					</div>
				</div>
			</Link>

			<Link to="/docs/svelte">
				<div data-framework="svelte" className={styles.item}>
					<IconSvelte />
					<div>
						<Heading as="h2">Svelte</Heading>
					</div>
				</div>
			</Link>

			<Link to="/docs/angular">
				<div data-framework="angular" className={styles.item}>
					<IconAngular />
					<div>
						<Heading as="h2">Angular</Heading>
					</div>
				</div>
			</Link>
		</section>
	);
};
