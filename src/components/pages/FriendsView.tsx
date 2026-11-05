import PageTitle from '../PageTitle';
import styles from './FriendsView.module.css';

/* 友链（沿用旧站数据；头像统一 https） */
const FRIENDS = [
    {
        name: 'Chuhelan',
        url: 'https://www.chuhelan.com',
        avatar:
            'https://www.chuhelan.com/me.jpeg',
        desc: '这是初荷岚的个人博客，里面记载了一些无聊的东西。',
    },
    {
        name: 'Doodle Huang',
        url: 'https://doodlehuang.wordpress.com/',
        avatar:
            'https://doodlehuang.files.wordpress.com/2020/03/2635148446.jpg',
        desc: 'Not coder, not programmer, not developer, but a player of life!',
    },
    {
        name: 'LightningUZ',
        url: 'https://lightninguz2.github.io/',
        avatar: 'https://lightninguz2.github.io/images/zps-avatar-new.jpg',
        desc: '“Rua,rua,rua!这是个看不懂的刷题大佬！” —— SS 如是说',
    },
    {
        name: 'Mashirl',
        url: 'https://www.mashirl.cn',
        avatar:
            'https://cdn.jsdelivr.net/gh/Mashirl/Blog/source/images/avatar.jpg',
        desc: '予 世界温柔以待 惟愿 时光静好',
    },
    {
        name: 'Lapis Apple',
        url: 'https://laple.me/',
        avatar: 'https://s1.ax1x.com/2020/04/12/GqhDs0.png',
        desc: '这人很懒啥也没说欸 QwQ',
    },
    {
        name: "Fidel's Lab",
        url: 'https://fidel.js.org',
        avatar:
            'https://cdn.jsdelivr.net/gh/Fidelxyz/fidelxyz.github.io@latest/images/avatar.webp',
        desc: '不乱于心，不困于情。不畏将来，不念过往。',
    },
    {
        name: 'sjfhsjfh',
        url: 'https://sjfhsjfh.gitee.io/',
        avatar:
            'https://www.gravatar.com/avatar/9f94d78fc4e492e8bb91319dec181d8a?s=2048',
        desc: '这就是 sjfhsjfh ——',
    },
    {
        name: 'Hao_Tian',
        url: 'https://www.haotian22.top/',
        avatar: 'https://www.haotian22.top/img/head.jpg',
        desc: '生命不息，折腾不止ヾ(≧▽≦*)o',
    },
    {
        name: 'Maxel Black',
        url: 'https://maxelblack.wordpress.com/',
        avatar:
            'https://maxelblack.files.wordpress.com/2021/04/maxel_360px.jpg',
        desc: 'Code & write what we want.',
    },
    {
        name: 'Zapic',
        url: 'https://blog.zapic.moe/',
        avatar:
            'https://gravatar.loli.net/avatar/d9464e8ea970cefdfb729b7301d04232?s=100&d=mp',
        desc: '就像鸽子，咕咕咕！',
    },
    {
        name: 'azmanyan',
        url: 'https://az.yanyaotian.xyz/',
        avatar: 'https://s2.loli.net/2021/12/26/HqTGatycs4QdFXU.jpg',
        desc: '一个什么都不会的高一学生',
    },
    {
        name: 'ltm 的百宝箱',
        url: 'https://ltm.ink/',
        avatar: 'https://q1.qlogo.cn/g?b=qq&nk=342750819&s=100',
        desc: '一个什么都可能有的box。',
    },
    {
        name: "Huan's Log",
        url: 'https://nekohuan.cyou',
        avatar: 'https://nekohuan.cyou/avatar.webp',
        desc: 'Bravery never goes out of fashion.',
    },
    {
        name: 'Fika',
        url: 'https://fika.ink',
        avatar: 'https://pic.imgdb.cn/item/637c14ee16f2c2beb161a26e.jpg',
        desc: '是 Fika！',
    },
    {
        name: 'Cynosura',
        url: 'https://cynosura.one',
        avatar: 'https://cynosura.one/img/avatar.webp',
        desc: 'Per aspera, ad astra.',
    },
    {
        name: 'Czz',
        url: 'https://czz.ink/link/',
        avatar: 'https://czz.ink/img/avatar.jpg',
        desc: '这是 Czz！',
    },
];

export default function FriendsView() {
    return (
        <main data-boot="main">
            <PageTitle>Friends</PageTitle>
            <div data-boot="cmd">
                <span className="cmd-prompt">&gt;</span>{' '}
                <span className="cmd-name">ls</span>{' '}
                <span className="cmd-dir">~/friends</span>{' '}
                <span className="cmd-flag">-a</span>
            </div>

            <div data-boot="rest">
                {/* ===== 友链卡片 ===== */}
                <div className={styles.grid}>
                    {FRIENDS.map((f) => (
                        <a
                            key={f.url}
                            className={styles.card}
                            href={f.url}
                            target="_blank"
                            rel="noopener"
                        >
                            <img
                                className={styles.avatar}
                                src={f.avatar}
                                alt=""
                                loading="lazy"
                                decoding="async"
                            />
                            <div className={styles.info}>
                                <div className={styles.name}>{f.name}</div>
                                <div className={styles.desc}>{f.desc}</div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* ===== 换友链 ===== */}
                <div className={styles.cmdline}>
                    <span className="cmd-prompt">&gt;</span>{' '}
                    <span className="cmd-name">cat</span>{' '}
                    <span className="cmd-dir">~/README.md</span>
                </div>
                <div className={styles.readme}>
                    <p>
                        欢迎互换友链 —— 在下方评论区留言申请就好：昵称填博客名称、
                        网址填博客链接，评论里附上一段简短的介绍（40 字以内）和
                        https 的头像链接。
                    </p>
                    <p>
                        我的博客信息都放在{' '}
                        <a className={styles.envLink} href="/env">
                            .env
                        </a>{' '}
                        里啦，点过去直接复制就好。
                    </p>
                    <p className={styles.comment}>
                        在这个独立博客式微的时代，每一个独立博客都是一个信息孤岛；
                        交换友情链接是很棒的架桥方式。维护独立博客从来都不是一件容易的事，且行且珍惜。
                    </p>
                </div>
            </div>
        </main>
    );
}
