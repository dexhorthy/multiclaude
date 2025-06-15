# CLI Init Tool Implementation Plan

Adopt the persona from hack/agent-developer.md

## What problem(s) am I solving?

Need to create a simple npm CLI package that initializes agent personas into projects. Users run `npx promptx init` to get all the agent personas in their project and a CLAUDE.staged.md file ready to merge.

## What user-facing changes will I ship?

- `npx promptx init` command that creates .promptx/ folder
- Copies all hack/ persona files into .promptx/personas/
- Creates CLAUDE.staged.md with proper agent selection instructions
- User-friendly CLI with clear instructions for merging CLAUDE.staged.md into CLAUDE.md
- Clean npm package that works with npx without installation

## How I will implement it

- Create package.json with proper bin entry for CLI command
- Implement src/cli.ts as main entry point for init command
- Copy all hack/agent-*.md files to .promptx/personas/
- Generate CLAUDE.staged.md template with persona selection
- Add clear instructions for merging staged file into CLAUDE.md
- Use simple Node.js fs operations for file copying and creation

## How to verify it

- Run `npx promptx init` in a test directory
- Verify .promptx/personas/ contains all agent persona files
- Verify CLAUDE.staged.md is created with proper content
- Test that init command works from npx without global install
- Check that files are copied correctly and templates are accurate

## Key Requirements

- Must work as `npx promptx init` without installation
- Must create .promptx/personas/ directory structure
- Must copy all hack/agent-*.md files to personas folder
- Must generate CLAUDE.staged.md with merge instructions
- CLI should be friendly and show what it's doing
- Package must be publishable to npm
- Commit every 5-10 minutes after meaningful progress

## Files to Create/Modify

- package.json (with bin entry pointing to cli)
- src/cli.ts (main CLI entry point)
- src/init.ts (initialization logic)
- tsconfig.json
- .gitignore
- README.md (basic usage instructions)

## Technical Notes

- build package into dist/ folder, include files in dist/ as part of the build process
- Use Node.js fs.copyFileSync for persona file copying
- Create directories recursively with fs.mkdirSync({recursive: true})
- Template CLAUDE.staged.md content as string literal
- CLI should show progress: "Creating .promptx/...", "Copying personas...", etc.
- Include clear instructions for user to copy/merge CLAUDE.staged.md
- Keep dependencies minimal - just TypeScript and basic Node.js

## CLAUDE.staged.md Content

Must include:
- Instructions to copy/merge into CLAUDE.md
- All 5 persona options with local file references (.promptx/personas/agent-*.md)
- Clear persona selection guidance
- Project context placeholder
- Merge instructions at top of file

## Init Process

1. Check if .promptx/ already exists (warn user)
2. Create .promptx/personas/ directory
3. Copy all hack/agent-*.md files to personas/
4. Generate CLAUDE.staged.md in project root
5. Show success message with next steps