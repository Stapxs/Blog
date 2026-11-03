import type { AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './HeaderLink.module.css';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string;
	/** Current page pathname; used to derive the active state (server-rendered). */
	currentPath?: string;
	/** 不可点击的装饰项（如 "."） */
	disabled?: boolean;
	children: ReactNode;
}

export default function HeaderLink({
	href,
	currentPath = '',
	disabled = false,
	className,
	children,
	...rest
}: Props) {
	const pathname = currentPath.replace(import.meta.env.BASE_URL, '');
	const subpath = pathname.match(/[^/]+/g);
	const isActive = !disabled && (href === pathname || href === '/' + (subpath?.[0] ?? ''));

	const classes = [styles.link, isActive && styles.active, disabled && styles.disabled, className]
		.filter(Boolean)
		.join(' ');

	if (disabled) {
		return (
			<span className={classes} aria-disabled="true">
				{children}
			</span>
		);
	}

	return (
		<a href={href} className={classes} {...rest}>
			{children}
		</a>
	);
}
