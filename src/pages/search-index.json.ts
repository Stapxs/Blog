import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

/**
 * 构建时生成的全文搜索索引（静态 JSON，客户端按需拉取）。
 * 正文为原始 markdown，客户端做子串匹配（中文无需分词）。
 */
export const GET: APIRoute = async () => {
	const posts = await getCollection('blog');
	const index = posts.map((post) => ({
		title: post.data.title,
		author: post.data.author,
		category: post.data.category,
		tags: post.data.tags,
		pubDate: post.data.pubDate.toISOString(),
		url: `/archives/${post.id}/`,
		content: (post.body ?? '').toLowerCase(),
	}));
	return new Response(JSON.stringify(index), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
