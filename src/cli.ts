#!/usr/bin/env node

import { Command } from 'commander';
import { Cleanup } from './cleanup.js';
import { initProject } from './init';
import { Launcher } from './launcher.js';
import type { InitOptions } from './types';

const program = new Command();

program
  .name('multiclaude')
  .description('AI-powered CLI tool for project scaffolding and development workflow automation')
  .version('0.2.1');

program
  .command('init')
  .description('Initialize agent personas and project structure')
  .option('-v, --verbose', 'Verbose output')
  .option('-o, --overwrite', 'Overwrite existing .multiclaude directory')
  .action(async (options: InitOptions) => {
    await initProject(options);
  });

program
  .command('launch')
  .description('Launch a coding agent with dedicated worktree and environment')
  .argument('<branch>', 'Branch name for the agent')
  .argument('<plan-file>', 'Plan file for the agent to execute')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --debug', 'Debug output')
  .action(
    async (branch: string, planFile: string, options: { verbose?: boolean; debug?: boolean }) => {
      const launcher = new Launcher();
      await launcher.launch(branch, planFile, options);
    },
  );

program
  .command('cleanup')
  .description("Clean up a coding agent's worktree, tmux window, and resources")
  .argument('<branch>', 'Branch name to clean up')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --debug', 'Debug output')
  .action(async (branch: string, options: { verbose?: boolean; debug?: boolean }) => {
    const cleanup = new Cleanup();
    await cleanup.cleanup(branch, options);
  });

program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('multiclaude v0.2.1');
  });

program.parse();
