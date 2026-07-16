import type { PartialStrykerOptions } from "@stryker-mutator/api/core";

import { setHas } from "ts-extras";

/** Complete typed input accepted by this package's factory. */
export type SharedStrykerOptions = PartialStrykerOptions & StrykerPluginOptions;

/**
 * Plugin-owned options that are intentionally absent from Stryker's core
 * schema.
 */
export interface StrykerPluginOptions {
    readonly typescriptChecker?: {
        readonly prioritizePerformanceOverAccuracy?: boolean;
    };
    readonly vitest?: {
        readonly configFile?: string;
        readonly related?: boolean;
    };
}

const trueEnvironmentValues: ReadonlySet<string> = new Set([
    "1",
    "on",
    "true",
    "yes",
]);
const warningDefaults = {
    preprocessorErrors: true,
    slow: true,
    unknownOptions: true,
    unserializableOptions: true,
} as const;

// eslint-disable-next-line n/no-process-env -- executable config intentionally reads Stryker and CI environment
const runtimeEnvironment: Readonly<NodeJS.ProcessEnv> = process.env;

const isEnabled = (value: string | undefined): boolean =>
    typeof value === "string" &&
    setHas(trueEnvironmentValues, value.toLowerCase());

const getConcurrency = (environment: Readonly<NodeJS.ProcessEnv>): number => {
    const configured = Math.trunc(
        Number(environment["STRYKER_CONCURRENCY"] ?? "")
    );

    if (configured > 0 && configured < Infinity) {
        return configured;
    }

    return isEnabled(environment["CI"]) ? 2 : 12;
};

const getBaseConfig = (
    environment: Readonly<NodeJS.ProcessEnv>
): SharedStrykerOptions => {
    const hasDashboardApiKey =
        (environment["STRYKER_DASHBOARD_API_KEY"] ?? "").length > 0;

    return {
        allowConsoleColors: true,
        allowEmpty: false,
        checkers: ["typescript"],
        cleanTempDir: true,
        clearTextReporter: {
            allowColor: true,
            allowEmojis: true,
            logTests: true,
            maxTestsToLog: 9999,
            reportMutants: true,
            reportScoreTable: true,
            reportTests: false,
            skipFull: false,
        },
        concurrency: getConcurrency(environment),
        dashboard: {
            baseUrl: "https://dashboard.stryker-mutator.io/api/reports",
        },
        disableTypeChecks: false,
        htmlReporter: {
            fileName: "coverage/stryker.html",
        },
        ignoreStatic: false,
        incremental: true,
        incrementalFile: ".cache/stryker/incremental.json",
        jsonReporter: {
            fileName: "coverage/stryker.json",
        },
        maxTestRunnerReuse: 0,
        mutate: [
            "src/**/*.{ts,tsx}",
            "!src/**/*.d.ts",
            "!src/**/*.{test,spec}.{ts,tsx}",
        ],
        packageManager: "npm",
        reporters: [
            "clear-text",
            "html",
            "json",
            ...(hasDashboardApiKey ? ["dashboard" as const] : []),
            "progress",
        ],
        symlinkNodeModules: true,
        testRunner: "vitest",
        thresholds: {
            break: 65,
            high: 85,
            low: 75,
        },
        timeoutFactor: 1.25,
        timeoutMS: 60_000,
        tsconfigFile: "tsconfig.build.json",
        typescriptChecker: {
            prioritizePerformanceOverAccuracy: true,
        },
        vitest: {
            configFile: "./vitest.config.ts",
            related: false,
        },
        warnings: warningDefaults,
    };
};

/**
 * Create a fresh Stryker Vitest/TypeScript configuration.
 *
 * Known nested option objects are merged. Arrays supplied by the consumer
 * replace package defaults so plugin, reporter, checker, and mutation policy
 * stays explicit.
 */
export function createStrykerConfig(
    overrides: SharedStrykerOptions = {},
    environment: Readonly<NodeJS.ProcessEnv> = runtimeEnvironment
): SharedStrykerOptions {
    const base = getBaseConfig(environment);
    const warnings =
        typeof overrides.warnings === "boolean"
            ? overrides.warnings
            : {
                  ...warningDefaults,
                  ...overrides.warnings,
              };

    return {
        ...base,
        ...overrides,
        clearTextReporter: {
            ...base.clearTextReporter,
            ...overrides.clearTextReporter,
        },
        dashboard: {
            ...base.dashboard,
            ...overrides.dashboard,
        },
        htmlReporter: {
            ...base.htmlReporter,
            ...overrides.htmlReporter,
        },
        jsonReporter: {
            ...base.jsonReporter,
            ...overrides.jsonReporter,
        },
        thresholds: {
            ...base.thresholds,
            ...overrides.thresholds,
        },
        typescriptChecker: {
            ...base.typescriptChecker,
            ...overrides.typescriptChecker,
        },
        vitest: {
            ...base.vitest,
            ...overrides.vitest,
        },
        warnings,
    };
}

/** Directly runnable package default. */
export const strykerConfig: SharedStrykerOptions = createStrykerConfig();

export default strykerConfig;
