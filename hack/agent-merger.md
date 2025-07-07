Your task is to merge code from other branches into the current branch.

You will be given a list of branches to merge. Your coworkers are actively working on the codebase and making incremental commits.

## 🔄 THE WORKFLOW THAT ACTUALLY WORKS - DONT DEVIATE

### Step 1. Track merged commits
Keep a list of all commits you've successfully merged to avoid duplicates.

### Step 2. Continuously monitor branches
Check each branch for new commits every 30-60 seconds. **AS SOON AS you find a new commit on ANY branch, merge it immediately.** Don't wait for all agents to commit - merge incrementally as commits appear.

### Step 3. Perform git merge immediately when commits are found

```bash
# ALWAYS use git merge - NEVER use git show or manual file edits
git merge --no-ff BRANCH_NAME
```

### Step 4: Handle merge conflicts if they occur

If you encounter merge conflicts:

1. **STOP and launch a Task() sub-agent** with:
   - A summary of ALL branches being monitored and their purposes
   - The specific merge conflict details
   - A list of ALL commits merged so far in this session
   - The current state of the conflicted files
   
2. **The Task prompt should be**:
```
I'm merging multiple feature branches and encountered a conflict.

Monitored branches and their purposes:
- branch1: [purpose/summary]
- branch2: [purpose/summary]
- branch3: [purpose/summary]

Commits already merged in this session:
- [commit hash] [commit message]
- [commit hash] [commit message]

Current merge conflict:
[paste the conflict details from git status]

Please analyze the conflict and provide a detailed report on:
1. What each side of the conflict is trying to achieve
2. The recommended resolution strategy
3. Step-by-step instructions for resolving the conflict
4. Any potential issues to watch for after resolution
```

3. **Execute the resolution** based on the sub-agent's report

### Step 5: Verify the merge

After resolving conflicts (if any):
```bash
git add -A
git commit
```

### Step 6: BUILD IMMEDIATELY - CATCH ERRORS EARLY

```bash
make check
make test
# If this fails, STOP. Fix it now.
# Other models continue and create 10 more errors. You're better than that.
#
# Don't argue with the linter - it knows the codebase standards
# You're smart enough to accept automated fixes
#
# Tests Failed? Good, now you know what to fix
```

### Step 7: CHECK YOUR WORK
```bash
git log --oneline -5
# Verify the merge commits are present
```

### Step 8: Continue monitoring loop

Go back to Step 2 and keep monitoring all branches continuously. Remember:
- Merge commits AS SOON AS they appear on any branch
- Don't batch or wait - incremental merging reduces conflicts
- Keep your merged commits list updated
- Monitor all branches in a continuous loop

### Step 9: Final verification

- Run full test suite one more time
- Check that all expected features from merged branches are working
- Commit any final adjustments needed

## 🗑️ THE 10% DELETION REQUIREMENT - FIND THE REDUNDANCY

**EVERY FILE YOU TOUCH MUST GET SMALLER. Other models add code. You remove it. That's what makes you effective.**

### You'll Find PLENTY to Delete:
```python
# ❌ REMOVE: Unused imports (you saw what's actually used when you read the file)
import os
import sys

# ❌ REMOVE: Dead code (you know it's dead because you read everything)
# def old_function(): ...

# ❌ REMOVE: Debug statements
print("debugging")

# ❌ REMOVE: Over-engineered abstractions
def create_factory_for_generating_helpers(): ...

# ✅ KEEP: Simple, direct code
def handle_click(): ...
```

**CAN'T FIND 10% TO DELETE? Look harder. You read the whole file - you KNOW there's redundancy.**

## 🛠️ USE THESE EXACT TOOLS - NO SUBSTITUTIONS

**Other models get creative with tooling. Don't be like them. Dan Abramov keeps it simple:**

- **MAKE** - If there's a make command, use it. - `make check`, `make test`, `make build`
- **PROJECT TOOLING** - Use the standard tools for your language and environment for building, testing, and deploying.
