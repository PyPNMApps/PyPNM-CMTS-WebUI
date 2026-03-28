import fs from "node:fs";
import path from "node:path";

import { parse, stringify } from "yaml";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function dedupeInstances(instances, sourceLabel) {
  const nextInstances = Array.isArray(instances) ? instances : [];
  const seenIds = new Set();
  const duplicateIds = new Set();
  const deduped = [];

  for (const instance of nextInstances) {
    const instanceId = typeof instance?.id === "string" ? instance.id.trim() : "";
    if (instanceId === "") {
      deduped.push(instance);
      continue;
    }

    if (seenIds.has(instanceId)) {
      duplicateIds.add(instanceId);
      continue;
    }

    seenIds.add(instanceId);
    deduped.push(instance);
  }

  if (duplicateIds.size > 0) {
    console.warn(
      `Duplicate PyPNM-CMTS agent ids found in ${sourceLabel}: ${Array.from(duplicateIds).join(", ")}. Keeping first occurrence only.`,
    );
  }

  return deduped;
}

function sanitizeConfig(config, sourceLabel) {
  return {
    ...(config ?? {}),
    instances: dedupeInstances(config?.instances, sourceLabel),
  };
}

function deepMerge(templateValue, sourceValue) {
  if (Array.isArray(templateValue)) {
    return Array.isArray(sourceValue) ? cloneValue(sourceValue) : cloneValue(templateValue);
  }

  if (isPlainObject(templateValue)) {
    const result = {};
    const sourceObject = isPlainObject(sourceValue) ? sourceValue : {};

    for (const key of Object.keys(templateValue)) {
      result[key] = deepMerge(templateValue[key], sourceObject[key]);
    }

    for (const [key, value] of Object.entries(sourceObject)) {
      if (!(key in result)) {
        result[key] = cloneValue(value);
      }
    }

    return result;
  }

  if (sourceValue === undefined) {
    return templateValue;
  }

  return cloneValue(sourceValue);
}

export function mergeRuntimeConfig(templateConfig, sourceConfig) {
  const sanitizedTemplateConfig = sanitizeConfig(templateConfig, "template runtime config");
  const sanitizedSourceConfig = sanitizeConfig(sourceConfig, "local runtime config");
  const merged = deepMerge(sanitizedTemplateConfig, sanitizedSourceConfig);
  const templateInstances = Array.isArray(sanitizedTemplateConfig?.instances) ? sanitizedTemplateConfig.instances : [];
  const sourceInstances = Array.isArray(sanitizedSourceConfig?.instances) ? sanitizedSourceConfig.instances : [];

  const mergedInstances = [];

  for (const templateInstance of templateInstances) {
    const matchingSourceInstance = sourceInstances.find((instance) => instance?.id === templateInstance?.id);
    mergedInstances.push(deepMerge(templateInstance, matchingSourceInstance));
  }

  for (const sourceInstance of sourceInstances) {
    if (!templateInstances.some((instance) => instance?.id === sourceInstance?.id)) {
      mergedInstances.push(cloneValue(sourceInstance));
    }
  }

  merged.instances = mergedInstances;
  if (sanitizedTemplateConfig?.version !== undefined) {
    merged.version = cloneValue(sanitizedTemplateConfig.version);
  }

  const mergedSelectedInstance = merged?.defaults?.selected_instance;
  if (!mergedInstances.some((instance) => instance?.id === mergedSelectedInstance) && mergedInstances.length > 0) {
    merged.defaults.selected_instance = mergedInstances[0].id;
  }

  return merged;
}

function backupPathFor(configPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${configPath}.${timestamp}.bak`;
}

function writeWithBackup(outputPath, content) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath, "utf8");
    if (existing !== content) {
      fs.copyFileSync(outputPath, backupPathFor(outputPath));
    }
  }
  fs.writeFileSync(outputPath, content, "utf8");
}

export function mergeRuntimeConfigFiles({ templatePath, sourcePath, outputPath }) {
  const templateConfig = sanitizeConfig(parse(fs.readFileSync(templatePath, "utf8")) ?? {}, templatePath);
  const sourceConfig = fs.existsSync(sourcePath)
    ? sanitizeConfig(parse(fs.readFileSync(sourcePath, "utf8")) ?? {}, sourcePath)
    : {};
  const merged = mergeRuntimeConfig(templateConfig, sourceConfig);
  writeWithBackup(outputPath, stringify(merged, { indent: 2 }));
  return merged;
}
