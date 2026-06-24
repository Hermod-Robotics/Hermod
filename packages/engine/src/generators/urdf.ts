import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';

/**
 * Generate URDF/XACRO robot model from hardware description.
 */
export async function generateUrdf(
  hw: HardwareDescription,
  options: GenerateOptions,
  templatesDir: string,
): Promise<GeneratedFile[]> {
  const context = {
    robot: hw.robot,
    joints: hw.joints,
    sensors: hw.sensors,
    ros: hw.ros,
  };

  await renderAndWrite(templatesDir, 'urdf/robot.urdf.xacro.ejs', options.outputDir,
    `urdf/${hw.robot.name.replace(/\s+/g, '_').toLowerCase()}.urdf.xacro`, context);

  return [
    { path: `urdf/${hw.robot.name.replace(/\s+/g, '_').toLowerCase()}.urdf.xacro`, content: '' },
  ];
}
