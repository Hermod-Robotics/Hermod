import path from 'node:path';
import type { HardwareDescription, GenerateOptions, GeneratedFile } from '../types';
import type { KnowledgeContext } from '../validator';
import { generateFirmware } from './firmware';
import { generateUrdf } from './urdf';
import { generateRos2Driver } from './ros2-driver';
import { generateGazebo } from './gazebo';
import { generateBom } from './bom';
import { generateClaudeMd } from './claude-md';
import { generateAnnotationRef } from './annotations';

/**
 * Run all generators against a validated HardwareDescription.
 *
 * @param hw        — Validated hardware description
 * @param options   — Output directory + generation flags
 * @param kb        — Knowledge base context (motors, sensors, MCUs, drivers, batteries)
 * @param templatesDir — Path to the EJS templates directory (repo root: templates/)
 */
export async function generateAll(
  hw: HardwareDescription,
  options: GenerateOptions,
  kb: KnowledgeContext,
  templatesDir: string,
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];

  // ── Firmware ──
  const firmwareFiles = await generateFirmware(hw, options, templatesDir, kb);
  results.push(...firmwareFiles);

  // ── URDF ──
  const urdfFiles = await generateUrdf(hw, options, templatesDir);
  results.push(...urdfFiles);

  // ── ROS 2 Driver ──
  const ros2Files = await generateRos2Driver(hw, options, templatesDir, kb);
  results.push(...ros2Files);

  // ── Simulation ──
  if (options.flags?.sim) {
    const simFiles = await generateGazebo(hw, options, templatesDir);
    results.push(...simFiles);
  }

  // ── BOM ──
  const bomFiles = await generateBom(hw, options, templatesDir, kb);
  results.push(...bomFiles);

  // ── CLAUDE.md ──
  const claudeFiles = await generateClaudeMd(hw, options, templatesDir, kb);
  results.push(...claudeFiles);

  // ── AI Annotation Reference ──
  const annotFiles = await generateAnnotationRef(hw, options, kb);
  results.push(...annotFiles);

  return results;
}
