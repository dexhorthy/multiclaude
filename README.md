# promptx

A CLI tool that initializes AI agent personas into your projects for consistent, role-based development workflows.

## What is promptx?

promptx is a simple npm package that helps teams adopt specialized AI agent personas for different development tasks. Instead of generic AI assistance, you get focused agents with specific workflows, rules, and expertise areas.

## Quick Start

```bash
# Initialize agent personas into your project
npx promptx init

# Follow the instructions to merge CLAUDE.staged.md into CLAUDE.md
```

### 1. File Structure

After running `npx promptx init`, you'll get:

```
your-project/
├── .promptx/
│   └── personas/
│       ├── agent-developer.md           # For coding & implementation
│       ├── agent-code-reviewer.md       # For code review & quality
│       ├── agent-rebaser.md            # For git history cleanup
│       ├── agent-merger.md             # For merging branches
│       └── agent-multiplan-manager.md  # For orchestrating work
├── CLAUDE.staged.md                    # Ready to merge into CLAUDE.md
└── ... (your existing project files)
```

### 2. Merge the template
Copy or merge `CLAUDE.staged.md` into your `CLAUDE.md` file.

### 3. Customize for your project
Edit the `CLAUDE.md` file to add:
- Your project's tech stack
- Build and test commands
- Project structure details
- Deployment processes

### 4. Start coding
When working with AI agents like claude code, instruct it to adopt the persona you selected.

## The 5 Agent Personas

### 🔨 Developer Agent
**Use for:** Writing code, implementing features, debugging, fixing bugs
- Follows "read 1500+ lines first" rule to understand context
- Maintains 20+ item TODO lists for complex tasks
- Commits every 5-10 minutes with meaningful progress
- Deletes more code than it adds to reduce complexity

### 👀 Code Reviewer Agent  
**Use for:** Reviewing pull requests, checking code quality, security audits
- Structured review format with critical/major/minor issues
- Focus on finding code to delete and simplify
- Detailed verification checklists
- Comprehensive security and vulnerability scanning

### 📚 Rebaser Agent
**Use for:** Cleaning git history, squashing commits, writing rich commit messages
- Creates clean, linear git history
- Writes detailed commit messages explaining the "why"
- Squashes related commits into logical units
- Always creates backup branches before rebasing

### 🔄 Merger Agent
**Use for:** Merging branches, consolidating parallel work, resolving conflicts
- Monitors multiple branches for changes
- Reads full context before merging (1500+ lines)
- Tests after each merge to catch integration issues
- Handles complex merge conflicts intelligently

### 📋 Multiplan Manager Agent
**Use for:** Breaking down large features, coordinating parallel work, creating plans
- Splits complex work into focused worker plans
- Manages parallel development streams
- Coordinates multiple agents working simultaneously
- Creates and monitors comprehensive project roadmaps


## How to Use

### 1. Initialize the personas
```bash
cd your-project
npx promptx init
```


## Example Usage

```bash
# Setting up a new project
npx promptx init
cat CLAUDE.staged.md >> CLAUDE.md  # or merge manually

# Now your CLAUDE.md has persona selection
# AI assistants will read it and adopt the right role
```

## Benefits

- **Focused Expertise**: Each agent has specialized knowledge for their domain
- **Consistent Workflows**: Same patterns across team and projects
- **Quality Enforcement**: Built-in best practices and verification steps
- **Parallel Work**: Multiple agents can work simultaneously on different aspects
- **Reduced Complexity**: Emphasis on deleting code and simplifying systems

## Development

This project itself uses the agent personas! Check out:
- `.promptx/personas/` - The agent persona definitions
- `hack/` - Original persona files and development scripts
- Worker plans for implementing features in parallel

### Project Structure

```
promptx/
├── src/
│   ├── cli.ts          # Main CLI entry point
│   └── init.ts         # Initialization logic
├── hack/               # Agent persona source files
│   ├── agent-developer.md
│   ├── agent-code-reviewer.md
│   ├── agent-rebaser.md
│   ├── agent-merger.md
│   ├── agent-multiplan-manager.md
│   └── CLAUDE.staged.md        # Example template
├── plan-cli-init-tool.md       # Worker plan for implementation
├── plan-merge-coordinator-cli.md # Worker plan for coordination
└── README.md           # This file
```

## Contributing

This project uses its own agent personas for development:

1. Use **Developer Agent** for implementing features
2. Use **Code Reviewer Agent** for reviewing changes  
3. Use **Merger Agent** for consolidating work
4. Use **Multiplan Manager Agent** for coordinating large features

## License

MIT