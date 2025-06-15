# Meta Launch Strategy Plan

Adopt the persona from hack/agent-multiplan-manager.md

## Launch Sequencing Strategy

Based on the project's current state (empty repo with no Node.js structure), agents must be launched in specific order to avoid conflicts and failures.

## Phase 1: Foundation (Sequential - MUST complete first)

### 1. Project Scaffold Agent
**Branch**: `project-scaffold`
**Plan**: `plan-project-scaffold.md`
**Why first**: Creates package.json, tsconfig.json, src/ directory - everything else depends on this
**Duration**: ~15-20 minutes
**Completion criteria**: 
- `npm install` works
- `npm run build` compiles TypeScript
- Basic CLI entry point exists

```bash
./hack/launch_coding_workers.sh project-scaffold plan-project-scaffold.md
```

**WAIT FOR COMPLETION** - Monitor commits every 5 minutes. Do not proceed until:
- package.json committed
- TypeScript compilation works
- Basic project structure exists
- merge commits into this branch

## Phase 2: Core Features (Parallel - After Phase 1 complete)

Once project scaffold is complete and merged to this branch, launch these agents in parallel:

### 2A. CLI Init Development
**Branch**: `cli-init-dev`
**Plan**: `plan-cli-init-dev.md`
**Dependencies**: Project scaffold complete
**Focus**: Implement `npx promptx init` command

### 2B. CLI Launcher Development  
**Branch**: `cli-launcher`
**Plan**: `plan-cli-launcher.md`
**Dependencies**: Project scaffold complete
**Focus**: Implement `npx promptx launch/cleanup` commands

### 2C. Merge Coordinator
**Branch**: `merge-cli-init`
**Plan**: `plan-merge-cli-init.md`
**Dependencies**: Project scaffold complete
**Focus**: Monitor and merge work from 2A and 2B

```bash
# Launch all three in parallel after Phase 1 complete
./hack/launch_coding_workers.sh cli-init-dev plan-cli-init-dev.md
./hack/launch_coding_workers.sh cli-launcher plan-cli-launcher.md  
./hack/launch_coding_workers.sh merge-cli-init plan-merge-cli-init.md
```

## Phase 3: Testing & Integration (After Phase 2 features working)

### 3. Testing Agent
**Branch**: `cli-init-test`
**Plan**: `plan-cli-init-test.md`
**Dependencies**: Core features implemented
**Focus**: Comprehensive testing of all CLI commands

```bash
# Launch once core features are working
./hack/launch_coding_workers.sh cli-init-test plan-cli-init-test.md
```

## Why This Sequence?

### Sequential Foundation Required
- **No package.json** = npm commands fail for all agents
- **No TypeScript config** = compilation fails for all agents  
- **No src/ directory** = agents don't know where to put files
- **No build system** = agents can't test their work

### Parallel Feature Development
Once foundation exists:
- Init and launcher features are independent
- Each can work on separate CLI commands
- Merge coordinator prevents conflicts
- All can build/test against same foundation

### Testing Last
- Needs working features to test
- Can validate integrated system
- Catches integration issues
- Provides final validation

## Critical Success Factors

### Phase 1 Success Criteria
- [ ] package.json with correct bin entries
- [ ] TypeScript compiles without errors
- [ ] `npm install && npm run build` works
- [ ] Basic CLI framework ready for extension
- [ ] Committed and merged to this branch

### Phase 2 Success Criteria  
- [ ] `npx promptx init` command working
- [ ] `npx promptx launch` command working
- [ ] `npx promptx cleanup` command working
- [ ] All features integrated without conflicts
- [ ] Build system works for all features

### Phase 3 Success Criteria
- [ ] Comprehensive test suite passes
- [ ] All CLI commands validated
- [ ] Package ready for npm publishing
- [ ] Documentation complete

## Monitoring Strategy

### Phase 1 Monitoring
Check every 5 minutes:
```bash
git log --oneline -3 project-scaffold
```
Look for commits:
- "Add package.json and basic structure"
- "Add TypeScript configuration"  
- "Add basic CLI entry point"
- "Complete project scaffold"

### Phase 2 Monitoring
Check every 10 minutes:
```bash
git log --oneline -3 cli-init-dev
git log --oneline -3 cli-launcher
git log --oneline -3 merge-cli-init
```

Watch for merge coordinator integrating work:
```bash
git log --oneline -5 <this branch>
```

### Phase 3 Monitoring
```bash
git log --oneline -3 cli-init-test
```

## Risk Mitigation

### Phase 1 Risks
- **Agent gets stuck on build setup** → Intervene after 30 minutes
- **Complex dependencies** → Keep minimal, basic setup only
- **TypeScript configuration issues** → Use simple, standard config

### Phase 2 Risks  
- **Merge conflicts on package.json** → Merge coordinator handles this
- **Duplicate CLI command structure** → Plans specify different commands
- **Build system conflicts** → Foundation handles this

### Phase 3 Risks
- **Tests fail on integrated system** → Expected, part of testing process
- **Integration issues discovered** → Testing agent creates fix plans

## Emergency Procedures

### If Phase 1 Fails
- Kill scaffold agent
- Manually create minimal package.json/tsconfig.json
- Commit and proceed to Phase 2

### If Phase 2 Parallel Work Conflicts
- Merge coordinator should handle
- If coordinator fails, manual intervention needed
- Prioritize init command over launcher command

### If Phase 3 Testing Reveals Issues
- Create hotfix plans for testing agent
- Fix critical issues before final integration

## Launch Commands Summary

```bash
# Phase 1: Foundation (wait for completion)
./hack/launch_coding_workers.sh project-scaffold plan-project-scaffold.md

# Monitor until complete, then Phase 2: Parallel (after Phase 1 done)
./hack/launch_coding_workers.sh cli-init-dev plan-cli-init-dev.md
./hack/launch_coding_workers.sh cli-launcher plan-cli-launcher.md
./hack/launch_coding_workers.sh merge-cli-init plan-merge-cli-init.md

# Phase 3: Testing (after core features working)
./hack/launch_coding_workers.sh cli-init-test plan-cli-init-test.md
```

## Success Metrics

- **Time to working CLI**: <2 hours total
- **Agent conflicts**: <3 merge conflicts
- **Test coverage**: >80% of CLI commands
- **Build success**: 100% after each phase
- **Npm publish ready**: Package validates correctly