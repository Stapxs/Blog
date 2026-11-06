import { SITE_TITLE } from '../consts';

interface Props {
	title: string;
	description: string;
	/** og:image `src`（可为相对路径，基于页面 URL 解析）；不传则不输出 og:image。 */
	image?: string;
	/** Site origin, e.g. `https://example.com`. */
	site: string;
	/** Current page pathname, e.g. `/archives/…/`. */
	pathname: string;
	/** Absolute URL of the current page. */
	pageUrl: string;
	generator: string;
}

export default function BaseHead({ title, description, image, site, pathname, pageUrl, generator }: Props) {
	const canonicalURL = new URL(pathname, site).href;
	const socialImage = image ? new URL(image, pageUrl).href : undefined;

	return (
		<>
			{/* Global Metadata */}
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<link rel="icon" href="/favicon.ico" />
			<link rel="sitemap" href="/sitemap-index.xml" />
			<link
				rel="alternate"
				type="application/rss+xml"
				title={SITE_TITLE}
				href={new URL('rss.xml', site).href}
			/>
			<meta name="generator" content={generator} />

			{/* Canonical URL */}
			<link rel="canonical" href={canonicalURL} />

			{/* Primary Meta Tags */}
			<title>{title}</title>
			<meta name="description" content={description} />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content="website" />
			<meta property="og:url" content={pageUrl} />
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			{socialImage && <meta property="og:image" content={socialImage} />}

			{/* Twitter */}
			<meta
				name="twitter:card"
				content={socialImage ? 'summary_large_image' : 'summary'}
			/>
		</>
	);
}
