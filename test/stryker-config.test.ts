import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import directFastConfig from "../presets/stryker.fast.config.mjs";
import directStrictConfig from "../presets/stryker.strict.config.mjs";
import {
    createStrykerConfig,
    createStrykerPreset,
    strykerConfig,
    strykerFastConfig,
    type StrykerPresetName,
    strykerPresets,
    strykerStrictConfig,
} from "../src/stryker-config.js";
import directDefaultConfig from "../stryker.config.mjs";

const dashboardKey = [
    "STRYKER",
    "DASHBOARD",
    "API_KEY",
].join("_");

const readJsonRecord = (url: URL): Readonly<Record<string, unknown>> => {
    const value: unknown = JSON.parse(readFileSync(url, "utf8"));

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new TypeError(`Expected an object in ${url.href}.`);
    }

    return value as Readonly<Record<string, unknown>>;
};

const readStringProperty = (
    value: Readonly<Record<string, unknown>>,
    property: string
): string => {
    const result = value[property];

    if (typeof result !== "string") {
        throw new TypeError(`Expected ${property} to be a string.`);
    }

    return result;
};

const readRecordProperty = (
    value: Readonly<Record<string, unknown>>,
    property: string
): Readonly<Record<string, unknown>> => {
    const result = value[property];

    if (
        typeof result !== "object" ||
        result === null ||
        Array.isArray(result)
    ) {
        throw new TypeError(`Expected ${property} to be an object.`);
    }

    return result as Readonly<Record<string, unknown>>;
};

describe("stryker shared config", () => {
    it("keeps the published Stryker 10 contract aligned with installed packages", () => {
        expect.assertions(8);

        const packageJson = readJsonRecord(
            new URL("../package.json", import.meta.url)
        );
        const peerDependencies = readRecordProperty(
            packageJson,
            "peerDependencies"
        );
        const strykerPeerPackages = [
            "@stryker-mutator/core",
            "@stryker-mutator/typescript-checker",
            "@stryker-mutator/vitest-runner",
        ] as const;

        for (const packageName of strykerPeerPackages) {
            const installedPackage = readJsonRecord(
                new URL(
                    `../node_modules/${packageName}/package.json`,
                    import.meta.url
                )
            );

            expect(readStringProperty(installedPackage, "version")).toBe(
                "10.0.0"
            );
            expect(readStringProperty(peerDependencies, packageName)).toBe(
                "^10.0.0"
            );
        }

        const apiPackage = readJsonRecord(
            new URL(
                "../node_modules/@stryker-mutator/api/package.json",
                import.meta.url
            )
        );
        const dependencies = readRecordProperty(packageJson, "dependencies");

        expect(readStringProperty(apiPackage, "version")).toBe("10.0.0");
        expect(readStringProperty(dependencies, "@stryker-mutator/api")).toBe(
            "^10.0.0"
        );
    });

    it("contains no source-repository identity or dead reporter options", () => {
        expect.assertions(6);

        expect(strykerConfig.dashboard).not.toHaveProperty("project");
        expect(strykerConfig.dashboard).not.toHaveProperty("version");
        expect(strykerConfig.clearTextReporter).toHaveProperty(
            "allowColor",
            true
        );
        expect(strykerConfig.clearTextReporter).not.toHaveProperty(
            "allowColors"
        );
        expect(strykerConfig).not.toHaveProperty("eventReporter");
        expect(JSON.stringify(strykerConfig)).not.toContain(
            "eslint-plugin-codex"
        );
    });

    it("deep-merges known nested objects without mutating the default", () => {
        expect.assertions(4);

        const customized = createStrykerConfig({
            thresholds: { break: 80 },
            vitest: {
                configFile: "./vitest.stryker.config.ts",
                dir: "packages",
            },
        });

        expect(customized.thresholds).toStrictEqual({
            break: 80,
            high: 85,
            low: 75,
        });
        expect(customized.vitest).toStrictEqual({
            configFile: "./vitest.stryker.config.ts",
            dir: "packages",
            related: false,
        });
        expect(strykerConfig.thresholds).toHaveProperty("break", 65);
        expect(strykerConfig.vitest).toHaveProperty(
            "configFile",
            "./vitest.config.ts"
        );
    });

    it("provides fast and strict presets without mutating the default", () => {
        expect.assertions(11);

        const defaultSnapshot = structuredClone(strykerConfig);
        const fast = createStrykerPreset("fast", {
            mutate: ["packages/core/src/**/*.ts"],
            vitest: { dir: "packages/core" },
        });
        const strict = createStrykerPreset("strict");

        expect(fast.checkers).toStrictEqual([]);
        expect(fast).toHaveProperty("disableTypeChecks", true);
        expect(fast).toHaveProperty("ignoreStatic", true);
        expect(fast).toHaveProperty("vitest.related", true);
        expect(fast).toHaveProperty("vitest.dir", "packages/core");
        expect(fast.mutate).toStrictEqual(["packages/core/src/**/*.ts"]);
        expect(strict).toHaveProperty(
            "typescriptChecker.prioritizePerformanceOverAccuracy",
            false
        );
        expect(strict).toHaveProperty("ignoreStatic", false);
        expect(strict).toHaveProperty("vitest.related", false);
        expect(strykerConfig).toStrictEqual(defaultSnapshot);
        expect(strykerPresets.default).toBe(strykerConfig);
    });

    it("applies consumer overrides after fast preset policy", () => {
        expect.assertions(6);

        const customized = createStrykerPreset("fast", {
            checkers: ["typescript"],
            disableTypeChecks: false,
            ignoreStatic: false,
            vitest: { related: false },
        });

        expect(customized.checkers).toStrictEqual(["typescript"]);
        expect(customized).toHaveProperty("disableTypeChecks", false);
        expect(customized).toHaveProperty("ignoreStatic", false);
        expect(customized).toHaveProperty("vitest.related", false);
        expect(strykerFastConfig).toHaveProperty("ignoreStatic", true);
        expect(() =>
            createStrykerPreset("unknown" as StrykerPresetName)
        ).toThrow(RangeError);
    });

    it("ships fresh directly runnable files for every preset", () => {
        expect.assertions(6);

        expect(directDefaultConfig).toStrictEqual(strykerConfig);
        expect(directFastConfig).toStrictEqual(strykerFastConfig);
        expect(directStrictConfig).toStrictEqual(strykerStrictConfig);
        expect(directDefaultConfig).not.toBe(strykerConfig);
        expect(directFastConfig).not.toBe(strykerFastConfig);
        expect(directStrictConfig).not.toBe(strykerStrictConfig);
    });

    it("enables dashboard reporting only when credentials are present", () => {
        expect.assertions(2);

        expect(createStrykerConfig({}, {}).reporters).not.toContain(
            "dashboard"
        );
        expect(
            createStrykerConfig({}, { [dashboardKey]: "present" }).reporters
        ).toContain("dashboard");
    });

    it("accepts a positive concurrency override from the environment", () => {
        expect.assertions(1);

        expect(
            createStrykerConfig({}, { STRYKER_CONCURRENCY: "3" })
        ).toHaveProperty("concurrency", 3);
    });
});
