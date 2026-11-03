import type { ReactNode } from 'react';
import FormattedDate from '../FormattedDate';
import styles from './BlogPostView.module.css';

interface Props {
	title: string;
	/** ISO date string. */
	pubDate: string;
	/** ISO date string. */
	updatedDate?: string;
	/** Optimized hero image URL (already passed through `getImage`). */
	heroUrl?: string;
	heroWidth?: number;
	heroHeight?: number;
	children: ReactNode;
}

export default function BlogPostView({
	title,
	pubDate,
	updatedDate,
	heroUrl,
	heroWidth = 1020,
	heroHeight = 510,
	children,
}: Props) {
	return (
		<main className={styles.main}>
			<article>
				<div className={styles.heroImage}>
					{heroUrl && <img src={heroUrl} width={heroWidth} height={heroHeight} alt="" />}
				</div>
				<div className={styles.prose}>
					<div className={styles.titleBlock}>
						<div className={styles.date}>
							<FormattedDate date={pubDate} />
							{updatedDate && (
								<div className={styles.lastUpdatedOn}>
									Last updated on <FormattedDate date={updatedDate} />
								</div>
							)}
						</div>
						<h1>{title}</h1>
						<hr />
					</div>
					{children}
				</div>
			</article>
		</main>
	);
}
