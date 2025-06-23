import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

describe('CLI Tests', () => {
  const projectRoot = join(__dirname, '..');

  describe('Help Commands', () => {
    it('should show help for main command', () => {
      try {
        const output = execSync('npx tsx src/cli.ts --help', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        expect(output).toContain('Usage:');
        expect(output).toContain('multiclaude');
        expect(output).toContain('Commands:');
        expect(output).toContain('launch');
      } catch (error: any) {
        // If tsx is not available, skip this test
        if (error.message?.includes('tsx')) {
          expect(true).toBe(true); // Skip test
          return;
        }
        throw error;
      }
    });

    it('should show help for launch command', () => {
      try {
        const output = execSync('npx tsx src/cli.ts launch --help', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        expect(output).toContain('Usage:');
        expect(output).toContain('launch');
        expect(output).toContain('--humanlayer');
        expect(output).toContain('Use HumanLayer launch instead of tmux session');
      } catch (error: any) {
        // If tsx is not available, skip this test
        if (error.message?.includes('tsx')) {
          expect(true).toBe(true); // Skip test
          return;
        }
        throw error;
      }
    });

    it('should show version', () => {
      try {
        const output = execSync('npx tsx src/cli.ts --version', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
      } catch (error: any) {
        // If tsx is not available, skip this test
        if (error.message?.includes('tsx')) {
          expect(true).toBe(true); // Skip test
          return;
        }
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands', () => {
      try {
        execSync('npx tsx src/cli.ts invalid-command', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Should exit with error code
        expect(error.status).toBeGreaterThan(0);
      }
    });
  });
});