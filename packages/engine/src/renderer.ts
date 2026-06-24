import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';
import type { GeneratedFile } from './types';

/**
 * Renders one EJS template and writes the output to disk.
 *
 * Usage:
 *   await renderAndWrite(templateDir, 'firmware/can_config.h.ejs', outputDir,
 *     'firmware/inc/can_config.h', { joints, ... })
 */
export async function renderAndWrite(
  templatesRoot: string,
  templatePath: string,
  outputDir: string,
  outputRelPath: string,
  context: Record<string, unknown>,
): Promise<void> {
  const fullTemplatePath = path.join(templatesRoot, templatePath);
  const fullOutputPath = path.join(outputDir, outputRelPath);

  const rendered = await ejs.renderFile(fullTemplatePath, context, {
    async: false,
    rmWhitespace: true,
  });

  await fs.promises.mkdir(path.dirname(fullOutputPath), { recursive: true });
  await fs.promises.writeFile(fullOutputPath, rendered, 'utf-8');
}

/**
 * Batch-render multiple templates from a list of { template, output } pairs.
 */
export async function renderBatch(
  templatesRoot: string,
  outputDir: string,
  files: { template: string; output: string; context?: Record<string, unknown> }[],
  baseContext: Record<string, unknown>,
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];

  for (const file of files) {
    const mergedContext = { ...baseContext, ...(file.context ?? {}) };
    const rendered = await ejs.renderFile(
      path.join(templatesRoot, file.template),
      mergedContext,
      { async: false, rmWhitespace: true },
    );
    results.push({ path: file.output, content: rendered });
  }

  return results;
}

/**
 * Write multiple GeneratedFiles to disk.
 */
export async function writeFiles(
  outputDir: string,
  files: GeneratedFile[],
): Promise<void> {
  for (const file of files) {
    const fullPath = path.join(outputDir, file.path);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, file.content, 'utf-8');
  }
}
