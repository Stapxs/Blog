import type { AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './HeaderLink.module.css';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string;
	/** Current page pathname; used to derive the active state (server-rendered). */
	currentPath?: string;
	children: ReactNode;
}

export default function HeaderLink({ href, currentPath = '', className, children, ...rest }: Props) {
	const pathname = currentPath.replace(import.meta.env.BASE_URL, '');
	const subpath = pathname.match(/[^/]+/g);
	const isActive = href === pathname || href === '/' + (subpath?.[0] ?? '');

	const classes = [styles.link, isActive && styles.active, className].filter(Boolean).join(' ');

	return (
		<a href={href} className={classes} {...rest}>
			{children}
		</a>
	);
}
