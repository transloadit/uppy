import React from 'react';
import styles from './browser-window.module.css';

interface BrowserWindowProps {
	children: React.ReactNode;
	className?: string;
}

export const BrowserWindow: React.FC<BrowserWindowProps> = ({
	children,
	className = '',
}) => {
	return (
		<div className={`${styles.browserWindow} ${className}`}>
			{/* Title bar with traffic lights */}
			<div className={styles.titleBar}>
				<div className={styles.trafficLights}>
					<div className={`${styles.trafficLight} ${styles.close}`}></div>
					<div className={`${styles.trafficLight} ${styles.minimize}`}></div>
					<div className={`${styles.trafficLight} ${styles.maximize}`}></div>
				</div>
			</div>

			{/* Content area */}
			<div className={styles.content}>{children}</div>
		</div>
	);
};
