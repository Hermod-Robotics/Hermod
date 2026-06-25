#!/usr/bin/env node
/**
 * Hermod CLI — AI-native robot project scaffolding.
 *
 * Usage:
 *   npx create-hermod my-robot
 *   npx create-hermod my-robot --template diff_drive
 *   npx create-hermod --list-templates
 */
import { Command } from 'commander';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCommand } from './commands/create';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const program = new Command();

program
  .name('create-hermod')
  .description('Scaffold a robot engineering project with AI-native context')
  .version('0.1.0')
  .argument('[project-name]', 'Name of your robot project')
  .option('-t, --template <type>', 'Robot type: diff_drive, arm_6dof, ackermann, quadruped, custom')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .action(async (name, options) => {
    await createCommand(name, options, REPO_ROOT);
  });

program.parse();
