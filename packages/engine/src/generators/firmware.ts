import path from 'node:path';
import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';

/**
 * Generate STM32/ESP32 firmware from hardware description.
 *
 * Outputs: can_config.h, motor_foc.cpp, safety/limits.h
 */
export async function generateFirmware(
  hw: HardwareDescription,
  options: GenerateOptions,
  templatesDir: string,
  kb: KnowledgeContext,
): Promise<GeneratedFile[]> {
  const activeJoints = hw.joints
    .filter((j) => j.type === 'active')
    .map((j) => ({
      ...j,
      motorEntry: kb.motors.get(j.motor),
      driverEntry: kb.drivers.get(j.driver),
    }));

  const passiveJoints = hw.joints.filter((j) => j.type === 'passive');

  const sensors = hw.sensors.map((s) => ({
    ...s,
    sensorEntry: kb.sensors.get(s.model),
  }));

  const mcu = kb.mcus.get(hw.robot.mcu);
  if (!mcu) throw new Error(`MCU "${hw.robot.mcu}" not found in knowledge base`);

  const context = {
    robot: hw.robot,
    activeJoints,
    passiveJoints,
    sensors,
    power: hw.power,
    ros: hw.ros,
    mcu,
  };

  // CAN configuration
  await renderAndWrite(templatesDir, 'firmware/can_config.h.ejs', options.outputDir,
    'firmware/inc/can_config.h', context);

  // Motor FOC control
  await renderAndWrite(templatesDir, 'firmware/motor_foc.cpp.ejs', options.outputDir,
    'firmware/src/motor_foc.cpp', context);

  // Safety limits
  await renderAndWrite(templatesDir, 'firmware/safety/limits.h.ejs', options.outputDir,
    'firmware/inc/safety/limits.h', context);

  return [
    { path: 'firmware/inc/can_config.h', content: '' },
    { path: 'firmware/src/motor_foc.cpp', content: '' },
    { path: 'firmware/inc/safety/limits.h', content: '' },
  ];
}
