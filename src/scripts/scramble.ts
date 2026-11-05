/* ============================================================
 * CopyRight musicforprogramming.net
 * 此文字效果为借鉴实现，并优化了对中文的适配；如有版权问题请联系：
 * 1007028430.stapx@gmail.com
 * ============================================================ */

const GLYPHS = '[]{}()<>/=+*~^?#$%&@!|;:._-x';
const NBSP = '\u00a0'; // 不断行空格：占位但不会被 HTML 折叠

/* ============ 中文适配：宽度匹配 ============ */
/* 等宽字体里汉字是全角宽。空白占位和乱码必须与被替换字符"同宽"，
 * 否则动画期间行长会不停抖动。所以：汉字位用全角空格/汉字乱码，
 * 拉丁位用 NBSP/原站符号。 */
const WIDE_GLYPHS =
	'码数据网云计算密码通信信号流波频源端程式语言机字节比特阵列矩阵递归算法架构协议？！＃＄％＊｜～';
const WIDE_SPACE = '\u3000'; // 全角空格（表意文字空格，正好一个汉字宽）

function isWide(ch: string): boolean {
	const c = ch.codePointAt(0) as number;
	return (
		(c >= 0x1100 && c <= 0x115f) || // 谚文字母
		(c >= 0x2e80 && c <= 0x303e) || // CJK 部首、康熙部首、CJK 符号
		(c >= 0x3041 && c <= 0x33ff) || // 假名、注音、CJK 补充
		(c >= 0x3400 && c <= 0x4dbf) || // 扩展 A
		(c >= 0x4e00 && c <= 0x9fff) || // 基本区（常用汉字）
		(c >= 0xac00 && c <= 0xd7a3) || // 谚文音节
		(c >= 0xf900 && c <= 0xfaff) || // 兼容表意文字
		(c >= 0xfe30 && c <= 0xfe4f) || // CJK 兼容形式
		(c >= 0xff00 && c <= 0xff60) || // 全角 ASCII／全角标点
		(c >= 0xffe0 && c <= 0xffe6)
	);
}

/* 递归收集元素下所有非空白文本节点（跳过纯空白、去掉 \n\r\t） */
function collectTextNodes(el: Node, out: Text[] = []): Text[] {
	el.childNodes.forEach((n) => {
		if (n.nodeType === Node.TEXT_NODE) {
			if (n.nodeValue !== ' ') {
				n.nodeValue = (n.nodeValue as string).replace(/(\n|\r|\t)/gm, '');
				out.push(n as Text);
			}
		} else {
			collectTextNodes(n, out);
		}
	});
	return out;
}

const randomGlyph = (reverse: boolean, wide: boolean): string => {
	if (reverse) return 'x';
	const pool = wide ? WIDE_GLYPHS : GLYPHS; // 按被替换字符的宽度选池
	return pool[~~(Math.random() * pool.length)];
};

/** 替换字符串 s 第 i 位为 ch */
const setChar = (s: string, i: number, ch: string): string =>
	i > s.length - 1 || i < 0 ? s : s.substring(0, i) + ch + s.substring(i + 1);

/** 把元素的所有文本节点替换为宽度匹配的空白模板（行长不变、零布局抖动）。
 *  用于"滚到哪里、哪里解密"的滚动揭示：屏外段落先铺空白，进入视口再 play()。
 *  原文按文本节点身份（而非位置）保存在 WeakMap 里：blank 与 restore 之间
 *  外部脚本可能重排 DOM（如相簿瀑布流把卡片分进各列），按位置还原会把
 *  别的节点的文字写进来；按节点还原则与顺序无关。 */
const originals = new WeakMap<HTMLElement, Map<Text, string>>();

export function blankNode(node: HTMLElement): void {
	const nodes = collectTextNodes(node);
	const saved = new Map<Text, string>();
	for (const n of nodes) saved.set(n, n.nodeValue as string);
	originals.set(node, saved);
	const lens = nodes.map((n) => n.nodeValue.length);
	const text = nodes.map((n) => n.nodeValue).join('');
	const blank = text
		.split(' ')
		.map((w) => [...w].map((ch) => (isWide(ch) ? WIDE_SPACE : NBSP)).join(''))
		.join(' ');
	let off = 0;
	nodes.forEach((n, i) => {
		n.nodeValue = blank.slice(off, off + lens[i]);
		off += lens[i];
	});
}

/** 恢复 blankNode 保存的原文（若未 blank 过则无操作） */
export function restoreNode(node: HTMLElement): void {
	const saved = originals.get(node);
	if (!saved) return;
	const nodes = collectTextNodes(node);
	for (const n of nodes) {
		const text = saved.get(n);
		if (text !== undefined) n.nodeValue = text;
	}
	originals.delete(node);
}

export interface ScrambleOptions {
	duration?: number;
	delay?: number;
	reverse?: boolean;
	absolute?: boolean;
	pointerEvents?: boolean;
	onDone?: () => void;
}

/* 核心函数：返回 { duration, delay, tick }，tick(p) 每帧收到进度 p。
 * 入场 p: 0→1；离场 p: 1→0。 */
function scramble(node: HTMLElement, { duration = 1000, delay = 0, reverse = false, absolute = false, pointerEvents = true } = {}) {
	const nodes = collectTextNodes(node);
	const lens = nodes.map((n) => n.nodeValue.length);
	const text = nodes.map((n) => n.nodeValue).join(''); // 完整真实文本
	const blank = text // 与原文同构的空白模板
		.split(' ')
		.map((w) => [...w].map((ch) => (isWide(ch) ? WIDE_SPACE : NBSP)).join(''))
		.join(' '); // 逐字符按宽度选空格 → 动画全程行长零抖动
	let tape = '' + blank; // 持久"乱码磁带"
	const bandMax = ~~(text.length * (reverse ? 0.25 : 1.5)); // 波带最大宽度
	const pReal = reverse ? 0.1 : 0.8; // 真字符概率阈值
	const dir = reverse ? -1 : 1;

	/* 离场时元素脱离文档流（absolute 悬浮），并禁掉指针事件 */
	if (absolute) node.style.position = 'absolute', (node.style.top = '0');
	if (!pointerEvents) node.style.pointerEvents = 'none';

	return {
		duration,
		delay,
		reverse, // 交给驱动器判断进度方向（intro 0→1 / outro 1→0）
		tick(p: number) {
			// 1) 缓动：easeInOutSine 再平方 —— 起步/收尾都慢，中段快
			let t = -(Math.cos(Math.PI * p) - 1) / 2;
			t = Math.pow(t, 2);
			if (reverse) t = 1 - t;

			const front = ~~(text.length * Math.abs(t * dir)); // 揭示前沿
			const band = ~~(2 * (0.5 - Math.abs(t - 0.5)) * bandMax); // 波带宽度（中段最宽）

			// 2) 已揭示部分 = 真实文本（反向则是空白）
			let out = reverse
				? blank.slice(0, Math.max(front - 1 - band, 0))
				: text.slice(0, front);

			// 3) 每帧 50% 概率，在波带里重掷最多 20 个位置
			if (Math.random() < 0.5 && t < 1 && t !== 0) {
				for (let k = 0; k < 20; k++) {
					const idx = front + ~~((1 - Math.random()) * bandMax * (k / 20));
					// 关键守卫：普通空格位置不写乱码 → 词间距永远保留
					if (' ' !== tape[idx]) {
						tape =
							Math.random() > pReal
								? setChar(tape, idx, text[idx]) // 少数时候写入真字符（闪现预览）
								: setChar(tape, idx, randomGlyph(reverse, isWide(text[idx] || ' ')));
					}
				}
			}

			// 4) 前沿之后拼上"乱码波带 + 未到的空白"
			out += reverse
				? tape.slice(Math.max(front - 1 - band, 0), Math.max(front - 1, 0)) +
					text.slice(Math.max(front - 1, 0))
				: tape.slice(front, front + band) + blank.slice(front + band);

			// 5) 按原长度切回每个文本节点 → 嵌套的 <em>/<span> 等结构完好无损
			let off = 0;
			nodes.forEach((n, i) => {
				n.nodeValue = out.slice(off, off + lens[i]);
				off += lens[i];
			});
		},
	};
}

/* rAF 驱动
 * 入场进度 0→1，离场（reverse）1→0。
 * 性能：用 performance.now() 而非 rAF 回调时间戳，
 * 后者在部分环境（无头浏览器、后台标签页节流）下与真实时间不同步。 */
export function play(node: HTMLElement, opts: ScrambleOptions = {}): void {
	// 若该元素曾被 blankNode 铺成空白，先恢复原文（否则空白会被当成揭示目标）
	restoreNode(node);
	const t = scramble(node, opts);
	const start = performance.now() + (t.delay || 0);
	const from = t.reverse ? 1 : 0;
	const to = 1 - from;
	let done = false;

	// 先同步渲染起始帧（intro 即全空白），避免 delay 期间闪出真实文本
	t.tick(from);

	function frame() {
		const r = Math.min(1, Math.max(0, (performance.now() - start) / t.duration));
		t.tick(from + (to - from) * r);
		if (r < 1) requestAnimationFrame(frame);
		else if (!done) {
			done = true;
			opts.onDone && opts.onDone();
		}
	}
	requestAnimationFrame(frame);
}
