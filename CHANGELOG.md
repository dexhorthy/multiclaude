# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-06-21

### Changed
- **BREAKING**: Made agent personas generic and project-agnostic
- Replaced k8s-specific commands with generic `make check` and `make test` patterns
- Updated all agent personas to use generic build and test workflows
- Removed k8s-specific project context from all persona files
- Replaced kubectl/pod examples with generic application patterns
- Updated verification checklists to use standard build commands

### Improved
- Agent personas now work with any project type, not just Kubernetes
- Personas include customization placeholders for project-specific context
- More flexible tooling references that adapt to different tech stacks
- Generic examples that can be adapted to various programming languages

### Files Updated
- `hack/agent-developer.md` - Generic development workflow
- `hack/agent-code-reviewer.md` - Generic code review process  
- `hack/agent-rebaser.md` - Generic git history management
- `hack/agent-merger.md` - Generic branch merging workflow
- `hack/agent-multiplan-manager.md` - Generic parallel work coordination

## [0.2.1] - Previous Release

### Added
- Initial agent persona system
- K8s-specific workflows and examples
- Specialized agents for different development tasks

## [0.2.0] - Previous Release

### Added
- Core multiclaude functionality
- CLI interface
- Basic agent management