/**
 * 代码块复制按钮
 */

const COPY_LABEL = '复制';
const COPIED_LABEL = '已复制';

/** navigator.clipboard 不可用（非安全上下文等）时的兜底 */
function fallbackCopy(text: string): boolean {
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.setAttribute('readonly', '');
	ta.style.position = 'fixed';
	ta.style.opacity = '0';
	document.body.appendChild(ta);
	ta.select();
	let ok = false;
	try {
		ok = document.execCommand('copy');
	} catch {
		ok = false;
	}
	ta.remove();
	return ok;
}

export function initCodeBlocks(): void {
	const blocks = document.querySelectorAll<HTMLPreElement>(
		'pre.astro-code:not([data-language="plaintext"])',
	);
	for (const pre of blocks) {
		if (pre.querySelector(':scope > .code-copy')) continue; // 防重复挂载
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'code-copy';
		btn.textContent = COPY_LABEL;
		btn.title = '复制代码';
		btn.addEventListener('click', () => {
			const code = pre.querySelector('code')?.textContent ?? '';
			const done = (ok: boolean) => {
				if (!ok) return;
				btn.textContent = COPIED_LABEL;
				btn.dataset.copied = '';
				window.setTimeout(() => {
					btn.textContent = COPY_LABEL;
					delete btn.dataset.copied;
				}, 1600);
			};
			if (navigator.clipboard?.writeText) {
				navigator.clipboard.writeText(code).then(
					() => done(true),
					() => done(fallbackCopy(code)),
				);
			} else {
				done(fallbackCopy(code));
			}
		});
		pre.appendChild(btn);
	}
}
