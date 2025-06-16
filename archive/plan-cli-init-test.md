# CLI Init Tool Testing Plan

Adopt the persona from hack/agent-developer.md

## What problem(s) am I solving?

Need to thoroughly test the `npx promptx init` command and ensure it works correctly across different environments and edge cases. The testing agent will create comprehensive test scenarios and verify the CLI package works as expected.

## What user-facing changes will I ship?

- Comprehensive test suite for the init command
- Integration tests that verify real npm package behavior
- Test scenarios for different project types and configurations
- Automated testing that can be run in CI/CD
- Documentation of test coverage and known limitations

## How I will implement it

- Create test/ directory with comprehensive test files
- Use Node.js built-in test runner or Jest for testing framework
- Create temporary directories for testing init command
- Test both success and failure scenarios
- Verify file creation, content generation, and error handling
- Test npx behavior with actual package installation

## How to verify it

- Run complete test suite and verify all tests pass
- Test in fresh directory to simulate real user experience
- Verify error messages are helpful and actionable
- Test that package.json is correctly configured for npm publishing
- Test cross-platform compatibility (macOS/Linux)

## Key Requirements

### Test Categories

1. **Basic Functionality Tests**
   - `npx promptx init` creates .promptx/ directory
   - All persona files copied correctly
   - CLAUDE.staged.md generated with proper content
   - Success messages displayed appropriately

2. **Edge Case Tests**
   - Running init in directory that already has .promptx/
   - Running init without write permissions
   - Running init with partial existing files
   - Running init in git repo vs non-git directory

3. **Package Distribution Tests**
   - Test actual npm package installation
   - Test npx execution without global install
   - Verify bin entry points work correctly
   - Test TypeScript compilation and dist/ generation

4. **Content Validation Tests**
   - Verify all 5 persona files are copied
   - Check CLAUDE.staged.md contains correct template
   - Validate file permissions and structure
   - Test merge instructions are clear and actionable

5. **CLI Interface Tests**
   - Test help command output
   - Test error message quality
   - Test progress indicators
   - Test command-line argument parsing

## Files to Create/Modify

- test/init.test.ts (main test file)
- test/helpers.ts (test utilities)
- test/fixtures/ (test data)
- package.json (add test scripts)
- .github/workflows/test.yml (CI configuration)

## Technical Notes

### Test Infrastructure
- Use temporary directories for each test
- Clean up all test artifacts after completion
- Mock file system operations where appropriate
- Test both success and failure code paths

### Integration Testing
- Test actual npm pack and install process
- Verify npx execution in clean environment
- Test with different Node.js versions
- Validate published package structure

### Persona File Testing
- Verify each hack/agent-*.md file is copied correctly
- Check file contents match exactly
- Test with different persona file configurations
- Validate .promptx/personas/ directory structure

### CLAUDE.staged.md Testing
- Verify template content is correct
- Check all persona references are valid
- Test merge instruction clarity
- Validate file format and structure

## Test Scenarios

### Happy Path
1. Fresh directory, run `npx promptx init`
2. Verify all files created correctly
3. Check success message and next steps
4. Validate generated content

### Error Scenarios
1. Directory without write permissions
2. Existing .promptx/ directory
3. Missing source persona files
4. Corrupted package installation

### Edge Cases
1. Very long directory paths
2. Special characters in directory names
3. Symlinked directories
4. Network drive locations

## Verification Requirements

- All tests must pass consistently
- Test coverage should be >90%
- Performance tests for init command speed
- Memory usage tests for large projects
- Cross-platform compatibility verification

## Integration with Development

- Tests should run automatically when code changes
- Test failures should block development progress
- Test results should be easy to interpret
- Tests should be maintainable and well-documented

## Commit Strategy

- Commit test files as they are created
- Commit after each test category is complete
- Commit bug fixes discovered during testing
- Commit every 5-10 minutes after meaningful progress