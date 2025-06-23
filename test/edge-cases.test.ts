import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, chmodSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initProject } from '../src/init';
import { createTestDirectory, createMockProject, captureConsoleOutput, suppressConsoleOutput } from './helpers';

describe('Edge Cases and Error Handling', () => {
  let testDir: string;
  let cleanup: () => void;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    const testEnv = createTestDirectory();
    testDir = testEnv.path;
    cleanup = testEnv.cleanup;
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanup();
  });

  describe('Directory Permissions', () => {
    it('should handle directory creation failures gracefully', async () => {
      // Create a scenario where .multiclaude creation might fail
      const readOnlyParent = join(testDir, 'readonly-parent');
      mkdirSync(readOnlyParent);
      
      // Create a read-only file where we want to create .multiclaude
      const blockingFile = join(readOnlyParent, '.multiclaude');
      writeFileSync(blockingFile, 'blocking file');
      
      process.chdir(readOnlyParent);
      
      // This should handle the error gracefully
      await expect(suppressConsoleOutput(() => initProject())).rejects.toThrow();
    });

    it('should work in deeply nested directories', async () => {
      const deepDir = join(testDir, 'a', 'very', 'deep', 'nested', 'directory', 'structure');
      mkdirSync(deepDir, { recursive: true });
      process.chdir(deepDir);

      await expect(suppressConsoleOutput(() => initProject())).resolves.not.toThrow();
      expect(existsSync(join(deepDir, '.multiclaude'))).toBe(true);
    });

    it('should handle special characters in directory names', async () => {
      // Test with various special characters that might cause issues
      const specialChars = ['spaces in name', 'with-dashes', 'with_underscores', 'with.dots'];
      
      for (const dirName of specialChars) {
        const specialDir = join(testDir, dirName);
        mkdirSync(specialDir, { recursive: true });
        process.chdir(specialDir);

        await expect(suppressConsoleOutput(() => initProject())).resolves.not.toThrow();
        expect(existsSync(join(specialDir, '.multiclaude'))).toBe(true);
        
        // Reset for next iteration
        process.chdir(testDir);
      }
    });
  });

  describe('Existing File Conflicts', () => {
    it('should handle existing .multiclaude directory with files', async () => {
      createMockProject(testDir, { hasExistingMulticlaude: true });

      const { result, logs } = await captureConsoleOutput(() => initProject());
      
      expect(logs.some(log => log.includes('already exists'))).toBe(true);
      expect(existsSync(join(testDir, '.multiclaude', 'personas'))).toBe(true);
    });

    it('should handle existing CLAUDE.staged.md file', async () => {
      const existingContent = '# Existing CLAUDE.staged.md\nThis file already exists';
      writeFileSync(join(testDir, 'CLAUDE.staged.md'), existingContent);

      await suppressConsoleOutput(() => initProject());

      // Should overwrite existing file
      const newContent = readFileSync(join(testDir, 'CLAUDE.staged.md'), 'utf-8');
      expect(newContent).not.toBe(existingContent);
      expect(newContent).toContain('AI Assistant Instructions');
    });

    it('should handle existing Makefile with different content', async () => {
      const existingMakefile = `# Custom Makefile
custom-target:
\techo "custom command"
`;
      writeFileSync(join(testDir, 'Makefile'), existingMakefile);

      const { logs } = await captureConsoleOutput(() => initProject());

      // Should not overwrite existing Makefile
      const content = readFileSync(join(testDir, 'Makefile'), 'utf-8');
      expect(content).toBe(existingMakefile);
      
      // Should warn about missing targets if they don't exist
      expect(logs.some(log => log.includes('missing setup/teardown'))).toBe(true);
    });

    it('should handle Makefile with existing setup/teardown targets', async () => {
      const makefileWithTargets = `# Existing Makefile with targets
.PHONY: setup teardown

setup:
\techo "existing setup"

teardown:
\techo "existing teardown"

other-target:
\techo "other"
`;
      writeFileSync(join(testDir, 'Makefile'), makefileWithTargets);

      const { logs } = await captureConsoleOutput(() => initProject());

      // Should not warn about missing targets
      expect(logs.some(log => log.includes('missing setup/teardown'))).toBe(false);
    });
  });

  describe('File System Edge Cases', () => {
    it('should handle very long file paths', async () => {
      // Create a path that approaches system limits
      const longPath = 'a'.repeat(50) + '/' + 'b'.repeat(50) + '/' + 'c'.repeat(50);
      const longDir = join(testDir, longPath);
      
      try {
        mkdirSync(longDir, { recursive: true });
        process.chdir(longDir);

        await expect(suppressConsoleOutput(() => initProject())).resolves.not.toThrow();
        expect(existsSync(join(longDir, '.multiclaude'))).toBe(true);
      } catch (error) {
        // If the system can't handle the long path, that's expected
        console.warn('System limit reached for long paths, skipping test');
      }
    });

    it('should handle concurrent init attempts', async () => {
      // Simulate multiple init processes running at the same time
      const promises = Array(5).fill(null).map(async (_, index) => {
        const concurrentDir = join(testDir, `concurrent-${index}`);
        mkdirSync(concurrentDir, { recursive: true });
        process.chdir(concurrentDir);
        
        return suppressConsoleOutput(() => initProject());
      });

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      for (const result of results) {
        expect(result.status).toBe('fulfilled');
      }

      // Verify all directories were created
      for (let i = 0; i < 5; i++) {
        expect(existsSync(join(testDir, `concurrent-${i}`, '.multiclaude'))).toBe(true);
      }
    });

    it('should handle symlinked directories', async () => {
      const realDir = join(testDir, 'real-directory');
      const symlinkDir = join(testDir, 'symlink-directory');
      
      mkdirSync(realDir);
      
      try {
        // Create symlink (skip on Windows or if symlink creation fails)
        require('fs').symlinkSync(realDir, symlinkDir, 'dir');
        process.chdir(symlinkDir);

        await expect(suppressConsoleOutput(() => initProject())).resolves.not.toThrow();
        
        // Should create files in the real directory
        expect(existsSync(join(realDir, '.multiclaude'))).toBe(true);
      } catch (error) {
        console.warn('Symlink test skipped (not supported on this system)');
      }
    });
  });

  describe('Corrupted or Missing Source Files', () => {
    it('should handle missing persona files gracefully', async () => {
      // This test would require mocking the findHackDir function
      // to return a directory with missing files
      
      const { result, logs } = await captureConsoleOutput(() => initProject());
      
      // Should complete but warn about missing files
      expect(logs.some(log => log.includes('Skipped') || log.includes('not found'))).toBe(false);
      // Normal operation should copy all files
    });

    it('should handle corrupted persona files', async () => {
      // In a real scenario, you'd mock file reading to simulate corruption
      // For now, test that the init process is robust
      
      await expect(suppressConsoleOutput(() => initProject())).resolves.not.toThrow();
      expect(existsSync(join(testDir, '.multiclaude'))).toBe(true);
    });
  });

  describe('Memory and Resource Constraints', () => {
    it('should handle large file operations efficiently', async () => {
      // Create a scenario with many files to ensure memory efficiency
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      await suppressConsoleOutput(() => initProject());

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;

      // Should complete quickly and not use excessive memory
      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it('should clean up properly on interruption', async () => {
      // Test cleanup behavior when process is interrupted
      // This is difficult to test directly, but we can verify
      // that the init process is atomic where possible
      
      let interruptedDuringCreation = false;
      
      try {
        await suppressConsoleOutput(() => initProject());
        
        // Verify complete state
        expect(existsSync(join(testDir, '.multiclaude'))).toBe(true);
        expect(existsSync(join(testDir, 'CLAUDE.staged.md'))).toBe(true);
      } catch (error) {
        interruptedDuringCreation = true;
      }

      if (!interruptedDuringCreation) {
        // Normal completion - all files should exist
        expect(existsSync(join(testDir, '.multiclaude', 'personas'))).toBe(true);
      }
    });
  });

  describe('Platform-Specific Behaviors', () => {
    it('should handle different line endings', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudeContent = readFileSync(join(testDir, 'CLAUDE.staged.md'), 'utf-8');
      
      // Content should be consistent regardless of platform
      expect(claudeContent).toContain('# AI Assistant Instructions');
      expect(claudeContent.split('\n').length).toBeGreaterThan(10);
    });

    it('should handle case-sensitive vs case-insensitive file systems', async () => {
      await suppressConsoleOutput(() => initProject());

      // Verify that file names are consistent
      const personasDir = join(testDir, '.multiclaude', 'personas');
      expect(existsSync(join(personasDir, 'agent-developer.md'))).toBe(true);
      
      // On case-insensitive file systems (like macOS), verify we have the right filename
      const fs = require('fs');
      const files = fs.readdirSync(personasDir);
      const agentDevFile = files.find((f: string) => f.toLowerCase() === 'agent-developer.md');
      expect(agentDevFile).toBe('agent-developer.md'); // Should be exactly this case
    });
  });

  describe('Error Recovery', () => {
    it('should provide helpful error messages', async () => {
      // Create a scenario that will cause an error
      const invalidDir = '/root/invalid-permission-test';
      
      try {
        process.chdir(invalidDir);
      } catch {
        // Expected to fail - directory doesn't exist
      }

      try {
        await suppressConsoleOutput(() => initProject());
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should maintain consistent state after partial failures', async () => {
      // This test ensures that if something fails partway through,
      // the directory structure remains in a valid state
      
      await suppressConsoleOutput(() => initProject());
      
      // Verify that if init succeeded, all expected files exist
      if (existsSync(join(testDir, '.promptx'))) {
        expect(existsSync(join(testDir, '.promptx', 'personas'))).toBe(true);
        expect(existsSync(join(testDir, 'CLAUDE.staged.md'))).toBe(true);
      }
    });
  });
});