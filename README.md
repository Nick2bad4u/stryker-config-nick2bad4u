# stryker-config-nick2bad4u

[![Continuous Integration](https://github.com/Nick2bad4u/stryker-config-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/stryker-config-nick2bad4u/actions/workflows/ci.yml)

Shared StrykerJS configuration for TypeScript projects tested with Vitest.

The default is directly runnable from `node_modules`, while the typed factory supports consumer-owned mutation globs, TypeScript projects, Vitest configs, thresholds, and reporter policy.

## Install

Keep the Stryker packages on the same version:

```sh
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/vitest-runner stryker-config-nick2bad4u typescript@^6.0.3 vitest
```

Stryker 9 still consumes TypeScript's programmatic compiler API. TypeScript 7's native package does not expose that legacy API, so consumers must keep the `typescript` peer on version 6.

## Direct usage

```json
{
 "scripts": {
  "test:stryker": "stryker run node_modules/stryker-config-nick2bad4u/stryker.config.mjs"
 }
}
```

Stryker treats the positional argument after `run` as the config file. Relative globs and paths resolve from the consumer working directory.

## Presets

The package keeps the existing `default` preset and provides two opt-in variants:

| Preset    | Use                       | Policy                                                                                                                         |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `default` | Normal mutation runs      | TypeScript checker, static mutants, and all Vitest tests                                                                       |
| `fast`    | Local iteration only      | Skips static mutants and compile-error checking, disables mutation-time type checks, and enables Vitest related-test selection |
| `strict`  | Release or scheduled runs | Uses the slower, maximum-accuracy TypeScript checker strategy                                                                  |

The `fast` preset deliberately does less work and can miss static or compile-error mutants. Do not use it as a release mutation gate.

Each preset has a directly runnable config file:

```json
{
 "scripts": {
  "test:stryker": "stryker run node_modules/stryker-config-nick2bad4u/stryker.config.mjs",
  "test:stryker:fast": "stryker run node_modules/stryker-config-nick2bad4u/presets/stryker.fast.config.mjs",
  "test:stryker:strict": "stryker run node_modules/stryker-config-nick2bad4u/presets/stryker.strict.config.mjs"
 }
}
```

## Customized usage

Create a small consumer-owned `stryker.config.mjs`:

```js
import { createStrykerConfig } from "stryker-config-nick2bad4u";

export default createStrykerConfig({
 mutate: ["src/**/*.ts", "!src/**/*.d.ts"],
 tsconfigFile: "tsconfig.build.json",
 vitest: {
  configFile: "./vitest.stryker.config.ts",
  related: false,
 },
});
```

Known nested option objects are merged. Arrays replace the shared defaults.

To customize a named preset, use the typed preset factory:

```js
import { createStrykerPreset } from "stryker-config-nick2bad4u";

export default createStrykerPreset("strict", {
 mutate: ["packages/core/src/**/*.ts"],
 vitest: {
  configFile: "./vitest.stryker.config.ts",
  dir: "packages/core",
 },
});
```

Programmatic consumers may also import the fresh factory outputs `strykerConfig`, `strykerFastConfig`, `strykerStrictConfig`, or the `strykerPresets` record. The executable subpath exports are `stryker-config-nick2bad4u/stryker.config.mjs`, `stryker-config-nick2bad4u/presets/fast`, and `stryker-config-nick2bad4u/presets/strict`.

## Policy

- The dashboard reporter is enabled only when `STRYKER_DASHBOARD_API_KEY` is present. Stryker infers project and version in supported CI environments.
- `STRYKER_CONCURRENCY` accepts an explicit positive worker count. Otherwise the default is 2 in CI and 12 locally.
- Consumer overrides are applied after preset policy. Known nested objects are merged, while arrays replace preset arrays.
- Dashboard `full` reports include source and mutant details; use the reporter only when that upload is intended.
- The stale `@stryker-ignorer/console-all` integration is not a default because its current release depends on the Stryker 8 API while this package targets Stryker 9.

## Validation

```sh
npm run release:verify
```
