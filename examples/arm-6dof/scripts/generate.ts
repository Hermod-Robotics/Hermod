/**
 * Hermod Demo — Full Generation Pipeline
 *
 * Reads robot.hardware.yaml, loads knowledge base, validates,
 * generates complete project, and prints a summary report.
 *
 * Usage: npx tsx scripts/generate.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {
  validateSchema,
  validateHardware,
  generateAll,
} from '@hermod/engine';
import type {
  HardwareDescription,
  MotorEntry,
  DriverEntry,
  SensorEntry,
  McuEntry,
  BatteryEntry,
  KnowledgeContext,
} from '@hermod/engine';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');
const KNOWLEDGE_DIR = path.join(REPO_ROOT, 'packages', 'knowledge');
const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'generated');

// ── 1. Load hardware description ──
const yamlPath = path.resolve(import.meta.dirname, '..', 'robot.hardware.yaml');
const hw = yaml.load(fs.readFileSync(yamlPath, 'utf-8')) as HardwareDescription;
console.log(`📄 Loaded: ${yamlPath}`);
console.log(`   Robot: ${hw.robot.name} (${hw.robot.type})`);
console.log(`   Joints: ${hw.joints.length} | Sensors: ${hw.sensors.length}`);

// ── 2. Schema validation ──
const schemaIssues = validateSchema(hw);
if (schemaIssues.length > 0) {
  console.error('❌ Schema validation failed:');
  for (const issue of schemaIssues) {
    console.error(`   [${issue.field}] ${issue.message}`);
  }
  process.exit(1);
}
console.log('✅ Schema validation passed');

// ── 3. Load knowledge base ──
const kb: KnowledgeContext = {
  motors: new Map(),
  sensors: new Map(),
  mcus: new Map(),
  drivers: new Map(),
  batteries: new Map(),
};

function loadYamlFiles<T>(dir: string): T[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => yaml.load(fs.readFileSync(path.join(dir, f), 'utf-8')) as T);
}

for (const motor of loadYamlFiles<MotorEntry>(path.join(KNOWLEDGE_DIR, 'motors'))) {
  kb.motors.set(motor.id, motor);
}
for (const sensor of loadYamlFiles<SensorEntry>(path.join(KNOWLEDGE_DIR, 'sensors'))) {
  kb.sensors.set(sensor.id, sensor);
}
for (const mcu of loadYamlFiles<McuEntry>(path.join(KNOWLEDGE_DIR, 'mcus'))) {
  kb.mcus.set(mcu.id, mcu);
}
for (const driver of loadYamlFiles<DriverEntry>(path.join(KNOWLEDGE_DIR, 'drivers'))) {
  kb.drivers.set(driver.id, driver);
}
for (const battery of loadYamlFiles<BatteryEntry>(path.join(KNOWLEDGE_DIR, 'batteries'))) {
  kb.batteries.set(battery.id, battery);
}

console.log(`📚 Knowledge base: ${kb.motors.size} motors | ${kb.sensors.size} sensors | ${kb.mcus.size} MCUs | ${kb.drivers.size} drivers | ${kb.batteries.size} batteries`);

// ── 4. Hardware validation ──
const hwIssues = validateHardware(hw, kb);
const errors = hwIssues.filter((i) => i.severity === 'error');
const warnings = hwIssues.filter((i) => i.severity === 'warning');

if (errors.length > 0) {
  console.error('❌ Hardware validation failed:');
  for (const e of errors) {
    console.error(`   [${e.field}] ${e.message}`);
  }
  process.exit(1);
}
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.log(`   [${w.field}] ${w.message}`);
  }
}
console.log('✅ Hardware validation passed');

async function main() {
  // ── 5. Generate ──
  console.log(`\n🔨 Generating project → ${OUTPUT_DIR}\n`);

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

  const files = await generateAll(
    hw,
    { outputDir: OUTPUT_DIR, flags: { sim: true } },
    kb,
    TEMPLATES_DIR,
  );

  // ── 6. Report ──
  const categories = new Map<string, string[]>();
  for (const file of files) {
    const dir = path.dirname(file.path).split('/')[0];
    if (!categories.has(dir)) categories.set(dir, []);
    categories.get(dir)!.push(file.path);
  }

  console.log('═══════════════════════════════════════');
  console.log(`  Generated ${files.length} files in ${OUTPUT_DIR}`);
  console.log('═══════════════════════════════════════\n');

  for (const [category, paths] of categories) {
    console.log(`  ${category}/`);
    for (const p of paths) {
      console.log(`    ${p}`);
    }
  }

  console.log('\n✅ Done. Next steps:');
  console.log(`   cd ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  console.log('   docker compose up    # Start Gazebo simulation\n');
}

main().catch((err) => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
