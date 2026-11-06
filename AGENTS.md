## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Type checking

The project uses TypeScript 7 (native). `astro check` does not support it (and is being
deprecated), so run type checks with:

```
yarn typecheck
```

which runs `astro sync && tsc --noEmit --runExternalCode`. `.astro` files are handled by
`@astrojs/ts-content-mapper` (registered in `tsconfig.json` under `contentMappers`). In
`.astro` pages, declare a `type Props = ...` (like `src/pages/archives/[...slug].astro`)
so `Astro.props` is typed; `getStaticPaths` should be annotated with the `GetStaticPaths`
type from `astro`.

## Markdown build-time plugins

Two Sätteri hast plugins enhance Markdown rendering at build time (configured in
`astro.config.mjs` under `markdown.processor`):

- `plugins/link-cards` — GitHub repo / Bilibili video links alone on their line
  become link cards (see README「链接卡片」).
- `plugins/markdown-alerts` — GitHub Alerts syntax (`> [!NOTE]` etc.) becomes
  styled callouts (see README「GitHub Alerts」).

Things to know:

- Link-card data is cached in `.cache/link-cards.json` and card images in
  `public/link-cards/` (both gitignored).
- Rendered Markdown is cached by digest in `.astro/data-store.json` (dev) and
  `node_modules/.astro/data-store.json` (build). After changing anything that
  affects Markdown rendering (either plugin), delete both files or unchanged
  `.md` files will keep serving the old HTML.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
