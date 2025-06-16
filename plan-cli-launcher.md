# CLI Launcher Commands Implementation Plan

Adopt the persona from hack/agent-developer.md

## What problem(s) am I solving?

Need to replace the shell script-based agent launching system with npm CLI commands that provide better configuration flexibility and can be used from any project directory. Users should be able to run `npx multiclaude launch BRANCH PLAN-FILE.md` and `npx multiclaude cleanup BRANCH` instead of the hack/ shell scripts.

## What user-facing changes will I ship?

- `npx multiclaude launch <branch> <plan-file>` command that replaces the shell script launching system
- `npx multiclaude cleanup <branch>` command that replaces the shell script cleanup system  
- Environment variable support: MULTICLAUDE_WORKTREE_DIR, MULTICLAUDE_TMUX_SESSION, MULTICLAUDE_REPO_NAME
- Configuration file support (.multiclaude/config.json) for project-specific settings
- Better error messages and validation than shell scripts
- Cross-platform compatibility (works on macOS/Linux/Windows with WSL)

## How I will implement it

- **IMPORTANT**: Extend existing CLI framework from scaffold - DO NOT recreate package.json/tsconfig.json
- Add `launch` and `cleanup` subcommands to existing src/cli.ts from scaffold
- Create src/launcher.ts for launch logic (replaces launch_coding_workers.sh functionality) - **NEW FILE**
- Create src/cleanup.ts for cleanup logic (replaces cleanup_coding_workers.sh functionality) - **NEW FILE**
- Create src/config.ts for configuration management - **NEW FILE**
- Use Node.js child_process.spawn() for git, tmux, make commands
- Support environment variable configuration with sensible defaults
- Add .multiclaude/config.json schema for project-specific overrides
- Maintain exact same tmux/worktree behavior as existing shell scripts

## How to verify it

- Test `npx multiclaude launch test-branch plan-test.md` creates worktree and tmux session
- Test `npx multiclaude cleanup test-branch` removes worktree and tmux window
- Verify MULTICLAUDE_WORKTREE_DIR override works (default: ~/.humanlayer/worktrees)
- Verify MULTICLAUDE_TMUX_SESSION override works (default: acp-agents)
- Test config file overrides work (.multiclaude/config.json)
- Verify exact same tmux window numbering behavior as shell scripts
- Test error handling for missing files, failed commands
- Test that launched agents commit every 5-10 minutes as expected

## Key Requirements

### Launch Command (`npx multiclaude launch <branch> <plan-file>`)
- Must exactly match existing shell script launching behavior
- Create git worktree in MULTICLAUDE_WORKTREE_DIR (default: ~/.humanlayer/worktrees)
- Copy .claude/ directory and plan file to worktree
- Run `make setup` in worktree to create isolated cluster
- Create prompt.md file (copy plan directly or use integration-tester logic)
- Add tmux window to MULTICLAUDE_TMUX_SESSION (default: acp-agents) 
- Set KUBECONFIG for isolated cluster
- Launch claude with prompt.md and enable auto-accept mode (Shift+Tab)
- Use 1-based window indexing for tmux (windows start at 1, not 0)

### Cleanup Command (`npx multiclaude cleanup <branch>`)
- Remove git worktree for specified branch
- Kill corresponding tmux window
- Clean up any temporary files
- Provide status reporting of what was cleaned up
- Be idempotent (safe to run multiple times)

### Environment Variables
- MULTICLAUDE_WORKTREE_DIR: Base directory for worktrees (default: ~/.humanlayer/worktrees)
- MULTICLAUDE_TMUX_SESSION: Tmux session name (default: agentcontrolplane-promptx)  
- MULTICLAUDE_REPO_NAME: Repository name prefix (default: $(basename $(pwd)))
- MULTICLAUDE_CONFIG: Path to config file (default: .multiclaude/config.json)

### Configuration File (.multiclaude/config.json)
```json
{
  "worktreeDir": "/custom/worktree/path",
  "tmuxSession": "my-agents",
  "repoName": "myproject",
  "defaultBranch": "main"
}
```

## Files to Create/Modify

- src/cli.ts (extend to add launch/cleanup subcommands) - **MODIFY EXISTING**
- src/launcher.ts (launch command implementation) - **NEW FILE**
- src/cleanup.ts (cleanup command implementation) - **NEW FILE**
- src/config.ts (configuration management) - **NEW FILE**
- src/types.ts (extend with launcher interfaces) - **MODIFY EXISTING**
- package.json (add any launcher-specific dependencies) - **EXTEND EXISTING**
- **DO NOT**: Recreate foundation files from scaffold agent

## Technical Notes

### Launch Process
1. Validate branch name and plan file exist
2. Load configuration from env vars and config file
3. Create worktree directory if needed
4. Remove existing worktree if present (like shell script)
5. Create git worktree with new branch
6. Copy .claude/ and plan file to worktree
7. Run `make setup` in worktree with proper error handling
8. Generate prompt.md based on plan file type
9. Create or attach to tmux session
10. Add new window with correct numbering (1-based)
11. Set KUBECONFIG environment variable
12. Launch claude with auto-accept mode enabled

### Cleanup Process  
1. Find worktree directory for branch
2. Kill tmux window if exists
3. Remove git worktree (force removal)
4. Delete branch if it exists
5. Clean up temporary files
6. Report what was cleaned up

### Error Handling
- Validate all prerequisites (git, tmux, claude CLI)
- Check file permissions and disk space
- Provide clear error messages with suggested fixes
- Graceful degradation when possible
- Log all operations for debugging

### Cross-Platform Support
- Use Node.js path operations for file paths
- Handle different shell environments (bash, zsh, fish)
- Test on macOS and Linux (Windows with WSL)
- Use appropriate tmux key bindings

## Integration with Existing System

- Must work with current .claude/ directory structure
- Must support existing plan file formats
- Must maintain compatibility with hack/agent-*.md personas
- Must work with existing Makefile targets
- Should eventually replace the existing shell script system
- Should integrate with `npx multiclaude init` for complete workflow

## Performance Requirements

- Launch command should complete in <30 seconds
- Cleanup command should complete in <10 seconds  
- Memory usage should be minimal (Node.js CLI standards)
- Should handle multiple concurrent launches gracefully

## Agent Commitment Requirements

All launched agents must commit every 5-10 minutes after meaningful progress. No work >10 minutes without commits.

## Testing Strategy

- Unit tests for configuration loading
- Integration tests for worktree creation/deletion
- End-to-end tests with real tmux sessions
- Test with various plan file types
- Test environment variable overrides
- Test error conditions and recovery