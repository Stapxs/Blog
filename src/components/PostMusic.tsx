/* 文章页关联歌曲组件：红色边框的信息条
 * [封面] [曲名(翻译名) / 作者] …… [播放]
 * 播放按钮：歌曲信息烘在 data-* 上，点播见 musicPlayer.ts 全局委托 */

import { Play } from 'pixelarticons/react';
import styles from './PostMusic.module.css';
import type { SongBrief } from '../scripts/songDetail';

interface Props {
	song: SongBrief;
}

export default function PostMusic({ song }: Props) {
	return (
		<div className={styles.box}>
			<img
				className={styles.cover}
				src={song.cover}
				alt=""
				loading="lazy"
				decoding="async"
			/>
			<div className={styles.info}>
				<div className={styles.nameLine}>
					<span className={styles.name}>{song.name}</span>
					{song.tns && <span className={styles.tns}>({song.tns})</span>}
				</div>
				<div className={styles.artists}>{song.artists}</div>
			</div>
			<button
				type="button"
				className={styles.play}
				data-song-id={song.id}
				data-song-name={song.name}
				data-song-tns={song.tns ?? undefined}
				data-song-artist={song.artists}
				data-song-cover={song.cover}
				aria-label={`播放 ${song.name}`}
				title="播放"
			>
				<Play width={28} height={28} aria-hidden="true" />
			</button>
		</div>
	);
}
