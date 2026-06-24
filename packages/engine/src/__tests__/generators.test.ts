import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import { validateSchema } from '../schema';
import { validateHardware } from '../validator';
import { generateAll } from '../generators/index';
import type { HardwareDescription, MotorEntry, DriverEntry, SensorEntry, McuEntry, KnowledgeContext } from '../types';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');
const EXAMPLES_DIR = path.join(REPO_ROOT, 'examples', 'diff-drive-inspector');
const KNOWLEDGE_DIR = path.join(REPO_ROOT, 'packages', 'knowledge');

let hw: HardwareDescription;
let kb: KnowledgeContext;
let outputDir: string;

beforeAll(() => {
  // Load hardware description
  const yamlPath = path.join(EXAMPLES_DIR, 'robot.hardware.yaml');
  hw = yaml.load(fs.readFileSync(yamlPath, 'utf-8')) as HardwareDescription;

  // Load knowledge base
  kb = {
    motors: new Map(),
    sensors: new Map(),
    mcus: new Map(),
    drivers: new Map(),
    batteries: new Map(),
  };

  const motorFiles = ['dji_m3508.yaml', 'tmotor_ak80-9.yaml'];
  for (const file of motorFiles) {
    const motor = yaml.load(
      fs.readFileSync(path.join(KNOWLEDGE_DIR, 'motors', file), 'utf-8'),
    ) as MotorEntry;
    kb.motors.set(motor.id, motor);
  }

  const driverFiles = ['drv8301.yaml'];
  for (const file of driverFiles) {
    const driver = yaml.load(
      fs.readFileSync(path.join(KNOWLEDGE_DIR, 'drivers', file), 'utf-8'),
    ) as DriverEntry;
    kb.drivers.set(driver.id, driver);
  }

  const sensorFiles = ['bmi088.yaml'];
  for (const file of sensorFiles) {
    const sensor = yaml.load(
      fs.readFileSync(path.join(KNOWLEDGE_DIR, 'sensors', file), 'utf-8'),
    ) as SensorEntry;
    kb.sensors.set(sensor.id, sensor);
  }

  const mcuFiles = ['stm32f407.yaml'];
  for (const file of mcuFiles) {
    const mcu = yaml.load(
      fs.readFileSync(path.join(KNOWLEDGE_DIR, 'mcus', file), 'utf-8'),
    ) as McuEntry;
    kb.mcus.set(mcu.id, mcu);
  }

  // Temp output directory
  outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermod-test-'));
});

describe('Full generation pipeline', () => {
  it('generates firmware files', async () => {
    const files = await generateAll(
      hw,
      { outputDir, flags: { sim: false } },
      kb,
      TEMPLATES_DIR,
    );

    const firmwareFiles = files.filter((f) => f.path.startsWith('firmware/'));
    expect(firmwareFiles.length).toBeGreaterThanOrEqual(3);

    // Verify files exist on disk
    for (const file of firmwareFiles) {
      const fullPath = path.join(outputDir, file.path);
      expect(fs.existsSync(fullPath), `${file.path} should exist`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    }
  });

  it('generates URDF file', async () => {
    const files = await generateAll(
      hw,
      { outputDir, flags: { sim: false } },
      kb,
      TEMPLATES_DIR,
    );

    const urdfFile = files.find((f) => f.path.startsWith('urdf/'));
    expect(urdfFile).toBeDefined();

    const fullPath = path.join(outputDir, urdfFile!.path);
    const content = fs.readFileSync(fullPath, 'utf-8');
    expect(content).toContain('<robot');
    expect(content).toContain('base_link');
    expect(content).toContain('left_front_wheel');
    expect(content).toContain('right_front_wheel');
  });

  it('generates ROS 2 driver files', async () => {
    const files = await generateAll(
      hw,
      { outputDir, flags: { sim: false } },
      kb,
      TEMPLATES_DIR,
    );

    const ros2Files = files.filter((f) => f.path.startsWith('ros2_ws/'));
    expect(ros2Files.length).toBeGreaterThanOrEqual(2);

    const hwIface = files.find((f) => f.path.includes('hardware_interface'));
    expect(hwIface).toBeDefined();
    const hwContent = fs.readFileSync(path.join(outputDir, hwIface!.path), 'utf-8');
    expect(hwContent).toContain('HermodHardwareInterface');
    expect(hwContent).toContain('0x201'); // CAN ID check
    expect(hwContent).toContain('0x202');
  });

  it('generates BOM with power budget', async () => {
    const files = await generateAll(
      hw,
      { outputDir, flags: { sim: false } },
      kb,
      TEMPLATES_DIR,
    );

    const bomFile = files.find((f) => f.path.includes('BOM.md'));
    expect(bomFile).toBeDefined();

    const bomContent = fs.readFileSync(path.join(outputDir, bomFile!.path), 'utf-8');
    expect(bomContent).toContain('dji-m3508');
    expect(bomContent).toContain('bmi088');
    expect(bomContent).toContain('stm32f407');
    expect(bomContent).toContain('Power Budget');
  });

  it('generates CLAUDE.md with AI context', async () => {
    const files = await generateAll(
      hw,
      { outputDir, flags: { sim: false } },
      kb,
      TEMPLATES_DIR,
    );

    const claudeFile = files.find((f) => f.path === 'CLAUDE.md');
    expect(claudeFile).toBeDefined();

    const claudeContent = fs.readFileSync(path.join(outputDir, claudeFile!.path), 'utf-8');
    expect(claudeContent).toContain('巡检机器人-C3');
    expect(claudeContent).toContain('@ai-lock');
    expect(claudeContent).toContain('@ai-critical');
    expect(claudeContent).toContain('@ai-extend');
  });

  it('generates AI annotation reference', async () => {
    const files = await generateAll(
      hw,
      { outputDir, flags: { sim: false } },
      kb,
      TEMPLATES_DIR,
    );

    const annotFile = files.find((f) => f.path.includes('AI_ANNOTATIONS.md'));
    expect(annotFile).toBeDefined();

    const annotContent = fs.readFileSync(path.join(outputDir, annotFile!.path), 'utf-8');
    expect(annotContent).toContain('@ai-lock');
    expect(annotContent).toContain('@ai-critical');
    expect(annotContent).toContain('@ai-extend');
  });

  it('generates Gazebo simulation when flag is set', async () => {
    const files = await generateAll(
      hw,
      { outputDir: fs.mkdtempSync(path.join(os.tmpdir(), 'hermod-sim-')), flags: { sim: true } },
      kb,
      TEMPLATES_DIR,
    );

    const simFiles = files.filter((f) => f.path.startsWith('sim/'));
    expect(simFiles.length).toBeGreaterThanOrEqual(1);

    const dockerFile = files.find((f) => f.path === 'docker-compose.yml');
    expect(dockerFile).toBeDefined();
  });
});
