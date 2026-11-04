import PageTitle from '../PageTitle';
import styles from './AboutView.module.css';

/* 现有设备（旧站的 Home Assistant 实时电量暂不迁移，静态清单） */
const DEVICES: Array<{ name: string; note?: string; c: string }> = [
    { name: 'MacBook Pro 14"', note: 'M2 Pro', c: 'var(--green)' },
    { name: 'iPhone 14 Pro', c: 'var(--blue)' },
    { name: 'Apple Watch', note: 'Series 9', c: 'var(--purple)' },
    { name: 'NanoPi R2C', c: 'var(--orange)' },
    { name: 'Raspberry Pi 5', c: 'var(--pink)' },
    { name: 'Xbox Series S', note: 'Robot White', c: 'var(--yellow)' },
    { name: 'Mac mini', note: 'M2', c: 'var(--green)' },
    { name: 'Air60', note: 'NuPhy', c: 'var(--blue)' },
];

/* 技术栈（沿用旧站条目与仓库链接） */
const STACK = [
    { lang: 'Java', frame: 'Spring Boot', repo: 'Fructose-Blog', url: 'https://github.com/Stapxs/Fructose-Blog' },
    { lang: 'TypeScript', frame: 'Vue', repo: 'Stapxs-QQ-Lite-2.0', url: 'https://github.com/Stapxs/Stapxs-QQ-Lite-2.0' },
    { lang: 'C#', frame: 'WPF', repo: 'SS-Tool-Box', url: 'https://github.com/Stapxs/SS-Tool-Box' },
    { lang: 'TypeScript', frame: 'Three.js', repo: 'Dancing-Line', url: 'https://github.com/SSF-Team/Dancing-Line' },
];

/* 站点历史：从旧站「维护入职」一文搬运（倒序 → 自上而下新到旧；一天一条） */
const HISTORY: Array<{ year: string; date: string; text: string }> = [
    { year: '2026', date: '2026.11.06', text: '站点更换为 Astro 纯静态页面' },
    { year: '2022', date: '2022.12.31', text: '更换了自己写的新主题 😋' },
    { year: '2021', date: '2021.04.09', text: '全站更换域名为 stapxs.cn' },
    { year: '2021', date: '2021.01.13', text: '在顶栏上加了个 RSS 订阅链接复制' },
    { year: '2021', date: '2021.01.12', text: '换了个更成熟的主题' },
    { year: '2020', date: '2020.08.12', text: '将全站图片进行了一次压缩，让加载速度快了近 50%！' },
    { year: '2020', date: '2020.04.14', text: '写了 HTTP 强制跳转 HTTPS 的 URL 重写规则，保证访问的安全性' },
    { year: '2020', date: '2020.03.27', text: '网站迁移至 HTTPS 443 端口，出现严重的迁移问题' },
    { year: '2020', date: '2020.03.25', text: '站点建立，基于 Typecho，暂时依附于同学的域名下' },
];

const AVATAR =
    'https://weavatar.com/avatar/75c55a45cadac8669a1c5e4943cda5ce?s=192&d=identicon';

export default function AboutView() {
    return (
        <main data-boot="main">
            <PageTitle>About</PageTitle>
            <div data-boot="cmd">
                <span className="cmd-prompt">&gt;</span>{' '}
                <span className="cmd-name">whoami</span>
            </div>

            <div data-boot="rest">
                {/* ===== 身份卡 ===== */}
                <div className={styles.card}>
                    <img
                        className={styles.avatar}
                        src={AVATAR}
                        alt="Stapxs 的头像"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className={styles.profile}>
                        <div className={styles.nameRow}>
                            <span className={styles.name}>Stapxs</span>
                            <span className={styles.sign}>啊吧啊吧，这是 SS！</span>
                        </div>
                        <div className={styles.mailRow}>
                            <span className="cmd-flag">mail</span>
                            <a href="mailto:1007028430.stapx@gmail.com">
                                1007028430.stapx@gmail.com
                            </a>
                        </div>
                        <div className={styles.mailRow}>
                            <span className="cmd-flag">gpg</span>
                            <a href="https://keys.openpgp.org/search?q=1A3579B5CF41188C">
                                1A35 79B5 CF41 188C
                            </a>
                        </div>
                        <div className={styles.socialRow}>
                            <a href="https://o3o.ca/@stapxs">[mastodon]</a>
                            <a href="https://twitter.com/Stapx_Happy">[twitter]</a>
                            <a href="https://space.bilibili.com/12659126">[bilibili]</a>
                            <a href="https://github.com/Stapxs">[github]</a>
                        </div>
                    </div>
                </div>

                {/* ===== 小槐在做什么 ===== */}
                <div className={styles.cmdline}>
                    <span className="cmd-prompt">&gt;</span>{' '}
                    <span className="cmd-name">wall</span>{' '}
                    <span className={styles.comment}># 小槐在做什么</span>
                    {/* 刷新倒计时：about.astro 脚本每秒更新，到 0 触发刷新 */}
                    <span
                        className={styles.refresh}
                        id="about-refresh"
                        title="每 30s 自动刷新"
                    >
                        30s
                    </span>
                </div>
                {/* 静态文案为兜底：about.astro 脚本拉取 HA 前台应用成功后覆盖 */}
                <div className={styles.hello} id="about-hello">
                  <span data-hello-text>
                    正在获取中……
                  </span>
                </div>

                {/* ===== 现有设备 ===== */}
                <div className={styles.cmdline}>
                    <span className="cmd-prompt">&gt;</span>{' '}
                    <span className="cmd-name">ls</span>{' '}
                    <span className="cmd-dir">~/devices</span>
                </div>
                <div className={styles.devices}>
                    {DEVICES.map((d) => (
                        <div key={d.name} className={styles.device}>
                            <span
                                className={styles.dot}
                                style={{ '--c': d.c } as React.CSSProperties}
                                aria-hidden="true"
                            />
                            <span>{d.name}</span>
                            {d.note && <span className={styles.note}>{d.note}</span>}
                        </div>
                    ))}
                </div>

                {/* ===== 技术栈 ===== */}
                <div className={styles.cmdline}>
                    <span className="cmd-prompt">&gt;</span>{' '}
                    <span className="cmd-name">cat</span>{' '}
                    <span className="cmd-dir">~/tech-stack</span>
                </div>
                <div className={styles.stack}>
                    {STACK.map((s) => (
                        <div key={s.repo} className={styles.stackRow}>
                            <span className={`cmd-name ${styles.col}`}>{s.lang}</span>
                            <span className={styles.sep}>--</span>
                            <span className={`cmd-flag ${styles.col}`}>{s.frame}</span>
                            <span className={styles.sep}>--</span>
                            <a className={`cmd-arg ${styles.col}`} href={s.url}>
                                {s.repo}
                            </a>
                        </div>
                    ))}
                </div>

                {/* ===== 分隔线 ===== */}
                <hr />
                {/* ===== 关于本站 ===== */}
                <div className={styles.cmdline}>
                    <span className="cmd-prompt">&gt;</span>{' '}
                    <span className="cmd-name">cat</span>{' '}
                    <span className="cmd-dir">~/about-site.txt</span>
                </div>
                <div className={styles.textfile}>
                    （这里还没有什么好写的）
                </div>

                {/* ===== 站点历史 ===== */}
                <div className={styles.cmdline}>
                    <span className="cmd-prompt">&gt;</span>{' '}
                    <span className="cmd-name">tree</span>{' '}
                    <span className="cmd-dir">~/site-history</span>
                </div>
                <div className={styles.history}>
                    {HISTORY.map((e, i) => (
                        <div
                            key={e.date}
                            className={
                                i > 0 && HISTORY[i - 1].year !== e.year
                                    ? styles.historyBreak
                                    : undefined
                            }
                        >
                            {i === 0 || HISTORY[i - 1].year !== e.year ? (
                                <div className={styles.historyYearLabel}>
                                    {e.year}
                                </div>
                            ) : null}
                            <div className={styles.historyRow}>
                                <span className={styles.historyDateLabel}>
                                    {e.date}
                                </span>
                                <span className={styles.historyText}>{e.text}</span>
                            </div>
                        </div>
                    ))}
                    <div className={styles.historyEnd}>
                        └── EOF
                    </div>
                </div>

            </div>
        </main>
    );
}
