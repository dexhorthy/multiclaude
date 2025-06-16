# CLI Init Tool Merge Coordination Plan

Adopt the persona from hack/agent-merger.md

## Your Task

You are the merge coordinator for the CLI init tool project. Your job is to monitor the development and testing agents' progress and merge their work into the main branch incrementally as they make commits.

## Branches to Monitor

- `cli-init-dev` - Main development work (plan-cli-init-dev.md)
- `cli-init-test` - Testing implementation (plan-cli-init-test.md)
- `cli-launcher` - CLI launcher commands (plan-cli-launcher.md)

## Integration Strategy

### Development Branch (cli-init-dev)
Watch for commits that implement:
- src/init.ts initialization logic (NEW FILE)
- src/cli.ts extensions for init command (MODIFIES EXISTING)
- Any additional dependencies in package.json (EXTENDS EXISTING)
- **CRITICAL**: Should NOT recreate package.json/tsconfig.json - only extend

### Testing Branch (cli-init-test)
Watch for commits that implement:
- Comprehensive test suite
- Integration testing scenarios
- CI/CD configuration
- Test utilities and fixtures
- Cross-platform compatibility tests

### Launcher Branch (cli-launcher)
Watch for commits that implement:
- Launch command functionality
- Cleanup command functionality
- Environment variable support
- Configuration file handling
- Error handling and validation

## Merge Priorities

1. **Foundation First**: Merge basic project structure and package.json
2. **Core Features**: Merge init command implementation
3. **Launch Features**: Merge launcher/cleanup commands
4. **Testing Last**: Merge comprehensive test suite
5. **Documentation**: Merge README and usage docs

## Key Integration Points

### Package Structure
- Ensure package.json has all necessary bin entries
- Verify TypeScript configuration is consistent
- Check that build process works correctly
- Validate npm package structure

### CLI Commands
- Ensure `init` command works independently
- Verify `launch` and `cleanup` commands integrate properly
- Check command-line argument parsing consistency
- Validate error handling across all commands

### Testing Integration
- Merge test infrastructure early
- Ensure tests run for all merged features
- Fix any test failures before merging more code
- Maintain test coverage as features are added

## Merge Timing

### Every 2-3 Commits
- Monitor each branch for new commits
- Review changes for integration conflicts
- Merge compatible changes immediately
- Test integrated functionality after merge

### Priority Checks
- Build must pass after every merge
- Tests must pass after every merge
- CLI commands must work after every merge
- No regression in existing functionality

## Quality Gates

### Before Each Merge
1. Read all changed files completely (1500+ lines)
2. Understand how changes fit together
3. Check for duplicate code or logic
4. Verify TypeScript compilation
5. Test CLI commands manually
6. Run test suite if available

### After Each Merge
1. Verify build process works
2. Test all CLI commands
3. Check for integration issues
4. Update documentation if needed
5. Commit merge with clear message

## Risk Management

### Potential Conflicts
- package.json changes from multiple branches
- TypeScript configuration differences
- CLI command structure changes
- Test setup and configuration

### Mitigation Strategies
- Merge package.json changes carefully
- Maintain consistent coding patterns
- Resolve conflicts in favor of simpler solutions
- Test thoroughly after conflict resolution

## Communication

### Commit Messages
- Clear description of what was merged
- Reference source branch and commits
- Note any conflicts resolved
- Mention testing performed

### Progress Updates
- Monitor agent progress every 10-15 minutes
- Check for new commits regularly
- Identify blocked or slow agents
- Coordinate integration timing

## Success Criteria

### Fully Integrated Package
- `npx multiclaude init` works correctly
- `npx multiclaude launch` works correctly
- `npx multiclaude cleanup` works correctly
- All tests pass
- Package can be published to npm
- Documentation is complete and accurate

### Quality Metrics
- No duplicate code
- Consistent error handling
- Clean TypeScript compilation
- Good test coverage
- User-friendly CLI interface

## Monitoring Commands

```bash
# Check all branches for new commits
git log --oneline -3 cli-init-dev
git log --oneline -3 cli-init-test  
git log --oneline -3 cli-launcher

# View differences before merging
git diff main..cli-init-dev
git diff main..cli-init-test
git diff main..cli-launcher

# Test integration after merge
npm run build
npm test
npm link  # Update global npx multiclaude to latest build
npx multiclaude init --help
```

## Emergency Procedures

### If Merge Fails
1. Revert the merge immediately
2. Analyze the conflict carefully
3. Coordinate with development agents
4. Re-attempt merge with fixes

### If Tests Fail
1. Identify the failing test
2. Determine if it's a merge issue
3. Fix the issue or revert
4. Ensure tests pass before continuing

## Completion Criteria

The merge coordinator's job is complete when:
- All three branches have been fully merged
- The integrated package works correctly
- All tests pass
- Package is ready for npm publishing
- Documentation is complete