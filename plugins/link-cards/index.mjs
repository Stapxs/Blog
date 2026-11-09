/**
 * 链接卡片插件
 *
 * 注意：.md 的渲染结果缓存在 node_modules/.astro/data-store.json
 * 改完本插件后需删掉该文件再构建才会重新渲染未变更的 .md
 */
import { cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchGitHub, fetchGitHubCard } from './github.mjs';
import { matchBilibili, fetchBilibiliCard } from './bilibili.mjs';
import { ASSET_DIR } from './assets.mjs';
import { flushCache } from './cache.mjs';

/** 调试开关：LC_DEBUG=1 时输出转换决策过程 */
const DEBUG = !!process.env.LC_DEBUG;
/** @param {string} msg @param {unknown[]} args */
const debug = (msg, ...args) => DEBUG && console.log(`[link-cards] ${msg}`, ...args);

/** 行内可忽略字符（空白 / 标点 / 分隔符，不含换行） */
const IGNORABLE_CHARS = ' \\t:：,，.。、;；!！?？/／\\-—–~=+|│()（）[\\]【】「」『』';
/** 锚点前一个文本节点：最后一个换行之后只剩可忽略字符（或整个节点都是） */
const PREV_OK = new RegExp(`(?:^|[\\n\\r])[${IGNORABLE_CHARS}]*$`);
/** 锚点后一个文本节点：第一个换行之前只剩可忽略字符（或到节点末尾都是） */
const NEXT_OK = new RegExp(`^[${IGNORABLE_CHARS}]*(?:[\\n\\r]|$)`);
/** 行尾紧随锚点的可忽略字符（用于清理换行前残留的「：」「。」等） */
const TRAILING_IGN = new RegExp(`[${IGNORABLE_CHARS}]+$`);
const LEADING_IGN = new RegExp(`^[${IGNORABLE_CHARS}]+(?=[\\n\\r])`);

/** @typedef {import('./github.mjs').CardData} CardData */

/** @param {string} tag @param {Record<string, any>} props @param {any[]} children */
function el(tag, props, children) {
	return { type: 'element', tagName: tag, properties: props, children };
}

/** @param {string} value */
function text(value) {
	return { type: 'text', value };
}

/**
 * 构建卡片 hast 节点
 * @param {string} href 原链接（保留作者书写的形式）
 * @param {CardData} data
 */
function buildCard(href, data) {
	const isGh = data.type === 'gh';
	const main = data.cover ?? data.icon;
	const mini = data.cover ? data.icon : null;

	return el(
		'a',
		{
			className: ['lc', isGh ? 'lc-gh' : 'lc-bili'],
			href,
			target: '_blank',
			rel: 'noopener noreferrer',
		},
		[
			main &&
				el('img', {
					className: ['lc-main'],
					src: main,
					alt: '',
					loading: 'lazy',
					decoding: 'async',
				}),
			el('span', { className: ['lc-info'] }, [
				el('span', { className: ['lc-name'] }, [
					mini &&
						el('img', {
							className: ['lc-mini'],
							src: mini,
							alt: '',
							width: 96,
							height: 96,
							loading: 'lazy',
							decoding: 'async',
						}),
					el('span', { className: ['lc-title'] }, [text(data.name)]),
				].filter(Boolean)),
				data.desc &&
					el('span', { className: ['lc-desc'] }, [text(data.desc)]),
			].filter(Boolean)),
			el('span', { className: ['lc-go'] }, [
				el(
					'span',
					{
						className: [
							isGh
								? 'pixelart-icons-font-external-link'
								: 'pixelart-icons-font-play',
						],
						'aria-hidden': 'true',
					},
					[],
				),
			]),
		].filter(Boolean),
	);
}

/**
 * 锚点是否「独占一行」
 */
function aloneOnLine(p, idx) {
	const kids = p.children ?? [];
	const prev = kids[idx - 1];
	const next = kids[idx + 1];
	if (prev?.type === 'text' && !PREV_OK.test(prev.value)) return false;
	if (next?.type === 'text' && !NEXT_OK.test(next.value)) return false;
	return true;
}

/**
 * 锚点是否在 GitHub Alerts（blockquote.md-alert）里
 * Alert 内容始终保持原文，不升级卡片
 * @param {any} node 锚点或其父节点
 * @param {any} ctx
 */
function inMdAlert(node, ctx) {
	for (let cur = ctx.parent(node); cur; cur = ctx.parent(cur)) {
		if (cur.type === 'element' && cur.tagName === 'blockquote') {
			const cls = cur.properties?.className;
			const list = Array.isArray(cls)
				? cls
				: String(cls ?? '').split(/\s+/);
			if (list.includes('md-alert')) return true;
		}
	}
	return false;
}

/** 插件本体 */
export const linkCards = {
	name: 'stapxs-link-cards',
	element: {
		// Rust 侧只把 <a> 节点送进来
		filter: ['a'],
		/**
		 * @param {any} node
		 * @param {any} ctx
		 */
		async visit(node, ctx) {
			const href = node.properties?.href;
			if (typeof href !== 'string') return;

			// 只在正文段落里升级卡片（标题 / 列表里的链接保持原样）
			const p = ctx.parent(node);
			if (!p || p.type !== 'element' || p.tagName !== 'p') {
				debug('跳过（非段落）：', href, '→', p?.tagName);
				return;
			}
			// GitHub Alerts 的内容始终保持原文，不升级卡片
			if (inMdAlert(p, ctx)) {
				debug('跳过（md-alert 内）：', href);
				return;
			}
			const gh = matchGitHub(href);
			const bili = gh ? null : matchBilibili(href);
			if (!gh && !bili) return;

			const idx = ctx.indexOf(node);
			if (idx === undefined || !aloneOnLine(p, idx)) {
				debug('跳过（非独占一行）：', href);
				return;
			}

			let data;
			try {
				data = gh
					? await fetchGitHubCard(gh)
					: await fetchBilibiliCard(bili);
			} catch (err) {
				// 无缓存可回退的抓取失败：保留原始链接
				debug('跳过（抓取失败）：', href, err?.message ?? err);
				return;
			}
			if (!data) {
				debug('跳过（无数据，如 404）：', href);
				return;
			}
			debug('成卡：', href, '→', data.name);

			// 清掉行内紧随链接的标点（「：」「。」等），让卡片独占整行
			const kids = p.children ?? [];
			const prev = kids[idx - 1];
			const next = kids[idx + 1];
			if (prev?.type === 'text' && TRAILING_IGN.test(prev.value)) {
				ctx.setProperty(prev, 'value', prev.value.replace(TRAILING_IGN, ''));
			}
			if (next?.type === 'text' && LEADING_IGN.test(next.value)) {
				ctx.setProperty(next, 'value', next.value.replace(LEADING_IGN, ''));
			}

			ctx.replaceNode(node, buildCard(href, data));
		},
	},
};

export function linkCardsAssets() {
	return {
		name: 'link-cards-assets',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				flushCache();
				if (!existsSync(ASSET_DIR)) return;
				const dist = join(fileURLToPath(dir), 'link-cards');
				await cp(ASSET_DIR, dist, { recursive: true });
				const n = (await readdir(dist)).length;
				logger.info(`已同步 ${n} 个链接卡片图片资产到 dist`);
			},
		},
	};
}
