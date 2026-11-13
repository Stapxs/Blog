import { getCollection } from 'astro:content';
import { posix } from 'node:path';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE, WALINE_SERVER_URL } from '../consts';

const assetImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,gif,avif}', {
	eager: true,
	import: 'default',
});
const assetImageUrls = new Map(
	Object.entries(assetImages).map(([path, image]) => [
		posix.normalize(posix.join('src/pages', path)),
		image.src,
	]),
);

const WFW_NAMESPACE = 'http://wellformedweb.org/CommentAPI/';

/** Make feed HTML links absolute, resolving relative references from the article URL. */
function renderFeedImages(html, articleUrl, post) {
	return html.replace(/<img\s+__ASTRO_IMAGE_=(['"])(.*?)\1\s*\/?>/gi, (_tag, _quote, encoded) => {
		try {
			const imageData = JSON.parse(encoded.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
			const sourcePath = decodeURI(imageData.src);
			const filePath = post.filePath?.replaceAll('\\\\', '/') ?? `src/content/blog/${post.id}.md`;
			const postPath = posix.isAbsolute(filePath) ? posix.relative(process.cwd(), filePath) : filePath;
			const rootPath = posix.normalize(posix.join(posix.dirname(postPath), sourcePath));
			const builtSrc = assetImageUrls.get(rootPath);
			const src = builtSrc ? new URL(builtSrc, articleUrl).href : new URL(sourcePath, articleUrl).href;
			const alt = String(imageData.alt ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
			return `<img src="${src}" alt="${alt}">`;
		} catch {
			return '';
		}
	});
}

function absolutizeHtmlUrls(html, articleUrl) {
	return html.replace(/\b(href|src|poster)=(['"])(.*?)\2/gi, (attribute, name, quote, value) => {
		const url = value.trim();
		if (!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) return attribute;
		try {
			return `${name}=${quote}${new URL(url, articleUrl).href}${quote}`;
		} catch {
			return attribute;
		}
	});
}

function xmlEscape(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export async function GET(context) {
	const site = context.site;
	const posts = (await getCollection('blog')).filter((post) => !post.data.hidden);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site,
		xmlns: { wfw: WFW_NAMESPACE },
		items: posts.map((post) => {
			const link = `/archives/${post.id}/`;
			const articleUrl = new URL(link, site).href;
			const commentFeedUrl = new URL(
				`/api/comment/rss?path=${encodeURIComponent(link)}`,
				WALINE_SERVER_URL,
			).href;
			const content = post.rendered?.html;
			return {
				title: post.data.title,
				link,
				pubDate: post.data.pubDate,
				description: post.data.description,
				content: content ? absolutizeHtmlUrls(renderFeedImages(content, articleUrl, post), articleUrl) : undefined,
				categories: [post.data.category, ...post.data.tags],
				author: post.data.author,
				commentsUrl: articleUrl,
				customData: `<wfw:commentRss>${xmlEscape(commentFeedUrl)}</wfw:commentRss>`,
			};
		}),
	});
}
