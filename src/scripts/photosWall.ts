import styles from '../components/pages/PhotosView.module.css';

/* 相簿瀑布流排布。 */

let wall: HTMLElement | null = null;
let ordered: HTMLElement[] = [];
let colCount = -1;

function calcColumns(width: number) {
	return Math.max(1, Math.min(3, Math.floor(width / 300)));
}

function cardRatio(fig: HTMLElement) {
	const img = fig.querySelector('img');
	const w = Number(img?.getAttribute('width'));
	const h = Number(img?.getAttribute('height'));
	return w > 0 && h > 0 ? h / w : 1;
}

function layout() {
	const el = document.querySelector<HTMLElement>('[data-photos-wall]');
	if (!el || el.children.length === 0) return;

	if (el !== wall) {
		wall = el;
		ordered = Array.from(el.children) as HTMLElement[];
		colCount = -1;
	}

	const n = Math.min(calcColumns(el.clientWidth), ordered.length);
	if (n === colCount) return;
	colCount = n;

	// 重建列容器
	for (const col of el.querySelectorAll('.' + styles.col)) col.remove();
	const cols = Array.from({ length: n }, () => {
		const col = document.createElement('div');
		col.className = styles.col;
		return col;
	});

	// 最短列优先
	const heights = new Array<number>(n).fill(0);
	for (const fig of ordered) {
		let min = 0;
		for (let i = 1; i < n; i++) if (heights[i] < heights[min]) min = i;
		cols[min].append(fig);
		heights[min] += cardRatio(fig);
	}

	el.append(...cols);
	el.dataset.masonryOn = '';
}

export function initPhotosWall() {
	document.addEventListener(
		'load',
		(e) => {
			const img = e.target;
			if (
				img instanceof HTMLImageElement &&
				img.closest('[data-photos-wall]')
			)
				img.style.backgroundImage = '';
		},
		true,
	);

	document.addEventListener('astro:page-load', () => layout());

	let timer = 0;
	window.addEventListener(
		'resize',
		() => {
			window.clearTimeout(timer);
			timer = window.setTimeout(layout, 150);
		},
		{ passive: true },
	);

	layout();
}
