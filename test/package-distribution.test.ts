import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createTestDirectory, execCommand } from './helpers';

describe('Package Distribution Tests', () => {
  let testDir: string;
  let cleanup: () => void;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    const testEnv = createTestDirectory();
    testDir = testEnv.path;
    cleanup = testEnv.cleanup;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanup();
  });

  describe('Package Structure', () => {
    it('should have correct package.json configuration', () => {
      const packageJsonPath = join(originalCwd, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check essential fields for npm publishing
      expect(packageJson.name).toBe('promptx');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin.promptx).toBeDefined();
      expect(packageJson.files).toContain('dist');
      expect(packageJson.files).toContain('hack');
      expect(packageJson.main).toBeDefined();
    });

    it('should include all required files in distribution', () => {
      const packageJsonPath = join(originalCwd, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check that all files in the 'files' array exist
      for (const file of packageJson.files) {
        const filePath = join(originalCwd, file);
        expect(existsSync(filePath), `File ${file} should exist for distribution`).toBe(true);
      }
    });

    it('should have all required hack directory persona files', () => {
      const hackDir = join(originalCwd, 'hack');
      const requiredFiles = [
        'agent-developer.md',
        'agent-code-reviewer.md',
        'agent-merger.md',
        'agent-multiplan-manager.md',
        'agent-rebaser.md'
      ];

      for (const file of requiredFiles) {
        const filePath = join(hackDir, file);
        expect(existsSync(filePath), `Persona file ${file} should exist in hack directory`).toBe(true);
      }
    });
  });

  describe('Build Process', () => {
    it('should build successfully', () => {
      try {
        execSync('npm run build', {
          cwd: originalCwd,
          stdio: 'pipe'
        });

        // Check that dist directory was created
        expect(existsSync(join(originalCwd, 'dist'))).toBe(true);
        
        // Check that CLI binary was built
        const packageJson = JSON.parse(readFileSync(join(originalCwd, 'package.json'), 'utf-8'));
        const cliPath = join(originalCwd, packageJson.bin.promptx);
        expect(existsSync(cliPath)).toBe(true);
      } catch (error) {
        console.error('Build failed:', error);
        throw error;
      }
    });

    it('should produce executable CLI binary', () => {
      try {
        execSync('npm run build', {
          cwd: originalCwd,
          stdio: 'pipe'
        });

        const packageJson = JSON.parse(readFileSync(join(originalCwd, 'package.json'), 'utf-8'));
        const cliPath = join(originalCwd, packageJson.bin.promptx);
        
        // Test that the binary can be executed
        const result = execCommand(`node "${cliPath}" --help`, { cwd: testDir });
        expect(result.success).toBe(true);
        expect(result.output).toContain('Usage:');
      } catch (error) {
        console.error('CLI binary test failed:', error);
        throw error;
      }
    });
  });

  describe('NPM Pack Testing', () => {
    it('should create a valid npm package', () => {
      try {
        // Build first
        execSync('npm run build', {
          cwd: originalCwd,
          stdio: 'pipe'
        });

        // Create npm pack
        const packOutput = execSync('npm pack', {
          cwd: originalCwd,
          encoding: 'utf-8'
        });

        const tarballName = packOutput.trim();
        const tarballPath = join(originalCwd, tarballName);
        
        expect(existsSync(tarballPath)).toBe(true);
        
        // Clean up
        execSync(`rm -f "${tarballPath}"`, { cwd: originalCwd });
      } catch (error) {
        console.error('NPM pack test failed:', error);
        throw error;
      }
    });

    it('should contain all required files in packed tarball', () => {
      try {
        // Build and pack
        execSync('npm run build', { cwd: originalCwd, stdio: 'pipe' });
        const packOutput = execSync('npm pack', { cwd: originalCwd, encoding: 'utf-8' });
        const tarballName = packOutput.trim();
        const tarballPath = join(originalCwd, tarballName);

        // Extract and examine contents
        process.chdir(testDir);
        execSync(`tar -tf "${tarballPath}"`, { stdio: 'pipe' });
        
        const contents = execSync(`tar -tf "${tarballPath}"`, { encoding: 'utf-8' });
        
        expect(contents).toContain('package/dist/');
        expect(contents).toContain('package/hack/');
        expect(contents).toContain('package/hack/agent-developer.md');
        expect(contents).toContain('package/LICENSE');
        expect(contents).toContain('package/README.md');
        
        // Clean up
        execSync(`rm -f "${tarballPath}"`, { cwd: originalCwd });
      } catch (error) {
        console.error('Tarball contents test failed:', error);
        throw error;
      }
    });
  });

  describe('NPX Simulation', () => {
    it('should simulate npx execution flow', async () => {
      try {
        // Build the project
        execSync('npm run build', { cwd: originalCwd, stdio: 'pipe' });
        
        // Create a test package installation
        process.chdir(testDir);
        
        // Copy built files to simulate npm install
        execSync(`cp -r "${join(originalCwd, 'dist')}" "${testDir}/"`, { stdio: 'pipe' });
        execSync(`cp -r "${join(originalCwd, 'hack')}" "${testDir}/"`, { stdio: 'pipe' });
        execSync(`cp -r "${join(originalCwd, 'node_modules')}" "${testDir}/"`, { stdio: 'pipe' });
        
        // Create a minimal package.json in test directory
        const testPackageJson = {
          name: 'promptx',
          version: '0.1.0',
          bin: { promptx: './dist/cli.js' },
          files: ['dist', 'hack'],
          dependencies: {
            commander: 'latest',
            chalk: 'latest'
          }
        };
        writeFileSync(join(testDir, 'package.json'), JSON.stringify(testPackageJson, null, 2));
        
        // Create a separate directory to test init from
        const initTestDir = join(testDir, 'init-test');
        execSync(`mkdir -p "${initTestDir}"`);
        process.chdir(initTestDir);
        
        // Simulate npx execution
        const result = execCommand(`node "${join(testDir, 'dist', 'cli.js')}" init`);
        
        if (!result.success) {
          console.error('NPX simulation error:', result.error);
          console.error('NPX simulation output:', result.output);
        }
        
        expect(result.success).toBe(true);
        expect(existsSync(join(initTestDir, '.promptx'))).toBe(true);
        expect(existsSync(join(initTestDir, 'CLAUDE.staged.md'))).toBe(true);
      } catch (error) {
        console.error('NPX simulation failed:', error);
        throw error;
      }
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different path separators', () => {
      // Test path handling for Windows vs Unix
      const packageJson = JSON.parse(readFileSync(join(originalCwd, 'package.json'), 'utf-8'));
      const binPath = packageJson.bin.promptx;
      
      // Should use forward slashes (npm handles conversion)
      expect(binPath).toBe('./dist/cli.js');
    });

    it('should work with different Node.js versions', () => {
      const packageJson = JSON.parse(readFileSync(join(originalCwd, 'package.json'), 'utf-8'));
      
      // Check Node.js version requirement
      expect(packageJson.engines?.node).toBeDefined();
      expect(packageJson.engines.node).toMatch(/>=\d+/);
    });
  });

  describe('Performance Tests', () => {
    it('should complete init within reasonable time', async () => {
      try {
        execSync('npm run build', { cwd: originalCwd, stdio: 'pipe' });
        
        const startTime = Date.now();
        
        const result = execCommand(`node "${join(originalCwd, 'dist', 'cli.js')}" init`, { 
          cwd: testDir 
        });
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        expect(result.success).toBe(true);
        expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      } catch (error) {
        console.error('Performance test failed:', error);
        throw error;
      }
    });

    it('should handle large number of concurrent executions', async () => {
      try {
        execSync('npm run build', { cwd: originalCwd, stdio: 'pipe' });
        
        // Create multiple test directories
        const concurrentTests = 5;
        const promises = [];
        
        for (let i = 0; i < concurrentTests; i++) {
          const concurrentTestDir = join(testDir, `concurrent-${i}`);
          execSync(`mkdir -p "${concurrentTestDir}"`);
          
          promises.push(
            new Promise((resolve, reject) => {
              try {
                const result = execCommand(`node "${join(originalCwd, 'dist', 'cli.js')}" init`, {
                  cwd: concurrentTestDir
                });
                
                if (result.success) {
                  resolve(result);
                } else {
                  reject(new Error(`Concurrent test ${i} failed: ${result.error}`));
                }
              } catch (error) {
                reject(error);
              }
            })
          );
        }
        
        const results = await Promise.all(promises);
        expect(results).toHaveLength(concurrentTests);
        
        // Verify all directories were created
        for (let i = 0; i < concurrentTests; i++) {
          const concurrentTestDir = join(testDir, `concurrent-${i}`);
          expect(existsSync(join(concurrentTestDir, '.promptx'))).toBe(true);
        }
      } catch (error) {
        console.error('Concurrent execution test failed:', error);
        throw error;
      }
    });
  });
});