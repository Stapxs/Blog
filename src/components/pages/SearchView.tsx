import PageTitle from '../PageTitle';
import styles from './BlogIndex.module.css';

/**
 * 搜索结果页静态壳：结构与列表页同构。
 * 行数据由客户端脚本克隆 [data-search-template] 填充
 * （复用 BlogIndex.module.css，类名哈希与列表页完全一致）。
 */
export default function SearchView() {
	return (
		<main data-boot="main">
			<PageTitle>Search</PageTitle>
			<div data-boot="cmd">
				<span className="cmd-prompt">&gt;</span> <span className="cmd-name">ls</span>{' '}
				<span className="cmd-flag">-al</span> <span className="cmd-dir">archives/</span>{' '}
				<span className="cmd-flag">--interactive</span> <span className="cmd-flag">-q</span>{' '}
				<span className="cmd-arg" data-search-q></span> <span className="cmd-flag">-p</span>{' '}
				<span className="cmd-arg" data-search-p></span>
			</div>
			<ul className={styles.list} data-boot="rest" data-hover-list data-search-list>
				<li className={styles.hoverBar} data-hover-bar aria-hidden="true"></li>
				<li hidden data-search-template>
					<a href="#" className={styles.row}>
						<span className={styles.author} data-f="author"></span>
						<span className={styles.category} data-f="category"></span>
						<span className={styles.date} data-f="date"></span>
						<span className={styles.title} data-f="title"></span>
					</a>
				</li>
			</ul>
			<nav className={styles.pagination} data-boot="rest" data-search-pagination>
				<a data-search-prev href="#" hidden>
					← prev
				</a>
				<span className={styles.disabled} data-search-prev-off>
					← prev
				</span>
				<span className={styles.pageInfo} data-search-info></span>
				<a data-search-next href="#" hidden>
					next →
				</a>
				<span className={styles.disabled} data-search-next-off>
					next →
				</span>
			</nav>
		</main>
	);
}
