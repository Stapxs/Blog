import { version } from '../../package.json';
import styles from './Footer.module.css';

export default function Footer() {
	const today = new Date();

	return (
    <footer className={styles.footer}>
      @2020-{today.getFullYear()} Stapx Steve [林槐]
			<span className={styles.sep}>|</span>
			<a rel="nofollow" href="http://beian.miit.gov.cn" target="_blank">苏ICP备2026019464号</a>
			<span className={styles.sep}>|</span>
			v{version}
		</footer>
	);
}
