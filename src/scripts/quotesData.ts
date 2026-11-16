/* 《林槐语录》(src/content/blog/ss-ana.md) 的构建期解析
 * `#### YYYY年MM月` 小节标题 + `-『正文』—— 出处` 列表行 → 结构化语录 */

export interface Quote {
	/** 1 起的序号：按时间正序，最早为 #1、最新为最大号 */
	id: number;
	/** 『』内的正文 */
	text: string;
	/** —— 后的出处，无出处为空串 */
	from: string;
	/** YYYY-MM */
	date: string;
	year: number;
}

export function parseQuotes(raw: string): Quote[] {
	const quotes: Quote[] = [];
	const seen = new Set<string>();
	let date = '';
	let year = 0;

	for (const line of raw.split('\n')) {
		const heading = line.match(/^#{4}\s*(\d{4})年(\d{1,2})月/);
		if (heading) {
			year = Number(heading[1]);
			date = `${heading[1]}-${heading[2].padStart(2, '0')}`;
			continue;
		}
		if (!date) continue;

		const trimmed = line.trim();
		if (!trimmed.startsWith('-')) continue;
		const body = trimmed.match(/『([^』]+)』/);
		if (!body) continue;
		const text = body[1].trim();
		if (!text || seen.has(text)) continue;
		seen.add(text);

		const rest = trimmed.slice(trimmed.indexOf('』') + 1).trim();
		const from = rest.match(/^[—–-]+\s*(.+)$/)?.[1]?.trim() ?? '';
		quotes.push({ id: 0, text, from, date, year });
	}
	// 文件按时间倒序（最新在前）：反向编号，让最早的语录为 #1
	const total = quotes.length;
	quotes.forEach((q, i) => (q.id = total - i));
	return quotes;
}
