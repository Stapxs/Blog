/**
 * GitHub Alerts 语法支持插件
 *
 *   > [!NOTE]
 *   > 内容
 *
 * 支持 NOTE / TIP / IMPORTANT / WARNING / CAUTION（大小写不敏感），
 * 渲染成带语义类的 blockquote。
 * 引用块里的软换行（单回车）会转成 <br>，多行书写的内容保持换行。
 */

const ICONS = {
	NOTE: 'circle-info',
	TIP: 'lightbulb',
	IMPORTANT: 'square-alert',
	WARNING: 'warning-diamond',
	CAUTION: 'stop',
};

/** 类型 → 标题文本（中文） */
const TITLES = {
	NOTE: '提醒',
	TIP: '提示',
	IMPORTANT: '重要',
	WARNING: '警告',
	CAUTION: '危险',
};

/** 标记行：[!TYPE] + 行尾空白 */
const MARK = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/i;

/**
 * 按软换行拆开文本，行与行之间插入 <br>
 * @param {string} value
 */
function linesToNodes(value) {
	const parts = value.split(/\r?\n/);
	/** @type {any[]} */
	const nodes = [];
	for (let i = 0; i < parts.length; i++) {
		if (i > 0)
			nodes.push({ type: 'element', tagName: 'br', properties: {}, children: [] });
		if (parts[i]) nodes.push({ type: 'text', value: parts[i] });
	}
	return nodes;
}

/**
 * 内容区（段落、紧凑列表项等）里的软换行（\n）转成 <br>，
 * 会继续下钻行内元素（a / strong / em …）。
 * @param {any} parent
 * @param {any} ctx
 * @param {any} [skip] 已单独处理过的子节点
 */
function inlineBreaksToBr(parent, ctx, skip) {
	for (const child of parent.children ?? []) {
		if (child === skip) continue;
		if (child.type === 'element') {
			if (child.tagName === 'pre') continue; // 代码里的换行是内容本身
			inlineBreaksToBr(child, ctx, skip);
		} else if (child.type === 'text' && child.value.includes('\n')) {
			ctx.replaceNode(child, linesToNodes(child.value));
		}
	}
}

/**
 * 找到引用块里的内容区并转换其中的软换行。
 * 只处理段落与没有段落的紧凑列表项（td / th 同理）；
 * 块级子节点之间的纯空白文本是结构分隔（不是内容），保持原样，
 * 以免在引用块首尾多出空行。
 * @param {any} parent
 * @param {any} ctx
 * @param {any} [skip] 已单独处理过的子节点
 */
function contentBreaksToBr(parent, ctx, skip) {
	for (const child of parent.children ?? []) {
		if (child === skip) continue;
		if (child.type !== 'element') continue;
		// 代码块（换行是内容）与嵌套引用块（拥有独立的 visit）不碰
		if (child.tagName === 'pre' || child.tagName === 'blockquote') continue;
		const hasPara = (child.children ?? []).some(
			(c) => c.type === 'element' && c.tagName === 'p',
		);
		if (child.tagName === 'p' || (child.tagName === 'li' && !hasPara) ||
			child.tagName === 'td' || child.tagName === 'th') {
			inlineBreaksToBr(child, ctx, skip);
		} else {
			contentBreaksToBr(child, ctx, skip); // ul / ol / 松散 li：继续往下找内容区
		}
	}
}

/** 插件本体 */
export const mdAlerts = {
	name: 'stapxs-md-alerts',
	element: {
		// Rust 侧只把 <blockquote> 节点送进来
		filter: ['blockquote'],
		/**
		 * @param {any} node
		 * @param {any} ctx
		 */
		visit(node, ctx) {
			const p = (node.children ?? []).find(
				(c) => c.type === 'element' && c.tagName === 'p',
			);
			if (!p) return;
			const first = p.children?.[0];
			if (first?.type !== 'text') return;

			const m = first.value.match(MARK);
			if (!m) return;
			const type = m[1].toUpperCase();

			// 标题行
			const title = {
				type: 'element',
				tagName: 'p',
				properties: { className: ['md-alert-title'] },
				children: [
					{
						type: 'element',
						tagName: 'span',
						properties: {
							className: [`pixelart-icons-font-${ICONS[type]}`],
							'aria-hidden': 'true',
						},
						children: [],
					},
					{ type: 'text', value: TITLES[type] },
				],
			};

			// 去掉标记行，剩下内容；多行时直接拆行（注意此时快照还是原文本，
			// 后续遍历要跳过这个节点，避免对同一节点重复下发命令）
			const rest = first.value.slice(m[0].length);
			// 标记行独占一段且该段没有别的内容：整段换成标题，不留空段落
			const others = (p.children ?? []).slice(1);
			const onlyMarker =
				!rest.trim() &&
				others.every((c) => c.type === 'text' && !c.value.trim());

			if (onlyMarker) {
				ctx.replaceNode(p, title);
			} else {
				// 标题行插到引用块最前面
				ctx.insertBefore(p, title);
				if (rest.includes('\n')) {
					ctx.replaceNode(first, linesToNodes(rest));
				} else {
					ctx.setProperty(first, 'value', rest);
				}
			}

			// 其余内容里的软换行也转 <br>
			// （标记段 / 标记文本已单独处理，按情况跳过，避免重复下发命令）
			contentBreaksToBr(node, ctx, onlyMarker ? p : first);

			// 引用块打上语义类（blockquote.md-alert.md-alert-note）
			ctx.setProperty(node, 'className', [
				'md-alert',
				`md-alert-${type.toLowerCase()}`,
			]);
		},
	},
};
