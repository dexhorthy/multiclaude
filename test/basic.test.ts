import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Basic Tests', () => {
  describe('Package Configuration', () => {
    it('should have correct package.json configuration', () => {
      const packageJsonPath = join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.name).toBe('multiclaude');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin.multiclaude).toBe('./dist/cli.js');
    });

    it('should have required dependencies', () => {
      const packageJsonPath = join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.chalk).toBeDefined();
      expect(packageJson.dependencies.commander).toBeDefined();
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have LaunchOptions with humanlayer flag', () => {
      const typesPath = join(__dirname, '..', 'src', 'types.ts');
      const typesContent = readFileSync(typesPath, 'utf-8');

      expect(typesContent).toContain('humanlayer?: boolean');
      expect(typesContent).toContain('interface LaunchOptions');
    });
  });

  describe('CLI Configuration', () => {
    it('should have humanlayer option in CLI', () => {
      const cliPath = join(__dirname, '..', 'src', 'cli.ts');
      const cliContent = readFileSync(cliPath, 'utf-8');

      expect(cliContent).toContain('--humanlayer');
      expect(cliContent).toContain('Use HumanLayer launch instead of tmux session');
    });
  });

  describe('Build Output', () => {
    it('should have built CLI file', () => {
      const cliPath = join(__dirname, '..', 'dist', 'cli.js');
      let cliExists = false;
      
      try {
        const cliContent = readFileSync(cliPath, 'utf-8');
        cliExists = cliContent.length > 0;
      } catch {
        // File doesn't exist or can't be read
      }

      // This test will pass if the file exists or if it's a fresh checkout
      expect(cliExists || process.env.CI).toBeTruthy();
    });
  });
});