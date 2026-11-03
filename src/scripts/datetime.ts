/** 本地日期格式化：YYYY-MM-DD（使用构建机本地时区，避免 toISOString 的 UTC 偏移） */
export function formatDateLocal(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
