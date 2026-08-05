---
name: pickup-ticket
description: "Pick up and implement a JIRA ticket with proper git workflow. Use when user says 'pick up ticket', 'work on PROJ-xxx', 'implement issue', or starts implementation work on a JIRA ticket."
---

# Pickup Ticket

Automates the workflow for picking up and implementing JIRA tickets with proper git workflow and JIRA updates. Requires `mcp-atlassian` MCP server.

## Workflow Steps

### 1. Parse Ticket Number

Accept formats:
- `PROJ-123`
- `proj-123` (case insensitive)
- Full URLs like `https://jira.../browse/PROJ-123`

### 2. Fetch Ticket Details

```
Use jira_get_issue with the ticket key
```

Extract and analyze:
- **Summary**: Brief description of the work
- **Description**: Full requirements and context
- **Acceptance Criteria**: What defines "done"
- **Technical Notes**: Implementation hints, relevant files
- **Story Points**: Estimate of complexity
- **Labels/Components**: Related areas of codebase

### 3. Create Feature Branch

**Branch naming convention**: `feature/PROJ-xxx`

```bash
git checkout main
git pull origin main
git checkout -b feature/PROJ-xxx
```

If the branch already exists, ask user whether to:
- Continue on existing branch
- Create fresh branch with suffix (e.g., `feature/PROJ-xxx-v2`)

### 4. Add JIRA Comment — Work Started

```
Use jira_add_comment:
"Implementation started. Branch: feature/PROJ-xxx"
```

### 5. Transition to In Progress

```
Use jira_get_transitions to find the "In Progress" transition
Use jira_transition_issue to move the ticket
```

### 6. Implement

- Read CLAUDE.md for project conventions
- Read all files mentioned in the ticket
- Implement the change following existing patterns
- Run lint/typecheck
- Run tests
- Commit with message: `feat(PROJ-xxx): <summary>`

### 7. Verify Against Acceptance Criteria

For each criterion in the ticket:
- Verify it's met (run test, check behavior, read code)
- Report pass/fail

### 8. Push & Report

```bash
git push -u origin feature/PROJ-xxx
```

Add JIRA comment summarizing what was done:
- Files changed
- How to test
- Any decisions made during implementation

## Rules

- Always read the full ticket before starting
- If requirements are ambiguous, ask the user — don't guess
- If scope exceeds the ticket, stop and discuss
- One ticket = one branch = one PR
