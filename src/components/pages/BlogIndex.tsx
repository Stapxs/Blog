import FormattedDate from '../FormattedDate';
import styles from './BlogIndex.module.css';

export interface BlogIndexPost {
	title: string;
	url: string;
	/** ISO date string. */
	pubDate: string;
	/** Optimized hero image URL (already passed through `getImage`). */
	heroUrl?: string;
	heroWidth?: number;
	heroHeight?: number;
}

interface Props {
	posts: BlogIndexPost[];
}

export default function BlogIndex({ posts }: Props) {
	return (
		<main>
			<section>
				<ul className={styles.list}>
					{posts.map((post) => (
						<li key={post.url}>
							<a href={post.url}>
								{post.heroUrl && (
									<img
										src={post.heroUrl}
										width={post.heroWidth ?? 720}
										height={post.heroHeight ?? 360}
										alt=""
										loading="lazy"
										decoding="async"
									/>
								)}
								<h4 className={styles.title}>{post.title}</h4>
								<p className={styles.date}>
									<FormattedDate date={post.pubDate} />
								</p>
							</a>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
