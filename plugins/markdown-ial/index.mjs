/**
 * Kramdown 兼容的行内属性列表（IAL）插件
 *
 *   ![图](a.png){: style="float:right; width:200px"}
 *   ![头像](b.png){: .rounded #hero-img}
 *   [链接](/about/){: .btn data-x="1"}
 *
 * 注意：.md 的渲染结果缓存在 .astro/data-store.json 与
 * node_modules/.astro/data-store.json，改完本插件后需删掉两者再构建。
 */

/** IAL 文本 */
const IAL_RE = /^[ \t\r\n]*\{:([^}]*)\}/;

/** class / id 名的合法字符 */
const NAME_RE = /^[\w-]+/;
/** 属性键的合法字符（含 data-* 的连字符） */
const KEY_RE = /^[\w:.-]+/;

/** 智能标点把引号转成弯引号（“”‘’），解析前还原成直引号 */
const CURLY_QUOTES = /[“”]/g;
const CURLY_SINGLE = /[‘’]/g;

/**
 * 解析 IAL 内容：空白分隔的 `.class` / `#id` / `key="value"` / `key=value` / `key`
 * @param {string} body
 * @returns {{ className: string[], id?: string } & Record<string, string> | null}
 * 无任何有效属性或语法坏时返回 null（整体按字面文本处理）
 */
function parseIAL(body) {
	const s = body.replace(CURLY_QUOTES, '"').replace(CURLY_SINGLE, "'").trim();
	/** @type {Record<string, any>} */
	const attrs = { className: [] };
	let has = false;
	let i = 0;
	while (i < s.length) {
		while (i < s.length && /\s/.test(s[i])) i++;
		if (i >= s.length) break;
		if (s[i] === '.') {
			const m = NAME_RE.exec(s.slice(i + 1));
			if (!m) return null;
			attrs.className.push(m[0]);
			i += 1 + m[0].length;
			has = true;
		} else if (s[i] === '#') {
			const m = NAME_RE.exec(s.slice(i + 1));
			if (!m) return null;
			attrs.id = m[0];
			i += 1 + m[0].length;
			has = true;
		} else {
			const km = KEY_RE.exec(s.slice(i));
			if (!km) return null;
			i += km[0].length;
			let val = '';
			if (s[i] === '=') {
				i++;
				if (s[i] === '"' || s[i] === "'") {
					const q = s[i++];
					const end = s.indexOf(q, i);
					if (end === -1) return null;
					val = s.slice(i, end);
					i = end + 1;
				} else {
					const vm = /^\S+/.exec(s.slice(i));
					if (!vm) return null;
					val = vm[0];
					i += vm[0].length;
				}
			}
			attrs[km[0]] = val;
			has = true;
		}
	}
	return has ? attrs : null;
}
/** 插件本体 */
export const mdIal = {
	name: 'stapxs-md-ial',
	element: {
		// Rust 侧只把 <img> / <a> 节点送进来
		filter: ['img', 'a'],
		/**
		 * @param {any} node
		 * @param {any} ctx
		 */
		visit(node, ctx) {
			const parent = ctx.parent(node);
			const idx = ctx.indexOf(node);
			if (!parent || idx === undefined) return;

			const next = parent.children?.[idx + 1];
			if (next?.type !== 'text') return;
			const m = IAL_RE.exec(next.value);
			if (!m) return;
			const attrs = parseIAL(m[1]);
			if (!attrs) return;

			// 合并属性（class 追加，其余直接设置）
			const extraClasses = attrs.className.concat(
				typeof attrs.class === 'string' && attrs.class
					? attrs.class.trim().split(/\s+/)
					: [],
			);
			const classes = [
				...(node.properties?.className ?? []),
				...extraClasses,
			];
			if (classes.length) ctx.setProperty(node, 'className', classes);
			for (const [k, v] of Object.entries(attrs)) {
				if (k === 'className' || k === 'class') continue;
				ctx.setProperty(node, k, v);
			}

			// 吃掉文本节点里的 IAL 部分，其余文字保留
			const rest = next.value.slice(m[0].length);
			if (rest === '') ctx.removeNode(next);
			else ctx.setProperty(next, 'value', rest);
		},
	},
};
