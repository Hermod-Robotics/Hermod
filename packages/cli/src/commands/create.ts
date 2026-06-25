/**
 * create command — interactive project scaffolding wizard.
 *
 * Flow:
 *   1. Project name (from CLI arg or prompt)
 *   2. Robot type
 *   3. MCU selection
 *   4. Joint configuration (motor + driver + CAN ID + role)
 *   5. Sensor selection
 *   6. Battery selection
 *   7. ROS configuration
 *   8. Generate project
 */
import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { loadIndex, toChoices, findRef, buildKnowledgeContext } from '../kb-loader';
import { validateSchema, validateHardware, generateAll } from '@hermod/engine';
import type { HardwareDescription } from '@hermod/engine';
import type { KbIndex } from '../kb-loader';
import type { KnowledgeContext } from '@hermod/engine';

const ROBOT_TYPES = [
  { value: 'diff_drive', label: 'Differential Drive', hint: '4-wheel skid-steer or 2-wheel + caster' },
  { value: 'arm_6dof',   label: '6-DOF Manipulator Arm', hint: 'serial chain, 6 revolute joints' },
  { value: 'ackermann',   label: 'Ackermann Steering', hint: 'car-like steering geometry' },
  { value: 'quadruped',   label: 'Quadruped', hint: '4-legged walking robot' },
  { value: 'custom',      label: 'Custom', hint: 'define your own kinematic structure' },
];

const ROS_VERSIONS = [
  { value: 'humble', label: 'Humble (LTS)', hint: 'Ubuntu 22.04' },
  { value: 'jazzy',  label: 'Jazzy (LTS)', hint: 'Ubuntu 24.04' },
  { value: 'rolling', label: 'Rolling', hint: 'latest development' },
];

interface CreateOptions {
  name?: string;
  template?: string;
  yes?: boolean;
}

export async function createCommand(
  projectName: string | undefined,
  options: CreateOptions,
  repoRoot: string,
): Promise<void> {
  const knowledgeDir = path.join(repoRoot, 'packages', 'knowledge');
  const templatesDir = path.join(repoRoot, 'templates');

  p.intro(color.bgCyan(color.black(' Hermod ')));

  // ── 1. Load knowledge base index ──
  const spinner = p.spinner();
  spinner.start('Loading knowledge base');
  const index = loadIndex(knowledgeDir);
  spinner.stop(`Loaded ${index.motors.length + index.sensors.length + index.drivers.length + index.mcus.length + index.batteries.length} hardware entries`);

  // ── 2. Project name ──
  const name = projectName || (await p.text({
    message: 'Project name:',
    placeholder: 'my-robot',
    validate: (v) => v.length > 0 ? undefined : 'Name is required',
  })) as string;

  if (p.isCancel(name)) { p.cancel('Cancelled'); return; }

  // ── 3. Robot type ──
  const robotType = options.template || (await p.select({
    message: 'Select robot type:',
    options: ROBOT_TYPES.map((t) => ({ value: t.value, label: `${t.label} — ${t.hint}` })),
  })) as string;

  if (p.isCancel(robotType)) { p.cancel('Cancelled'); return; }

  // ── 4. MCU ──
  const mcuId = await p.select({
    message: 'Select MCU:',
    options: toChoices(index.mcus).map((c) => ({ value: c.value, label: `${c.label} — ${c.hint}` })),
  }) as string;

  if (p.isCancel(mcuId)) { p.cancel('Cancelled'); return; }

  // ── 5. Joints ──
  const joints: HardwareDescription['joints'] = [];
  let addMore = true;
  let jointIndex = 0;
  let nextCanId = 0x201;

  while (addMore) {
    jointIndex++;
    const motorId = await p.select({
      message: `Joint ${jointIndex}: select motor (ESC to finish):`,
      options: [
        ...toChoices(index.motors).map((c) => ({ value: c.value, label: `${c.label} — ${c.hint}` })),
        { value: '__passive__', label: 'Passive wheel / caster' },
        { value: '__done__', label: 'Done adding joints' },
      ],
    }) as string;

    if (p.isCancel(motorId) || motorId === '__done__') { addMore = false; break; }

    if (motorId === '__passive__') {
      const pName = await p.text({
        message: 'Passive joint name:',
        placeholder: `caster_${jointIndex}`,
      }) as string;
      if (p.isCancel(pName)) break;
      joints.push({ name: pName, type: 'passive', role: 'passive' });
      continue;
    }

    const driverId = await p.select({
      message: `Driver for ${motorId}:`,
      options: toChoices(index.drivers).map((c) => ({ value: c.value, label: `${c.label} — ${c.hint}` })),
    }) as string;

    if (p.isCancel(driverId)) { p.cancel('Cancelled'); return; }

    const jointName = await p.text({
      message: 'Joint name:',
      placeholder: `joint_${jointIndex}`,
      defaultValue: `joint_${jointIndex}`,
    }) as string;

    if (p.isCancel(jointName)) break;

    const canId = await p.text({
      message: 'CAN ID (hex, e.g. 0x201):',
      placeholder: `0x${nextCanId.toString(16)}`,
      defaultValue: `0x${nextCanId.toString(16)}`,
    }) as string;

    const canIdNum = parseInt(canId, 16);
    if (!isNaN(canIdNum)) nextCanId = canIdNum + 1;

    const role = await p.select({
      message: 'Joint role:',
      options: [
        { value: 'drive', label: 'Drive (wheel/track)' },
        { value: 'steering', label: 'Steering' },
        { value: 'manipulation', label: 'Manipulation (arm joint)' },
      ],
    }) as string;

    if (p.isCancel(role)) break;

    joints.push({
      name: jointName,
      type: 'active',
      motor: motorId,
      driver: driverId,
      canId: canIdNum,
      role: role as 'drive' | 'steering' | 'manipulation',
    });
  }

  if (joints.length === 0) {
    p.log.warn('No joints added — generating a minimal skeleton');
    joints.push({ name: 'placeholder', type: 'passive', role: 'passive' });
  }

  // ── 6. Sensors ──
  const sensorSelections = await p.multiselect({
    message: 'Select sensors (space to toggle, enter to confirm):',
    options: toChoices(index.sensors).map((c) => ({ value: c.value, label: `${c.label} — ${c.hint}` })),
  }) as string[];

  if (p.isCancel(sensorSelections)) { p.cancel('Cancelled'); return; }

  const sensors: HardwareDescription['sensors'] = [];
  for (const sensorId of sensorSelections) {
    const sensorRef = findRef(index.sensors, sensorId);
    const iface = await p.select({
      message: `Interface for ${sensorId}:`,
      options: [
        { value: 'UART', label: 'UART' },
        { value: 'SPI', label: 'SPI' },
        { value: 'I2C', label: 'I2C' },
        { value: 'USB', label: 'USB' },
        { value: 'CAN', label: 'CAN' },
        { value: 'GPIO', label: 'GPIO' },
      ],
    }) as string;

    if (p.isCancel(iface)) break;

    const port = await p.text({
      message: `Port for ${sensorId}:`,
      placeholder: iface === 'UART' ? '/dev/ttyUSB0' : iface === 'SPI' ? 'SPI1' : 'I2C1',
      defaultValue: iface === 'UART' ? '/dev/ttyUSB0' : iface === 'SPI' ? 'SPI1' : 'I2C1',
    }) as string;

    if (p.isCancel(port)) break;

    sensors.push({
      name: sensorId,
      model: sensorId,
      interface: iface as HardwareDescription['sensors'][0]['interface'],
      port,
    });
  }

  // ── 7. Battery ──
  const batteryId = await p.select({
    message: 'Select battery:',
    options: toChoices(index.batteries).map((c) => ({ value: c.value, label: `${c.label} — ${c.hint}` })),
  }) as string;

  if (p.isCancel(batteryId)) { p.cancel('Cancelled'); return; }

  // ── 8. ROS ──
  const rosVersion = await p.select({
    message: 'ROS 2 version:',
    options: ROS_VERSIONS.map((v) => ({ value: v.value, label: `${v.label} — ${v.hint}` })),
  }) as string;

  if (p.isCancel(rosVersion)) { p.cancel('Cancelled'); return; }

  const rosNs = await p.text({
    message: 'ROS namespace:',
    placeholder: name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
    defaultValue: name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
  }) as string;

  // ── 9. Build HardwareDescription ──
  const hw: HardwareDescription = {
    robot: {
      name,
      type: robotType as HardwareDescription['robot']['type'],
      mcu: mcuId,
    },
    joints,
    sensors,
    power: {
      battery: batteryId,
      voltageNominal: 22.2,
      voltageRange: [18.0, 25.2],
    },
    ros: {
      version: rosVersion as HardwareDescription['ros']['version'],
      namespace: rosNs,
    },
  };

  // ── 10. Validate ──
  const schemaIssues = validateSchema(hw);
  if (schemaIssues.length > 0) {
    p.log.error('Schema validation failed:');
    for (const issue of schemaIssues) {
      p.log.error(`  ${issue.field}: ${issue.message}`);
    }
    return;
  }

  const motorIds = joints.filter(j => j.type === 'active').map(j => j.motor);
  const sensorIds = sensors.map(s => s.model);
  const driverIds = joints.filter(j => j.type === 'active').map(j => j.driver);

  const kb = buildKnowledgeContext(knowledgeDir, index, {
    motorIds, sensorIds, mcuId, driverIds, batteryId,
  }) as unknown as KnowledgeContext;

  const hwIssues = validateHardware(hw, kb);
  const errors = hwIssues.filter(i => i.severity === 'error');
  if (errors.length > 0) {
    p.log.error('Hardware validation failed:');
    for (const e of errors) {
      p.log.error(`  ${e.field}: ${e.message}`);
    }
    return;
  }

  // ── 11. Generate ──
  const outputDir = path.resolve(process.cwd(), name);
  const genSpinner = p.spinner();
  genSpinner.start('Generating project');

  const files = await generateAll(
    hw,
    { outputDir, flags: { sim: true } },
    kb,
    templatesDir,
  );

  genSpinner.stop(`Generated ${files.length} files`);

  // ── 12. Summary ──
  const categories = new Map<string, number>();
  for (const file of files) {
    const dir = file.path.split('/')[0];
    categories.set(dir, (categories.get(dir) || 0) + 1);
  }

  p.note(
    Array.from(categories.entries())
      .map(([cat, count]) => `  ${cat}/ — ${count} files`)
      .join('\n'),
    `${name}/`
  );

  p.outro(color.green(`Project ready at ${outputDir}\n  cd ${name}\n  docker compose up`));
}
