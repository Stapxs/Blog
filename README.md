[![Astro](https://img.shields.io/badge/Astro-7-blue)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2022.23.4-green)](./package.json)
[![License](https://img.shields.io/badge/License-AGPL--3.0--only-orange)](./LICENSE)
[![Content](https://img.shields.io/badge/Content-ALL%20RIGHTS%20RESERVED-red)](#️-内容版权声明)

## 林槐的杂货铺

一个用 Astro 打造的终端 / 像素风个人博客

[**🌎 访问博客**](https://blog.stapxs.cn)  |  [**📦️ 获取源码**](https://github.com/Stapxs/Blog)  |  [**💬 反馈问题**](https://github.com/Stapxs/Blog/issues/new)

## 🧭 页面一览

| 路径 | 页面 |
| -------------- | ------------------ |
| `/` | 文章列表（分页） |
| `/archives/[slug]` | 文章页 |
| `/category` `/tags` | 分类 / 标签 |
| `/search` | 搜索 |
| `/photos` | 相簿 |
| `/friends` | 友链 |
| `/about` | 关于 |
| `/env` | 站点信息（`cat .env`） |
| `/rss.xml` | RSS 订阅 |

## 🚀 快速使用

### > 环境要求

- Node.js ≥ 22.23.4
- yarn

### > 本地调试

```bash
git clone https://github.com/Stapxs/Blog.git
cd Blog

# 安装依赖
yarn install

# 运行本地调试
yarn dev
```

打开 `localhost:4321` 即可

### > 构建部署

```bash
# 构建应用
yarn build

# 本地预览构建结果
yarn preview
```

构建结果输出在 `dist/` 目录，纯静态文件，放进任意静态服务器（nginx / GitHub Pages / Vercel …）即可。部署前别忘了把 `astro.config.mjs` 中的 `site` 换成你自己的域名。

### > 部署评论后端（Waline）

博客使用 [Waline](https://waline.js.org) 作为评论系统，`deploy/waline` 提供了一份 SQLite 单机部署的 docker-compose：

```bash
cd deploy/waline
# 修改 docker-compose.yml 中的 JWT_TOKEN、AUTHOR_EMAIL、SECURE_DOMAINS 等配置
docker compose up -d
```

然后在 `src/consts.ts` 中把 `WALINE_SERVER_URL` 指向你的 Waline 地址；留空则全站不显示评论区。

### > 写文章

在 `src/content/blog` 下新建 Markdown（`.md`）或 MDX（`.mdx`）文件：

```markdown
---
title: '文章标题'
description: '描述（用于 SEO 与列表摘要）'
category: '分类'
tags: ['标签1', '标签2']
author: '林小槐'
pubDate: '2024-12-21 02:32'
updatedDate: '2024-12-22 10:00'   # 可选，编辑时间
hidden: false                      # true = 草稿
music: 123456                      # 可选，网易云歌曲 id
---

正文 …
```

其中 `hidden: true` 的文章在列表 / 归档 / 搜索 / RSS / 直链全部不可见，可以放心当草稿用；`music` 会在文章页日期行下方显示一个网易云播放条。

### > 图片排版（IAL 属性语法）

正文里可以用 Kramdown 风格的行内属性列表给图片 / 链接附加 class、id 或内联样式（构建期由 `plugins/markdown-ial` 处理）：

```markdown
![图片](./a.png){: class=right}
![图片](./a.png){: .rounded #hero-img style="width:120px"}
[链接](/about/){: .btn}
```

内置排版类定义在 `src/styles/article.css`，对所有文章生效：

- `right` —— 图片右浮动（宽 40%、左侧留白 2em；窄屏自动回到全宽文档流）

### > 添加照片

把照片丢进 `src/assets/photos`（支持子目录嵌套；HEIC 请先导出为 JPEG），构建 / dev 时会自动扫描 EXIF 生成相簿数据。

照片说明写同目录下的 `note.txt`，每行一条「文件名|说明」：

```text
IMG_0544|某次旅行拍的照片
跨行的说明直接另起一行（不需要 |），空行结束

# 「#」开头是注释
```

## 🧞 命令列表

以下是本项目的完整命令列表，你可以使用这些命令来快速调试和构建博客。

**命令格式为 `yarn <命令>`，其中 `<命令>` 为列表中的一个：**

| 命令 | 描述 |
| -------------- | ------------------ |
| install | 安装依赖 |
| dev | 本地调试（localhost:4321） |
| build | 构建应用到 `./dist/` |
| preview | 本地预览构建结果 |
| astro … | 运行 Astro CLI 子命令（如 `astro check`） |

另外，`node scripts/photos-exif.mjs` 可以在不动 dev / build 的情况下手动重新生成一次相簿数据。

## 📜 开源协议与依赖声明

本项目**代码**以 **AGPL-3.0-only** 协议开源。开源协议**仅覆盖代码部分**，不包含仓库中的文章、图片与照片等内容资源 —— 它们的版权见下方[「内容版权声明」](#️-内容版权声明)。

代码协议全文见 [LICENSE](LICENSE)，附加条款见 [LICENSE-ADDITIONAL](LICENSE-ADDITIONAL.md)。

本项目使用到的部分依赖及其开源协议如下：

| 名称 | 简介 | 开源协议 |
| -------------- | ---------- | ---------- |
| [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font) | 像素字体 | OFL 1.1 |
| [pixelarticons](https://pixelarticons.com) | 像素图标库 | MIT License |
| [Waline](https://github.com/walinejs/waline) | 评论系统 | MIT License |
| exifr / sharp | 照片 EXIF 解析与图像处理 | MIT / Apache License 2.0 |

### > 额外依赖声明

博客中的打字机效果以及音乐播放器借鉴自 [musicforprogramming.net](https://musicforprogramming.net) 的页面播放器实现，并在此基础上做了中文适配与交互优化。如有版权问题请联系：1007028430.stapx@gmail.com。

## ⚠️ 内容版权声明

本仓库是个人博客的**完整站点仓库**，除代码外还包含大量原创内容。这些内容**不属于 AGPL-3.0 开源协议的授权范围**，均由作者保留所有权利（All Rights Reserved）：

| 内容 | 位置 | 版权 |
| -------------- | ---------- | ---------- |
| 博客文章（含草稿） | `src/content/blog` | © 作者所有，保留所有权利 |
| 文章图片、站点素材 | `src/assets` | © 作者所有，保留所有权利 |
| 照片及其 EXIF、说明 | `src/assets/photos`、`note.txt`、`src/data/photos.json` | © 作者所有，保留所有权利 |

> [!IMPORTANT]
> **未经作者书面授权，任何人不得转载、复制、存储、二次分发本仓库中的文章、图片与照片，或将其用于任何商业用途。**
>
> - Fork 本仓库请仅用于学习代码与搭建参考；公开你自己的仓库之前，请先删除 `src/content` 与 `src/assets`（尤其是 `src/assets/photos`）中的全部内容资源，替换为你自己的内容。
> - 如果你想基于此博客搭建自己的站点，请只保留代码与主题样式。
>
> 完整条款以 [LICENSE-ADDITIONAL](LICENSE-ADDITIONAL.md) 为准。

## 🎉 鸣谢

- [Astro](https://astro.build) 及其博客模板
- [musicforprogramming.net](https://musicforprogramming.net) —— 音乐播放器灵感来源
- 本项目部分代码使用 AI 辅助生成
