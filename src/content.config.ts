import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: () =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			author: z.string().default('Stapxs'),
			category: z.string().default('未分类'),
			tags: z.array(z.string()).default([]),
			// 隐藏文章（草稿等）：列表 / 归档 / 搜索 / RSS / 直链全部不可见
			hidden: z.boolean().default(false),
			// 关联歌曲（网易云歌曲 id）：文章页日期行下方显示播放组件
			music: z.coerce.number().optional(),
		}),
});

export const collections = { blog };
