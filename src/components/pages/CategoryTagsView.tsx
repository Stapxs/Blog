import PageTitle from '../PageTitle';
import styles from './CategoryTagsView.module.css';

export interface CategoryTagItem {
	name: string;
	count: number;
}

interface Props {
	/** categories | tags */
	mode: 'categories' | 'tags';
	items: CategoryTagItem[];
}

/**
 * 分类 / 标签总览页：ls | awk | sort | uniq -c 管线风格，
 * 点击跳转搜索页按字段筛选。
 *
 * 命令行彩蛋的语义是严谨的（在真实 shell 里就是这么得到这页数据的）：
 *   ls -al                       列出 archives/ 下全部条目
 *   awk 'NR>1 {print $N}'        跳过 total 行，取第 N 列
 *   sort | uniq -c               排序 + 计数去重（输出 "  3 生活"）
 *   awk '{printf "%s(%d)\n", $2, $1}'
 *                                把 "count name" 重排成 "name(count)"
 */
export default function CategoryTagsView({ mode, items }: Props) {
	const isCategories = mode === 'categories';
	const prefix = isCategories ? 'cat:' : 'tag:';
	const column = isCategories ? '$2' : '$5';
	return (
		<main data-boot="main">
			<PageTitle>{isCategories ? 'Category' : 'Tags'}</PageTitle>
			<div data-boot="cmd">
				<span className="cmd-prompt">&gt;</span> <span className="cmd-name">ls</span>{' '}
				<span className="cmd-flag">-al</span> <span className="cmd-name">awk</span>{' '}
				<span className="cmd-string">'NR&gt;1 {'{print '}{column}{'}'}'</span>{' '}
				<span className="cmd-flag">|</span> <span className="cmd-name">sort</span>{' '}
				<span className="cmd-flag">|</span> <span className="cmd-name">uniq</span>{' '}
				<span className="cmd-flag">-c</span> <span className="cmd-flag">|</span>{' '}
				<span className="cmd-name">awk</span>{' '}
				<span className="cmd-string">'{'{printf "%s(%d)\\n", $2, $1}'}'</span>
			</div>
			<ul className={styles.cloud} data-boot="rest">
				{items.map((item) => (
					<li key={item.name}>
						<a href={`/search?q=${encodeURIComponent(prefix + item.name)}`}>
							<span className={styles.name}>{item.name}</span>
							<span className={styles.count}>({item.count})</span>
						</a>
					</li>
				))}
			</ul>
		</main>
	);
}
