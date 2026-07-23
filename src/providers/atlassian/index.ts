import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AtlassianConfig } from "../../config.js";
import { AtlassianClient } from "./client.js";

export function registerAtlassianTools(server: McpServer, config: AtlassianConfig) {
  const client = new AtlassianClient(config);

  // --- Jira ---
  server.tool("jira_search", "Search Jira issues using JQL", {
    jql: z.string().describe("JQL query string"),
    fields: z.array(z.string()).optional().describe("Fields to include"),
    maxResults: z.number().optional().describe("Max results (default 50)"),
  }, async (params) => {
    return client.jiraSearch(params.jql, params.fields, params.maxResults);
  });

  server.tool("jira_get_issue", "Get details of a Jira issue", {
    issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
  }, async (params) => {
    return client.jiraGetIssue(params.issueKey);
  });

  server.tool("jira_create_issue", "Create a new Jira issue", {
    projectKey: z.string().describe("Project key"),
    issueType: z.string().describe("Issue type (Bug, Task, Story)"),
    summary: z.string().describe("Issue summary"),
    description: z.string().optional().describe("Issue description"),
  }, async (params) => {
    return client.jiraCreateIssue(params);
  });

  server.tool("jira_update_issue", "Update a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    fields: z.record(z.any()).describe("Fields to update"),
  }, async (params) => {
    return client.jiraUpdateIssue(params.issueKey, params.fields);
  });

  server.tool("jira_add_comment", "Add a comment to a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    comment: z.string().describe("Comment text"),
  }, async (params) => {
    return client.jiraAddComment(params.issueKey, params.comment);
  });

  server.tool("jira_get_transitions", "Get available transitions for an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetTransitions(params.issueKey);
  });

  server.tool("jira_transition_issue", "Transition a Jira issue to a new status", {
    issueKey: z.string().describe("Issue key"),
    transitionId: z.string().describe("Transition ID"),
  }, async (params) => {
    return client.jiraTransitionIssue(params.issueKey, params.transitionId);
  });

  server.tool("jira_list_projects", "List all Jira projects", {}, async () => {
    return client.jiraListProjects();
  });

  // --- Confluence ---
  server.tool("confluence_search", "Search Confluence using CQL", {
    cql: z.string().describe("CQL query"),
    limit: z.number().optional().describe("Max results (default 25)"),
  }, async (params) => {
    return client.confluenceSearch(params.cql, params.limit);
  });

  server.tool("confluence_get_page", "Get a Confluence page by ID", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetPage(params.pageId);
  });

  server.tool("confluence_create_page", "Create a new Confluence page", {
    spaceKey: z.string().describe("Space key"),
    title: z.string().describe("Page title"),
    body: z.string().describe("Page body (HTML storage format)"),
    parentId: z.string().optional().describe("Parent page ID"),
  }, async (params) => {
    return client.confluenceCreatePage(params);
  });

  server.tool("confluence_list_spaces", "List Confluence spaces", {
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceListSpaces(params.limit);
  });

  // --- Jira: Extended Issue Ops ---
  server.tool("jira_delete_issue", "Delete a Jira issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraDeleteIssue(params.issueKey);
  });

  server.tool("jira_assign_issue", "Assign a Jira issue to a user", {
    issueKey: z.string().describe("Issue key"),
    accountId: z.string().describe("Atlassian account ID of the assignee"),
  }, async (params) => {
    return client.jiraAssignIssue(params.issueKey, params.accountId);
  });

  server.tool("jira_get_comments", "Get all comments on a Jira issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetComments(params.issueKey);
  });

  server.tool("jira_search_users", "Search for Jira users by name or email", {
    query: z.string().describe("Search query"),
    maxResults: z.number().optional().describe("Max results (default 50)"),
  }, async (params) => {
    return client.jiraSearchUsers(params.query, params.maxResults);
  });

  // --- Jira: Labels ---
  server.tool("jira_add_labels", "Add labels to a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    labels: z.array(z.string()).describe("Labels to add"),
  }, async (params) => {
    return client.jiraAddLabels(params.issueKey, params.labels);
  });

  server.tool("jira_remove_labels", "Remove labels from a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    labels: z.array(z.string()).describe("Labels to remove"),
  }, async (params) => {
    return client.jiraRemoveLabels(params.issueKey, params.labels);
  });

  // --- Jira: Watchers ---
  server.tool("jira_get_watchers", "Get watchers of a Jira issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetWatchers(params.issueKey);
  });

  server.tool("jira_add_watcher", "Add a watcher to a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    accountId: z.string().describe("Account ID of the watcher"),
  }, async (params) => {
    return client.jiraAddWatcher(params.issueKey, params.accountId);
  });

  server.tool("jira_remove_watcher", "Remove a watcher from a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    accountId: z.string().describe("Account ID to remove"),
  }, async (params) => {
    return client.jiraRemoveWatcher(params.issueKey, params.accountId);
  });

  // --- Jira: Worklogs ---
  server.tool("jira_get_worklogs", "Get work logs for a Jira issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetWorklogs(params.issueKey);
  });

  server.tool("jira_add_worklog", "Add a work log entry to a Jira issue", {
    issueKey: z.string().describe("Issue key"),
    timeSpent: z.string().describe("Time spent (e.g. '2h 30m', '1d')"),
    comment: z.string().optional().describe("Work log comment"),
    started: z.string().optional().describe("Start date/time in ISO format"),
  }, async (params) => {
    return client.jiraAddWorklog(params.issueKey, params.timeSpent, params.comment, params.started);
  });

  // --- Jira: Links ---
  server.tool("jira_get_issue_link_types", "Get available issue link types", {}, async () => {
    return client.jiraGetIssueLinkTypes();
  });

  server.tool("jira_link_issues", "Create a link between two Jira issues", {
    type: z.string().describe("Link type name (e.g. 'Blocks', 'Relates')"),
    inwardIssue: z.string().describe("Inward issue key"),
    outwardIssue: z.string().describe("Outward issue key"),
  }, async (params) => {
    return client.jiraLinkIssues(params.type, params.inwardIssue, params.outwardIssue);
  });

  // --- Jira: Components & Versions ---
  server.tool("jira_get_components", "List components for a Jira project", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetComponents(params.projectKey);
  });

  server.tool("jira_get_versions", "List versions/releases for a Jira project", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetVersions(params.projectKey);
  });

  server.tool("jira_get_project", "Get detailed info about a Jira project", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetProject(params.projectKey);
  });

  // --- Jira: Boards & Sprints ---
  server.tool("jira_list_boards", "List Jira boards (Scrum/Kanban)", {
    projectKeyOrId: z.string().optional().describe("Filter by project"),
    type: z.enum(["scrum", "kanban"]).optional().describe("Filter by board type"),
  }, async (params) => {
    return client.jiraListBoards(params.projectKeyOrId, params.type);
  });

  server.tool("jira_get_sprints", "Get sprints for a board", {
    boardId: z.number().describe("Board ID"),
    state: z.enum(["active", "closed", "future"]).optional().describe("Filter by sprint state"),
  }, async (params) => {
    return client.jiraGetSprints(params.boardId, params.state);
  });

  server.tool("jira_get_sprint_issues", "Get issues in a sprint", {
    sprintId: z.number().describe("Sprint ID"),
  }, async (params) => {
    return client.jiraGetSprintIssues(params.sprintId);
  });

  server.tool("jira_move_to_sprint", "Move issues to a sprint", {
    sprintId: z.number().describe("Sprint ID"),
    issueKeys: z.array(z.string()).describe("Issue keys to move"),
  }, async (params) => {
    return client.jiraMoveToSprint(params.sprintId, params.issueKeys);
  });

  // --- Jira: Bulk ---
  server.tool("jira_bulk_transition", "Transition multiple issues at once", {
    issueKeys: z.array(z.string()).describe("Issue keys to transition"),
    transitionId: z.string().describe("Transition ID to apply"),
  }, async (params) => {
    return client.jiraBulkTransition(params.issueKeys, params.transitionId);
  });

  // --- Confluence: Extended ---
  server.tool("confluence_update_page", "Update an existing Confluence page", {
    pageId: z.string().describe("Page ID"),
    title: z.string().describe("Page title"),
    body: z.string().describe("New page body (HTML storage format)"),
    version: z.number().describe("Current version number (will be incremented)"),
  }, async (params) => {
    return client.confluenceUpdatePage(params.pageId, params.title, params.body, params.version);
  });

  server.tool("confluence_delete_page", "Delete a Confluence page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceDeletePage(params.pageId);
  });

  server.tool("confluence_get_children", "Get child pages of a Confluence page", {
    pageId: z.string().describe("Parent page ID"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceGetChildren(params.pageId, params.limit);
  });

  server.tool("confluence_get_comments", "Get comments on a Confluence page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetComments(params.pageId);
  });

  server.tool("confluence_add_comment", "Add a comment to a Confluence page", {
    pageId: z.string().describe("Page ID"),
    body: z.string().describe("Comment body (HTML storage format)"),
  }, async (params) => {
    return client.confluenceAddComment(params.pageId, params.body);
  });

  server.tool("confluence_get_labels", "Get labels on a Confluence page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetLabels(params.pageId);
  });

  server.tool("confluence_add_labels", "Add labels to a Confluence page", {
    pageId: z.string().describe("Page ID"),
    labels: z.array(z.string()).describe("Labels to add"),
  }, async (params) => {
    return client.confluenceAddLabels(params.pageId, params.labels);
  });

  server.tool("confluence_remove_label", "Remove a label from a Confluence page", {
    pageId: z.string().describe("Page ID"),
    label: z.string().describe("Label to remove"),
  }, async (params) => {
    return client.confluenceRemoveLabel(params.pageId, params.label);
  });

  server.tool("confluence_get_page_history", "Get version history of a Confluence page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetPageHistory(params.pageId);
  });

  server.tool("confluence_get_attachments", "List attachments on a Confluence page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetAttachments(params.pageId);
  });
}
