import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import * as os from 'node:os';
import chalk from 'chalk';
import type { InitOptions } from './types';

// Find hack directory - try multiple locations
function findHackDir(): string {
  const candidates = [
    resolve(join(__dirname, '..', 'hack')), // Development (src is in dist, so go up to root then hack)
    resolve(join(process.cwd(), 'hack')), // Development from root
  ];

  // If package is installed, try to find it
  try {
    const packageDir = dirname(require.resolve('multiclaude/package.json'));
    candidates.push(resolve(join(packageDir, 'hack')));
  } catch {
    // Package not installed, that's fine for development
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not find hack directory with agent persona files');
}

const HACK_DIR = findHackDir();

async function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string } = {},
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
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

    child.on('error', () => {
      resolve({ stdout, stderr, code: 1 });
    });
  });
}

async function checkCommand(command: string): Promise<boolean> {
  const result = await runCommand('which', [command]);
  return result.code === 0;
}

function log(message: string): void {
  console.log(`${chalk.green('+')} ${message}`);
}

function warn(message: string): void {
  console.log(`${chalk.yellow('!')} ${message}`);
}

function error(message: string): void {
  console.log(`${chalk.red('-')} ${message}`);
}

function info(message: string): void {
  console.log(`${chalk.blue('*')} ${message}`);
}

async function checkTmuxSession(): Promise<boolean> {
  try {
    const result = await runCommand('tmux', ['display-message', '-p', '#{session_name}']);
    return result.code === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function checkSystemRequirements(): Promise<{ allRequired: boolean; inTmuxSession: boolean }> {
  console.log(`\n${chalk.bold('System Requirements Check')}`);
  
  // Check OS
  const platform = os.platform();
  info(`Platform: ${platform} (${os.arch()})`);
  
  if (platform === 'darwin') {
    log('macOS detected - fully supported');
  } else if (platform === 'linux') {
    log('Linux detected - fully supported');
  } else if (platform === 'win32') {
    warn('Windows detected - may require WSL for best experience');
  }

  // Check prerequisites
  const requirements = [
    { command: 'git', name: 'Git', required: true },
    { command: 'tmux', name: 'tmux', required: true },
    { command: 'claude', name: 'Claude Code CLI', required: true },
  ];

  let allRequired = true;

  for (const req of requirements) {
    const isInstalled = await checkCommand(req.command);
    
    if (isInstalled) {
      log(`${req.name} is installed`);
    } else {
      if (req.required) {
        error(`${req.name} is required but not installed`);
        allRequired = false;
        
        if (req.command === 'tmux') {
          info('  Install: brew install tmux (macOS) or apt-get install tmux (Ubuntu)');
        } else if (req.command === 'claude') {
          info('  Install: https://claude.ai/code - Download Claude Code CLI');
        }
      }
    }
  }

  // Check if we're in a tmux session
  const inTmuxSession = await checkTmuxSession();
  if (inTmuxSession) {
    log('Running inside tmux session');
  } else {
    info('Not in a tmux session');
  }

  return { allRequired, inTmuxSession };
}

async function checkGitRepository(): Promise<boolean> {
  console.log(`\n${chalk.bold('Git Repository Check')}`);
  
  // Check if we're in a git repository
  const gitStatus = await runCommand('git', ['status', '--porcelain']);
  if (gitStatus.code !== 0) {
    error('Not in a git repository');
    info('Run: git init');
    return false;
  }
  
  log('Git repository detected');
  
  // Check git status
  const statusResult = await runCommand('git', ['status', '--short']);
  if (statusResult.stdout.trim()) {
    warn('Working directory has uncommitted changes');
    info('Consider committing changes before using multiclaude');
  } else {
    log('Working directory is clean');
  }
  
  // Check current branch
  const branchResult = await runCommand('git', ['branch', '--show-current']);
  if (branchResult.code === 0) {
    const currentBranch = branchResult.stdout.trim();
    info(`Current branch: ${currentBranch}`);
  }
  
  // List branches
  const allBranchesResult = await runCommand('git', ['branch', '-a']);
  if (allBranchesResult.code === 0) {
    const branches = allBranchesResult.stdout.trim().split('\n').slice(0, 5); // Show first 5
    info(`Available branches: ${branches.map(b => b.trim()).join(', ')}`);
  }

  return true;
}


const CLAUDE_STAGED_TEMPLATE = `# AI Assistant Instructions

**IMPORTANT: Copy or merge this file into your project's CLAUDE.md file to activate agent personas.**

## 🚨 MANDATORY PERSONA SELECTION

**CRITICAL: You MUST adopt one of the specialized personas before proceeding with any work.**

**BEFORE DOING ANYTHING ELSE**, you must read and adopt one of these personas:

1. **Developer Agent** - Read \`.multiclaude/personas/agent-developer.md\` - For coding, debugging, and implementation tasks
2. **Code Reviewer Agent** - Read \`.multiclaude/personas/agent-code-reviewer.md\` - For reviewing code changes and quality assurance
3. **Rebaser Agent** - Read \`.multiclaude/personas/agent-rebaser.md\` - For cleaning git history and rebasing changes
4. **Merger Agent** - Read \`.multiclaude/personas/agent-merger.md\` - For merging code across branches
5. **Multiplan Manager Agent** - Read \`.multiclaude/personas/agent-multiplan-manager.md\` - For orchestrating parallel work and creating plans

**DO NOT PROCEED WITHOUT SELECTING A PERSONA.** Each persona has specific rules, workflows, and tools that you MUST follow exactly.

## How to Choose Your Persona

- **Asked to write code, fix bugs, or implement features?** → Use Developer Agent
- **Asked to review code changes?** → Use Code Reviewer Agent  
- **Asked to clean git history or rebase changes?** → Use Rebaser Agent
- **Asked to merge branches or consolidate work?** → Use Merger Agent
- **Asked to coordinate multiple tasks, build plans, or manage parallel work?** → Use Multiplan Manager Agent

## Project Context

[CUSTOMIZE THIS SECTION FOR YOUR PROJECT]

This project uses:
- **Language/Framework**: [Add your stack here]
- **Build Tool**: [Add your build commands]
- **Testing**: [Add your test commands]  
- **Architecture**: [Describe your project structure]

## Core Principles (All Personas)

1. **READ FIRST**: Always read at least 1500 lines to understand context fully
2. **DELETE MORE THAN YOU ADD**: Complexity compounds into disasters
3. **FOLLOW EXISTING PATTERNS**: Don't invent new approaches
4. **BUILD AND TEST**: Run your build and test commands after changes
5. **COMMIT FREQUENTLY**: Every 5-10 minutes for meaningful progress

## File Structure Reference

[CUSTOMIZE THIS SECTION FOR YOUR PROJECT]

\`\`\`
./
├── package.json          # [or your dependency file]
├── src/                  # [your source directory]
│   ├── [your modules]
│   └── [your files]
├── test/                 # [your test directory]
├── .multiclaude/         # Agent personas (created by multiclaude init)
│   └── personas/
└── CLAUDE.md            # This file (after merging)
\`\`\`

## Common Commands (All Personas)

[CUSTOMIZE THIS SECTION FOR YOUR PROJECT]

\`\`\`bash
# Build project
[your build command]

# Run tests  
[your test command]

# Lint code
[your lint command]

# Deploy locally
[your deploy command]
\`\`\`

## CRITICAL REMINDER

**You CANNOT proceed without adopting a persona.** Each persona has:
- Specific workflows and rules
- Required tools and commands  
- Success criteria and verification steps
- Commit and progress requirements

**Choose your persona now and follow its instructions exactly.**

---

*Generated by multiclaude - Agent personas are in .multiclaude/personas/*
`;

const MAKEFILE_TEMPLATE = `# Makefile for launch compatibility
.PHONY: setup teardown

setup:
	@echo "Setting up project..."
  # TODO: Add install command here
	# @npm install || bun install || yarn install
	@echo "Setup complete!"

teardown:
	@echo "Tearing down project..."
  # TODO: Add teardown command here
	# @rm -rf node_modules
	@echo "Teardown complete!"
`;

export async function initProject(options: InitOptions = {}): Promise<void> {
  console.log(`${chalk.bold.blue('Welcome to multiclaude')}`);
  console.log('Checking system and setting up project...\n');

  // Run onboarding checks first
  const systemCheck = await checkSystemRequirements();
  const gitOk = await checkGitRepository();

  if (!systemCheck.allRequired || !gitOk) {
    console.log(`\n${chalk.bold.red('Setup Issues Detected')}`);
    if (!systemCheck.allRequired) {
      error('Please install missing prerequisites before continuing');
    }
    if (!gitOk) {
      error('Please set up git repository before continuing');
    }
    console.log(`\n${chalk.blue('*')} Run ${chalk.cyan('npx multiclaude init')} again after resolving these issues.`);
    process.exit(1);
  }

  console.log(`\n${chalk.bold.green('System ready! Initializing multiclaude...')}`);

  const cwd = process.cwd();
  const multiclaudeDir = join(cwd, '.multiclaude');
  const personasDir = join(multiclaudeDir, 'personas');
  const claudeStagedPath = join(cwd, 'CLAUDE.staged.md');
  const makefilePath = join(cwd, 'Makefile');

  try {
    // Check if .multiclaude already exists
    if (existsSync(multiclaudeDir)) {
      if (!options.overwrite) {
        console.log(chalk.red('- .multiclaude directory already exists'));
        console.log(chalk.blue('* Use --overwrite flag to overwrite existing directory'));
        console.log(chalk.gray('  Example: npx multiclaude init --overwrite'));
        process.exit(1);
      }
      console.log(chalk.yellow('! .multiclaude directory exists, overwriting...'));
    }

    // Create directories
    console.log(chalk.blue('Creating .multiclaude/personas/ directory...'));
    mkdirSync(personasDir, { recursive: true });

    // Copy persona files
    const personaFiles = [
      'agent-developer.md',
      'agent-code-reviewer.md',
      'agent-merger.md',
      'agent-multiplan-manager.md',
      'agent-rebaser.md',
    ];

    let copiedCount = 0;
    for (const file of personaFiles) {
      const sourcePath = join(HACK_DIR, file);
      const destPath = join(personasDir, file);

      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        copiedCount++;
        console.log(chalk.green(`+ .multiclaude/personas/${file}`));
      } else {
        console.log(chalk.yellow(`! Skipped ${file} (not found)`));
      }
    }

    // Generate CLAUDE.staged.md
    console.log(chalk.blue('Generating CLAUDE.staged.md...'));
    writeFileSync(claudeStagedPath, CLAUDE_STAGED_TEMPLATE);
    console.log(chalk.green('+ Created CLAUDE.staged.md'));

    // Create/update Makefile if needed
    if (!existsSync(makefilePath)) {
      console.log(chalk.blue('Creating Makefile with setup/teardown targets...'));
      writeFileSync(makefilePath, MAKEFILE_TEMPLATE);
      console.log(chalk.green('+ Created Makefile'));
    } else {
      // Check if Makefile has required targets
      const makefileContent = readFileSync(makefilePath, 'utf-8');
      const hasSetup = makefileContent.includes('setup:');
      const hasTeardown = makefileContent.includes('teardown:');

      if (!hasSetup || !hasTeardown) {
        console.log(chalk.yellow('! Makefile exists but missing setup/teardown targets'));
        console.log(chalk.blue('* Please add these targets for launch compatibility'));
      }
    }

    // Success message
    console.log(chalk.green('\nMulticlaude init completed successfully!'));
    
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.white('  1. Review CLAUDE.staged.md'));
    console.log(chalk.white('  2. Copy/merge CLAUDE.staged.md into CLAUDE.md'));
    console.log(chalk.white('  3. Customize project context in CLAUDE.md'));
    console.log(chalk.white('  4. Customize project and toolchain context in .multiclaude/personas/*.md'));
    
    let stepNumber = 5;
    if (!systemCheck.inTmuxSession) {
      console.log(chalk.white(`  ${stepNumber}. Attach to a tmux session or launch a new one`));
      console.log(chalk.gray('     tmux new-session or tmux attach'));
      stepNumber++;
    }
    
    console.log(chalk.white(`  ${stepNumber}. Launch Claude Code CLI and adopt the manager persona`));
    console.log(chalk.gray('\nAgent personas are ready in .multiclaude/personas/'));
    
    console.log(chalk.blue('\nCustomization tips:'));
    console.log(chalk.white('  - Replace [CUSTOMIZE THIS SECTION FOR YOUR PROJECT] placeholders'));
    console.log(chalk.white('  - Update build commands (make check, make test) for your toolchain'));
    console.log(chalk.white('  - Add project-specific file patterns and directories'));
    console.log(chalk.white('  - Include relevant tech stack and framework information'));
    
    console.log(chalk.blue('\nUsage:'));
    console.log(chalk.white('Launch Claude Code CLI and instruct it to adopt the manager persona,'));
    console.log(chalk.white('then point it at your next project or feature spec to get started,'));
    console.log(chalk.white('or just explain what you want to build.'));
  } catch (error) {
    console.error(chalk.red('- Error during initialization:'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    } else {
      console.error(chalk.red(String(error)));
    }
    process.exit(1);
  }
}
