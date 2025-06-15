#!/usr/bin/env node

import { Command } from 'commander';
import { initProject } from './init';
import { Cleanup } from './cleanup.js';
import { Launcher } from './launcher.js';
import type { InitOptions } from './types';

const program = new Command();

program
  .name('promptx')
  .description('AI-powered CLI tool for project scaffolding and development workflow automation')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize agent personas and project structure')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: InitOptions) => {
    await initProject(options);
  });

program
  .command('launch')
  .description('Launch a coding agent with dedicated worktree and cluster')
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
    console.log('promptx v0.1.0');
  });

program.parse();
