import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { LauncherConfig } from './types.js';

export function loadConfig(): LauncherConfig {
  const repoName = process.env.MULTICLAUDE_REPO_NAME || path.basename(process.cwd());

  const defaultConfig: LauncherConfig = {
    worktreeDir: path.join(os.homedir(), '.humanlayer', 'worktrees'),
    tmuxSession: `${repoName}-agents`,
    repoName: repoName,
    defaultBranch: 'main',
  };

  // Override with environment variables
  const config: LauncherConfig = {
    worktreeDir: process.env.MULTICLAUDE_WORKTREE_DIR || defaultConfig.worktreeDir,
    tmuxSession: process.env.MULTICLAUDE_TMUX_SESSION || defaultConfig.tmuxSession,
    repoName: repoName,
    defaultBranch: defaultConfig.defaultBranch,
  };

  // Override with config file if it exists
  const configPath = process.env.MULTICLAUDE_CONFIG || '.multiclaude/config.json';

  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (fileConfig.worktreeDir) config.worktreeDir = fileConfig.worktreeDir;
      if (fileConfig.tmuxSession) config.tmuxSession = fileConfig.tmuxSession;
      if (fileConfig.repoName) config.repoName = fileConfig.repoName;
      if (fileConfig.defaultBranch) config.defaultBranch = fileConfig.defaultBranch;
    } catch (error) {
      console.warn(`Warning: Failed to parse config file ${configPath}:`, error);
    }
  }

  return config;
}

export function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
