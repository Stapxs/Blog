/* 全屏遮罩的尺寸计算 */

export function syncOverlaySize(backdrop: HTMLElement, view: HTMLElement) {
	const root = document.documentElement;
	const scrollEl = document.scrollingElement ?? root;
	const zoom = parseFloat(getComputedStyle(root).zoom) || 1;

	const apply = () => {
		const docH = Math.max(
			scrollEl.getBoundingClientRect().height / zoom,
			scrollEl.scrollHeight,
			window.innerHeight / zoom,
		);
		backdrop.style.height = `${docH}px`;
		view.style.top = `${-document.body.getBoundingClientRect().top / zoom}px`;
		view.style.height = `${window.innerHeight / zoom}px`;
	};

	apply();

	window.addEventListener('resize', apply);
	window.visualViewport?.addEventListener('resize', apply);
	return () => {
		window.removeEventListener('resize', apply);
		window.visualViewport?.removeEventListener('resize', apply);
	};
}
