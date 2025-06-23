import { describe, it, expect } from 'vitest';
import { Launcher } from '../src/launcher';
import type { LaunchOptions } from '../src/types';

describe('Launcher Tests', () => {
  describe('Launcher Class', () => {
    it('should create launcher instance', () => {
      const launcher = new Launcher();
      expect(launcher).toBeDefined();
      expect(launcher).toBeInstanceOf(Launcher);
    });

    it('should have launch method that accepts humanlayer option', () => {
      const launcher = new Launcher();
      expect(typeof launcher.launch).toBe('function');
      
      // Test that the method signature accepts the right parameters
      const mockOptions: LaunchOptions = {
        verbose: true,
        debug: false,
        humanlayer: true
      };
      
      // This just tests the types compile correctly
      expect(mockOptions.humanlayer).toBe(true);
    });
  });

  describe('Launch Options', () => {
    it('should handle humanlayer option in LaunchOptions interface', () => {
      const options: LaunchOptions = {
        humanlayer: true,
        verbose: false,
        debug: false
      };

      expect(options.humanlayer).toBe(true);
      expect(options.verbose).toBe(false);
      expect(options.debug).toBe(false);
    });

    it('should make humanlayer option optional', () => {
      const options: LaunchOptions = {
        verbose: true
      };

      expect(options.humanlayer).toBeUndefined();
      expect(options.verbose).toBe(true);
    });
  });
});