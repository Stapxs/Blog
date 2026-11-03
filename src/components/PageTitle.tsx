import type { ReactNode } from 'react';
import styles from './PageTitle.module.css';

interface Props {
	children: ReactNode;
}

export default function PageTitle({ children }: Props) {
	return (
		<h4 className={styles.title} data-boot="pagetitle">
			~/{children}
		</h4>
	);
}
