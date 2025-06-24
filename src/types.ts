export interface InitOptions {
  verbose?: boolean;
  overwrite?: boolean;
  ignoreMissingPrereqs?: boolean;
}

export interface LauncherConfig {
  worktreeDir: string;
  tmuxSession: string;
  repoName: string;
  defaultBranch?: string;
}

export interface LaunchOptions {
  verbose?: boolean;
  debug?: boolean;
  humanlayer?: boolean;
  model?: string;
  maxTurns?: number;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  customInstructions?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
}

export interface CleanupOptions {
  verbose?: boolean;
  debug?: boolean;
}

export interface WorktreeInfo {
  branchName: string;
  worktreeDir: string;
  planFile: string;
  planFileName: string;
  tmuxWindow: string;
}
