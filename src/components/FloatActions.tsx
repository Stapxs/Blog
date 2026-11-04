import { ArrowUp, Music } from 'pixelarticons/react';
import styles from './FloatActions.module.css';

interface Props {
	/** 显示「回到顶部」按钮（仅文章页开启）。 */
	backToTop?: boolean;
}

/**
 * 页面右下角悬浮操作区（横排方形按钮）。
 * 必须作为 main 之后的 body 直接子元素渲染（见 Root.astro）：
 * 横向贴页面右缘；纵向 sticky 悬浮于视口底部，
 * 自然位置经负 margin 拉回 main 底边缘 —— 最多只显示到 main 的最底部。
 *
 * 回到顶部按钮带 main 滚动进度指示（由 Root.astro 模块脚本驱动）：
 * 2px 描边沿按钮周缘顺时针行进。
 */
export default function FloatActions({ backToTop = false }: Props) {
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
						{/* pathLength=100：dashoffset 即剩余长度（100=空，0=画满）；
						    路径自左上角顺时针一圈。注意按钮里还有图标 svg ——
						    脚本靠 data-backtop-path 精确命中本 path，别用标签选择器 */}
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
