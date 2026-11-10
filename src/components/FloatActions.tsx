import { ArrowUp, Bulletlist, Music } from 'pixelarticons/react';
import styles from './FloatActions.module.css';
import type { TocItem } from '../scripts/toc';

interface Props {
	/** 显示「回到顶部」按钮 */
	backToTop?: boolean;
	/** 文章目录 */
	toc?: TocItem[];
}

/**
 * 悬浮操作区
 */
export default function FloatActions({ backToTop = false, toc }: Props) {
	const hasToc = (toc?.length ?? 0) > 0;
	return (
		<div className={styles.dock} data-boot="dock">
			{backToTop && (
				<button
					type="button"
					id="back-to-top"
					className={`${styles.button} ${styles.top}`}
					aria-label="回到顶部"
					title="回到顶部"
				>
					<ArrowUp width={24} height={24} aria-hidden="true" />
					<svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
						<path
							data-backtop-path
							d="M1 1H99V99H1Z"
							pathLength={100}
							strokeDasharray={100}
							strokeDashoffset={100}
						/>
					</svg>
				</button>
			)}
			{hasToc && (
				<button
					type="button"
					id="toc-toggle"
					className={`${styles.button} ${styles.toc}`}
					aria-label="目录"
					title="目录"
					aria-expanded="false"
					aria-controls="toc-panel"
				>
					<Bulletlist width={24} height={24} aria-hidden="true" />
				</button>
			)}
			<button
				type="button"
				id="music-toggle"
				className={`${styles.button} ${styles.music}`}
				aria-label="音乐播放器"
				title="音乐播放器"
				aria-expanded="false"
				aria-controls="music-panel"
			>
				<Music width={24} height={24} aria-hidden="true" />
			</button>
		</div>
	);
}
