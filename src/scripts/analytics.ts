/* ============================================================
 * umami 埋点工具
 *
 * 注意：is:inline / data-astro-rerun 脚本无法 import 本文件，
 * 直接调用 window.umami?.track(...) 即可
 * ============================================================ */

declare global {
	interface Window {
		umami?: {
			track: (
				name: string,
				data?: Record<string, string | number>,
			) => void;
		};
	}
}

/** 全站事件字典：新增事件先在这里登记名字 */
export const EVENTS = [
	'search',
	'read_depth',
	'music_play',
	'photo_view',
	'toc_jump',
	'outbound',
	'theme_switch',
	'pagination',
] as const;

export type EventName = (typeof EVENTS)[number];

/** 发送事件；data 的值为字符串时注意截断（umami 上限 500 字符） */
export function track(
	name: EventName,
	data?: Record<string, string | number>,
) {
	window.umami?.track(name, data);
}
