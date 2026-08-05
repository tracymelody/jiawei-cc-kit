---
name: jira-lead
description: "Create tickets, epics, manage sprints in JIRA for team leadership. Use when user says 'create a ticket', 'create an epic', 'search tickets', 'update ticket', 'check sprint', 'plan sprint work'."
---

# JIRA Lead Management

This skill provides guidance for managing JIRA tickets, epics, and sprints as a tech lead. Requires `mcp-atlassian` MCP server to be configured.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `jira_create_issue` | Create tickets, stories, epics, tasks |
| `jira_update_issue` | Update existing tickets |
| `jira_get_issue` | Fetch ticket details |
| `jira_search` | Search tickets with JQL |
| `jira_create_issue_link` | Link related issues |
| `jira_get_all_projects` | List available projects |
| `jira_get_agile_boards` | List agile boards |
| `jira_get_sprints_from_board` | Get sprint information |
| `jira_search_fields` | Search available fields |
| `jira_transition_issue` | Move ticket through workflow |
| `jira_add_comment` | Add comments to tickets |

## Core Workflows

### Creating an Epic

1. Get project info: `jira_get_all_projects`
2. Create with required fields:
   - **summary**: Clear, concise title
   - **description**: Use Standard Format (see below)
   - **issuetype**: "Epic"
   - **project**: Project key

3. **Standard Epic Format:**
   ```
   *High-level description:*

   → Business value: [One sentence explaining business impact]

   h3. Goals
   * *[Goal 1]:* [Description and impact]
   * *[Goal 2]:* [Description and impact]

   h3. Scope
   * *[Scope item 1]:* [Detailed description]
   * *[Scope item 2]:* [Detailed description]

   h3. Key Files & Architecture
   * [file/module]: [purpose]

   h3. Acceptance Criteria
   * [ ] [Criterion 1]
   * [ ] [Criterion 2]
   ```

### Creating a Story/Task

1. Identify parent epic (if any)
2. Create with:
   - **summary**: Action-oriented title ("Implement X", "Add Y")
   - **description**: What + Why + Acceptance Criteria
   - **issuetype**: "Story" or "Task"
   - **project**: Project key
3. Link to epic: `jira_create_issue_link` with type "is part of"

### Searching Tickets

Use JQL (JIRA Query Language):
- All open in sprint: `sprint in openSprints() AND status != Done`
- Assigned to me: `assignee = currentUser() AND status != Done`
- By epic: `"Epic Link" = PROJ-123`
- Recent updates: `project = PROJ AND updated >= -7d ORDER BY updated DESC`

### Sprint Planning

1. Get board: `jira_get_agile_boards`
2. Get sprints: `jira_get_sprints_from_board`
3. Review backlog: `jira_search` with `sprint is EMPTY AND status = "To Do"`
4. Move to sprint: `jira_update_issue` with sprint field

### Updating Ticket Status

1. Get transitions: `jira_get_transitions` for the issue
2. Transition: `jira_transition_issue` with the target transition ID
3. Add comment explaining the change if relevant

## Tips

- Always search before creating to avoid duplicates
- Use labels consistently across the team
- Link related issues (blocks, is blocked by, relates to)
- Add comments when picking up or completing work
