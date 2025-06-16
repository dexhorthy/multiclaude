# CLI Merge Coordinator Plan

Adopt the persona from hack/agent-merger.md

## What problem(s) am I solving?

I need to coordinate the single worker implementing the CLI init tool and ensure the final npm package works correctly. This is much simpler than the MCP server approach.

## What branches will I monitor?

- cli-init-tool (single worker implementing the CLI)

## What user-facing changes will result?

- Working `npx multiclaude init` command
- Package publishable to npm
- Clean project structure for CLI tool
- Documentation for usage
- All personas properly copied and templates generated

## How I will implement the merging

- Monitor cli-init-tool branch for commits every 2 minutes
- Read full implementation when commits appear (minimum 1500 lines)
- Test the CLI tool thoroughly after each merge
- Verify npm package structure is correct
- Delete any redundant code or files
- Ensure package.json is properly configured

## How to verify the final result

- `npx multiclaude init` works in clean directory
- .multiclaude/personas/ contains all agent files
- CLAUDE.staged.md generated correctly
- Package builds without errors: `npm run build`
- Package can be published: `npm publish --dry-run`
- CLI shows helpful progress messages
- All persona files copied correctly

## Monitoring and Merge Strategy

- Check branch every 2 minutes: `git log --oneline -3 cli-init-tool`
- Use `git diff main...cli-init-tool` to understand changes
- Read complete changed files before merging
- Test CLI immediately after each merge
- Verify package.json bin configuration
- Test scaffolding in clean directory

## Testing Strategy

- Create temporary test directory
- Run `npx multiclaude init` from test directory
- Verify all expected files created
- Check file contents match expectations
- Test CLI error handling (existing .multiclaude/, etc.)
- Verify npm package structure

## Integration Points to Watch

- package.json bin entry points to correct file
- TypeScript compilation produces working JavaScript
- All hack/ files properly included in package
- CLI entry point handles arguments correctly
- File copying preserves content exactly

## Key Requirements

- Monitor single worker branch, merge incrementally
- Test CLI functionality after every merge
- Verify npm package structure and publishability
- Ensure all persona files included and working
- Final package must work with npx without installation
- Delete any unnecessary complexity from original MCP plans

## Expected Timeline

- Worker commits every 5-10 minutes
- I merge every 2 minutes when commits appear
- Final CLI implementation within 30 minutes
- Complete testing and verification within 45 minutes