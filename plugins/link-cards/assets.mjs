/**
 * 链接卡片图片资产：构建期下载远程图片： public/link-cards
 *
 * 文件名 = 语义前缀 + 来源 URL 短哈希
 */
import { existsSync } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { hashUrl } from './cache.mjs';

export const ASSET_DIR = join(process.cwd(), 'public', 'link-cards');
export const ASSET_URL = '/link-cards';

const UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 StapxsBlogLinkCards/1.0';

/** @typedef {{ kind: 'avatar' | 'cover', w?: number, h?: number }} AssetSpec */

/**
 * 下载并处理一张卡片图片，返回站内 URL；任何一步失败返回 null（卡片优雅降级）。
 * @param {string} url 远程图片 URL（会被归一成 https）
 * @param {string} name 语义文件名前缀（如 gh-owner-avatar）
 * @param {AssetSpec} spec
 * @returns {Promise<string | null>}
 */
export async function fetchCardAsset(url, name, spec) {
	if (!url) return null;
	const src = url.replace(/^http:\/\//, 'https://');
	const file = `${name}-${hashUrl(src)}.webp`;
	const dest = join(ASSET_DIR, file);
	if (existsSync(dest)) return `${ASSET_URL}/${file}`;

	try {
		const res = await fetch(src, {
			headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
			redirect: 'follow',
			signal: AbortSignal.timeout(20_000),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const buf = Buffer.from(await res.arrayBuffer());
		if (buf.byteLength === 0) throw new Error('空响应');

		let out;
		if (spec.kind === 'avatar') {
			// 头像统一裁成 96×96 方图
			out = await sharp(buf)
				.resize(96, 96, { fit: 'cover', position: 'centre' })
				.webp({ quality: 85 })
				.toBuffer();
		} else {
			// 封面缩到 360px 宽（卡片缩略图 2x retina 足够），不放大
			out = await sharp(buf)
				.resize(360, null, { withoutEnlargement: true })
				.webp({ quality: 82 })
				.toBuffer();
		}

		mkdirSync(ASSET_DIR, { recursive: true });
		writeFileSync(dest, out);
		return `${ASSET_URL}/${file}`;
	} catch (err) {
		console.warn(`[link-cards] 图片下载失败（${src}）：`, err?.message ?? err);
		return null;
	}
}
