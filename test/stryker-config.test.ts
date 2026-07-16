import { describe, expect, it } from "vitest";

import { createStrykerConfig, strykerConfig } from "../src/stryker-config.js";

const dashboardKey = [
    "STRYKER",
    "DASHBOARD",
    "API_KEY",
].join("_");

describe("stryker shared config", () => {
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
            vitest: { configFile: "./vitest.stryker.config.ts" },
        });

        expect(customized.thresholds).toStrictEqual({
            break: 80,
            high: 85,
            low: 75,
        });
        expect(customized.vitest).toStrictEqual({
            configFile: "./vitest.stryker.config.ts",
            related: false,
        });
        expect(strykerConfig.thresholds).toHaveProperty("break", 65);
        expect(strykerConfig.vitest).toHaveProperty(
            "configFile",
            "./vitest.config.ts"
        );
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
