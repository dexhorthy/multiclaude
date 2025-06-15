# Project Scaffold Setup Plan

Adopt the persona from hack/agent-developer.md

## What problem(s) am I solving?

Need to create the basic Node.js/TypeScript project foundation that other agents depend on. Currently the repo has no package.json, TypeScript config, or directory structure - so other agents would fail immediately trying to run npm/tsc commands.

## What user-facing changes will I ship?

- Complete Node.js/TypeScript project structure
- package.json with proper CLI bin configuration
- TypeScript configuration optimized for CLI development
- Build system with npm scripts for dev/build/test/lint
- Directory structure: src/, dist/, test/
- Basic CI/CD configuration
- Development tooling setup (prettier, eslint if needed)

## How I will implement it

- Create package.json with CLI-focused dependencies and bin entries
- Set up tsconfig.json for Node.js CLI development
- Create src/ directory with basic file structure
- Add build scripts that compile TypeScript to dist/
- Set up basic test infrastructure
- Create .gitignore for Node.js projects
- Add README with development instructions

## How to verify it

- `npm install` works and installs dependencies
- `npm run build` compiles TypeScript successfully
- `npm test` runs (even if no tests yet)
- `npm run dev` works for development
- Generated dist/ files are executable
- bin entries in package.json work correctly
- TypeScript compilation has no errors

## Key Requirements

### Package.json Structure
- Name: "promptx" (for npm publishing)
- Version: "0.1.0" (semantic versioning)
- Bin entries: { "promptx": "./dist/cli.js" }
- Scripts: build, dev, test, lint, clean
- Dependencies: typescript, @types/node, minimal CLI deps
- Keywords and description for npm discoverability

### TypeScript Configuration
- Target ES2022 for modern Node.js
- Module: CommonJS for CLI compatibility
- OutDir: "./dist"
- RootDir: "./src"
- Strict mode enabled
- Declaration files for library usage
- Source maps for debugging

### Directory Structure
```
src/
  cli.ts          # Main CLI entry point
  index.ts        # Library exports
  types.ts        # TypeScript interfaces
  utils/          # Utility functions
dist/             # Compiled JavaScript (gitignored)
test/             # Test files
  fixtures/       # Test data
```

### Build System
- `npm run build` - Compile TypeScript to dist/
- `npm run dev` - Watch mode for development
- `npm run clean` - Remove dist/ and node_modules/
- `npm run test` - Run test suite
- `npm run lint` - Code quality checks

## Files to Create

- package.json (main project configuration)
- tsconfig.json (TypeScript configuration)
- .gitignore (ignore node_modules/, dist/, etc.)
- src/cli.ts (basic CLI entry point stub)
- src/index.ts (library entry point)
- src/types.ts (shared TypeScript interfaces)
- test/basic.test.ts (placeholder test)
- README.md (development setup instructions)

## Technical Notes

### CLI-Specific Requirements
- Shebang line in compiled cli.js: #!/usr/bin/env node
- Proper exit codes for CLI commands
- Commander.js or similar for argument parsing
- Colorful output for better UX
- Error handling with helpful messages

### Dependencies Strategy
- Keep dependencies minimal for faster installs
- Use built-in Node.js modules where possible
- TypeScript and @types/node for development
- Commander.js for CLI argument parsing
- Chalk for colored output (optional)

### Build Output Requirements
- dist/cli.js must be executable
- All TypeScript files compile without errors
- Generated JavaScript works in Node.js 18+
- Package structure ready for npm publish

### Development Experience
- Fast build times for iteration
- Clear error messages during development
- Easy testing setup for future agents
- Consistent code formatting

## Validation Checklist

### Project Structure
- [ ] package.json exists with correct bin entry
- [ ] tsconfig.json compiles without errors
- [ ] src/ directory with basic files
- [ ] dist/ generates executable files
- [ ] .gitignore excludes generated files

### Build System
- [ ] `npm install` completes successfully
- [ ] `npm run build` compiles TypeScript
- [ ] `npm run clean` removes generated files
- [ ] `npm test` runs (even with no tests)
- [ ] Generated cli.js is executable

### CLI Foundation
- [ ] bin/promptx entry point works
- [ ] Basic argument parsing setup
- [ ] Help command shows usage
- [ ] Error handling returns proper exit codes
- [ ] Ready for other agents to extend

## Integration Points

This scaffold must support the future work from:
- plan-cli-init-dev.md (init command implementation)
- plan-cli-launcher.md (launch/cleanup commands)
- plan-cli-init-test.md (comprehensive testing)

The scaffold should provide:
- CLI framework ready for subcommands
- TypeScript interfaces for configuration
- Build system that works for all features
- Test infrastructure for all agents to use

## Commit Strategy

- Commit basic package.json and tsconfig.json first
- Commit directory structure and basic files
- Commit working build system
- Commit every 5-10 minutes after meaningful progress
- Each commit should leave project in buildable state