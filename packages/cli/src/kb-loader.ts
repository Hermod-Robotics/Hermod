/**
 * Knowledge Base Loader — reads INDEX.yaml and loads entries on demand.
 * Provides the CLI with categorized lists for interactive prompts.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface KbIndex {
  motors:     KbRef[];
  sensors:    KbRef[];
  drivers:    KbRef[];
  mcus:       KbRef[];
  batteries:  KbRef[];
}

export interface KbRef {
  id: string;
  path: string;
  description: string;
}

export interface KbChoice {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Load the knowledge base index.
 */
export function loadIndex(knowledgeDir: string): KbIndex {
  const indexPath = path.join(knowledgeDir, 'INDEX.yaml');
  return yaml.load(fs.readFileSync(indexPath, 'utf-8')) as KbIndex;
}

/**
 * Convert a category to CLI choices.
 */
export function toChoices(refs: KbRef[]): KbChoice[] {
  return refs.map((r) => ({
    value: r.id,
    label: r.id,
    hint: r.description,
  }));
}

/**
 * Load a full knowledge base entry by ID.
 */
export function loadEntry<T>(knowledgeDir: string, ref: KbRef): T {
  const entryPath = path.join(knowledgeDir, ref.path);
  return yaml.load(fs.readFileSync(entryPath, 'utf-8')) as T;
}

/**
 * Find a KbRef by ID within a category.
 */
export function findRef(refs: KbRef[], id: string): KbRef | undefined {
  return refs.find((r) => r.id === id);
}

/**
 * Build a KnowledgeContext map by loading all referenced entries.
 */
export function buildKnowledgeContext(
  knowledgeDir: string,
  index: KbIndex,
  selections: {
    motorIds: string[];
    sensorIds: string[];
    mcuId: string;
    driverIds: string[];
    batteryId: string;
  },
): {
  motors: Map<string, unknown>;
  sensors: Map<string, unknown>;
  mcus: Map<string, unknown>;
  drivers: Map<string, unknown>;
  batteries: Map<string, unknown>;
} {
  const motors = new Map<string, unknown>();
  for (const id of selections.motorIds) {
    const ref = findRef(index.motors, id);
    if (ref) motors.set(id, loadEntry(knowledgeDir, ref));
  }

  const sensors = new Map<string, unknown>();
  for (const id of selections.sensorIds) {
    const ref = findRef(index.sensors, id);
    if (ref) sensors.set(id, loadEntry(knowledgeDir, ref));
  }

  const mcus = new Map<string, unknown>();
  const mcuRef = findRef(index.mcus, selections.mcuId);
  if (mcuRef) mcus.set(selections.mcuId, loadEntry(knowledgeDir, mcuRef));

  const drivers = new Map<string, unknown>();
  for (const id of selections.driverIds) {
    const ref = findRef(index.drivers, id);
    if (ref) drivers.set(id, loadEntry(knowledgeDir, ref));
  }

  const batteries = new Map<string, unknown>();
  const batRef = findRef(index.batteries, selections.batteryId);
  if (batRef) batteries.set(selections.batteryId, loadEntry(knowledgeDir, batRef));

  return { motors, sensors, mcus, drivers, batteries };
}
