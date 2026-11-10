/* ============================================================
 * 站点偏好设置
 *
 * 注意：键名与 Root.astro head 内联脚本共用 —— 内联脚本无法
 * import 本文件，改名需两处同步。
 * ============================================================ */

export const MOTION_KEY = 'text-motion';
export const THEME_KEY = 'theme';
export const CURSOR_KEY = 'cursor';

export type ThemePref = 'light' | 'dark' | 'system';
export type SwitchPref = 'on' | 'off';

/* ============ 开关通用读写 ============ */

function switchOn(key: string): boolean {
    try {
        return localStorage.getItem(key) !== 'off';
    } catch {
        /* 隐私模式等：默认开启 */
        return true;
    }
}

export function writeSwitchPref(key: string, state: SwitchPref) {
    try {
        if (state === 'off') localStorage.setItem(key, 'off');
        else localStorage.removeItem(key);
    } catch {
        /* 写不进去就算了 */
    }
}

/* ============ 动效 ============ */

/** 系统是否允许动效*/
export function motionOk(): boolean {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 文本动画（打字机）是否可用：系统未减弱动效 且 用户未关闭 */
export function textMotionOk(): boolean {
    return motionOk() && switchOn(MOTION_KEY);
}

export const writeMotionPref = (state: SwitchPref) =>
    writeSwitchPref(MOTION_KEY, state);

/* ============ 主题偏好 ============ */

/* 与 head 内联脚本的 LABELS 保持一致 */
const THEME_LABELS: Record<ThemePref, string> = {
    dark: '切换主题，当前暗色',
    light: '切换主题，当前亮色',
    system: '切换主题，当前跟随系统',
};

export function readThemePref(): ThemePref {
    try {
        const v = localStorage.getItem(THEME_KEY);
        return v === 'light' || v === 'dark' ? v : 'system';
    } catch {
        return 'system';
    }
}

/** 应用主题偏好 */
export function applyThemePref(pref: ThemePref) {
    const root = document.documentElement;
    const resolved =
        pref === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            : pref;
    root.dataset.themeMode = pref;
    root.dataset.theme = resolved;
    try {
        localStorage.setItem(THEME_KEY, pref);
    } catch {
        /* 隐私模式：仅本页生效 */
    }
    const label = THEME_LABELS[pref];
    const btn = document.getElementById('theme-toggle');
    btn?.setAttribute('aria-label', label);
    btn?.setAttribute('title', label);
}

/* ============ 自定义鼠标 ============ */
export const cursorOn = () => switchOn(CURSOR_KEY);

export function applyCursorPref(state: SwitchPref) {
    document.documentElement.classList.toggle('cursor-off', state === 'off');
    writeSwitchPref(CURSOR_KEY, state);
}

/* ============ 初始化 ============ */
export function initSettings() {
    const syncCursor = () =>
        document.documentElement.classList.toggle('cursor-off', !cursorOn());
    syncCursor();
    document.addEventListener('astro:after-swap', syncCursor);
}
