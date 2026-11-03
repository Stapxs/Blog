import PageTitle from '../PageTitle';
import styles from './BlogIndex.module.css';

export interface BlogIndexPost {
	author: string;
	category: string;
	/** 本地格式化日期 YYYY-MM-DD。 */
	pubDate: string;
	title: string;
	url: string;
	/** 最后一个标签（无标签则不渲染）。 */
	lastTag?: string;
}

export interface BlogPagination {
	current: number;
	last: number;
	total: number;
	prevUrl?: string;
	nextUrl?: string;
}

interface Props {
	posts: BlogIndexPost[];
	pagination: BlogPagination;
}

export default function BlogIndex({ posts, pagination }: Props) {
	return (
		<main data-boot="main">
			<PageTitle>Archives</PageTitle>
			<div data-boot="cmd">
				<span className="cmd-prompt">&gt;</span> <span className="cmd-name">ls</span>{' '}
				<span className="cmd-flag">-al</span> <span className="cmd-dir">archives/</span>{' '}
				<span className="cmd-flag">--interactive</span> <span className="cmd-flag">-p</span>{' '}
				<span className="cmd-arg">{pagination.current}</span>
			</div>
			<ul className={styles.list} data-boot="rest" data-hover-list>
				<li className={styles.hoverBar} data-hover-bar aria-hidden="true"></li>
				{posts.map((post) => (
					<li key={post.url}>
						<a href={post.url} className={styles.row}>
							<span className={styles.author}>{post.author}</span>
							<span className={styles.category}>{post.category}</span>
							<span className={styles.date}>{post.pubDate}</span>
							<span className={styles.title}>{post.title}</span>
							{post.lastTag && (<span className={styles.tag}>{post.lastTag}</span>)}
						</a>
					</li>
				))}
			</ul>
			<nav className={styles.pagination} data-boot="rest">
				{pagination.prevUrl ? (
					<a href={pagination.prevUrl}>← prev</a>
				) : (
					<span className={styles.disabled}>← prev</span>
				)}
				<span className={styles.pageInfo}>
					{pagination.current} / {pagination.last}
				</span>
				{pagination.nextUrl ? (
					<a href={pagination.nextUrl}>next →</a>
				) : (
					<span className={styles.disabled}>next →</span>
				)}
			</nav>
		</main>
	);
}
