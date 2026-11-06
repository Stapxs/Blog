/**
 * 哔哩哔哩视频链接卡片数据
 */
import { fetchCardAsset } from './assets.mjs';
import { cached } from './cache.mjs';

const API_UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * 匹配 B 站视频链接
 * @param {string} href
 * @returns {{ bvid?: string, aid?: string } | null}
 */
export function matchBilibili(href) {
	const m = href?.match(
		/^https?:\/\/(?:www\.)?bilibili\.com\/video\/(BV[0-9A-Za-z]{10}|av\d+)(?:\/|\?|#|$)/,
	);
	if (!m) return null;
	return m[1].startsWith('BV')
		? { bvid: m[1] }
		: { aid: m[1].slice(2) };
}

/**
 * 抓取 B 站视频卡片数据
 * @param {{ bvid?: string, aid?: string }} v
 * @returns {Promise<import('./github.mjs').CardData | null>} null = 视频不存在/失效
 */
export function fetchBilibiliCard(v) {
	const key = v.bvid ? `bili:${v.bvid}` : `bili:av${v.aid}`;
	return cached(key, async () => {
		const query = v.bvid ? `bvid=${v.bvid}` : `aid=${v.aid}`;
		const res = await fetch(
			`https://api.bilibili.com/x/web-interface/view?${query}`,
			{
				headers: {
					'User-Agent': API_UA,
					Referer: 'https://www.bilibili.com/',
				},
				signal: AbortSignal.timeout(20_000),
			},
		);
		if (!res.ok) throw new Error(`bilibili API HTTP ${res.status}`);
		const json = await res.json();
		// code -404 视频不存在；-412 风控等按失败处理（走 stale-if-error）
		if (json.code === -404) return null;
		if (json.code !== 0) throw new Error(`bilibili API code ${json.code}`);
		const d = json.data;

		const [icon, cover] = await Promise.all([
			fetchCardAsset(
				d.owner?.face,
				`bili-avatar-${(d.owner?.mid ?? key).toString()}`,
				{ kind: 'avatar' },
			),
			fetchCardAsset(d.pic, `bili-cover-${v.bvid ?? `av${v.aid}`}`, {
				kind: 'cover',
			}),
		]);

		return {
			type: 'bili',
			name: d.title,
			// 简介里的换行 / 长分隔线在卡片里会挤成一串，归一化成空格
			desc:
				typeof d.desc === 'string' && d.desc.trim()
					? d.desc.trim().replace(/\s*\n+\s*/g, ' ')
					: null,
			icon,
			cover,
		};
	});
}
