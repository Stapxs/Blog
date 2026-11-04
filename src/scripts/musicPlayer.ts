/* ============================================================
 * CopyRight musicforprogramming.net
 * 此音乐播放器组件为借鉴实现，并优化了对中文的适配；如有版权问题请联系：
 * 1007028430.stapx@gmail.com
 *
 * 面板 DOM（Root.astro 内 id=music-* 的节点）
 * ============================================================ */

/* ---------- 小工具 ---------- */

function fmtVolume(t: number): string {
    let s = String(t);
    if (s.length < 3) s += " ";
    return s + "%";
}

function fmtTime(t: number): string {
    const e = ~~t;
    const h = ~~(e / 3600);
    const m = ~~((e - 3600 * h) / 60);
    const s = e - 3600 * h - 60 * m;
    const p = (n: number) => (n < 10 ? "0" + n : String(n));
    return `${p(h)}:${p(m)}:${p(s)}`;
}

const $ = (id: string) => document.getElementById(id);
const setText = (id: string, text: string) => {
    const el = $(id);
    if (el) el.textContent = text;
};

let ctx: AudioContext | null = null;
let audioEl: HTMLAudioElement;
let analyser: AnalyserNode;
let freqData: Uint8Array;
let gainNode: GainNode;

let v = parseInt(localStorage.getItem("music-volume") ?? "") || 100;

function ensureGraph() {
    if (ctx) return;
    ctx = new AudioContext();
    audioEl = new Audio();
    audioEl.crossOrigin = "anonymous"; // 外链流时防 CORS 污染
    const srcNode = ctx.createMediaElementSource(audioEl);
    analyser = ctx.createAnalyser();
    analyser.minDecibels = -114;
    analyser.maxDecibels = -30;
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.666;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    gainNode = ctx.createGain();
    gainNode.gain.value = Math.pow(0.01 * v, 1.666);
    srcNode.connect(analyser);
    srcNode.connect(gainNode);
    gainNode.connect(ctx.destination);
}

function adjustVolume(d: number) {
    v = Math.min(100, Math.max(10, v + d));
    localStorage.setItem("music-volume", String(v));
    if (gainNode) gainNode.gain.value = Math.pow(0.01 * v, 1.666);
    setText("music-vol", fmtVolume(v));
}

/* ============================================================
 *    32 列对数频率轴（bin = floor(c)+col，c 每列 ×1.08 起步），
 *    强度 i = max((freqData[bin]+s)>>3, 0)，s 从 -40 起每列 +1.5。
 *    四条字符阶梯错位 8 格：低强度落在绿行，强度升高逐级到
 *    黄/橙/品红行；字符本身（_.-•:*^º'）再细分十级。
 * ============================================================ */

/* 四条字符阶梯 —— “空格”全部是 NBSP(\xa0)，各 32 字符 */
const N = "\u00a0";
const ramp = (pre: number, post: number) =>
    N.repeat(pre) + "_.-•:*^º'" + N.repeat(post); // 9 字形 + 23 填充 = 32
const RAMP = [
    ramp(23, 0), // 品红行（最强）：字形区间 [23,31]
    ramp(15, 8), // 橙行：[15,23]
    ramp(7, 16), // 黄行：[7,15]
    ramp(0, 23), // 绿行（最弱）：[0,8]
];

function spectrum() {
    if (analyser && document.documentElement.classList.contains("music-open")) {
        analyser.getByteFrequencyData(freqData);
        let t = "",
            e = "",
            r = "",
            a = "",
            s = -40,
            l = 1.08,
            c = 1;
        for (let o = 0; o < 32; ) {
            const i = Math.min(31, Math.max((freqData[~~c + o] + s) >> 3, 0));
            c *= l;
            o++;
            s += 1.5;
            l += 0.01;
            t += RAMP[0][i];
            e += RAMP[1][i];
            r += RAMP[2][i];
            a += RAMP[3][i];
        }
        setText("music-sp1", t);
        setText("music-sp2", e);
        setText("music-sp3", r);
        setText("music-sp4", a);
    }
    requestAnimationFrame(spectrum);
}

/* ============================================================
 * 3. Episode 跑马灯
 *    每 500ms 前进一格，循环播报
 * ============================================================ */

let tickerSrc = " ";
let tickerPos = 0;
let tickerTimer: number | undefined;

function ticker() {
    window.clearTimeout(tickerTimer);
    let t = tickerPos,
        out = "";
    while (out.length < 32)
        out += tickerSrc[t % tickerSrc.length], t++;
    setText("music-ticker", out);
    tickerPos++;
    tickerTimer = window.setTimeout(ticker, 500);
}

/* 时间码 —— 暂停时由状态机清除 */
let timeTimer: number | undefined;

function stopTime() {
    window.clearTimeout(timeTimer);
}

function startTime() {
    stopTime();
    setText("music-time", fmtTime(audioEl.currentTime));
    timeTimer = window.setTimeout(startTime, 500);
}

/* ============================================================
 * 4. 按钮与状态机
 *    empty / playing / paused 三态
 *    按钮为面板内静态节点（非动态创建），脚本只渲染
 *    label / data-colour / disabled。
 * ============================================================ */

interface ButtonDef {
    id: string;
    label: string;
    enabled: boolean;
    colour: string;
    run: () => void;
    el: HTMLButtonElement | null;
}

const buttons: ButtonDef[] = [
    { id: "music-prev", label: "----", enabled: false, colour: "green", run: () => step(-1), el: null },
    { id: "music-b30", label: "---", enabled: false, colour: "green", run: () => seek(-30), el: null },
    { id: "music-stop", label: "----", enabled: false, colour: "green", run: toggleStop, el: null },
    { id: "music-f30", label: "---", enabled: false, colour: "green", run: () => seek(30), el: null },
    { id: "music-next", label: "----", enabled: false, colour: "green", run: () => step(1), el: null },
    { id: "music-vminus", label: "--", enabled: false, colour: "purple", run: () => adjustVolume(-5), el: null },
    { id: "music-vplus", label: "--", enabled: false, colour: "purple", run: () => adjustVolume(5), el: null },
];

function renderButtons() {
    buttons.forEach((b) => {
        if (!b.el) return;
        b.el.textContent = "[" + b.label + "]";
        b.el.dataset.colour = b.enabled ? b.colour : "grey";
        b.el.disabled = !b.enabled;
    });
    /* 面板关闭但仍在播放时，悬浮按钮保持激活配色 */
    $("music-toggle")?.toggleAttribute("data-playing", state === "playing");
}

let state = "empty";

function setState(next: string) {
    state = next;
    const B = Object.fromEntries(buttons.map((b) => [b.id, b]));
    if (next === "empty") {
        audioEl?.pause();
        stopTime();
        B["music-prev"].label = "----";
        B["music-prev"].enabled = false;
        B["music-b30"].label = "---";
        B["music-b30"].enabled = false;
        B["music-stop"].label = "----";
        B["music-stop"].enabled = false;
        B["music-f30"].label = "---";
        B["music-f30"].enabled = false;
        B["music-next"].label = "----";
        B["music-next"].enabled = false;
        B["music-vminus"].label = "--";
        B["music-vminus"].enabled = false;
        B["music-vplus"].label = "--";
        B["music-vplus"].enabled = false;
        setText("music-vol", "....");
    }
    if (next === "playing") {
        audioEl.play();
        startTime();
        B["music-prev"].label = "prev";
        B["music-prev"].enabled = true;
        B["music-b30"].label = "-30";
        B["music-b30"].enabled = true;
        B["music-stop"].label = "stop";
        B["music-stop"].enabled = true;
        B["music-f30"].label = "+30";
        B["music-f30"].enabled = true;
        B["music-next"].label = "next";
        B["music-next"].enabled = true;
        B["music-vminus"].label = "v-";
        B["music-vminus"].enabled = true;
        B["music-vminus"].colour = "purple";
        B["music-vplus"].label = "v+";
        B["music-vplus"].enabled = true;
        B["music-vplus"].colour = "purple";
        setText("music-vol", fmtVolume(v));
    }
    if (next === "paused") {
        audioEl.pause();
        stopTime();
        B["music-stop"].label = "play"; // 其余按钮保持原样
        B["music-stop"].enabled = true;
    }
    renderButtons();
}

/* ---------- 交互 ---------- */

function seek(d: number) {
    /* 越界钳制（+30 最多到 duration-1） */
    const t = audioEl.currentTime + d;
    audioEl.currentTime = Math.max(
        0,
        Math.min(t, (audioEl.duration || 60) - 1),
    );
}

function toggleStop() {
    setState(state === "playing" ? "paused" : "playing");
}

/* 待播放列表接入：上一曲 / 下一曲 */
function step(_d: 1 | -1) {
    /* TODO: 曲目队列切换（播放列表实现后接线） */
}

/* ============================================================
 * 5. 曲目装载 —— 播放列表（后续实现）的点播入口。
 * ============================================================ */

export async function setTrack(title: string, url: string) {
    ensureGraph();
    audioEl.src = url;
    audioEl.load();
    tickerSrc = title.replaceAll(" ", "\u00a0") + "\u00a0•\u00a0";
    tickerPos = 0;
    await ctx!.resume();
    setState("playing");
}

/* ============================================================
 * 6. 启动
 * ============================================================ */

export function initMusicPlayer() {
    buttons.forEach((b) => {
        b.el = $(b.id) as HTMLButtonElement | null;
        b.el?.addEventListener("click", () => {
            if (b.enabled) b.run();
        });
    });
    setState("empty");
    ticker();
    spectrum();
    /* 切页后面板 DOM 持久、按钮态不变；需要重挂的只有
     * 新文档里的悬浮按钮（data-playing），renderButtons 顺带完成 */
    document.addEventListener("astro:after-swap", renderButtons);
}
