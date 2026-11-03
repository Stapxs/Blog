import styles from './Footer.module.css';

export default function Footer() {
	const today = new Date();

	return (
		<footer className={styles.footer}>
			&copy; {today.getFullYear()} Stapx Steve [林槐].&nbsp;
			<a rel="nofollow" href="http://beian.miit.gov.cn" target="_blank">苏ICP备2026019464号</a>
		</footer>
	);
}
