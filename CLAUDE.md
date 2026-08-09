# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目性质

Serendipity-Grace（`theme-serendipity`）是 **基于 [atangccc/Serenity-Grace](https://github.com/atangccc/Serenity-Grace) 二次开发的 Halo 2.x 博客主题**（GPL-3.0），樱花粉 + 湖水蓝配色，亮/暗双模式。所有模板代码在 `templates/` 下，无 package.json / Makefile / 编译步骤——**纯手写 HTML + CSS + JS**，通过 `th:` 属性注入 Thymeleaf 表达式。本仓库为 fork：`origin` 指向 `LHY0125/Serendipity-theme`，`upstream` 指向原作者 `atangccc/Serenity-Grace`（合并上游更新用 `git fetch upstream && git merge upstream/main`）。

## 开发与验证

- **无构建、无 lint、无测试**。改完模板/资源后上传到 Halo 实例即可生效（用户博客：`blog.liuhangyv.top`，由腾讯云 Halo 托管）。
- **Halo 主题要求**:新增页面模板必须在 `theme.yaml` 的 `customTemplates` 中注册；新增后台配置项必须在 `settings.yaml`（FormKit schema）中定义，二者缺一即后台/前台不生效。
- 后台配置项在模板中通过 `theme.config.<group>.<field>` 读取。注意两种防御式写法并存：老代码用 `theme.config.xxx != null and theme.config.xxx.yyy != null ? theme.config.xxx.yyy : default`，新代码用安全导航 `theme.config.xxx?.yyy?.field`（`?.` 后跟 `== true` / `?: default` 等）。
- 修改前检查文件头部的 `Build` / `Fingerprint` 注释——这些由同步工具生成，**无需手动更新**。

## 模板架构

### 主布局 `templates/modules/layout.html`

核心 shell，定义 fragment `html(title, content, head)`。每个页面模板通过以下方式注入（见 `index.html` / `archives.html` 头部）：

```
th:replace="~{modules/layout :: html(title = ..., content = ~{::content}, head = ~{::head})}"
```

页面自身的 `<head>` 额外资源放 `head` fragment，主体内容放 `content` fragment。layout.html 按顺序承担以下职责（**顺序敏感，改动需谨慎**）：

1. **主题初始化**（`<head>` 顶部 inline script）——从 `localStorage['color-scheme']` + `data-theme` 属性决定亮/暗模式，默认暗色
2. **全站字体**——`theme.config.basic.typographyConfig` 的字体 key 映射到 `--font-*` CSS 变量
3. **欢迎页 overlay**——`welcome-pending` class + sessionStorage 控制首次访问
4. **主题色系统**——`window.__ACCENT_LIGHT/__ACCENT_DARK`（默认 `#7DCDE8` 湖水蓝 / `#E87D98` 樱花粉）经 hex→HSL 换算后写入 `--color-accent`、`--color-accent-secondary`、`--color-accent-rgb`、`--gateway-bg-*` 等 CSS 变量
5. 头部/搜索/主内容区（`#pjax-main`）/页脚模块替换 + 音乐播放器（APlayer + Meting2）+ 返回顶部
6. **PJAX 支持**：`enablePjax` 开启时加载 `pjax.js`

### 页面模板

每个页面 = `head` fragment（本页 CSS + meta）+ `content` fragment（本页 HTML + 本页 JS）。Halo 模板变量：`site`（站点信息）、`theme.config`（主题设置）、`menuFinder`（菜单）、`archives` / `posts` / `post` / `tag` / `category` 等列表对象。归档/标签/分类是 Halo 内置路由（`/archives` `/tags` `/categories`），无需创建页面；`about` / `moments` / `links` / `guestbook` / `projects` / `photos` / `wishes` / `equipments` / `star-gallery` 等需后台创建自定义页面并选对应模板。

### 模块组件 `templates/modules/`

`header.html`（导航 + 菜单，含下拉 + `nav-icon` 图标映射）、`footer.html`、`layout.html`、`nav-icon.html`（按 URL 匹配菜单图标）、`search-modal.html`、`watermark.html`。

### 网关页面 `templates/gateway_fragments/layout.html`

登录/注册/登出页专属布局（fragment `layout(title, head, body)`），独立于主布局，引用 `theme-color-init.js` 与 `login.css`。品牌区 + 表单区（`body` fragment），壁纸读取首页背景配置。`login.html` / `signup.html` / `logout.html` 是内容体。

### 资源目录 `templates/assets/`

- `css/`、`js/` 按页面一对一命名（如 `index.html` ↔ `css/index.css` ↔ `js/archives.js`）
- 第三方库**已本地化**：`lenis.min.js`、`swiper-bundle.min.js`、`aos.js`、`iconify.min.js`、`APlayer.min.js`、`Meting2.min.js`、`marked.min.js`、FontAwesome webfonts、ANI 动态光标（`fonts/cursor/`）
- `public/` 静态图（logo、亮/暗背景 `lightbg.webp` / `darkbg.webp`），模板中以 `/themes/theme-serendipity/assets/...` 引用（路径含主题 `metadata.name`，改名需同步替换）

## PJAX 关键约定（易踩坑）

`enablePjax` 开启时，页面切换走 `pjax.js` 无刷新局部刷新。遵守以下约定否则切页会出 bug：

- **本页脚本和初始化变量必须放在 `content` fragment 内**（随局部刷新重新执行），不能放在全局 layout
- 监听 `document` / `window` / 内容层的事件必须用 `main.js` 暴露的 `bindPageEvent()` 注册——事件会登记到全局注册表，PJAX 切页前由 `clearPageEvents()` 统一解绑，避免重复叠加
- Lenis 是持久层（`lenis` 全局单例），已存在则只 `resize()`，不重建

## 后台配置分组（settings.yaml）

16 组：`basic`(基本) / `hero`(首页头部) / `welcome`(欢迎页) / `social`(社交) / `compass`(风向标) / `home`(首页内容) / `post`(文章页) / `footer`(页脚) / `sidebar`(侧边栏) / `about` / `seo` / `watermark` / `projects` / `links` / `starGallery` / `music`。新增配置时在此注册 group + FormKit schema，模板侧用 `theme.config.<group>.<field>` 读取。

## 插件依赖

必需：评论组件、瞬间（`moments.html` 数据源）、链接管理（`links.html` 数据源）、图库管理（`photos.html`）。可选：AstraHub 星链、朋友圈、爱发电、LightGallery、便签墙、Steam 展示。开发某页面模板前先确认其依赖插件的数据接口。

## CI/CD

`.github/workflows/cd.yaml` 在 GitHub Release 发布时触发，复用 Halo 官方 workflow（`halo-sigs/reusable-workflows/theme-cd.yaml@v3`，node 22 + pnpm 9），产出主题 zip。本地无需跑 CI。
