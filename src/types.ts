export interface InitOptions {
  verbose?: boolean;
  overwrite?: boolean;
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
}

export interface CleanupOptions {
  verbose?: boolean;
  debug?: boolean;
}

export interface WorktreeInfo {
  branchName: string;
  worktreeDir: string;
  planFile: string;
  tmuxWindow: string;
}
