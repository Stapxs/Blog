import PageTitle from '../PageTitle';
import styles from './EnvView.module.css';

/** .env 页：站点元信息，以环境变量的形式输出 */
export default function EnvView() {
	const env: Array<[string, string]> = [
		['NAME', '林槐的杂货铺'],
		['OWNER', 'Stapx Steve'],
		['HOMEPAGE', 'https://stapxs.cn'],
		['DESCRIPTION', '要来点什么吗 QWQ'],
		['AVATAR', 'https://blog.stapxs.cn/usr/uploads/2020/03/3664075920.png'],
	];

	return (
		<main data-boot="main">
			<PageTitle>.env</PageTitle>
			<div data-boot="cmd">
				<span className="cmd-prompt">&gt;</span> <span className="cmd-name">cat</span>{' '}
				<span className="cmd-arg">.env</span>
			</div>
			<div className={styles.env} data-boot="rest">
				{env.map(([key, value]) => (
					<div key={key} className={styles.line}>
						<span className={styles.key}>{key}</span>
						<span className={styles.eq}>=</span>
						<span className={styles.value}>{value}</span>
					</div>
				))}
			</div>
		</main>
	);
}
