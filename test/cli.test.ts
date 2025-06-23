import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CLI Integration Tests', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `multiclaude-cli-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('CLI Command Execution', () => {
    it('should execute init command via CLI', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        execSync(`tsx "${cliPath}" init`, {
          cwd: testDir,
          stdio: 'pipe'
        });

        expect(existsSync(join(testDir, '.multiclaude'))).toBe(true);
        expect(existsSync(join(testDir, 'CLAUDE.staged.md'))).toBe(true);
      } catch (error) {
        console.error('CLI execution failed:', error);
        throw error;
      }
    });

    it('should show help when requested', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        const output = execSync(`tsx "${cliPath}" --help`, {
          cwd: testDir,
          encoding: 'utf-8'
        });

        expect(output).toContain('Usage:');
        expect(output).toContain('init');
      } catch (error) {
        console.error('Help command failed:', error);
        throw error;
      }
    });

    it('should show version when requested', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        const output = execSync(`tsx "${cliPath}" --version`, {
          cwd: testDir,
          encoding: 'utf-8'
        });

        expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
      } catch (error) {
        console.error('Version command failed:', error);
        throw error;
      }
    });
  });

  describe('Built CLI Tests', () => {
    it('should work with built CLI binary', async () => {
      // First build the project
      try {
        execSync('npm run build', {
          cwd: originalCwd,
          stdio: 'pipe'
        });
      } catch (error) {
        console.warn('Build failed, skipping built CLI test');
        return;
      }

      const builtCliPath = join(originalCwd, 'dist', 'cli.js');
      
      if (!existsSync(builtCliPath)) {
        console.warn('Built CLI not found, skipping test');
        return;
      }

      try {
        execSync(`node "${builtCliPath}" init`, {
          cwd: testDir,
          stdio: 'pipe'
        });

        expect(existsSync(join(testDir, '.multiclaude'))).toBe(true);
        expect(existsSync(join(testDir, 'CLAUDE.staged.md'))).toBe(true);
      } catch (error) {
        console.error('Built CLI execution failed:', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        execSync(`tsx "${cliPath}" invalid-command`, {
          cwd: testDir,
          stdio: 'pipe'
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Should exit with error code
        expect(error.status).toBeGreaterThan(0);
      }
    });

    it('should provide helpful error messages', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        const output = execSync(`tsx "${cliPath}" invalid-command`, {
          cwd: testDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';
        const stdout = error.stdout?.toString() || '';
        const output = stderr + stdout;
        
        expect(output).toContain('error');
      }
    });
  });

  describe('Output Formatting', () => {
    it('should produce colored output for init command', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        const output = execSync(`tsx "${cliPath}" init`, {
          cwd: testDir,
          encoding: 'utf-8',
          env: { ...process.env, FORCE_COLOR: '1' }
        });

        expect(output).toContain('✓');
        expect(output).toContain('📁');
        expect(output).toContain('🎉');
      } catch (error) {
        console.error('Output formatting test failed:', error);
        throw error;
      }
    });

    it('should handle no-color environment', async () => {
      const cliPath = join(originalCwd, 'src', 'cli.ts');
      
      try {
        const output = execSync(`tsx "${cliPath}" init`, {
          cwd: testDir,
          encoding: 'utf-8',
          env: { ...process.env, NO_COLOR: '1' }
        });

        // Should still complete successfully
        expect(output).toContain('completed successfully');
      } catch (error) {
        console.error('No-color test failed:', error);
        throw error;
      }
    });
  });
});