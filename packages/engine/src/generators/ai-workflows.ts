import { renderAndWrite } from '../renderer';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';

/**
 * Generate AI agent workflow files (.ai-workflows/).
 *
 * These files are task-specific guides for AI agents (Claude Code, Cursor, Copilot).
 * Each workflow describes the steps, safety constraints, and context
 * an AI agent needs to perform a specific robotics task.
 */
export async function generateAiWorkflows(
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

  const context = {
    robot: hw.robot,
    activeJoints,
    sensors: hw.sensors.map((s) => ({ ...s, sensorEntry: kb.sensors.get(s.model) })),
    ros: hw.ros,
  };

  await renderAndWrite(templatesDir, 'ai-workflows/add-sensor.md.ejs', options.outputDir,
    '.ai-workflows/add-sensor.md', context);

  await renderAndWrite(templatesDir, 'ai-workflows/tune-pid.md.ejs', options.outputDir,
    '.ai-workflows/tune-pid.md', context);

  await renderAndWrite(templatesDir, 'ai-workflows/diagnose.md.ejs', options.outputDir,
    '.ai-workflows/diagnose.md', context);

  return [
    { path: '.ai-workflows/add-sensor.md', content: '' },
    { path: '.ai-workflows/tune-pid.md', content: '' },
    { path: '.ai-workflows/diagnose.md', content: '' },
  ];
}
