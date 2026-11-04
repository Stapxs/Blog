/* ============================================================
 * 网易云歌曲信息
 * ============================================================ */

export interface SongBrief {
	id: number;
	/** 曲名 */
	name: string;
	/** 翻译名（tns[0]，可能没有） */
	tns: string | null;
	/** 作者（多位用 " / " 连接） */
	artists: string;
	/** 封面缩略图（https + CDN 缩放） */
	cover: string;
}

interface NcmSong {
	id?: number;
	name?: string;
	tns?: string[];
	ar?: Array<{ name?: string }>;
	al?: { picUrl?: string };
}

/** 拉取歌曲详情；失败/无数据返回 null（调用方静默跳过组件） */
export async function fetchSongDetail(id: number): Promise<SongBrief | null> {
	try {
		const res = await fetch(
			`https://api.stapxs.cn/music/song/detail?ids=${id}`,
		);
		const data = await res.json();
		const song: NcmSong | undefined = data?.songs?.[0];
		if (!song) return null;
		return {
			id: song.id ?? id,
			name: song.name ?? "未知曲目",
			tns: song.tns?.[0] ?? null,
			artists: (song.ar ?? [])
				.map((a) => a.name ?? "")
				.filter(Boolean)
				.join(" / ") || "未知",
			cover: song.al?.picUrl
				? song.al.picUrl.replace(/^http:/, "https:") + "?param=96y96"
				: "",
		};
	} catch {
		/* 构建期接口故障：跳过组件，不影响页面生成 */
		console.warn(`[music] 歌曲详情获取失败：${id}`);
		return null;
	}
}
