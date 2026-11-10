/* ============================================================
 * 首访欢迎
 * ============================================================ */

import { play } from './scramble';
import { track } from './analytics';
import {
    applyCursorPref,
    applyThemePref,
    cursorOn,
    motionOk,
    readThemePref,
    textMotionOk,
    writeMotionPref,
    type SwitchPref,
    type ThemePref,
} from './settings';

const STORAGE_KEY = 'cookie-consent';
/** 授权记录版本：升级后 +1 */
const CONSENT_VERSION = 1;

export type ConsentLevel = 'all' | 'essential';

interface ConsentRecord {
    v: number;
    level: ConsentLevel;
    at: number;
}

declare global {
    interface Window {
        __bootPending?: boolean;
        __bootPlayed?: boolean;
    }
}

const gateEl = () => document.getElementById('welcome-gate');

/** 读取授权记录；缺失 / 损坏 / 版本过旧都视为未授权 */
export function readConsent(): ConsentRecord | null {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch {
        /* 隐私模式等场景：当作未授权 */
    }
    if (!raw) return null;
    try {
        const rec = JSON.parse(raw) as Partial<ConsentRecord>;
        if (
            rec &&
            typeof rec.v === 'number' &&
            rec.v >= CONSENT_VERSION &&
            (rec.level === 'all' || rec.level === 'essential')
        ) {
            return rec as ConsentRecord;
        }
    } catch {
        /* 损坏记录当作未授权 */
    }
    return null;
}

function writeConsent(level: ConsentLevel) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                v: CONSENT_VERSION,
                level,
                at: Date.now(),
            } satisfies ConsentRecord),
        );
    } catch {
        /* 写不进去就算了 */
    }
}

/* ============ umami 动态注入 ============ */

function loadAnalytics() {
    if (!import.meta.env.PROD) return;
    if (document.querySelector('script[data-umami]')) return;
    const env = import.meta.env as Record<string, string | undefined>;
    const s = document.createElement('script');
    s.defer = true;
    s.src = env.PUBLIC_UMAMI_SRC ?? 'https://status.stapxs.cn/script.js';
    s.dataset.websiteId =
        env.PUBLIC_UMAMI_ID ?? 'd8f1b578-64ec-4b37-a67e-839c93af9efd';
    s.dataset.domains = 'blog.stapxs.cn';
    s.setAttribute('data-umami', '');
    document.head.appendChild(s);
}


let lastFocus: HTMLElement | null = null;

function scrambleIn() {
    const els = document.querySelectorAll<HTMLElement>('[data-gate-scramble]');
    els.forEach((el, i) => {
        el.classList.add('in');
        if (!textMotionOk()) return;
        const len = (el.textContent ?? '').length;
        play(el, {
            duration: Math.min(1400, Math.max(600, 420 + len * 7)),
            delay: 120 + i * 260,
        });
    });
}

/* ============ 基本设置 ============ */

const SETTING_GROUPS: Array<{
    ds: string;
    attr: string;
    read: () => string;
}> = [
    {
        ds: 'gateMotion',
        attr: 'gate-motion',
        read: () => (textMotionOk() ? 'on' : 'off'),
    },
    { ds: 'gateTheme', attr: 'gate-theme', read: readThemePref },
    {
        ds: 'gateCursor',
        attr: 'gate-cursor',
        read: () => (cursorOn() ? 'on' : 'off'),
    },
];

const asSwitch = (v: string): SwitchPref => (v === 'off' ? 'off' : 'on');
const SETTING_APPLY: Record<string, (value: string) => void> = {
    'gate-theme': (v) => applyThemePref(v as ThemePref),
    'gate-motion': (v) => writeMotionPref(asSwitch(v)),
    'gate-cursor': (v) => applyCursorPref(asSwitch(v)),
};

const toDsKey = (attr: string) =>
    attr.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());

function syncSettingsUI() {
    const gate = gateEl();
    if (!gate) return;
    for (const g of SETTING_GROUPS) {
        const value = g.read();
        gate.querySelectorAll<HTMLElement>(`[data-${g.attr}]`).forEach((b) => {
            const on = b.dataset[g.ds] === value;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', String(on));
        });
    }
}

function openGate() {
    const gate = gateEl();
    if (!gate) return;
    const root = document.documentElement;
    if (!root.classList.contains('gate-open')) {
        lastFocus = document.activeElement as HTMLElement | null;
        root.classList.add('gate-open');
    }
    document.body.style.overflow = 'hidden';
    resetConfirmState();
    syncSettingsUI();
    gate.querySelector<HTMLElement>('[data-gate-accept]')?.focus();
    scrambleIn();
}

type GateCard = 'cookie' | 'settings';

const confirmed: Record<GateCard, boolean> = {
    cookie: false,
    settings: false,
};

const CARD_SEL: Record<GateCard, string> = {
    cookie: '[data-gate-card="cookie"]',
    settings: '[data-gate-card="settings"]',
};

function resetConfirmState() {
    confirmed.cookie = false;
    confirmed.settings = false;
    gateEl()
        ?.querySelectorAll('[data-gate-card].done')
        .forEach((el) => el.classList.remove('done'));
}

function markCardDone(card: GateCard, note: string) {
    confirmed[card] = true;
    const gate = gateEl();
    const cardEl = gate?.querySelector<HTMLElement>(CARD_SEL[card]);
    if (cardEl) {
        cardEl.classList.add('done');
        const noteEl = cardEl.querySelector<HTMLElement>(
            '[data-gate-done-note]',
        );
        if (noteEl) {
            noteEl.textContent = note;
            if (textMotionOk()) play(noteEl, { duration: 500 });
        }
    }
    const other: GateCard = card === 'cookie' ? 'settings' : 'cookie';
    if (!confirmed[other]) {
        const otherEl = gate?.querySelector<HTMLElement>(CARD_SEL[other]);
        otherEl
            ?.querySelector<HTMLElement>(
                other === 'settings'
                    ? '[data-gate-settings-ok]'
                    : '[data-gate-accept]',
            )
            ?.focus();
    }
}

function confirmCookie(level: ConsentLevel) {
    writeConsent(level);
    if (level === 'all') loadAnalytics();
    track('cookie_consent', { level });
    markCardDone(
        'cookie',
        level === 'all' ? '[ok] 已授权：全部允许' : '[ok] 已授权：仅保留必要',
    );
    tryClose();
}

function confirmSettings() {
    markCardDone('settings', '[ok] 设置已确认');
    tryClose();
}

function tryClose() {
    if (confirmed.cookie && confirmed.settings) closeGate();
}

function closeGate() {
    const gate = gateEl();
    const root = document.documentElement;

    const runBootNow =
        window.__bootPending === true &&
        textMotionOk() &&
        typeof runBoot === 'function';
    window.__bootPending = false;
    if (runBootNow) {
        window.__bootPlayed = true;
        root.classList.add('boot');
    }

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        root.classList.remove('gate-open');
        gate?.classList.remove('closing');
        document.body.style.overflow = '';
        lastFocus?.focus?.();
        lastFocus = null;
        if (runBootNow) runBoot?.();
    };

    if (gate && motionOk()) {
        gate.classList.add('closing');
        gate.addEventListener('animationend', finish, { once: true });
        /* 兜底：动画事件没触发也不能把人锁在空门里 */
        window.setTimeout(finish, 400);
    } else {
        finish();
    }
}

/* ============ 状态同步 ============ */

function syncGate() {
    if (readConsent()) {
        document.documentElement.classList.remove('gate-open');
        document.body.style.overflow = '';
        gateEl()?.classList.remove('closing');
    } else {
        openGate();
    }
}

/* ============ 对外初始化 ============ */

let runBoot: (() => void) | null = null;

export function initWelcomeGate(boot: () => void) {
    runBoot = boot;

    if (readConsent()?.level === 'all') loadAnalytics();

    syncGate();

    document.addEventListener('click', (e) => {
        const el = e.target as HTMLElement | null;
        if (!el?.closest) return;
        if (el.closest('[data-gate-accept]')) {
            confirmCookie('all');
            return;
        }
        if (el.closest('[data-gate-essential]')) {
            confirmCookie('essential');
            return;
        }
        if (el.closest('[data-gate-settings-ok]')) {
            confirmSettings();
            return;
        }
        for (const attr of Object.keys(SETTING_APPLY)) {
            const btn = el.closest<HTMLElement>(`[data-${attr}]`);
            if (!btn) continue;
            const value = btn.dataset[toDsKey(attr)] ?? '';
            SETTING_APPLY[attr]?.(value);
            track('setting_change', {
                key: attr.replace('gate-', ''),
                value,
            });
            syncSettingsUI();
            return;
        }
        if (el.closest('#settings-toggle')) {
            e.preventDefault();
            openGate();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const root = document.documentElement;
        if (!root.classList.contains('gate-open')) return;
        const gate = gateEl();
        if (!gate) return;
        const focusables = Array.from(
            gate.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea',
            ),
        ).filter((f) => !f.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (!active || active === first || !gate.contains(active))) {
            e.preventDefault();
            last.focus();
        } else if (
            !e.shiftKey &&
            (!active || active === last || !gate.contains(active))
        ) {
            e.preventDefault();
            first.focus();
        }
    });

    /* 供其他模块 */
    window.addEventListener('welcome-gate-open', openGate);
    document.addEventListener('astro:after-swap', syncGate);
}
