# Repository Instructions

This repository publishes `stryker-config-nick2bad4u`.
Treat `stryker.config.mjs` and the typed factory as public package surfaces.

## Priorities

- Keep repository identity and dashboard version out of shared defaults.
- Keep every `@stryker-mutator/*` package on the same release line.
- Deep-merge known nested option objects and replace consumer-supplied arrays.
- Validate options against the current Stryker schema; unknown keys are defects.
- Test both the direct config file and factory behavior before release.

## Commands

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```
