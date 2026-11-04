/* ============================================================
 * CopyRight musicforprogramming.net
 * 此音乐播放器组件为借鉴实现，并优化了对中文的适配；如有版权问题请联系：
 * 1007028430.stapx@gmail.com
 *
 * 面板 DOM（Root.astro 内 id=music-* 的节点）
 * ============================================================ */

import { play } from "./scramble";

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
    /* 曲目自然播完 → 自动下一曲（末尾则停在 paused，stop 键可重播） */
    audioEl.addEventListener("ended", () => {
        if (state !== "playing") return;
        const i = playlistTracks.findIndex(
            (t) => t.id === currentTrack?.id,
        );
        const next = playlistTracks[i + 1];
        if (next) void playTrack(next);
        else setState("paused");
    });
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
 *    黄/橙/品红行；字符本身（_.-o:*^º'）再细分十级。
 * ============================================================ */

/* 四条字符阶梯 —— “空格”全部是 NBSP(\xa0)，各 32 字符。
 * 原站用 •（U+2022），但 fusion-pixel 里它是全角（1em）会让频谱列错位，
 * 换成半角的 o（像素圆环，最接近「点」的视觉且等宽） */
const N = "\u00a0";
const ramp = (pre: number, post: number) =>
    N.repeat(pre) + "_.-o:*^º'" + N.repeat(post); // 9 字形 + 23 填充 = 32
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
    /* 悬浮音乐按钮：播放中保持激活配色（data-playing） */
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
        B["music-prev"].label = "上一首";
        B["music-prev"].enabled = true;
        B["music-b30"].label = "-30";
        B["music-b30"].enabled = true;
        B["music-stop"].label = "暂停";
        B["music-stop"].enabled = true;
        B["music-f30"].label = "+30";
        B["music-f30"].enabled = true;
        B["music-next"].label = "下一首";
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
        audioEl?.pause();
        stopTime();
        B["music-stop"].label = "播放";
        B["music-stop"].enabled = true;
        /* 预选态（歌单加载后自动选中的第一首，尚未装载音频）：
           prev/next 也可直接点播，stop 即开播 */
        if (currentTrack) {
            B["music-prev"].label = "上一首";
            B["music-prev"].enabled = true;
            B["music-next"].label = "下一首";
            B["music-next"].enabled = true;
        }
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
    if (state === "playing") {
        setState("paused");
        return;
    }
    /* 预选未装载、或上一曲已自然播完 —— 播放链接是一次性的，现取开播 */
    if (currentTrack && (!audioEl?.src || audioEl?.ended)) {
        void playTrack(currentTrack);
        return;
    }
    setState("playing");
}

/* 上一曲 / 下一曲：在已加载的歌单里顺移（不循环，到头不动） */
function step(d: 1 | -1) {
    if (!currentTrack) return;
    const i = playlistTracks.findIndex((t) => t.id === currentTrack?.id);
    const next = playlistTracks[i + d];
    if (next) void playTrack(next);
}

/* ============================================================
 * 5. 曲目装载与点播。
 *    播放链接是一次性的（CDN 签名短时效）—— 每次播放前现取。
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

const SONG_URL_API = "https://api.stapxs.cn/music/song/url?id=";

let currentTrack: PlaylistTrack | null = null;

const labelOf = (t: PlaylistTrack) =>
    `${t.name}${t.tns ? `(${t.tns})` : ""} // ${t.artist}`;

async function playTrack(t: PlaylistTrack) {
    const player = document.getElementById("music-player");
    if (player) player.style.opacity = "0.5"; // 取链接中
    try {
        const res = await fetch(SONG_URL_API + t.id, {
            signal: AbortSignal.timeout(10_000),
        });
        const data = await res.json();
        const url: string | undefined = data?.data?.[0]?.url;
        if (!url) throw new Error("no url");
        currentTrack = t;
        markCurrentRow();
        await setTrack(labelOf(t), url.replace(/^http:/, "https:"));
    } catch {
        tickerSrc = "获取播放链接失败，请稍后再试".replaceAll(
            " ",
            "\u00a0",
        );
        tickerPos = 0;
    } finally {
        if (player) player.style.opacity = "1";
    }
}

let marqueeAnim: Animation | null = null;

function markCurrentRow() {
    marqueeAnim?.cancel();
    marqueeAnim = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
    document
        .querySelectorAll<HTMLElement>("#music-playlist [data-track]")
        .forEach((row) => {
            const isCurrent = Number(row.dataset.id) === currentTrack?.id;
            row.toggleAttribute("data-current", isCurrent);
            const label = row.querySelector<HTMLElement>("[data-label]");
            if (!label) return;
            const text = row.querySelector<HTMLElement>("[data-text]");
            if (isCurrent && text && !reduce) {
                const overflow = label.scrollWidth - label.clientWidth;
                if (overflow > 1) {
                    label.dataset.marquee = "";
                    /* 首尾各停 0.5s，中段约 30px/s 匀速 */
                    const hold = 1000;
                    const total = (overflow / 30) * 1000 + hold * 2;
                    const shift = `translateX(${-overflow}px)`;
                    marqueeAnim = text.animate(
                        [
                            { transform: "translateX(0)", offset: 0 },
                            {
                                transform: "translateX(0)",
                                offset: hold / total,
                            },
                            {
                                transform: shift,
                                offset: (total - hold) / total,
                            },
                            { transform: shift, offset: 1 },
                        ],
                        {
                            duration: total,
                            iterations: Infinity,
                            easing: "linear",
                        },
                    );
                }
            } else {
                delete label.dataset.marquee;
            }
        });
}

/* ============================================================
 * 6. 播放列表 —— 网易云音乐歌单
 * ============================================================ */

 //
const PLAYLIST_API =
    "https://api.stapxs.cn/music/playlist/detail?id=966613732&s=0";
const PLAYLIST_LIMIT = 10;

export interface PlaylistTrack {
    id: number;
    name: string;
    tns: string | null;
    artist: string;
    cover: string;
}

interface NcmTrack {
    id?: number;
    name?: string;
    tns?: string[];
    ar?: Array<{ name?: string }>;
    al?: { picUrl?: string };
}

/* 已加载的曲目缓存 */
let playlistTracks: PlaylistTrack[] = [];

async function loadPlaylist() {
    const box = document.getElementById("music-playlist");
    if (!box) return;
    try {
        const res = await fetch(PLAYLIST_API, {
            signal: AbortSignal.timeout(10_000),
        });
        const data = await res.json();
        const tracks: NcmTrack[] = data?.playlist?.tracks ?? [];
        playlistTracks = tracks.slice(0, PLAYLIST_LIMIT).map((t) => ({
            id: t.id ?? 0,
            name: t.name ?? "未知曲目",
            tns: t.tns?.[0] ?? null,
            artist: t.ar?.[0]?.name ?? "未知",
            cover: t.al?.picUrl
                ? t.al.picUrl.replace(/^http:/, "https:") + "?param=48y48"
                : "",
        }));
        if (playlistTracks.length === 0) throw new Error("empty");
        renderPlaylist(box, playlistTracks);
        if (
            document.documentElement.classList.contains("music-open") &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            box.querySelectorAll<HTMLElement>("[data-track]").forEach(
                (row, i) => {
                    row.animate([{ opacity: "0" }, { opacity: "1" }], {
                        duration: 300,
                        delay: i * 60,
                        easing: "ease-out",
                        fill: "backwards",
                    });
                    play(row, { duration: 600, delay: 450 + i * 60 });
                },
            );
        }
        currentTrack = playlistTracks[0];
        markCurrentRow();
        setState("paused");
    } catch {
        /* 失败：提示 + 重试按钮（再来一次 loadPlaylist） */
        renderPlaylistError(box);
    }
}

/* 失败态：提示文案 + [retry] 按钮（终端按钮风，样式见 CSS 模块） */
function renderPlaylistError(box: HTMLElement) {
    box.replaceChildren();
    const msg = document.createElement("p");
    msg.dataset.error = "";
    msg.textContent = "播放列表加载失败";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.dataset.retry = "";
    retry.textContent = "[retry]";
    retry.addEventListener("click", () => {
        retry.disabled = true;
        msg.textContent = "正在重试 …";
        void loadPlaylist();
    });
    msg.append(" ", retry);
    box.append(msg);
}

function renderPlaylist(box: HTMLElement, tracks: PlaylistTrack[]) {
    box.replaceChildren();
    const bar = document.createElement("div");
    bar.dataset.hoverBar = "";
    bar.setAttribute("aria-hidden", "true");
    box.append(bar);
    tracks.forEach((t) => {
        const row = document.createElement("button");
        row.type = "button";
        row.dataset.track = "";
        row.dataset.id = String(t.id);
        row.title = labelOf(t);
        row.addEventListener("click", () => void playTrack(t));

        const cover = document.createElement("div");
        cover.dataset.cover = "";
        if (t.cover) cover.style.backgroundImage = `url("${t.cover}")`;

        const label = document.createElement("span");
        label.dataset.label = "";
        const text = document.createElement("span");
        text.dataset.text = "";
        text.append(t.name);
        if (t.tns) {
            const tns = document.createElement("span");
            tns.dataset.tns = "";
            tns.textContent = `(${t.tns})`;
            text.append(tns);
        }
        text.append(` // ${t.artist}`);
        label.append(text);

        row.append(cover, label);
        box.append(row);
    });
}

/* ============================================================
 * 6.5 插播
 * ============================================================ */

export function queueAndPlay(track: PlaylistTrack) {
    const existing = playlistTracks.find((t) => t.id === track.id);
    if (existing) {
        void playTrack(existing);
        return;
    }
    const i = playlistTracks.findIndex((t) => t.id === currentTrack?.id);
    if (i >= 0) playlistTracks.splice(i, 0, track);
    else playlistTracks.push(track);
    /* 队列变了要重渲染列表（纯渲染，不触发级联入场） */
    const box = document.getElementById("music-playlist");
    if (box) renderPlaylist(box, playlistTracks);
    void playTrack(track);
}

/* ============================================================
 * 7. 入场
 * ============================================================ */

function panelEntrance() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = document.querySelectorAll<HTMLElement>("#music-player > div");
    const playlist = document.getElementById("music-playlist");
    /* 自上而下错峰：传输行 → 时间/音量行 → 播放列表 */
    rows[0] && play(rows[0], { duration: 800 });
    rows[1] && play(rows[1], { duration: 800, delay: 150 });
    if (playlist) {
        playlist.animate([{ opacity: "0" }, { opacity: "1" }], {
            duration: 450,
            delay: 300,
            easing: "ease-out",
            fill: "backwards",
        });
        play(playlist, { duration: 900, delay: 300 });
    }
}

/* ============================================================
 * 8. 启动
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
    void loadPlaylist();
    document.fonts?.ready.then(() => markCurrentRow());
    /* 面板每次打开（Root.astro 在 #music-toggle 点开时派发事件）：
     * 文字解密入场 */
    window.addEventListener("music-panel-open", panelEntrance);
    /* 文章页关联歌曲的播放按钮（[data-song-id]，歌曲信息由构建期
     * 烘在 data-* 上）：插播 + 请求弹出面板。
     * 委托在 document 上 —— 切页后的新按钮自动生效 */
    document.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>(
            "[data-song-id]",
        );
        if (!btn) return;
        const id = Number(btn.dataset.songId);
        if (!id) return;
        queueAndPlay({
            id,
            name: btn.dataset.songName ?? "未知曲目",
            tns: btn.dataset.songTns || null,
            artist: btn.dataset.songArtist ?? "未知",
            cover: btn.dataset.songCover ?? "",
        });
        window.dispatchEvent(new Event("music-panel-open-request"));
    });
    document.addEventListener("astro:after-swap", renderButtons);
}
