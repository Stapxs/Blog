// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [react(), mdx(), sitemap()],
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
