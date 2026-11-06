/**
 * GitHub Alerts 语法支持插件
 *
 *   > [!NOTE]
 *   > 内容
 *
 * 支持 NOTE / TIP / IMPORTANT / WARNING / CAUTION（大小写不敏感），
 * 渲染成带语义类的 blockquote
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

			// 去掉标记行，剩下内容
			ctx.setProperty(first, 'value', first.value.slice(m[0].length));

			// 标题行插到引用块最前面
			ctx.insertBefore(
				p,
				{
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
				},
			);

			// 引用块打上语义类（blockquote.md-alert.md-alert-note）
			ctx.setProperty(node, 'className', [
				'md-alert',
				`md-alert-${type.toLowerCase()}`,
			]);
		},
	},
};
