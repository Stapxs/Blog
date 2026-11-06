import styles from '../components/pages/PhotosView.module.css';
import { play } from './scramble';
import { track } from './analytics';

/* 照片灯箱 */

let lightbox: HTMLDivElement | null = null;
let lightboxBody: HTMLDivElement | null = null;
let prevOverflow = '';

function closeLightbox() {
	if (!lightbox) return;
	const el = lightbox;
	lightbox = null;
	lightboxBody = null;
	document.documentElement.style.overflow = prevOverflow;
	el.animate([{ opacity: '1' }, { opacity: '0' }], {
		duration: 120,
		easing: 'ease-in',
	}).onfinish = () => el.remove();
}

function infoLine(text: string, className?: string) {
	const div = document.createElement('div');
	if (className) div.className = className;
	div.textContent = text;
	return div;
}

function openLightbox(a: HTMLAnchorElement) {
	closeLightbox();
	/* umami：照片灯箱打开 */
	track('photo_view', { file: (a.dataset.file ?? '').slice(0, 200) });

	const box = document.createElement('div');
	box.className = styles.lightbox;
	box.role = 'dialog';
	box.ariaLabel = '照片详情';

	const img = document.createElement('img');
	img.className = styles.lightboxImg;
	img.alt = a.dataset.file ?? '';
	img.decoding = 'async';
	// 打开瞬间即定好最终显示尺寸
	const dims = a.dataset.dims?.match(/(\d+)×(\d+)/);
	if (dims) {
		const w = Number(dims[1]);
		const h = Number(dims[2]);
		if (w > 0 && h > 0) {
			img.style.setProperty('--lb-ar-num', String(h / w));
			img.style.setProperty('--lb-nat-h', `${h}px`);
			img.style.setProperty('--lb-nat-w', `${w}px`);
			img.style.aspectRatio = `${w} / ${h}`;
		}
	}

	// 加载填充
	const thumb = a.querySelector('img')?.currentSrc;
	const layers = [
		thumb && `url("${thumb}")`,
		a.dataset.lqip && `url("${a.dataset.lqip}")`,
	]
		.filter(Boolean)
		.join(', ');
	if (layers) img.style.backgroundImage = layers;

	// 原图加载状态角标：加载中 → 加载完成即消失 / 失败常驻提示
	const loading = document.createElement('span');
	loading.className = styles.lightboxLoading;
	loading.textContent = '加载中';
	img.addEventListener(
		'load',
		() => {
			img.style.backgroundImage = '';
			loading.remove();
		},
		{ once: true },
	);
	img.addEventListener(
		'error',
		() => {
			loading.textContent = '加载失败';
			loading.classList.add(styles.lightboxError);
		},
		{ once: true },
	);

	img.src = a.href;

	const info = document.createElement('div');
	info.className = styles.lightboxInfo;
	if (a.dataset.note)
		info.append(infoLine(a.dataset.note, styles.lightboxNote));
	info.append(infoLine(a.dataset.date ?? '', styles.lightboxDate));
	[a.dataset.device, a.dataset.params, a.dataset.lens].forEach((line) => {
		if (line) info.append(infoLine(line));
	});
	const tail = [a.dataset.dims, a.dataset.file].filter(Boolean).join(' · ');
	if (tail) info.append(infoLine(tail));
	if (a.dataset.fallback)
		info.append(infoLine('（无 EXIF 时间，按文件修改时间排序）'));

	const hint = document.createElement('span');
	hint.className = styles.lightboxHint;
	hint.textContent = 'ESC / 点击空白处关闭';

	const aside = document.createElement('div');
	aside.className = styles.lightboxAside;
	aside.append(info, hint);

	const body = document.createElement('div');
	body.className = styles.lightboxBody;
	body.append(img, loading, aside);

	box.append(body);
	document.body.append(box);
	lightbox = box;
	lightboxBody = body;

	// 原图命中缓存时 load 事件早已就绪（或不会再触发），直接收掉角标
	if (img.complete && img.naturalWidth > 0) loading.remove();

	// 弹窗期间锁背景滚动
	prevOverflow = document.documentElement.style.overflow;
	document.documentElement.style.overflow = 'hidden';

	if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		play(info, { duration: 900, delay: 150 });
	}
}

export function initPhotoLightbox() {
	document.addEventListener(
		'click',
		(e) => {
			const target = e.target as Element;

			if (lightbox && (target === lightbox || target === lightboxBody)) {
				closeLightbox();
				return;
			}

			const a = target.closest('a[data-photos-lightbox]');
			if (!a) return;

			if (
				e.defaultPrevented ||
				e.button !== 0 ||
				e.metaKey ||
				e.ctrlKey ||
				e.shiftKey ||
				e.altKey
			)
				return;

			e.preventDefault();
			openLightbox(a as HTMLAnchorElement);
		},
		true,
	);

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeLightbox();
	});

	// 切页时若灯箱还开着直接移除
	document.addEventListener('astro:after-swap', () => {
		lightbox?.remove();
		lightbox = null;
		lightboxBody = null;
		document.documentElement.style.overflow = prevOverflow;
	});
}
