import { Chart, Github, Moon, Rss, Search, Sun } from 'pixelarticons/react';
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
				<h2 className={styles.title} data-boot="title">
					<a href="/">/var/www/blog.stapxs.cn -&gt; ~/{siteTitle}</a>
				</h2>
        <div className={styles.internalLinks} data-boot="nav">
          <HeaderLink href="." disabled>
						.
          </HeaderLink>
          <HeaderLink href=".." id="history-back">
						..
          </HeaderLink>
          <HeaderLink href="/env">
						.env
					</HeaderLink>
					<HeaderLink href="/" currentPath={currentPath}>
						./Archives
					</HeaderLink>
					<HeaderLink href="/category" currentPath={currentPath}>
						./Category
					</HeaderLink>
					<HeaderLink href="/tags" currentPath={currentPath}>
						./Tags
					</HeaderLink>
					<HeaderLink href="/photos" currentPath={currentPath}>
						./Photos
					</HeaderLink>
					<HeaderLink href="/friends" currentPath={currentPath}>
						./Friends
					</HeaderLink>
					<HeaderLink href="/about" currentPath={currentPath}>
						./About
					</HeaderLink>
				</div>
				<div className={styles.socialLinks} data-boot="icons">
					<button type="button" id="search-toggle" className={styles.iconButton} aria-label="搜索">
						<Search width={24} height={24} aria-hidden="true" />
					</button>
					<button type="button" id="theme-toggle" className={styles.iconButton} aria-label="切换主题">
						<Moon className={styles.iconMoon} width={24} height={24} aria-hidden="true" />
						<Sun className={styles.iconSun} width={24} height={24} aria-hidden="true" />
					</button>
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
