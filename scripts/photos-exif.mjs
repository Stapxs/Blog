// 构建期工具：扫描 src/assets/photos 下的所有图片，读取 EXIF
// （拍摄时间、设备、镜头、曝光参数）生成为 src/data/photos.json，
// 相簿页（/photos）以它为数据源按拍摄时间排序展示。
//
// 照片说明：同目录下的 note.txt，每行一条「文件名|说明」：
//   - 文件名可省略扩展名（嵌套子目录写相对路径亦可）；
//   - 「#」开头为注释；条目之后不含 | 的行视为上一条的续行（可写多段）；
//   - 空行结束续行。说明合并进 photos.json 的 note 字段（灯箱信息区展示）。
//
// 由 astro.config.mjs 中的 photosExif() 集成调用：
//   - astro:config:setup：dev / build 启动时同步生成一次
//   - astro:server:setup：dev 期监听照片目录，增删改后自动重新生成
//
// 说明：EXIF 时间是不带时区的本地时间字符串，这里原样保留为
// 「naive」格式（YYYY-MM-DDTHH:mm:ss），展示与排序都在本地语义下进行。

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import exifr from 'exifr';
import sharp from 'sharp';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

/** 照片源目录（支持子目录嵌套）。 */
export const PHOTOS_DIR = path.resolve(SCRIPT_DIR, '../src/assets/photos');

/** 生成的元数据 JSON。 */
export const OUT_FILE = path.resolve(SCRIPT_DIR, '../src/data/photos.json');

/** 照片说明文件（与照片同目录，格式见文件头注释）。 */
const NOTES_FILE = path.join(PHOTOS_DIR, 'note.txt');

// 与相册页 import.meta.glob 的扩展名保持一致：
// 浏览器可直接展示 + sharp 可处理（HEIC 请先导出为 JPEG）
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

/** 递归收集目录下所有支持格式的图片文件。 */
async function walk(dir) {
	let files = [];
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return files; // 目录不存在：当作没有照片
	}
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files = files.concat(await walk(full));
		} else if (EXTS.has(path.extname(entry.name).toLowerCase())) {
			files.push(full);
		}
	}
	return files;
}

const pad = (n) => String(n).padStart(2, '0');

/** Date → EXIF 同款 naive 本地时间字符串。 */
function toNaiveISO(d) {
	return (
		d.getFullYear() +
		'-' +
		pad(d.getMonth() + 1) +
		'-' +
		pad(d.getDate()) +
		'T' +
		pad(d.getHours()) +
		':' +
		pad(d.getMinutes()) +
		':' +
		pad(d.getSeconds())
	);
}

const num = (v) => {
	// EXIF 的 ISOSpeedRatings 等字段可能是数组或字符串
	if (Array.isArray(v)) v = v[0];
	const n = typeof v === 'string' ? Number(v) : v;
	return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** 读取单张照片的元数据（EXIF + 方向校正后的宽高）。 */
async function readPhoto(file) {
	const buffer = await readFile(file);

	// 只挑需要的字段
	const exif = await exifr.parse(buffer, {
		pick: [
			'Make',
			'Model',
			'LensModel',
			'DateTimeOriginal',
			'CreateDate',
			'DateTime',
			'FNumber',
			'ExposureTime',
			'FocalLength',
			'FocalLengthIn35mmFilm',
			'ISOSpeedRatings',
			'ISO',
			'Orientation',
		],
	});

	// 宽高以 sharp 为准；orientation 5-8 为旋转方向，交换宽高
	// 与浏览器展示（image-orientation: from-image）一致
	const meta = await sharp(buffer).metadata();
	let width = meta.width ?? 0;
	let height = meta.height ?? 0;
	const orientation = num(meta.orientation ?? exif?.Orientation) ?? 1;
	if (orientation >= 5 && orientation <= 8) {
		[width, height] = [height, width];
	}

	const exifDate = exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.DateTime;
	const hasExifDate =
		exifDate instanceof Date && !Number.isNaN(exifDate.valueOf());

	// 低分辨率占位图（LQIP）：32px webp 的 data URI，原图 / 缩略图
	// 加载前的模糊填充 —— 内联进 JSON，浏览器零额外请求
	let lqip;
	try {
		const buf = await sharp(buffer)
			.rotate() // 烘焙 EXIF 方向，占位图与展示比例一致
			.resize({ width: 32 })
			.webp({ quality: 40 })
			.toBuffer();
		lqip = `data:image/webp;base64,${buf.toString('base64')}`;
	} catch {
		lqip = undefined; // 生成失败不影响其余元数据
	}

	return {
		// 相对 photos 目录的路径（统一 / 分隔，与页面 glob 的 key 一致）
		file: path.relative(PHOTOS_DIR, file).split(path.sep).join('/'),
		// 拍摄时间；无 EXIF 时间时退回文件修改时间（naive 本地时间）
		date: toNaiveISO(hasExifDate ? exifDate : (await stat(file)).mtime),
		dateSource: hasExifDate ? 'exif' : 'file',
		make: exif?.Make?.trim() || undefined,
		model: exif?.Model?.trim() || undefined,
		lens: exif?.LensModel?.trim() || undefined,
		fNumber: num(exif?.FNumber),
		exposure: num(exif?.ExposureTime), // 快门，秒（1/120 → 0.00833…）
		focal: num(exif?.FocalLength), // 实际焦距 mm
		focal35: num(exif?.FocalLengthIn35mmFilm), // 等效 35mm 焦距
		iso: num(exif?.ISOSpeedRatings ?? exif?.ISO),
		width,
		height,
		lqip,
	};
}

/**
 * 解析 note.txt → Map<小写去扩展名文件名, 说明>。
 * @param {{ warn?: (msg: string) => void }} options
 */
async function readNotes({ warn = () => {} } = {}) {
	let content;
	try {
		content = await readFile(NOTES_FILE, 'utf8');
	} catch {
		return new Map(); // 没有 note.txt：所有照片都无说明
	}

	const notes = new Map();
	const append = (key, text) => {
		const k = key.trim().replace(/\.[^.]+$/, '').toLowerCase();
		if (!k) return;
		notes.set(k, notes.has(k) ? `${notes.get(k)}\n${text.trim()}` : text.trim());
	};

	let lastKey = null;
	for (const raw of content.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) {
			lastKey = null; // 空行：结束续行
			continue;
		}
		if (line.startsWith('#')) continue; // 注释
		const bar = line.indexOf('|');
		if (bar > 0) {
			lastKey = line.slice(0, bar);
			append(lastKey, line.slice(bar + 1));
		} else if (lastKey) {
			append(lastKey, line); // 上一条的续行
		} else {
			warn(`note.txt 中无法归属的行：${line.slice(0, 30)}…`);
		}
	}
	return notes;
}

/**
 * 扫描照片目录并生成 photos.json。
 * 内容无变化时不写盘（避免 dev 监听循环 / 无意义的构建产物抖动）。
 *
 * @param {{ log?: (msg: string) => void }} options
 * @returns {Promise<{ count: number; changed: boolean }>}
 */
export async function generatePhotosJson({ log = () => {} } = {}) {
	const files = (await walk(PHOTOS_DIR)).sort();

	const notes = await readNotes();
	const photos = [];
	let failed = 0;
	for (const file of files) {
		try {
			const photo = await readPhoto(file);
			// note.txt 说明：先按完整相对路径匹配，再退回仅文件名
			const note =
				notes.get(photo.file.replace(/\.[^.]+$/, '').toLowerCase()) ??
				notes.get(
					path
						.basename(photo.file)
						.replace(/\.[^.]+$/, '')
						.toLowerCase(),
				);
			photos.push(note ? { ...photo, note } : photo);
		} catch (err) {
			failed++;
			log(`解析失败 ${path.relative(PHOTOS_DIR, file)}：${err?.message ?? err}`);
		}
	}

	// 按拍摄时间倒序（最新在前）；无日期的排最后、按文件名稳定排序。
	// naive ISO 字符串的字典序即时间序。
	photos.sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? 1 : -1;
		return a.file < b.file ? -1 : 1;
	});

	const data = { generatedAt: new Date().toISOString(), photos };
	const content = JSON.stringify(data, null, '\t') + '\n';

	let changed = true;
	try {
		// 忽略 generatedAt 时间戳，仅在照片数据变化时写盘
		const prev = JSON.parse(await readFile(OUT_FILE, 'utf8'));
		if (JSON.stringify(prev.photos) === JSON.stringify(data.photos)) {
			changed = false;
		}
	} catch {
		// 尚未生成过
	}

	if (changed) {
		await mkdir(path.dirname(OUT_FILE), { recursive: true });
		await writeFile(OUT_FILE, content, 'utf8');
	}

	log(
		`photos.json ${changed ? '已生成' : '无变化'}：${photos.length} 张照片` +
			(failed ? `，${failed} 张解析失败` : ''),
	);
	return { count: photos.length, changed };
}

// 直接执行（node scripts/photos-exif.mjs）时手动生成一次
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	generatePhotosJson({ log: (m) => console.log(`[photos-exif] ${m}`) }).catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
