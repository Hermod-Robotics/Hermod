import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';

/**
 * Generate CLAUDE.md — AI agent project context.
 *
 * This is the most important file for AI-native development.
 * It gives any AI agent (Claude Code, Cursor, Copilot) the context
 * it needs to understand the hardware, build system, and safety constraints.
 */
export async function generateClaudeMd(
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

  const sensors = hw.sensors.map((s) => ({
    ...s,
    sensorEntry: kb.sensors.get(s.model),
  }));

  const mcu = kb.mcus.get(hw.robot.mcu);

  const context = {
    robot: hw.robot,
    activeJoints,
    sensors,
    ros: hw.ros,
    mcu: mcu ?? { id: hw.robot.mcu },
  };

  await renderAndWrite(templatesDir, 'docs/CLAUDE.md.ejs', options.outputDir,
    'CLAUDE.md', context);

  return [
    { path: 'CLAUDE.md', content: '' },
  ];
}
