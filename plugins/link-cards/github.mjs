/**
 * GitHub 仓库链接卡片数据
 */
import { fetchCardAsset } from './assets.mjs';
import { cached } from './cache.mjs';

const API_UA = 'stapxs-blog-link-cards (+https://blog.stapxs.cn)';

/**
 * 匹配 GitHub 仓库主页链接
 * @param {string} href
 * @returns {{ owner: string, repo: string } | null}
 */
export function matchGitHub(href) {
	const m = href?.match(
		/^https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/,
	);
	return m ? { owner: m[1], repo: m[2] } : null;
}

/** @typedef {{ type: 'gh', name: string, desc: string | null, icon: string | null, cover: string | null }} CardData */

/**
 * 抓取 GitHub 仓库卡片数据
 * @param {{ owner: string, repo: string }} r
 * @returns {Promise<CardData | null>} null = 仓库不存在/已删除 → 保留普通链接
 */
export function fetchGitHubCard(r) {
	return cached(`gh:${r.owner}/${r.repo.toLowerCase()}`, async () => {
		const headers = {
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': API_UA,
		};
		if (process.env.GITHUB_TOKEN) {
			headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
		}

		const api = await fetch(
			`https://api.github.com/repos/${r.owner}/${r.repo}`,
			{ headers, signal: AbortSignal.timeout(20_000) },
		);
		if (api.status === 404 || api.status === 301 || api.status === 451) {
			// 仓库不存在 / 已迁移私有 / 被下架：不做卡片
			return null;
		}
		if (!api.ok) throw new Error(`GitHub API HTTP ${api.status}`);
		const repo = await api.json();
		if (!repo?.full_name) throw new Error('GitHub API 返回异常');

		// 自定义 social preview 检测
		const coverUrl = await detectSocialPreview(r);

		const [icon, cover] = await Promise.all([
			// 头像 URL 支持 s= 参数，直接请求小图省流量
			fetchCardAsset(
				withSize(repo.owner?.avatar_url, 96),
				`gh-${r.owner.toLowerCase()}-avatar`,
				{ kind: 'avatar' },
			),
			coverUrl
				? fetchCardAsset(coverUrl, `gh-${r.owner}-${r.repo}-cover`, {
						kind: 'cover',
					})
				: null,
		]);

		return {
			type: 'gh',
			name: repo.full_name,
			desc: typeof repo.description === 'string' ? repo.description : null,
			icon,
			cover,
		};
	});
}

/**
 * 读仓库页面 og:image
 * @param {{ owner: string, repo: string }} r
 * @returns {Promise<string | null>}
 */
async function detectSocialPreview(r) {
	try {
		const res = await fetch(
			`https://github.com/${r.owner}/${r.repo}`,
			{
				headers: { 'User-Agent': API_UA },
				redirect: 'follow',
				signal: AbortSignal.timeout(20_000),
			},
		);
		if (!res.ok) return null;
		const html = await res.text();
		const og = html.match(
			/<meta property="og:image" content="([^"]+)"[^>]*>/,
		)?.[1];
		if (og?.startsWith('https://repository-images.githubusercontent.com/')) {
			return og;
		}
		return null;
	} catch (err) {
		console.warn(
			`[link-cards] social preview 检测失败（${r.owner}/${r.repo}）：`,
			err?.message ?? err,
		);
		return null;
	}
}

function withSize(url, s) {
	if (!url) return url;
	return `${url}${url.includes('?') ? '&' : '?'}s=${s}`;
}
