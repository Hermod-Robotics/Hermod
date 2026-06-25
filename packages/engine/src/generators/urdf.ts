import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';

/**
 * Generate URDF/XACRO robot model from hardware description.
 *
 * Handles both mobile robot types (diff_drive, ackermann) with parallel
 * wheel links, and serial chain manipulators (arm_6dof) with parent-child
 * joint nesting.
 */
export async function generateUrdf(
  hw: HardwareDescription,
  options: GenerateOptions,
  templatesDir: string,
  kb?: KnowledgeContext,
): Promise<GeneratedFile[]> {
  const activeJoints = hw.joints
    .filter((j) => j.type === 'active')
    .map((j) => ({
      ...j,
      motorEntry: kb?.motors.get(j.motor) ?? null,
    }));

  const context = {
    robot: hw.robot,
    joints: hw.joints,
    activeJoints,
    sensors: hw.sensors,
    ros: hw.ros,
  };

  await renderAndWrite(templatesDir, 'urdf/robot.urdf.xacro.ejs', options.outputDir,
    `urdf/${hw.robot.name.replace(/\s+/g, '_').toLowerCase()}.urdf.xacro`, context);

  return [
    { path: `urdf/${hw.robot.name.replace(/\s+/g, '_').toLowerCase()}.urdf.xacro`, content: '' },
  ];
}
