import type { CSSProperties } from 'react';
import {
	ChevronRight,
	Collapse,
	Copy,
	Expand,
	Pause,
	Play,
	Shuffle,
	Sparkle,
} from 'pixelarticons/react';
import PageTitle from '../PageTitle';
import type { Quote } from '../../scripts/quotesData';
import styles from './QuotesView.module.css';

interface Props {
	quotes: Quote[];
}

/* 年份 chip 的配色（按年份倒序循环取色） */
const YEAR_COLORS = [
	'var(--green)',
	'var(--blue)',
	'var(--orange)',
	'var(--pink)',
	'var(--purple)',
	'var(--yellow)',
	'var(--red)',
];

export default function QuotesView({ quotes }: Props) {
	const total = quotes.length;
	const years = [...new Set(quotes.map((q) => q.year))].sort((a, b) => b - a);
	const yearCount = (y: number) => quotes.filter((q) => q.year === y).length;
	const maxCount = Math.max(...years.map(yearCount));
	const minYear = years[years.length - 1];
	const maxYear = years[0];

	const initial =
		quotes.find((q) => q.text.includes('夜、星空与晚风')) ?? quotes[0];

	return (
		<main data-boot="main">
			<PageTitle>quotes</PageTitle>
			<div data-boot="cmd">
				<span className="cmd-prompt">&gt;</span>{' '}
				<span className="cmd-name">shuf</span>{' '}
				<span className="cmd-dir">~/quotes/linhuai.txt</span>{' '}
				<span className="cmd-flag">-n</span>{' '}
				<span className="cmd-arg">1</span>
			</div>

			<div data-boot="rest">
				{/* ===== 抽取机 ===== */}
				<div
					className={styles.machine}
					data-quote-machine
					data-quotes={JSON.stringify(quotes)}
				>
					<div className={styles.head}>
						<span className={styles.brand}>
							<Sparkle width={16} height={16} aria-hidden="true" />
							碎碎念
							<span className={styles.ver}>v1.0</span>
						</span>
						<span className={styles.headRight}>
							<span className={styles.counter} data-quote-counter>
								#{String(initial.id).padStart(3, '0')} / {total}
							</span>
							<button
								type="button"
								className={styles.iconBtn}
								data-quote-fullscreen
								aria-pressed="false"
								aria-label="全屏显示"
								title="全屏显示（F）"
							>
								<Expand data-fs-enter width={18} height={18} aria-hidden="true" />
								<Collapse data-fs-exit width={18} height={18} aria-hidden="true" />
							</button>
						</span>
					</div>

					<div className={styles.stage} data-quote-stage>
						<canvas className={styles.stars} data-quote-stars aria-hidden="true" />
						<div className={styles.stageInner}>
							<p className={styles.quote}>
								<span className={styles.bracket} aria-hidden="true">『</span>
								<span data-quote-text>{initial.text}</span>
								<span className={styles.bracket} aria-hidden="true">』</span>
							</p>
							<div className={styles.meta} data-quote-meta>
								<span className={styles.from} data-quote-from>
									{initial.from ? `—— ${initial.from}` : ''}
								</span>
								<span className={styles.date} data-quote-date>
									{initial.date.replace('-', '.')}
								</span>
							</div>
						</div>
					</div>

					<div className={styles.autoTrack} data-quote-auto-track hidden>
						<div className={styles.autoBar} data-quote-auto-bar />
					</div>

					<div className={styles.controls}>
						<button type="button" className={styles.draw} data-quote-draw>
							<Shuffle width={20} height={20} aria-hidden="true" />
							抽取一条
							<kbd className={styles.kbd}>Space</kbd>
						</button>
						<button type="button" className={styles.btn} data-quote-copy>
							<Copy width={16} height={16} aria-hidden="true" />
							<span data-copy-label>复制</span>
						</button>
						<button
							type="button"
							className={styles.btn}
							data-quote-auto
							aria-pressed="false"
							title="每 6 秒自动抽一条"
						>
							<Play data-auto-play width={16} height={16} aria-hidden="true" />
							<Pause data-auto-pause width={16} height={16} aria-hidden="true" />
							自动
						</button>
					</div>

					<div className={styles.filters} role="group" aria-label="按年份筛选">
						<span className={styles.filterLabel}>年份</span>
						<button
							type="button"
							className={styles.chip}
							data-quote-year="all"
							data-active
						>
							全部<span className={styles.chipCount}>{total}</span>
						</button>
						{years.map((y, i) => (
							<button
								type="button"
								className={styles.chip}
								data-quote-year={String(y)}
								style={{ '--chip': YEAR_COLORS[i % YEAR_COLORS.length] } as CSSProperties}
							>
								{y}
								<span className={styles.chipCount}>{yearCount(y)}</span>
								<span
									className={styles.chipBar}
									style={{ width: `${Math.round((yearCount(y) / maxCount) * 100)}%` }}
									aria-hidden="true"
								/>
							</button>
						))}
					</div>

					<div className={styles.foot}>
						<span data-quote-stats>
							共 {total} 条
						</span>
						<a className={styles.sourceLink} href="/archives/ss-ana">
							查看所有
							<ChevronRight width={14} height={14} aria-hidden="true" />
						</a>
					</div>
				</div>
			</div>
		</main>
	);
}
