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

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
