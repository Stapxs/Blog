/**
 * 链接卡片数据缓存
 *
 * - key 规范化标识（gh:{owner}/{repo} / bili:{bvid|aid}）
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const CACHE_FILE = join(process.cwd(), '.cache', 'link-cards.json');
/** 数据有效期（毫秒）：7 天，过期后下次构建重抓 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** 明确无数据（404 / 视频已删等）的负缓存有效期，避免每次构建都撞墙 */
const NEG_TTL_MS = 24 * 60 * 60 * 1000;

/** @type {{ [key: string]: { ts: number, data: any } | undefined }} */
let disk;
/** @type {Map<string, Promise<any>>} 同 key 在途请求去重（不落盘） */
const inflight = new Map();
let flushTimer;

function load() {
	if (disk !== undefined) return disk;
	try {
		disk = existsSync(CACHE_FILE)
			? JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
			: {};
	} catch (err) {
		console.warn('[link-cards] 缓存文件损坏，忽略：', err?.message ?? err);
		disk = {};
	}
	return disk;
}

function flushNow() {
	clearTimeout(flushTimer);
	flushTimer = undefined;
	// 本进程从未加载过缓存（没抓过任何数据）：不写盘，避免抹掉旧内容
	if (disk === undefined) return;
	try {
		mkdirSync(dirname(CACHE_FILE), { recursive: true });
		writeFileSync(CACHE_FILE, JSON.stringify(disk));
	} catch (err) {
		console.warn('[link-cards] 缓存写入失败：', err?.message ?? err);
	}
}

/** 防抖落盘；build:done 时由集成调用 flushNow 立即写 */
function scheduleFlush() {
	clearTimeout(flushTimer);
	flushTimer = setTimeout(flushNow, 2000);
	// dev 常驻进程：timer 不阻止退出
	flushTimer?.unref?.();
}

/**
 * 取缓存数据（含并发去重）
 * @template T
 * @param {string} key
 * @param {() => Promise<T | null>} refetch
 * @returns {Promise<T | null>}
 */
export async function cached(key, refetch) {
	const store = load();
	const hit = store[key];
	if (hit) {
		const ttl = hit.data === null ? NEG_TTL_MS : TTL_MS;
		if (Date.now() - hit.ts < ttl) return hit.data ?? null;
	}

	const pending = inflight.get(key);
	if (pending) return pending;

	const p = (async () => {
		try {
			const fresh = await refetch();
			store[key] = { ts: Date.now(), data: fresh };
			scheduleFlush();
			return fresh;
		} catch (err) {
			// 网络失败等：有旧数据就回退（保留原 ts，下次构建继续重试）
			console.warn(`[link-cards] 抓取失败（${key}）：`, err?.message ?? err);
			if (hit) return hit.data ?? null;
			throw err;
		} finally {
			inflight.delete(key);
		}
	})();
	inflight.set(key, p);
	return p;
}

export function hashUrl(url) {
	return createHash('sha1').update(url).digest('hex').slice(0, 8);
}

export { flushNow as flushCache };
