import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';

/**
 * Generate ROS 2 driver package with ros2_control hardware interface.
 */
export async function generateRos2Driver(
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
    }));

  const sensors = hw.sensors.map((s) => ({
    ...s,
    sensorEntry: kb.sensors.get(s.model),
  }));

  const context = {
    robot: hw.robot,
    activeJoints,
    sensors,
    ros: hw.ros,
  };

  // Hardware interface
  await renderAndWrite(templatesDir, 'ros2/hardware_interface.cpp.ejs', options.outputDir,
    'ros2_ws/src/hermod_hardware/src/hardware_interface.cpp', context);

  // Bringup launch
  await renderAndWrite(templatesDir, 'ros2/launch/bringup.launch.py.ejs', options.outputDir,
    'ros2_ws/src/hermod_bringup/launch/bringup.launch.py', context);

  return [
    { path: 'ros2_ws/src/hermod_hardware/src/hardware_interface.cpp', content: '' },
    { path: 'ros2_ws/src/hermod_bringup/launch/bringup.launch.py', content: '' },
  ];
}
