const fs = require('fs');
const path = require('path');

const DEFAULT_RUNTIME_CONFIG = require('../shared/defaultRuntimeConfig.json');

const RUNTIME_CONFIG_FILE_NAME = 'runtime-config.json';

function normalizeApiUrl(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return fallback;
    }

    try {
        const normalizedUrl = new URL(trimmedValue);
        return normalizedUrl.toString().replace(/\/+$/, '');
    } catch {
        return fallback;
    }
}

function normalizePositiveInteger(value, fallback) {
    const normalizedValue = Number(value);

    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
        return fallback;
    }

    return Math.round(normalizedValue);
}

function sanitizeRuntimeConfig(rawConfig = {}) {
    return {
        apiUrl: normalizeApiUrl(rawConfig.apiUrl, DEFAULT_RUNTIME_CONFIG.apiUrl),
        apiTimeoutMs: normalizePositiveInteger(rawConfig.apiTimeoutMs, DEFAULT_RUNTIME_CONFIG.apiTimeoutMs),
        apiGetCacheTtlMs: normalizePositiveInteger(rawConfig.apiGetCacheTtlMs, DEFAULT_RUNTIME_CONFIG.apiGetCacheTtlMs),
    };
}

function getRuntimeConfigPath(appInstance) {
    return path.join(appInstance.getPath('userData'), RUNTIME_CONFIG_FILE_NAME);
}

function ensureRuntimeConfigFile(configPath) {
    if (fs.existsSync(configPath)) {
        return false;
    }

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(DEFAULT_RUNTIME_CONFIG, null, 4)}\n`, 'utf8');
    return true;
}

function readRuntimeConfigFile(configPath) {
    try {
        const rawConfig = fs.readFileSync(configPath, 'utf8');
        return {
            config: JSON.parse(rawConfig),
            readError: null,
        };
    } catch (error) {
        return {
            config: {},
            readError: error,
        };
    }
}

function getEnvironmentOverrides() {
    const overrides = {};

    const apiUrl = process.env.API_URL || process.env.VITE_API_URL;
    const apiTimeoutMs = process.env.API_TIMEOUT_MS || process.env.VITE_API_TIMEOUT_MS;
    const apiGetCacheTtlMs = process.env.API_GET_CACHE_TTL_MS || process.env.VITE_API_GET_CACHE_TTL_MS;

    if (apiUrl) {
        overrides.apiUrl = apiUrl;
    }

    if (apiTimeoutMs) {
        overrides.apiTimeoutMs = apiTimeoutMs;
    }

    if (apiGetCacheTtlMs) {
        overrides.apiGetCacheTtlMs = apiGetCacheTtlMs;
    }

    return overrides;
}

function initializeRuntimeConfig(appInstance) {
    const configPath = getRuntimeConfigPath(appInstance);
    const createdDefaultFile = ensureRuntimeConfigFile(configPath);
    const { config: fileConfig, readError } = readRuntimeConfigFile(configPath);
    const environmentOverrides = getEnvironmentOverrides();
    const hasEnvironmentOverrides = Object.keys(environmentOverrides).length > 0;
    const runtimeConfig = sanitizeRuntimeConfig({
        ...fileConfig,
        ...environmentOverrides,
    });

    const source = hasEnvironmentOverrides
        ? 'environment'
        : createdDefaultFile
            ? 'default-file'
            : readError
                ? 'fallback'
                : 'user-file';

    process.env.API_URL = runtimeConfig.apiUrl;
    process.env.API_TIMEOUT_MS = String(runtimeConfig.apiTimeoutMs);
    process.env.API_GET_CACHE_TTL_MS = String(runtimeConfig.apiGetCacheTtlMs);
    process.env.RUNTIME_CONFIG_PATH = configPath;
    process.env.RUNTIME_CONFIG_SOURCE = source;

    return {
        config: runtimeConfig,
        configPath,
        source,
        readError,
    };
}

module.exports = {
    DEFAULT_RUNTIME_CONFIG,
    getRuntimeConfigPath,
    initializeRuntimeConfig,
    sanitizeRuntimeConfig,
};