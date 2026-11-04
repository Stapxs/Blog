import type { ReactNode } from 'react';
import PageTitle from '../PageTitle';
import PostMusic from '../PostMusic';
import styles from './BlogPostView.module.css';
import type { SongBrief } from '../../scripts/songDetail';

interface Props {
	/** Big location heading shown at the top of the prose column (e.g. "About"). */
	location?: string;
	title: string;
	author?: string;
	/** 本地格式化日期 YYYY-MM-DD（由路由层 format 好）。 */
	pubDate: string;
	/** 本地格式化日期 YYYY-MM-DD。 */
	updatedDate?: string;
	wordCount?: number;
	/** 关联歌曲（frontmatter music 字段，构建期取好）：日期行下方的播放条。 */
	song?: SongBrief;
	children: ReactNode;
}

export default function BlogPostView({
	location,
	title,
	author,
	pubDate,
	updatedDate,
	wordCount,
	song,
	children,
}: Props) {
	return (
		<main data-boot="main">
			<article>
				<div className={styles.prose}>
					{location && <PageTitle>{location}</PageTitle>}
					<div data-boot="cmd">
						<span className="cmd-prompt">&gt;</span> <span className="cmd-name">mdcat</span>{' '}
						<span className="cmd-arg">'{title}.md'</span>
					</div>
					<div className={styles.content} data-boot="rest">
						<div className={styles.titleBlock}>
							<h2>{title}</h2>
							<div className={styles.meta}>
								{author && (
									<>
										<span className={styles.author}>{author}</span>
										<span className={styles.sep}>|</span>
									</>
								)}
								<span>
									{pubDate}
									{updatedDate && ` (编辑于 ${updatedDate})`}
								</span>
								{typeof wordCount === 'number' && (
									<>
										<span className={styles.sep}>|</span>
										<span>{wordCount} 字</span>
									</>
								)}
							</div>
							{song && <PostMusic song={song} />}
							<hr />
						</div>
						{children}
					</div>
				</div>
			</article>
		</main>
	);
}
