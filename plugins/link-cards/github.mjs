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

/**
 * 匹配 GitHub Releases 链接：
 * - /releases             → 最新一个 release（tag 为 null）
 * - /releases/tag/<tag>   → 指定 tag 的 release
 * @param {string} href
 * @returns {{ owner: string, repo: string, tag: string | null } | null}
 */
export function matchGitHubReleases(href) {
	const m = href?.match(
		/^https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)\/releases(?:\/tag\/([^/?#]+))?\/?$/,
	);
	if (!m) return null;
	return {
		owner: m[1],
		repo: m[2],
		tag: m[3] ? decodeURIComponent(m[3]) : null,
	};
}

/** @typedef {{ type: 'gh', name: string, desc: string | null, icon: string | null, cover: string | null }} CardData */

function ghHeaders() {
	const headers = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': API_UA,
	};
	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}
	return headers;
}

/**
 * 抓取 GitHub 仓库卡片数据
 * @param {{ owner: string, repo: string }} r
 * @returns {Promise<CardData | null>} null = 仓库不存在/已删除 → 保留普通链接
 */
export function fetchGitHubCard(r) {
	return cached(`gh:${r.owner}/${r.repo.toLowerCase()}`, async () => {
		const headers = ghHeaders();

		const api = await fetch(
			`https://api.github.com/repos/${r.owner}/${r.repo}`,
			{ headers, signal: AbortSignal.timeout(20_000) },
		);
		if (api.status === 404 || api.status === 301 || api.status === 451) {
			// 仓库不存在 / 已迁移私有 / 被下架：不做卡片
			console.warn(
				`[link-cards] GitHub 仓库不可用（HTTP ${api.status}）：${r.owner}/${r.repo}`,
			);
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
 * 抓取 GitHub Release 卡片数据
 * @param {{ owner: string, repo: string, tag: string | null }} r
 * @returns {Promise<CardData | null>} null = release 不存在 → 保留普通链接
 */
export function fetchGitHubReleaseCard(r) {
	const repoKey = `${r.owner}/${r.repo.toLowerCase()}`;
	const key = r.tag ? `gh-rel:${repoKey}@${r.tag}` : `gh-rel:${repoKey}@latest`;
	return cached(key, async () => {
		const apiPath = r.tag
			? `/repos/${r.owner}/${r.repo}/releases/tags/${encodeURIComponent(r.tag)}`
			: `/repos/${r.owner}/${r.repo}/releases/latest`;
		const api = await fetch(`https://api.github.com${apiPath}`, {
			headers: ghHeaders(),
			signal: AbortSignal.timeout(20_000),
		});
		if (api.status === 404 || api.status === 301 || api.status === 451) {
			// 无 release / 仓库不可见：不做卡片
			console.warn(
				`[link-cards] GitHub release 不可用（HTTP ${api.status}）：${r.owner}/${r.repo}${r.tag ? `@${r.tag}` : '@latest'}`,
			);
			return null;
		}
		if (!api.ok) throw new Error(`GitHub API HTTP ${api.status}`);
		const release = await api.json();
		if (!release?.tag_name) throw new Error('GitHub API 返回异常');

		// 解析 tag 指向的 commit hash（轻量/附注 tag 都能解出）
		const sha = await resolveCommitSha(r, release.tag_name);

		// 头像复用 owner 的 GitHub 头像（与仓库卡一致），releases 页面无独立封面
		const icon = await fetchCardAsset(
			`https://github.com/${r.owner}.png`,
			`gh-${r.owner.toLowerCase()}-avatar`,
			{ kind: 'avatar' },
		);

		return {
			type: 'gh',
			name:
				(typeof release.name === 'string' && release.name.trim()) ||
				release.tag_name,
			desc: releaseDesc(release, sha),
			icon,
			cover: null,
		};
	});
}

/**
 * 解析 tag 指向的 commit hash（拿不到时返回 null，不影响成卡）
 * @param {{ owner: string, repo: string }} r
 * @param {string} tag
 * @returns {Promise<string | null>}
 */
async function resolveCommitSha(r, tag) {
	try {
		const api = await fetch(
			`https://api.github.com/repos/${r.owner}/${r.repo}/commits/${encodeURIComponent(tag)}`,
			{ headers: ghHeaders(), signal: AbortSignal.timeout(20_000) },
		);
		if (!api.ok) return null;
		const commit = await api.json();
		return typeof commit?.sha === 'string' ? commit.sha : null;
	} catch {
		return null;
	}
}

/**
 * 副标题：发布时间 · 分支 · 短 hash
 * @param {any} release
 * @param {string | null} sha
 * @returns {string | null}
 */
function releaseDesc(release, sha) {
	const parts = [];
	if (release.published_at) parts.push(release.published_at.slice(0, 10));

	const branch =
		typeof release.target_commitish === 'string'
			? release.target_commitish.trim()
			: '';
	// 若 target_commitish 本身就是完整 SHA，就不重复展示（交给下面的短 hash）
	if (branch && !/^[0-9a-f]{40}$/i.test(branch)) parts.push(branch);

	if (sha) parts.push(sha.slice(0, 7));
	return parts.length ? parts.join(' · ') : null;
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
