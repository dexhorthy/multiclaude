import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { loadConfig } from './config.js';
import type { CleanupOptions, LauncherConfig } from './types.js';

export class Cleanup {
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

  private info(message: string): void {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`${chalk.blue(`[${timestamp}] INFO:`)} ${message}`);
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

  private async findWindowInAllSessions(
    windowName: string,
  ): Promise<{ session: string; window: string } | null> {
    try {
      // List all sessions
      const sessionsResult = await this.runCommand('tmux', [
        'list-sessions',
        '-F',
        '#{session_name}',
      ]);

      if (sessionsResult.code !== 0) {
        return null;
      }

      const sessions = sessionsResult.stdout
        .trim()
        .split('\n')
        .filter((s) => s.length > 0);

      for (const session of sessions) {
        const windowsResult = await this.runCommand('tmux', [
          'list-windows',
          '-t',
          session,
          '-F',
          '#{window_name}',
        ]);

        if (windowsResult.code === 0 && windowsResult.stdout.includes(windowName)) {
          return { session, window: windowName };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async killTmuxWindow(windowName: string): Promise<void> {
    try {
      // Find the window in any session
      const windowLocation = await this.findWindowInAllSessions(windowName);

      if (windowLocation) {
        this.log(`Killing tmux window: ${windowLocation.session}:${windowLocation.window}`);
        await this.runCommand('tmux', [
          'kill-window',
          '-t',
          `${windowLocation.session}:${windowLocation.window}`,
        ]);
      } else {
        this.info(`Tmux window not found: ${windowName}`);
      }
    } catch (error) {
      this.warn(
        `Failed to kill tmux window: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async removeWorktree(branchName: string): Promise<void> {
    const worktreeDir = path.join(this.config.worktreeDir, `${this.config.repoName}_${branchName}`);

    if (!fs.existsSync(worktreeDir)) {
      this.info(`Worktree not found: ${worktreeDir}`);
      return;
    }

    try {
      this.log(`Removing worktree: ${worktreeDir}`);

      // Fix permissions before removing worktree
      this.log('Fixing permissions for worktree removal');
      try {
        const chmodResult = await this.runCommand('chmod', ['-R', '755', worktreeDir]);
        if (chmodResult.code !== 0) {
          this.warn(`Failed to fix permissions for ${worktreeDir}`);
        }
      } catch {
        this.warn(`Failed to fix permissions for ${worktreeDir}`);
      }

      // Remove worktree
      const removeResult = await this.runCommand('git', [
        'worktree',
        'remove',
        '--force',
        worktreeDir,
      ]);

      if (removeResult.code !== 0) {
        this.warn('Failed to remove worktree with git, removing directory manually');
        fs.rmSync(worktreeDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.warn(
        `Failed to remove worktree: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Try manual removal as fallback
      try {
        fs.rmSync(worktreeDir, { recursive: true, force: true });
      } catch {
        this.error(`Failed to manually remove worktree directory: ${worktreeDir}`);
      }
    }
  }

  private async deleteBranch(branchName: string): Promise<void> {
    try {
      // Check if branch exists
      const branchExists = await this.runCommand('git', [
        'show-ref',
        '--verify',
        '--quiet',
        `refs/heads/${branchName}`,
      ]);

      if (branchExists.code === 0) {
        this.log(`Deleting branch: ${branchName}`);
        const deleteResult = await this.runCommand('git', ['branch', '-D', branchName]);

        if (deleteResult.code !== 0) {
          this.warn(`Failed to delete branch: ${branchName}`);
        }
      } else {
        this.info(`Branch not found: ${branchName}`);
      }
    } catch (error) {
      this.warn(
        `Failed to delete branch: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async pruneWorktrees(): Promise<void> {
    try {
      this.log('Pruning git worktree list...');
      await this.runCommand('git', ['worktree', 'prune']);
    } catch (error) {
      this.warn(
        `Failed to prune worktrees: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async showRemainingResources(): Promise<void> {
    console.log();
    this.info('=== REMAINING RESOURCES ===');

    console.log();
    this.info('📺 Tmux sessions and windows:');

    try {
      const sessionsResult = await this.runCommand('tmux', ['list-sessions']);

      if (sessionsResult.code === 0 && sessionsResult.stdout.trim()) {
        console.log(sessionsResult.stdout.trim());

        // Show windows in our session if it exists
        const sessionExists = await this.runCommand('tmux', [
          'has-session',
          '-t',
          this.config.tmuxSession,
        ]);

        if (sessionExists.code === 0) {
          console.log();
          this.info(`Windows in ${this.config.tmuxSession} session:`);

          const windowsResult = await this.runCommand('tmux', [
            'list-windows',
            '-t',
            this.config.tmuxSession,
            '-F',
            '  #{window_index}: #{window_name}',
          ]);

          if (windowsResult.code === 0 && windowsResult.stdout.trim()) {
            console.log(windowsResult.stdout.trim());
          } else {
            console.log('  No windows found');
          }
        }
      } else {
        console.log('No tmux sessions found');
      }
    } catch {
      console.log('No tmux sessions found');
    }

    console.log();
    this.info('🌲 Git worktrees:');

    try {
      const worktreesResult = await this.runCommand('git', ['worktree', 'list']);

      if (worktreesResult.code === 0 && worktreesResult.stdout.trim()) {
        const filteredWorktrees = worktreesResult.stdout
          .split('\n')
          .filter((line) => line.includes('agentcontrolplane_') || line.includes('integration-'))
          .join('\n');

        if (filteredWorktrees.trim()) {
          console.log(filteredWorktrees);
        } else {
          console.log('No relevant worktrees found');
        }
      } else {
        console.log('No relevant worktrees found');
      }
    } catch {
      console.log('No relevant worktrees found');
    }

    console.log();
  }

  private async removeMulticlaudeDirectory(): Promise<void> {
    const multiclaudeDir = path.join(process.cwd(), '.multiclaude');
    
    if (fs.existsSync(multiclaudeDir)) {
      try {
        this.log(`Removing .multiclaude directory: ${multiclaudeDir}`);
        fs.rmSync(multiclaudeDir, { recursive: true, force: true });
      } catch (error) {
        this.warn(`Failed to remove .multiclaude directory: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      this.info('.multiclaude directory not found');
    }
  }

  private async removeStagedFiles(): Promise<void> {
    try {
      this.log('Removing staged files...');
      
      // Check if we're in a git repository
      const gitCheck = await this.runCommand('git', ['rev-parse', '--git-dir']);
      if (gitCheck.code !== 0) {
        this.info('Not a git repository, skipping staged file cleanup');
        return;
      }

      // Reset staged files
      const resetResult = await this.runCommand('git', ['reset', 'HEAD']);
      if (resetResult.code === 0) {
        this.log('Successfully unstaged all files');
      } else {
        this.warn('Failed to unstage files');
      }

      // Remove untracked files that match common patterns
      const patterns = ['*.staged.md', 'CLAUDE.staged.md'];
      for (const pattern of patterns) {
        try {
          const findResult = await this.runCommand('find', ['.', '-name', pattern, '-type', 'f']);
          if (findResult.code === 0 && findResult.stdout.trim()) {
            const files = findResult.stdout.trim().split('\n');
            for (const file of files) {
              try {
                fs.unlinkSync(file);
                this.log(`Removed staged file: ${file}`);
              } catch {
                this.warn(`Failed to remove staged file: ${file}`);
              }
            }
          }
        } catch {
          // Ignore errors from find command
        }
      }
    } catch (error) {
      this.warn(`Failed to clean staged files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async listWorktreesToDelete(): Promise<{ path: string; branch: string }[]> {
    try {
      // List all worktrees
      const worktreesResult = await this.runCommand('git', ['worktree', 'list', '--porcelain']);
      if (worktreesResult.code !== 0) {
        return [];
      }

      const worktrees = worktreesResult.stdout.trim().split('\n\n');
      const agentWorktrees = worktrees.filter(worktree => 
        worktree.includes(`${this.config.repoName}_`) || 
        worktree.includes('integration-') ||
        worktree.includes('agentcontrolplane_')
      );

      const toDelete: { path: string; branch: string }[] = [];
      for (const worktree of agentWorktrees) {
        const worktreePath = worktree.split('\n')[0].replace('worktree ', '');
        const branchMatch = worktree.match(/branch refs\/heads\/(.+)/);
        const branchName = branchMatch ? branchMatch[1] : path.basename(worktreePath);
        
        if (worktreePath && worktreePath !== process.cwd()) {
          toDelete.push({ path: worktreePath, branch: branchName });
        }
      }

      return toDelete;
    } catch (error) {
      this.warn(`Failed to list worktrees: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async listTmuxWindowsToKill(): Promise<{ session: string; window: string }[]> {
    try {
      // List all sessions
      const sessionsResult = await this.runCommand('tmux', ['list-sessions', '-F', '#{session_name}']);
      if (sessionsResult.code !== 0) {
        return [];
      }

      const sessions = sessionsResult.stdout.trim().split('\n').filter(s => s.length > 0);
      const toKill: { session: string; window: string }[] = [];
      
      for (const session of sessions) {
        const windowsResult = await this.runCommand('tmux', [
          'list-windows', '-t', session, '-F', '#{window_name}'
        ]);
        
        if (windowsResult.code === 0) {
          const windows = windowsResult.stdout.trim().split('\n').filter(w => w.length > 0);
          const agentWindows = windows.filter(window => 
            window.includes('integration-') || 
            window.includes('agent-') ||
            window.match(/^[a-f0-9-]{8,}$/) // UUID-like patterns
          );
          
          for (const window of agentWindows) {
            toKill.push({ session, window });
          }
        }
      }

      return toKill;
    } catch (error) {
      this.warn(`Failed to list tmux windows: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async promptForConfirmation(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`${message} (y/N): `, (answer: string) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  private async cleanAllWorktrees(): Promise<void> {
    try {
      const worktreesToDelete = await this.listWorktreesToDelete();
      
      if (worktreesToDelete.length === 0) {
        this.info('No agent worktrees found to delete');
        return;
      }

      console.log('\n📁 The following worktrees will be deleted:');
      for (const worktree of worktreesToDelete) {
        console.log(`  - ${worktree.path} (branch: ${worktree.branch})`);
      }

      const confirmed = await this.promptForConfirmation('\nDelete these worktrees?');
      if (!confirmed) {
        this.info('Skipping worktree cleanup');
        return;
      }

      this.log('Cleaning agent worktrees...');
      
      for (const worktree of worktreesToDelete) {
        await this.removeWorktree(worktree.branch);
        await this.deleteBranch(worktree.branch);
      }

      await this.pruneWorktrees();
    } catch (error) {
      this.warn(`Failed to clean worktrees: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async killAllAgentTmuxWindows(): Promise<void> {
    try {
      const windowsToKill = await this.listTmuxWindowsToKill();
      
      if (windowsToKill.length === 0) {
        this.info('No agent tmux windows found to kill');
        return;
      }

      console.log('\n🖥️  The following tmux windows will be killed:');
      for (const window of windowsToKill) {
        console.log(`  - ${window.session}:${window.window}`);
      }

      const confirmed = await this.promptForConfirmation('\nKill these tmux windows?');
      if (!confirmed) {
        this.info('Skipping tmux window cleanup');
        return;
      }

      this.log('Killing agent tmux windows...');
      
      for (const window of windowsToKill) {
        await this.killTmuxWindow(window.window);
      }
    } catch (error) {
      this.warn(`Failed to kill tmux windows: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async reset(options: CleanupOptions = {}): Promise<void> {
    try {
      this.log('🧹 Starting full reset and cleanup...');

      await this.removeMulticlaudeDirectory();
      await this.removeStagedFiles();
      await this.cleanAllWorktrees();
      await this.killAllAgentTmuxWindows();

      this.log('✅ Reset completed successfully!');
      
      await this.showRemainingResources();
    } catch (error) {
      this.error(`Reset failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  async cleanup(branchName: string, options: CleanupOptions = {}): Promise<void> {
    try {
      this.log(`Cleaning up worker: ${branchName} (branch: ${branchName})`);

      await this.killTmuxWindow(branchName);
      await this.removeWorktree(branchName);
      await this.deleteBranch(branchName);
      await this.pruneWorktrees();

      this.log('✅ Cleanup completed successfully!');

      await this.showRemainingResources();
    } catch (error) {
      this.error(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}
