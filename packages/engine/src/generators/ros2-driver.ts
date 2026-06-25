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

  const robotName = hw.robot.name.replace(/\s+/g, '_').toLowerCase();
  const rosNs = hw.ros?.namespace ?? 'hermod_robot';
  const pkgName = rosNs.replace(/-/g, '_');

  const context = {
    robot: hw.robot,
    activeJoints,
    sensors,
    ros: hw.ros,
    robotName,
    rosNs,
    pkgName,
  };

  // Hardware interface (real robot)
  await renderAndWrite(templatesDir, 'ros2/hardware_interface.cpp.ejs', options.outputDir,
    'ros2_ws/src/hermod_hardware/src/hardware_interface.cpp', context);

  // Bringup launch (real robot)
  await renderAndWrite(templatesDir, 'ros2/launch/bringup.launch.py.ejs', options.outputDir,
    'ros2_ws/src/hermod_bringup/launch/bringup.launch.py', context);

  const files: GeneratedFile[] = [
    { path: 'ros2_ws/src/hermod_hardware/src/hardware_interface.cpp', content: '' },
    { path: 'ros2_ws/src/hermod_bringup/launch/bringup.launch.py', content: '' },
  ];

  // Simulation launch
  if (options.flags?.sim) {
    await renderAndWrite(templatesDir, 'ros2/launch/sim.launch.py.ejs', options.outputDir,
      'ros2_ws/src/hermod_bringup/launch/sim.launch.py', context);
    files.push({ path: 'ros2_ws/src/hermod_bringup/launch/sim.launch.py', content: '' });
  }

  return files;
}
