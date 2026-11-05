import PageTitle from '../PageTitle';
import styles from './PhotosView.module.css';

/**
 * photos.json 的单条记录（scripts/photos-exif.mjs 构建 / dev 期生成）。
 */
export interface PhotoMeta {
	/** 相对 src/assets/photos 的路径。 */
	file: string;
	/** 拍摄时间（EXIF 本地时间，无时区，YYYY-MM-DDTHH:mm:ss）。 */
	date: string;
	dateSource: 'exif' | 'file';
	make?: string;
	model?: string;
	lens?: string;
	/** 光圈值。 */
	fNumber?: number;
	/** 快门（秒）。 */
	exposure?: number;
	/** 实际焦距 mm。 */
	focal?: number;
	/** 等效 35mm 焦距 mm。 */
	focal35?: number;
	iso?: number;
	/** 方向校正后的宽高（与浏览器展示比例一致，用于占位）。 */
	width: number;
	height: number;
	/** 构建期生成的低分辨率占位图（32px webp data URI）。 */
	lqip?: string;
	/** 照片说明（note.txt 在构建期合并，可多行）。 */
	note?: string;
}

/** 展示用照片：EXIF 元数据 + 页面拼接的图片地址。 */
export interface PhotoCard extends PhotoMeta {
	/** 瀑布流缩略图（带 srcset）。 */
	src: string;
	srcSet: string;
	sizes: string;
	/** 原图地址（灯箱 / 无 JS 时的新标签页回退）。 */
	fullSrc: string;
}

interface Props {
	photos: PhotoCard[];
}

/** 2023-10-06T10:00:32 → 2023.10.06 10:00 */
function formatDate(date: string) {
	return `${date.slice(0, 10).replaceAll('-', '.')} ${date.slice(11, 16)}`;
}

/** 快门秒数 → 1/120s 形式。 */
function formatShutter(t: number) {
	return t >= 1 ? `${Math.round(t * 10) / 10}s` : `1/${Math.round(1 / t)}s`;
}

/** 焦距 mm，最多一位小数。 */
function formatFocal(f: number) {
	return `${Math.round(f * 10) / 10}mm`;
}

/** 设备名：model 不含厂商名时补上（Apple iPhone 14 Pro → iPhone 14 Pro）。 */
function deviceName(photo: PhotoCard) {
	const { make, model } = photo;
	if (make && model) return model.startsWith(make) ? model : `${make} ${model}`;
	return model ?? make ?? '';
}

/** 光圈 / 快门 / ISO / 焦距一行参数（缺哪项跳哪项）。 */
function photoParams(photo: PhotoCard) {
	return [
		photo.fNumber ? `f/${photo.fNumber}` : null,
		photo.exposure ? formatShutter(photo.exposure) : null,
		photo.iso ? `ISO${photo.iso}` : null,
		photo.focal ? formatFocal(photo.focal) : null,
	]
		.filter(Boolean)
		.join(' ');
}

function PhotoFigure({ photo }: { photo: PhotoCard }) {
	const device = deviceName(photo);
	const params = photoParams(photo);

	return (
		<figure className={styles.card}>
			<a
				className={styles.link}
				href={photo.fullSrc}
				data-astro-reload
				data-photos-lightbox
				data-date={formatDate(photo.date)}
				data-device={device}
				data-params={params}
				data-lens={photo.lens ?? ''}
				data-focal35={
					photo.focal35 && photo.focal && photo.focal35 !== photo.focal
						? formatFocal(photo.focal35)
						: ''
				}
				data-dims={`${photo.width}×${photo.height}`}
				data-file={photo.file}
				data-lqip={photo.lqip ?? ''}
				data-note={photo.note ?? ''}
				data-fallback={photo.dateSource === 'file' ? '1' : ''}
			>
				<img
					className={styles.img}
					src={photo.src}
					srcSet={photo.srcSet || undefined}
					sizes={photo.srcSet ? photo.sizes : undefined}
					width={photo.width}
					height={photo.height}
					loading="lazy"
					decoding="async"
					alt={photo.file}
					style={
						photo.lqip
							? { backgroundImage: `url("${photo.lqip}")` }
							: undefined
					}
				/>
			</a>
			<figcaption className={styles.caption}>
				<span className={styles.date}>{formatDate(photo.date)}</span>
				<span className={styles.meta}>
					{[device, params].filter(Boolean).join(' · ')}
				</span>
			</figcaption>
		</figure>
	);
}

export default function PhotosView({ photos }: Props) {
	return (
		<main data-boot="main">
			<PageTitle>Photos</PageTitle>
			<div data-boot="cmd">
				<span className="cmd-prompt">&gt;</span>{' '}
				<span className="cmd-name">ls</span>{' '}
				<span className="cmd-dir">~/photos</span>{' '}
				<span className="cmd-flag">-lt</span>
			</div>

			<div className={styles.wall} data-boot="rest" data-photos-wall>
				{photos.length === 0 ? (
					<p className={styles.empty}>
						ls: Empty.
					</p>
				) : (
					photos.map((photo) => <PhotoFigure key={photo.file} photo={photo} />)
				)}
			</div>
		</main>
	);
}
