import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { ensureDirectory, loadConfig } from './config.js';
import type { LaunchOptions, LauncherConfig, WorktreeInfo } from './types.js';

export class Launcher {
  private config: LauncherConfig;

  constructor() {
    this.config = loadConfig();
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`${chalk.green(`[${timestamp}]`)} ${message}`);
  }

  private error(message: string): void {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.error(`${chalk.red(`[${timestamp}] ERROR:`)} ${message}`);
  }

  private warn(message: string): void {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.warn(`${chalk.yellow(`[${timestamp}] WARN:`)} ${message}`);
  }

  private async runCommand(
    command: string,
    args: string[],
    options: { cwd?: string } = {},
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: options.cwd || process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, code: code || 0 });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async checkPrerequisites(): Promise<void> {
    const commands = ['git', 'tmux', 'claude'];

    for (const cmd of commands) {
      try {
        await this.runCommand('which', [cmd]);
      } catch {
        throw new Error(`${cmd} is not installed or not in PATH`);
      }
    }
  }

  private getWorktreeInfo(branchName: string, planFile: string): WorktreeInfo {
    return {
      branchName,
      worktreeDir: path.join(this.config.worktreeDir, `${this.config.repoName}_${branchName}`),
      planFile,
      tmuxWindow: branchName,
    };
  }

  private async createWorktree(info: WorktreeInfo): Promise<void> {
    this.log(`Creating worktree for ${info.branchName}...`);

    ensureDirectory(this.config.worktreeDir);

    // Remove existing worktree if it exists
    if (fs.existsSync(info.worktreeDir)) {
      this.warn(`Removing existing worktree: ${info.worktreeDir}`);
      try {
        await this.runCommand('git', ['worktree', 'remove', '--force', info.worktreeDir]);
      } catch {
        // If git worktree remove fails, remove directory manually
        fs.rmSync(info.worktreeDir, { recursive: true, force: true });
      }
    }

    // Create new worktree
    const result = await this.runCommand('git', [
      'worktree',
      'add',
      '-b',
      info.branchName,
      info.worktreeDir,
      'HEAD',
    ]);

    if (result.code !== 0) {
      throw new Error(`Failed to create worktree: ${result.stderr}`);
    }

    // Copy .claude directory
    if (fs.existsSync('.claude')) {
      fs.cpSync('.claude', path.join(info.worktreeDir, '.claude'), { recursive: true });
    }

    // Copy plan file
    fs.copyFileSync(info.planFile, path.join(info.worktreeDir, path.basename(info.planFile)));

    this.log(`Worktree created: ${info.worktreeDir}`);
  }

  private async setupWorktree(info: WorktreeInfo): Promise<void> {
    this.log('Setting up project environment in worktree...');

    const result = await this.runCommand('make', ['setup'], { cwd: info.worktreeDir });

    if (result.code !== 0) {
      this.error('Setup failed. Cleaning up worktree...');
      try {
        await this.runCommand('git', ['worktree', 'remove', '--force', info.worktreeDir]);
        await this.runCommand('git', ['branch', '-D', info.branchName]);
      } catch {
        // Best effort cleanup
      }
      throw new Error(`Setup failed: ${result.stderr}`);
    }
  }

  private createPromptFile(info: WorktreeInfo): void {
    const promptPath = path.join(info.worktreeDir, 'prompt.md');

    if (info.planFile.includes('agent-integration-tester.md')) {
      // Copy the integration tester persona directly as the prompt
      fs.copyFileSync(path.join('hack', 'agent-integration-tester.md'), promptPath);
    } else {
      // Copy the plan file as the prompt for regular agents
      fs.copyFileSync(info.planFile, promptPath);
    }
  }

  private async getNextWindowNumber(): Promise<number> {
    try {
      const result = await this.runCommand('tmux', [
        'list-windows',
        '-t',
        this.config.tmuxSession,
        '-F',
        '#{window_index}',
      ]);

      if (result.code === 0 && result.stdout.trim()) {
        const windowNumbers = result.stdout
          .trim()
          .split('\n')
          .map((n) => Number.parseInt(n, 10));
        return Math.max(...windowNumbers) + 1;
      }
    } catch {
      // Session doesn't exist or has no windows
    }

    return 1; // Start with window 1 (1-based indexing)
  }

  private async createTmuxWindow(info: WorktreeInfo): Promise<void> {
    const sessionExists = await this.runCommand('tmux', [
      'has-session',
      '-t',
      this.config.tmuxSession,
    ]);

    if (sessionExists.code === 0) {
      // Session exists, add new window
      const nextWindow = await this.getNextWindowNumber();
      this.log(
        `Adding new window to existing session: ${this.config.tmuxSession} (window ${nextWindow})`,
      );

      await this.runCommand('tmux', [
        'new-window',
        '-t',
        `${this.config.tmuxSession}:${nextWindow}`,
        '-n',
        info.tmuxWindow,
        '-c',
        info.worktreeDir,
      ]);
    } else {
      // Create new session
      this.log(`Creating new tmux session: ${this.config.tmuxSession}`);

      await this.runCommand('tmux', [
        'new-session',
        '-d',
        '-s',
        this.config.tmuxSession,
        '-n',
        info.tmuxWindow,
        '-c',
        info.worktreeDir,
      ]);
    }
  }

  private async launchClaude(info: WorktreeInfo): Promise<void> {
    const target = `${this.config.tmuxSession}:${info.tmuxWindow}`;

    this.log('Setting up project environment');
    // Environment setup can be customized via Makefile setup target

    this.log(`Starting Claude Code in worktree: ${info.worktreeDir}`);
    await this.runCommand('tmux', ['send-keys', '-t', target, 'claude "$(cat prompt.md)"', 'C-m']);

    // Wait and handle Claude trust prompt
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.runCommand('tmux', ['send-keys', '-t', target, 'C-m']);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.runCommand('tmux', ['send-keys', '-t', target, 'C-m']);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Send Shift+Tab to enable auto-accept edits mode
    await this.runCommand('tmux', ['send-keys', '-t', target, 'S-Tab']);
  }

  async launch(branchName: string, planFile: string, options: LaunchOptions = {}): Promise<void> {
    let sessionName = this.config.tmuxSession; // default fallback
    
    try {
      this.log(`Starting worker: ${branchName} with plan: ${planFile}`);

      await this.checkPrerequisites();

      if (!fs.existsSync(planFile)) {
        throw new Error(`Plan file not found: ${planFile}`);
      }

      const info = this.getWorktreeInfo(branchName, planFile);

      await this.createWorktree(info);
      await this.setupWorktree(info);
      this.createPromptFile(info);
      sessionName = await this.createTmuxWindow(info);
      await this.launchClaude(info, sessionName);

      this.log('✅ Worker launched successfully!');
      console.log();
      console.log(`Session: ${sessionName}`);
      console.log(`Branch: ${branchName}`);
      console.log(`Plan: ${planFile}`);
      console.log(`Worktree: ${info.worktreeDir}`);
      console.log();
      console.log('To attach to the session:');
      console.log(`  tmux attach -t ${sessionName}`);
      console.log();
      console.log('To switch to this window:');
      console.log(`  tmux select-window -t ${sessionName}:${info.tmuxWindow}`);
      console.log();
      console.log('To clean up later:');
      console.log(`  npx promptx cleanup ${branchName}`);
    } catch (error) {
      this.error(`Launch failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}
