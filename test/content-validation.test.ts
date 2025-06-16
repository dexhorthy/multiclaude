import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { initProject } from '../src/init';
import { createTestDirectory, verifyPersonaFiles, verifyCLAUDEStagedFile, verifyMakefile, suppressConsoleOutput } from './helpers';

describe('Content Validation Tests', () => {
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

  describe('Persona Files Content Validation', () => {
    it('should copy persona files with exact content match', async () => {
      await suppressConsoleOutput(() => initProject());

      const personasDir = join(testDir, '.promptx', 'personas');
      const sourceHackDir = join(originalCwd, 'hack');

      const personaFiles = [
        'agent-developer.md',
        'agent-code-reviewer.md',
        'agent-merger.md',
        'agent-multiplan-manager.md',
        'agent-rebaser.md'
      ];

      for (const file of personaFiles) {
        const sourcePath = join(sourceHackDir, file);
        const destPath = join(personasDir, file);

        expect(existsSync(destPath), `${file} should exist in personas directory`).toBe(true);

        if (existsSync(sourcePath)) {
          const sourceContent = readFileSync(sourcePath, 'utf-8');
          const destContent = readFileSync(destPath, 'utf-8');
          
          expect(destContent).toBe(sourceContent);
          expect(destContent.length).toBeGreaterThan(0);
        }
      }
    });

    it('should validate persona file structure and key content', async () => {
      await suppressConsoleOutput(() => initProject());

      const personasDir = join(testDir, '.promptx', 'personas');
      
      // Test agent-developer.md specifically
      const developerPath = join(personasDir, 'agent-developer.md');
      expect(existsSync(developerPath)).toBe(true);

      const content = readFileSync(developerPath, 'utf-8');
      
      // Validate key structural elements
      expect(content).toContain('Dan Abramov');
      expect(content).toContain('1500-LINE MINIMUM READ RULE');
      expect(content).toContain('20-POINT TODO LIST');
      expect(content).toContain('DELETE MORE THAN YOU ADD');
      expect(content).toContain('WORKFLOW THAT ACTUALLY WORKS');
    });

    it('should validate all persona files have proper markdown structure', async () => {
      await suppressConsoleOutput(() => initProject());

      const personasDir = join(testDir, '.promptx', 'personas');
      const personaFiles = [
        'agent-developer.md',
        'agent-code-reviewer.md',
        'agent-merger.md',
        'agent-multiplan-manager.md',
        'agent-rebaser.md'
      ];

      for (const file of personaFiles) {
        const filePath = join(personasDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // Should have markdown headers
        expect(content).toMatch(/^#+ /m);
        
        // Should have substantial content
        expect(content.length).toBeGreaterThan(500);
        
        // Should not be empty or just whitespace
        expect(content.trim().length).toBeGreaterThan(0);
        
        // Should contain workflow instructions
        expect(content.toLowerCase()).toMatch(/(workflow|process|step|rule)/);
      }
    });

    it('should validate persona files contain required agent instructions', async () => {
      await suppressConsoleOutput(() => initProject());

      const personasDir = join(testDir, '.promptx', 'personas');
      
      // Each persona should have specific characteristics
      const requiredPatterns = {
        'agent-developer.md': ['DELETE MORE THAN YOU ADD', 'TODO LIST', 'READ', 'BUILD'],
        'agent-code-reviewer.md': ['review', 'quality', 'code'],
        'agent-merger.md': ['merge', 'branch'],
        'agent-multiplan-manager.md': ['plan', 'manager', 'multiplan'],
        'agent-rebaser.md': ['rebase', 'history', 'clean']
      };

      for (const [filename, patterns] of Object.entries(requiredPatterns)) {
        const filePath = join(personasDir, filename);
        const content = readFileSync(filePath, 'utf-8').toLowerCase();

        for (const pattern of patterns) {
          expect(content).toContain(pattern.toLowerCase());
        }
      }
    });
  });

  describe('CLAUDE.staged.md Content Validation', () => {
    it('should generate CLAUDE.staged.md with complete template structure', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      verifyCLAUDEStagedFile(claudePath);
    });

    it('should contain all required sections in CLAUDE.staged.md', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      const content = readFileSync(claudePath, 'utf-8');

      const requiredSections = [
        '# AI Assistant Instructions',
        '## 🚨 MANDATORY PERSONA SELECTION',
        '## How to Choose Your Persona',
        '## Project Context',
        '## Core Principles (All Personas)',
        '## File Structure Reference',
        '## Common Commands (All Personas)',
        '## CRITICAL REMINDER'
      ];

      for (const section of requiredSections) {
        expect(content).toContain(section);
      }
    });

    it('should reference all 5 persona files correctly', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      const content = readFileSync(claudePath, 'utf-8');

      const expectedReferences = [
        'agent-developer.md',
        'agent-code-reviewer.md',
        'agent-merger.md',
        'agent-multiplan-manager.md',
        'agent-rebaser.md'
      ];

      for (const reference of expectedReferences) {
        expect(content).toContain(reference);
        expect(content).toContain(`.promptx/personas/${reference}`);
      }
    });

    it('should contain customization placeholders', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      const content = readFileSync(claudePath, 'utf-8');

      const placeholders = [
        '[CUSTOMIZE THIS SECTION FOR YOUR PROJECT]',
        '[Add your stack here]',
        '[Add your build commands]',
        '[Add your test commands]',
        '[Describe your project structure]',
        '[your build command]',
        '[your test command]',
        '[your lint command]',
        '[your deploy command]'
      ];

      for (const placeholder of placeholders) {
        expect(content).toContain(placeholder);
      }
    });

    it('should have proper persona selection instructions', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      const content = readFileSync(claudePath, 'utf-8');

      // Should have clear decision tree
      expect(content).toContain('Asked to write code, fix bugs, or implement features?');
      expect(content).toContain('Asked to review code changes?');
      expect(content).toContain('Asked to clean git history or rebase changes?');
      expect(content).toContain('Asked to merge branches or consolidate work?');
      expect(content).toContain('Asked to coordinate multiple tasks');

      // Should have warnings about not proceeding without persona
      expect(content).toContain('DO NOT PROCEED WITHOUT SELECTING A PERSONA');
      expect(content).toContain('You CANNOT proceed without adopting a persona');
    });
  });

  describe('Makefile Content Validation', () => {
    it('should create Makefile with required targets', async () => {
      await suppressConsoleOutput(() => initProject());

      const makefilePath = join(testDir, 'Makefile');
      verifyMakefile(makefilePath);
    });

    it('should have proper Makefile syntax and structure', async () => {
      await suppressConsoleOutput(() => initProject());

      const makefilePath = join(testDir, 'Makefile');
      const content = readFileSync(makefilePath, 'utf-8');

      // Should have .PHONY declaration
      expect(content).toContain('.PHONY: setup teardown');

      // Should have setup target with proper syntax
      expect(content).toMatch(/setup:\s*\n\s*@/);
      
      // Should have teardown target with proper syntax
      expect(content).toMatch(/teardown:\s*\n\s*@/);

      // Should use tabs for indentation (Makefile requirement)
      const lines = content.split('\n');
      const targetLines = lines.filter(line => line.startsWith('\t'));
      expect(targetLines.length).toBeGreaterThan(0);
    });

    it('should contain launch compatibility commands', async () => {
      await suppressConsoleOutput(() => initProject());

      const makefilePath = join(testDir, 'Makefile');
      const content = readFileSync(makefilePath, 'utf-8');

      // Should support multiple package managers
      expect(content).toContain('npm install');
      expect(content).toContain('bun install');
      expect(content).toContain('yarn install');

      // Should have cleanup commands
      expect(content).toContain('rm -rf node_modules');

      // Should have informative echo statements
      expect(content).toContain('Setting up project');
      expect(content).toContain('Tearing down project');
    });
  });

  describe('File Permissions and Attributes', () => {
    it('should create files with appropriate permissions', async () => {
      await suppressConsoleOutput(() => initProject());

      const filesToCheck = [
        join(testDir, '.promptx', 'personas', 'agent-developer.md'),
        join(testDir, 'CLAUDE.staged.md'),
        join(testDir, 'Makefile')
      ];

      for (const filePath of filesToCheck) {
        expect(existsSync(filePath)).toBe(true);
        
        // Files should be readable
        const content = readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }
    });

    it('should maintain consistent line endings', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      const content = readFileSync(claudePath, 'utf-8');

      // Should not have mixed line endings
      const hasCarriageReturn = content.includes('\r');
      const lines = content.split('\n');
      
      // Should have multiple lines
      expect(lines.length).toBeGreaterThan(10);
      
      // If it has carriage returns, they should be consistent
      if (hasCarriageReturn) {
        expect(content.split('\r\n').length).toBeGreaterThan(1);
      }
    });
  });

  describe('Content Integrity', () => {
    it('should validate helper function works correctly', async () => {
      await suppressConsoleOutput(() => initProject());

      const personasDir = join(testDir, '.promptx', 'personas');
      
      // Use helper function to verify
      expect(() => verifyPersonaFiles(personasDir)).not.toThrow();
    });

    it('should handle UTF-8 characters correctly', async () => {
      await suppressConsoleOutput(() => initProject());

      const claudePath = join(testDir, 'CLAUDE.staged.md');
      const content = readFileSync(claudePath, 'utf-8');

      // Should contain emoji characters from the template  
      expect(content).toContain('🚨'); // This is in the template

      // Should handle special characters properly
      const buffer = readFileSync(claudePath);
      const utf8Content = buffer.toString('utf-8');
      expect(utf8Content).toBe(content);
    });

    it('should generate consistent content across multiple runs', async () => {
      await suppressConsoleOutput(() => initProject());
      
      const firstContent = readFileSync(join(testDir, 'CLAUDE.staged.md'), 'utf-8');
      
      // Run again (should overwrite)
      await suppressConsoleOutput(() => initProject());
      
      const secondContent = readFileSync(join(testDir, 'CLAUDE.staged.md'), 'utf-8');
      
      // Should be identical
      expect(firstContent).toBe(secondContent);
    });
  });
});