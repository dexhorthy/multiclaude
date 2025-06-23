import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

export interface TestDirectory {
  path: string;
  cleanup: () => void;
}

/**
 * Creates a temporary test directory with automatic cleanup
 */
export function createTestDirectory(): TestDirectory {
  const testDir = join(tmpdir(), `multiclaude-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  mkdirSync(testDir, { recursive: true });

  return {
    path: testDir,
    cleanup: () => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    }
  };
}

/**
 * Executes a command and captures both stdout and stderr
 */
export function execCommand(command: string, options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      ...options
    });
    return { success: true, output, error: null };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout?.toString() || '',
      error: error.stderr?.toString() || error.message
    };
  }
}

/**
 * Verifies that all expected persona files exist and have content
 */
export function verifyPersonaFiles(personasDir: string): void {
  const expectedFiles = [
    'agent-developer.md',
    'agent-code-reviewer.md',
    'agent-merger.md',
    'agent-multiplan-manager.md',
    'agent-rebaser.md'
  ];

  for (const file of expectedFiles) {
    const filePath = join(personasDir, file);
    if (!existsSync(filePath)) {
      throw new Error(`Expected persona file not found: ${file}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    if (content.length < 100) {
      throw new Error(`Persona file ${file} appears to be empty or too short`);
    }

    if (!content.includes('#')) {
      throw new Error(`Persona file ${file} doesn't appear to be markdown`);
    }
  }
}

/**
 * Verifies CLAUDE.staged.md has the expected structure and content
 */
export function verifyCLAUDEStagedFile(claudePath: string): void {
  if (!existsSync(claudePath)) {
    throw new Error('CLAUDE.staged.md file not found');
  }

  const content = readFileSync(claudePath, 'utf-8');

  const requiredSections = [
    'MANDATORY PERSONA SELECTION',
    'How to Choose Your Persona',
    'Project Context',
    'Core Principles',
    'File Structure Reference',
    'Common Commands',
    'CRITICAL REMINDER'
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      throw new Error(`Required section missing from CLAUDE.staged.md: ${section}`);
    }
  }

  const requiredPersonaReferences = [
    'agent-developer.md',
    'agent-code-reviewer.md',
    'agent-merger.md',
    'agent-multiplan-manager.md',
    'agent-rebaser.md'
  ];

  for (const persona of requiredPersonaReferences) {
    if (!content.includes(persona)) {
      throw new Error(`Persona reference missing from CLAUDE.staged.md: ${persona}`);
    }
  }
}

/**
 * Verifies Makefile has required targets
 */
export function verifyMakefile(makefilePath: string): void {
  if (!existsSync(makefilePath)) {
    throw new Error('Makefile not found');
  }

  const content = readFileSync(makefilePath, 'utf-8');

  if (!content.includes('setup:')) {
    throw new Error('Makefile missing setup target');
  }

  if (!content.includes('teardown:')) {
    throw new Error('Makefile missing teardown target');
  }

  if (!content.includes('.PHONY:')) {
    throw new Error('Makefile missing .PHONY declaration');
  }
}

/**
 * Creates a mock project structure for testing
 */
export function createMockProject(testDir: string, options: {
  hasPackageJson?: boolean;
  hasExistingMakefile?: boolean;
  hasExistingMulticlaude?: boolean;
} = {}): void {
  if (options.hasPackageJson) {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        build: 'echo "building..."',
        test: 'echo "testing..."'
      }
    };
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  if (options.hasExistingMakefile) {
    const makefile = `# Existing Makefile
all:
\techo "existing target"

build:
\techo "building..."
`;
    writeFileSync(join(testDir, 'Makefile'), makefile);
  }

  if (options.hasExistingMulticlaude) {
    mkdirSync(join(testDir, '.multiclaude', 'personas'), { recursive: true });
    writeFileSync(join(testDir, '.multiclaude', 'test.txt'), 'existing file');
  }
}

/**
 * Captures console output during function execution
 */
export async function captureConsoleOutput<T>(
  fn: () => Promise<T>
): Promise<{ result: T; logs: string[]; errors: string[] }> {
  const logs: string[] = [];
  const errors: string[] = [];

  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    logs.push(args.join(' '));
  };

  console.error = (...args) => {
    errors.push(args.join(' '));
  };

  try {
    const result = await fn();
    return { result, logs, errors };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

/**
 * Suppresses console output during function execution
 */
export async function suppressConsoleOutput<T>(fn: () => Promise<T>): Promise<T> {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = () => {}; // Blackhole console.log
  console.error = () => {}; // Blackhole console.error

  try {
    return await fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

/**
 * Validates that a directory structure matches expected layout
 */
export function validateDirectoryStructure(basePath: string, expectedStructure: {
  files?: string[];
  directories?: string[];
}): void {
  if (expectedStructure.files) {
    for (const file of expectedStructure.files) {
      const filePath = join(basePath, file);
      if (!existsSync(filePath)) {
        throw new Error(`Expected file not found: ${file}`);
      }
    }
  }

  if (expectedStructure.directories) {
    for (const dir of expectedStructure.directories) {
      const dirPath = join(basePath, dir);
      if (!existsSync(dirPath)) {
        throw new Error(`Expected directory not found: ${dir}`);
      }
    }
  }
}

/**
 * Simulates different file system conditions for testing
 */
export function simulateFileSystemConditions(testDir: string, condition: 'readonly' | 'full-disk' | 'permissions'): void {
  // Note: These are simplified simulations for testing purposes
  // In a real environment, you'd need platform-specific implementations
  
  switch (condition) {
    case 'readonly':
      // Create a read-only file to test error handling
      writeFileSync(join(testDir, 'readonly.txt'), 'readonly content');
      break;
    case 'full-disk':
      // This would require more complex simulation in real scenarios
      break;
    case 'permissions':
      // This would require platform-specific permission modifications
      break;
  }
}

/**
 * Measures execution time of a function
 */
export async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = Date.now();
  const result = await fn();
  const timeMs = Date.now() - start;
  return { result, timeMs };
}

/**
 * Compares two files for exact content match
 */
export function compareFiles(file1: string, file2: string): boolean {
  if (!existsSync(file1) || !existsSync(file2)) {
    return false;
  }

  const content1 = readFileSync(file1, 'utf-8');
  const content2 = readFileSync(file2, 'utf-8');

  return content1 === content2;
}

/**
 * Creates a minimal package.json for testing npm/npx functionality
 */
export function createTestPackageJson(testDir: string, name: string = 'test-package'): void {
  const packageJson = {
    name,
    version: '1.0.0',
    bin: {
      [name]: './dist/cli.js'
    },
    files: ['dist', 'hack'],
    dependencies: {
      chalk: 'latest',
      commander: 'latest'
    }
  };

  writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
}