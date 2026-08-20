# Contributing

## Setup

```sh
npm ci
```

## Before Opening a Pull Request

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```

Review the packed file list whenever a public config, export, binary, or declaration changes. Use the commit style documented in `.github/agent-commit-message-instructions.md`.
