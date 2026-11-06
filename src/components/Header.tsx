import {
	Archive,
	ArrowLeft,
	Chart,
	Code,
	Folder,
	Github,
	Images,
	Label,
	Monitor,
	Moon,
	Rss,
	Search,
	Sun,
	User,
	Users,
} from 'pixelarticons/react';
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
					<a href="/">
						<span className={styles.titlePrefix}>/var/www/blog.stapxs.cn -&gt; </span>
						~/{siteTitle}
					</a>
				</h2>
			<div className={styles.internalLinks} data-boot="nav">
				<HeaderLink href="." disabled>
					<span className={styles.linkText}>.</span>
				</HeaderLink>
				<HeaderLink href=".." id="history-back">
					<span className={styles.linkText}>..</span>
					<ArrowLeft className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/env">
					<span className={styles.linkText}>.env</span>
					<Code className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/" currentPath={currentPath}>
					<span className={styles.linkText}>./Archives</span>
					<Archive className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/category" currentPath={currentPath}>
					<span className={styles.linkText}>./Category</span>
					<Folder className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/tags" currentPath={currentPath}>
					<span className={styles.linkText}>./Tags</span>
					<Label className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/photos" currentPath={currentPath}>
					<span className={styles.linkText}>./Photos</span>
					<Images className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/friends" currentPath={currentPath}>
					<span className={styles.linkText}>./Friends</span>
					<Users className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
				<HeaderLink href="/about" currentPath={currentPath}>
					<span className={styles.linkText}>./About</span>
					<User className={styles.linkIcon} data-boot="nav-icons" width={24} height={24} aria-hidden="true" />
				</HeaderLink>
			</div>
				<div className={styles.socialLinks} data-boot="icons">
					<button type="button" id="search-toggle" className={styles.iconButton} aria-label="搜索">
						<Search width={24} height={24} aria-hidden="true" />
					</button>
					<button type="button" id="theme-toggle" className={styles.iconButton} aria-label="切换主题">
						<Moon className={styles.iconMoon} width={24} height={24} aria-hidden="true" />
						<Sun className={styles.iconSun} width={24} height={24} aria-hidden="true" />
						<Monitor className={styles.iconSystem} width={24} height={24} aria-hidden="true" />
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
