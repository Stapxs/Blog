// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { linkCards, linkCardsAssets } from './plugins/link-cards/index.mjs';
import { mdAlerts } from './plugins/markdown-alerts/index.mjs';
import { generatePhotosJson, PHOTOS_DIR } from './scripts/photos-exif.mjs';

/** @typedef {import('astro').AstroIntegration} AstroIntegration */
/** @typedef {import('astro').AstroIntegrationLogger} AstroIntegrationLogger */

/**
 * 相簿数据集成：构建 / dev 启动时扫描 src/assets/photos 的 EXIF
 * （拍摄时间、设备、镜头、曝光参数）生成 src/data/photos.json；
 * dev 期监听照片目录，丢照片 / 删照片后自动重新生成。
 * @returns {AstroIntegration}
 */
function photosExif() {
	/** @param {AstroIntegrationLogger} logger */
	const run = async (logger) => {
		await generatePhotosJson({ log: (m) => logger.info(m) }).catch((err) =>
			logger.error(`生成 photos.json 失败：${err?.message ?? err}`),
		);
	};
	return {
		name: 'photos-exif',
		hooks: {
			'astro:config:setup': ({ logger }) => run(logger),
			'astro:server:setup': ({ server, logger }) => {
				server.watcher.add(PHOTOS_DIR);
				/** @type {ReturnType<typeof setTimeout> | undefined} */
				let timer;
				// 照片文件较大，复制 / 导出过程会触发多次事件：防抖后重新生成
				server.watcher.on('all', (_event, file) => {
					if (!file?.startsWith(PHOTOS_DIR)) return;
					clearTimeout(timer);
					timer = setTimeout(() => void run(logger), 300);
				});
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.stapxs.cn',
	integrations: [react(), mdx(), sitemap(), photosExif(), linkCardsAssets()],
	markdown: {
		processor: satteri({ hastPlugins: [linkCards, mdAlerts] }),
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Fusion Pixel 12px Monospaced SC',
			cssVariable: '--font-pixel',
			fallbacks: ['monospace'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/fusion-pixel-12px-monospaced-sc.woff2'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
