import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';

/**
 * Generate BOM (Bill of Materials) and power budget.
 */
export async function generateBom(
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

  const context = {
    robot: hw.robot,
    activeJoints,
    passiveJoints,
    sensors,
    mcu: mcu ?? { id: hw.robot.mcu, specs: {}, peripherals: {} },
  };

  await renderAndWrite(templatesDir, 'docs/BOM.md.ejs', options.outputDir,
    'docs/BOM.md', context);

  return [
    { path: 'docs/BOM.md', content: '' },
  ];
}
