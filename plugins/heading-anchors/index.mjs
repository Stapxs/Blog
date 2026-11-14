/**
 * 标题锚点插件
 *
 * 注意：.md 的渲染结果缓存在 .astro/data-store.json 与
 * node_modules/.astro/data-store.json，改完本插件后需删掉两者再构建。
 */
import Slugger from 'github-slugger';

export const headingAnchors = () => {
	const slugger = new Slugger();
	return {
		name: 'stapxs-heading-anchors',
		element: {
			filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
			/**
			 * @param {any} node
			 * @param {any} ctx
			 */
			visit(node, ctx) {
				const text = ctx.textContent(node);
				const existingId = node.properties?.id;
				const slug =
					typeof existingId === 'string' && existingId
						? existingId
						: slugger.slug(text);
				if (typeof existingId !== 'string') {
					ctx.setProperty(node, 'id', slug);
				}

				if (node.tagName === 'h6') return;

				ctx.appendChild(node, {
					type: 'element',
					tagName: 'a',
					properties: {
						className: ['heading-anchor'],
						href: `#${slug}`,
						'aria-label': `链接到：${text}`,
					},
					children: [],
				});
			},
		},
	};
};
