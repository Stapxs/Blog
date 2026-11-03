import { SITE_TITLE } from '../consts';

interface Props {
	title: string;
	description: string;
	/** Image `src` (may be a relative URL, resolved against the page URL). */
	image: string;
	/** Site origin, e.g. `https://example.com`. */
	site: string;
	/** Current page pathname, e.g. `/blog/`. */
	pathname: string;
	/** Absolute URL of the current page. */
	pageUrl: string;
	generator: string;
}

export default function BaseHead({ title, description, image, site, pathname, pageUrl, generator }: Props) {
	const canonicalURL = new URL(pathname, site).href;
	const socialImage = new URL(image, pageUrl).href;

	return (
		<>
			{/* Global Metadata */}
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
			<meta property="og:image" content={socialImage} />

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" />
		</>
	);
}
