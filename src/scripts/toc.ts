/* ============================================================
 * 文章目录：构建期生成
 * ============================================================ */

import { track } from './analytics';
import { play } from './scramble';

/** render() 返回的标题元数据（MarkdownHeading） */
export interface TocHeading {
	depth: number;
	slug: string;
	text: string;
}

/** 目录树节点 */
export interface TocItem {
	slug: string;
	text: string;
	children: TocItem[];
}

/** 最深解析到 #### */
const MAX_DEPTH = 4;
/** 只解析最大的两级标题 */
const MAX_LEVELS = 2;

export function buildToc(headings: TocHeading[]): TocItem[] {
	/* 只看 #### 及以上的层级，取文章里出现过的最大两级 */
	const depths = [...new Set(headings.map((h) => h.depth))]
		.filter((d) => d >= 1 && d <= MAX_DEPTH)
		.sort((a, b) => a - b)
		.slice(0, MAX_LEVELS);
	if (depths.length === 0) return [];

	const [top, sub] = depths;
	const items: TocItem[] = [];
	let current: TocItem | undefined;
	for (const h of headings) {
		if (h.depth === top) {
			current = { slug: h.slug, text: h.text, children: [] };
			items.push(current);
		} else if (sub !== undefined && h.depth === sub) {
			const item: TocItem = { slug: h.slug, text: h.text, children: [] };
			/* 子级出现在第一个顶级标题前：当顶层平铺 */
			if (current) current.children.push(item);
			else items.push(item);
		}
	}
	return items;
}

/* ============================================================
 *    客户端交互
 * ============================================================ */

/** 标题顶部越过视口这条线（视觉 px）即算「当前小节」 */
const ACTIVE_LINE = 100;

let panel: HTMLElement | null = null;
let toggleBtn: HTMLElement | null = null;
let links: HTMLAnchorElement[] = [];
let targets: (HTMLElement | null)[] = [];
let activeIndex = -1;
let spyPending = false;
let bound = false;

/** a.hash 是百分号编码的（中文标题），解回原文再 getElementById */
const decodeId = (hash: string): string => {
	try {
		return decodeURIComponent(hash);
	} catch {
		return hash;
	}
};

/* 展开态记在 data-open 上（CSS Modules 会哈希类名，属性不会） */
const isOpen = (): boolean => panel?.hasAttribute('data-open') ?? false;

/** 面板打开时的解密入场（与音乐面板同款，只作用于列表） */
function entrance(): void {
	if (!panel) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const list = panel.querySelector<HTMLElement>('[data-hover-list]');
	if (list) play(list, { duration: 900, delay: 300 });
}

function setOpen(open: boolean): void {
	if (!panel || !toggleBtn) return;
	panel.toggleAttribute('data-open', open);
	panel.setAttribute('aria-hidden', String(!open));
	toggleBtn.setAttribute('aria-expanded', String(open));
	if (open) entrance();
}

/**
 * 捕获阶段处理：需赶在 ClientRouter 的 document 冒泡监听之前
 * preventDefault 锚点点击，否则会被它接管成瞬移跳转。
 */
function onDocClick(e: Event): void {
	const target = e.target as HTMLElement | null;
	if (!target || typeof target.closest !== 'function') return;

	/* 目录条目：平滑滚动到标题（顺手关面板） */
	const link = target.closest<HTMLAnchorElement>("#toc-panel a[href^='#']");
	if (link) {
		const heading = document.getElementById(decodeId(link.hash.slice(1)));
		if (heading) {
			e.preventDefault();
			const reduce = window.matchMedia(
				'(prefers-reduced-motion: reduce)',
			).matches;
			heading.scrollIntoView({
				behavior: reduce ? 'auto' : 'smooth',
				block: 'start',
			});
			/* 同步地址栏锚点（replace 不产生历史记录） */
			history.replaceState(history.state, '', link.getAttribute('href'));
			track('toc_jump', { target: link.hash.slice(1).slice(0, 100) });
			setOpen(false);
		}
		return;
	}

	/* 开关按钮 */
	if (target.closest('#toc-toggle')) {
		setOpen(!isOpen());
		return;
	}

	/* 点面板外：关闭（与音乐面板互斥 —— 双方的外点关闭各管各的） */
	if (isOpen() && !target.closest('#toc-panel')) setOpen(false);
}

function onKeyDown(e: KeyboardEvent): void {
	if (e.key === 'Escape' && isOpen()) setOpen(false);
}

/* ---------- 当前小节高亮（滚动监听） ---------- */

function spy(): void {
	spyPending = false;
	let current = -1;
	/* targets 与正文同序：最后一个越过基准线的即当前小节 */
	for (let i = 0; i < targets.length; i++) {
		const el = targets[i];
		if (!el) continue;
		if (el.getBoundingClientRect().top <= ACTIVE_LINE) current = i;
		else break;
	}
	if (current === activeIndex) return;
	activeIndex = current;
	links.forEach((link, i) => {
		if (i === current) link.setAttribute('data-active', '');
		else link.removeAttribute('data-active');
	});
}

function onScroll(): void {
	if (spyPending || links.length === 0) return;
	spyPending = true;
	window.requestAnimationFrame(spy);
}

export function initToc(): void {
	panel = document.getElementById('toc-panel');
	toggleBtn = document.getElementById('toc-toggle');
	links = [];
	targets = [];
	activeIndex = -1;
	if (!panel || !toggleBtn) return;

	links = Array.from(
		panel.querySelectorAll<HTMLAnchorElement>("a[href^='#']"),
	);
	targets = links.map((a) => document.getElementById(decodeId(a.hash.slice(1))));

	if (!bound) {
		bound = true;
		document.addEventListener('click', onDocClick, true);
		document.addEventListener('keydown', onKeyDown);
		window.addEventListener('scroll', onScroll, { passive: true });
	}
	spy();
}
