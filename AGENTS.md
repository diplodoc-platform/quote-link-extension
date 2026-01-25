## Common rules and standards

This package is a submodule in the Diplodoc metapackage. When working in metapackage mode, also follow:

- `../../.agents/style-and-testing.md` — code style, import organization, testing, English-only docs/comments/commit messages
- `../../.agents/monorepo.md` — workspace vs standalone dependency management (`--no-workspaces`)
- `../../.agents/dev-infrastructure.md` — infrastructure update recipes and CI conventions

## Project description

`@diplodoc/quote-link-extension` adds special “quote link” blocks based on Markdown quote syntax and a `data-quotelink` attribute.

Key outputs:

- **Plugin** (`src/plugin/`) — transformer/MarkdownIt integration
- **Runtime** (`src/runtime/`) — styles + client behavior

## Development commands

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

