import { Chart, Github, Rss } from 'pixelarticons/react';
import HeaderLink from './HeaderLink';
import styles from './Header.module.css';

interface Props {
	siteTitle: string;
	/** Current page pathname; used to highlight the active nav link. */
	currentPath: string;
}

export default function Header({ siteTitle, currentPath }: Props) {
	return (
		<header className={styles.header}>
			<nav className={styles.nav}>
				<h2 className={styles.title}>
					<a href="/">{siteTitle} -&gt; /林槐的杂货铺</a>
				</h2>
        <div className={styles.internalLinks}>
          &gt; cd
					<HeaderLink href="/" currentPath={currentPath}>
						./Blog
					</HeaderLink>
					<HeaderLink href="/about" currentPath={currentPath}>
						./About
					</HeaderLink>
				</div>
				<div className={styles.socialLinks}>
					<a href="https://status.stapxs.cn/share/lK6BSgpK8QJbYmke/blog.stapxs.cn" target="_blank">
						<span className="sr-only">Site status / 统计</span>
						<Chart width={24} height={24} aria-hidden="true" />
					</a>
					<a href="/rss.xml">
						<span className="sr-only">RSS 订阅</span>
						<Rss width={24} height={24} aria-hidden="true" />
					</a>
					<a href="https://github.com/Stapxs" target="_blank">
						<span className="sr-only">GitHub</span>
						<Github width={24} height={24} aria-hidden="true" />
					</a>
				</div>
			</nav>
		</header>
	);
}
