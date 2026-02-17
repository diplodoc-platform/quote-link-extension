## Common rules and standards

This package is a submodule in the Diplodoc metapackage. When working in metapackage mode, also follow:

- `../../.agents/style-and-testing.md` — code style, import organization, testing, English-only docs/comments/commit messages
- `../../.agents/monorepo.md` — workspace vs standalone dependency management (`--no-workspaces`)
- `../../.agents/dev-infrastructure.md` — infrastructure update recipes and CI conventions

## Project description

`@diplodoc/quote-link-extension` adds **quote link** blocks: Markdown blockquotes whose first paragraph starts with a link marked with `data-quotelink` (or `{data-quotelink}` in YFM). The plugin changes token types and adds a CSS class; the runtime provides styles and client behavior.

Key outputs:

- **Plugin** (`src/plugin/`) — MarkdownIt plugin and transform API (script/style in `env.meta`, optional runtime copy)
- **Runtime** (`src/runtime/`) — SCSS + JS built to `build/runtime/` (esbuild + sass from `@diplodoc/lint/esbuild`)

## Plugin structure (for code changes)

- **`transform.ts`** — Public `transform(options)` creates the MarkdownIt plugin and attaches `registerTransform` (quoteLinkPlugin + after-ruler that fills `env.meta` and optionally `copyRuntime`). Exports `TransformOptions`.
- **`plugin.ts`** — `quoteLinkPlugin`: core ruler that finds blockquote → paragraph → inline starting with link; reads `data-quotelink` from attrs or via `parseMdAttrs`; sets token types/class, splits paragraph if link and text are on one line, sets `state.env[ENV_FLAG_NAME]`.
- **`helpers.ts`** — `matchBlockquote`, `matchLinkAtInlineStart`, `cloneToken`; used by the rule. `TokenMatch` type for open/close pair + index.
- **`utils.ts`** — `hidden`, `copyRuntime`, `copy`, `dynrequire` (dynamic require for bundlers). `Runtime` type for script/style paths.
- **`const.ts`** — `ENV_FLAG_NAME`, `TokenType`, `ClassNames`, `QUOTE_LINK_ATTR`.

Tests use **MarkdownIt + plugin only** (no `@diplodoc/transform`): `html()` = `md.render()`, `meta()` = `env.meta` after render.

## Development commands

```bash
npm run typecheck
npm test
npm run lint
npm run build
```
