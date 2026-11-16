/* 碎碎念（/quotes）：随机抽取、复制、自动播放、年份筛选与像素星空。
 * 数据由 quotes.astro 构建期注入 [data-quote-machine] 的 data-quotes 属性。 */

import type { Quote } from './quotesData';
import { play } from './scramble';
import { motionOk, textMotionOk } from './settings';
import { track } from './analytics';

const AUTO_MS = 6000;

/* ============ 像素星空 ============ */

interface Star {
	x: number;
	y: number;
	size: number;
	alpha: number;
	speed: number;
	phase: number;
	drift: number;
	color: number;
}

interface Meteor {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
}

class Starfield {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private stars: Star[] = [];
	private meteor: Meteor | null = null;
	private nextMeteorAt = 0;
	private colors: string[] = [];
	private w = 0;
	private h = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d')!;
		this.readColors();
		this.resize();
	}

	readColors() {
		const cs = getComputedStyle(this.canvas);
		const v = (name: string) => cs.getPropertyValue(name).trim();
		this.colors = [
			`rgb(${v('--black')})`,
			v('--green'),
			v('--blue'),
			v('--pink'),
			v('--yellow'),
		];
	}

	resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		this.w = this.canvas.clientWidth;
		this.h = this.canvas.clientHeight;
		if (this.w === 0 || this.h === 0) return;
		this.canvas.width = Math.round(this.w * dpr);
		this.canvas.height = Math.round(this.h * dpr);
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const count = Math.max(40, Math.min(110, Math.round((this.w * this.h) / 9000)));
		this.stars = Array.from({ length: count }, () => ({
			x: Math.random() * this.w,
			y: Math.random() * this.h,
			size: Math.random() < 0.72 ? 2 : Math.random() < 0.85 ? 3 : 1,
			alpha: 0.25 + Math.random() * 0.6,
			speed: 0.4 + Math.random() * 1.1,
			phase: Math.random() * Math.PI * 2,
			drift: 2 + Math.random() * 5,
			color: Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 4),
		}));
		this.nextMeteorAt = performance.now() / 1000 + 3 + Math.random() * 5;
	}

	/** t：秒；dt：帧间隔秒；animate=false 时只画静态帧 */
	render(t: number, dt: number, animate: boolean) {
		const { ctx, w, h } = this;
		if (w === 0 || h === 0) return;
		ctx.clearRect(0, 0, w, h);

		for (const s of this.stars) {
			if (animate) {
				s.x -= s.drift * dt;
				if (s.x < -4) s.x = w + 4;
			}
			const tw = animate ? 0.55 + 0.45 * Math.sin(t * s.speed + s.phase) : 1;
			ctx.globalAlpha = s.alpha * tw;
			ctx.fillStyle = this.colors[s.color];
			ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
		}

		if (animate) {
			if (!this.meteor && t >= this.nextMeteorAt) {
				this.meteor = {
					x: w * (0.3 + Math.random() * 0.65),
					y: -6,
					vx: -(140 + Math.random() * 120),
					vy: 90 + Math.random() * 70,
					life: 1,
				};
			}
			const m = this.meteor;
			if (m) {
				m.x += m.vx * dt;
				m.y += m.vy * dt;
				m.life -= dt * 0.9;
				for (let i = 0; i < 7; i++) {
					const k = i / 7;
					ctx.globalAlpha = Math.max(0, m.life * (1 - k)) * 0.9;
					ctx.fillStyle = this.colors[i === 0 ? 0 : 3];
					ctx.fillRect(
						Math.round(m.x - m.vx * k * 0.09),
						Math.round(m.y - m.vy * k * 0.09),
						i === 0 ? 3 : 2,
						i === 0 ? 3 : 2,
					);
				}
				if (m.life <= 0 || m.y > h + 10 || m.x < -10) {
					this.meteor = null;
					this.nextMeteorAt = t + 5 + Math.random() * 7;
				}
			}
		}
		ctx.globalAlpha = 1;
	}
}

/* ============ 机器状态（每次页面加载重建） ============ */

interface MachineApi {
	draw: () => void;
	copy: () => void;
	toggleAuto: () => void;
	toggleFullscreen: () => void;
	exitFs: () => void;
}

let api: MachineApi | null = null;
let cleanup: (() => void) | null = null;
let keyBound = false;

function setup() {
	cleanup?.();

	const root = document.querySelector<HTMLElement>('[data-quote-machine]');
	if (!root) return;
	const machine = root;

	const quotes: Quote[] = JSON.parse(machine.dataset.quotes ?? '[]');
	if (quotes.length === 0) return;

	const textEl = machine.querySelector<HTMLElement>('[data-quote-text]')!;
	const fromEl = machine.querySelector<HTMLElement>('[data-quote-from]')!;
	const dateEl = machine.querySelector<HTMLElement>('[data-quote-date]')!;
	const metaEl = machine.querySelector<HTMLElement>('[data-quote-meta]')!;
	const counterEl = machine.querySelector<HTMLElement>('[data-quote-counter]')!;
	const statsEl = machine.querySelector<HTMLElement>('[data-quote-stats]')!;
	const drawBtn = machine.querySelector<HTMLButtonElement>('[data-quote-draw]')!;
	const copyBtn = machine.querySelector<HTMLButtonElement>('[data-quote-copy]')!;
	const copyLabel = machine.querySelector<HTMLElement>('[data-copy-label]')!;
	const autoBtn = machine.querySelector<HTMLButtonElement>('[data-quote-auto]')!;
	const autoTrack = machine.querySelector<HTMLElement>('[data-quote-auto-track]')!;
	const autoBar = machine.querySelector<HTMLElement>('[data-quote-auto-bar]')!;
	const chips = Array.from(
		machine.querySelectorAll<HTMLButtonElement>('[data-quote-year]'),
	);
	const stage = machine.querySelector<HTMLElement>('[data-quote-stage]')!;
	const canvas = machine.querySelector<HTMLCanvasElement>('[data-quote-stars]')!;
	const fsBtn = machine.querySelector<HTMLButtonElement>('[data-quote-fullscreen]')!;

	const reduced = !motionOk();
	const years = quotes.map((q) => q.year);
	const minYear = Math.min(...years);
	const maxYear = Math.max(...years);

	let pool = quotes;
	let year = 'all';
	let currentId = -1;
	let draws = 0;
	let auto = false;
	let nextAt = 0;

	/* ---------- 展示 ---------- */

	function updateStats() {
		statsEl.textContent = `${year === 'all' ? '总计' : '筛选'} ${pool.length} 条`;
	}

	function present(q: Quote, opts: { count?: boolean; trackIt?: boolean } = {}) {
		currentId = q.id;
		textEl.textContent = q.text;
		fromEl.textContent = q.from ? `—— ${q.from}` : '';
		dateEl.textContent = q.date.replace('-', '.');
		counterEl.textContent = `#${String(q.id).padStart(3, '0')}`;

		if (textMotionOk()) play(textEl, { duration: 850 });
		if (motionOk())
			metaEl.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 500,
				easing: 'ease-out',
			});

		if (opts.count) {
			draws++;
			updateStats();
		}
		if (opts.trackIt) track('quote_draw', { year: q.year });
	}

	function draw(user: boolean) {
		if (pool.length === 0) return;
		let q = pool[Math.floor(Math.random() * pool.length)];
		if (pool.length > 1) {
			while (q.id === currentId) q = pool[Math.floor(Math.random() * pool.length)];
		}
		present(q, { count: true, trackIt: user });
		if (auto) nextAt = performance.now() + AUTO_MS;
	}

	/* ---------- 复制 ---------- */

	let copyTimer = 0;
	async function copy() {
		const q = quotes.find((x) => x.id === currentId);
		if (!q) return;
		const line = `『${q.text}』${q.from ? ` —— ${q.from}` : ''}（林槐语录 · ${q.date.replace('-', '.')}）`;
		let ok = false;
		try {
			await navigator.clipboard.writeText(line);
			ok = true;
		} catch {
			const ta = document.createElement('textarea');
			ta.value = line;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.append(ta);
			ta.select();
			try {
				ok = document.execCommand('copy');
			} catch {
				ok = false;
			}
			ta.remove();
		}
		copyLabel.textContent = ok ? '已复制' : '复制失败';
		copyBtn.toggleAttribute('data-copied', ok);
		window.clearTimeout(copyTimer);
		copyTimer = window.setTimeout(() => {
			copyLabel.textContent = '复制';
			copyBtn.removeAttribute('data-copied');
		}, 1200);
	}

	/* ---------- 星空 + 自动播放（单 rAF 循环） ---------- */

	const field = new Starfield(canvas);
	let rafId = 0;
	let loopOn = false;
	let lastT = 0;

	function tick(now: number) {
		if (!loopOn) return;
		const dt = Math.min(0.05, (now - lastT) / 1000);
		lastT = now;
		field.render(now / 1000, dt, true);
		if (auto) {
			const p = Math.min(1, Math.max(0, 1 - (nextAt - now) / AUTO_MS));
			autoBar.style.transform = `scaleX(${p})`;
			if (now >= nextAt) {
				nextAt = now + AUTO_MS;
				draw(false);
			}
		}
		rafId = requestAnimationFrame(tick);
	}

	function ensureLoop() {
		if (loopOn || document.hidden) return;
		if (reduced && !auto) {
			field.render(0, 0, false);
			return;
		}
		loopOn = true;
		lastT = performance.now();
		rafId = requestAnimationFrame(tick);
	}

	function stopLoop() {
		loopOn = false;
		cancelAnimationFrame(rafId);
	}

	function toggleAuto() {
		auto = !auto;
		autoBtn.setAttribute('aria-pressed', String(auto));
		autoTrack.hidden = !auto;
		if (auto) {
			nextAt = performance.now() + AUTO_MS;
			ensureLoop();
		} else {
			autoBar.style.transform = 'scaleX(0)';
			if (reduced) stopLoop();
		}
	}

	/* ---------- 年份筛选 ---------- */

	function setYear(y: string) {
		year = y;
		pool = y === 'all' ? quotes : quotes.filter((q) => String(q.year) === y);
		chips.forEach((c) =>
			c.toggleAttribute('data-active', c.dataset.quoteYear === y),
		);
		updateStats();
		if (!pool.some((q) => q.id === currentId)) draw(true);
	}

	/* ---------- 全屏 ---------- */

	const fsFallback = () => machine.hasAttribute('data-fs-fallback');
	const fsActive = () => document.fullscreenElement === machine || fsFallback();
	const syncFs = () => fsBtn.setAttribute('aria-pressed', String(fsActive()));

	function exitFallback() {
		machine.removeAttribute('data-fs-fallback');
		document.body.style.overflow = '';
		syncFs();
	}

	let fsPending = false;
	async function toggleFullscreen() {
		if (fsPending) return;
		if (document.fullscreenElement === machine) {
			await document.exitFullscreen().catch(() => {});
			return;
		}
		if (fsFallback()) {
			exitFallback();
			return;
		}
		/* 原生全屏优先；iOS Safari 等不支持时退回固定定位全屏 */
		if ('requestFullscreen' in machine) {
			fsPending = true;
			try {
				await machine.requestFullscreen();
				return;
			} catch {
				/* 被拒绝 → 走回退 */
			} finally {
				fsPending = false;
			}
		}
		machine.setAttribute('data-fs-fallback', '');
		document.body.style.overflow = 'hidden';
		syncFs();
	}

	/* 退出原生全屏时顺带清掉可能残留的回退态，否则机器仍被固定定位撑满视口 */
	const onFsChange = () => {
		if (document.fullscreenElement !== machine && fsFallback()) exitFallback();
		syncFs();
	};

	/* ---------- 事件绑定 ---------- */

	drawBtn.addEventListener('click', () => draw(true));
	copyBtn.addEventListener('click', () => void copy());
	autoBtn.addEventListener('click', toggleAuto);
	fsBtn.addEventListener('click', () => void toggleFullscreen());
	document.addEventListener('fullscreenchange', onFsChange);
	chips.forEach((c) =>
		c.addEventListener('click', () => setYear(c.dataset.quoteYear ?? 'all')),
	);

	const onVisibility = () => {
		if (document.hidden) stopLoop();
		else {
			if (auto) nextAt = performance.now() + AUTO_MS;
			ensureLoop();
		}
	};
	document.addEventListener('visibilitychange', onVisibility);

	const resizeObs = new ResizeObserver(() => {
		field.resize();
		if (reduced && !auto) field.render(0, 0, false);
	});
	resizeObs.observe(stage);

	const themeObs = new MutationObserver(() => {
		field.readColors();
		if (reduced && !auto) field.render(0, 0, false);
	});
	themeObs.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	});

	/* ---------- 启动 ---------- */

	updateStats();
	ensureLoop();
	draw(false); // 首条随机（不上报）

	api = {
		draw: () => draw(true),
		copy: () => void copy(),
		toggleAuto,
		toggleFullscreen: () => void toggleFullscreen(),
		exitFs: () => {
			if (document.fullscreenElement === machine)
				void document.exitFullscreen().catch(() => {});
			if (fsFallback()) exitFallback();
		},
	};

	cleanup = () => {
		api = null;
		stopLoop();
		window.clearTimeout(copyTimer);
		document.removeEventListener('visibilitychange', onVisibility);
		document.removeEventListener('fullscreenchange', onFsChange);
		if (document.fullscreenElement === machine)
			void document.exitFullscreen().catch(() => {});
		if (fsFallback()) {
			machine.removeAttribute('data-fs-fallback');
			document.body.style.overflow = '';
		}
		resizeObs.disconnect();
		themeObs.disconnect();
		cleanup = null;
	};
}

function onKey(e: KeyboardEvent) {
	if (!api) return;
	const target = e.target;
	if (target instanceof Element && target.closest('input, textarea, select')) return;
	if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
	if (e.key === 'Escape') {
		api.exitFs();
		return;
	}
	if (e.code === 'Space') {
		e.preventDefault();
		api.draw();
	} else if (e.key === 'c' || e.key === 'C') {
		api.copy();
	} else if (e.key === 'a' || e.key === 'A') {
		api.toggleAuto();
	} else if (e.key === 'f' || e.key === 'F') {
		api.toggleFullscreen();
	}
}

export function initQuotes() {
	document.addEventListener('astro:page-load', setup);
	document.addEventListener('astro:before-swap', () => cleanup?.());
	if (!keyBound) {
		keyBound = true;
		document.addEventListener('keydown', onKey);
	}
	setup();
}
