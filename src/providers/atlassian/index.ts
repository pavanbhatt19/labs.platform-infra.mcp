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

  // =========================================================================
  // JIRA: Metadata & Config
  // =========================================================================

  server.tool("jira_get_issue_types", "Get all issue types (optionally for a project)", {
    projectKey: z.string().optional().describe("Project key to get types for"),
  }, async (params) => {
    return client.jiraGetIssueTypes(params.projectKey);
  });

  server.tool("jira_get_priorities", "Get all Jira priorities", {}, async () => {
    return client.jiraGetPriorities();
  });

  server.tool("jira_get_statuses", "Get all Jira statuses", {}, async () => {
    return client.jiraGetStatuses();
  });

  server.tool("jira_get_resolutions", "Get all Jira resolutions", {}, async () => {
    return client.jiraGetResolutions();
  });

  server.tool("jira_get_fields", "Get all fields (system + custom)", {}, async () => {
    return client.jiraGetFields();
  });

  server.tool("jira_get_server_info", "Get Jira server/instance info", {}, async () => {
    return client.jiraGetServerInfo();
  });

  server.tool("jira_get_myself", "Get current authenticated user", {}, async () => {
    return client.jiraGetMyself();
  });

  server.tool("jira_get_user", "Get a user by account ID", {
    accountId: z.string().describe("Atlassian account ID"),
  }, async (params) => {
    return client.jiraGetUser(params.accountId);
  });

  // =========================================================================
  // JIRA: Issue Extended
  // =========================================================================

  server.tool("jira_get_issue_changelog", "Get issue change history", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetIssueChangelog(params.issueKey);
  });

  server.tool("jira_get_issue_editmeta", "Get editable fields metadata for an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetIssueEditMeta(params.issueKey);
  });

  server.tool("jira_update_comment", "Update an existing comment", {
    issueKey: z.string().describe("Issue key"),
    commentId: z.string().describe("Comment ID"),
    body: z.string().describe("New comment text"),
  }, async (params) => {
    return client.jiraUpdateComment(params.issueKey, params.commentId, params.body);
  });

  server.tool("jira_delete_comment", "Delete a comment", {
    issueKey: z.string().describe("Issue key"),
    commentId: z.string().describe("Comment ID"),
  }, async (params) => {
    return client.jiraDeleteComment(params.issueKey, params.commentId);
  });

  server.tool("jira_get_issue_remote_links", "Get remote links on an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetIssueRemoteLinks(params.issueKey);
  });

  server.tool("jira_create_remote_link", "Add a remote link to an issue", {
    issueKey: z.string().describe("Issue key"),
    url: z.string().describe("Link URL"),
    title: z.string().describe("Link title"),
  }, async (params) => {
    return client.jiraCreateRemoteLink(params.issueKey, params.url, params.title);
  });

  server.tool("jira_delete_issue_link", "Delete a link between two issues", {
    linkId: z.string().describe("Issue link ID"),
  }, async (params) => {
    return client.jiraDeleteIssueLink(params.linkId);
  });

  server.tool("jira_get_issue_votes", "Get votes on an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetIssueVotes(params.issueKey);
  });

  server.tool("jira_add_vote", "Vote for an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraAddVote(params.issueKey);
  });

  server.tool("jira_remove_vote", "Remove your vote from an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraRemoveVote(params.issueKey);
  });

  // =========================================================================
  // JIRA: Attachments
  // =========================================================================

  server.tool("jira_get_issue_attachments", "Get all attachments on an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetIssueAttachments(params.issueKey);
  });

  server.tool("jira_get_attachment", "Get attachment metadata by ID", {
    attachmentId: z.string().describe("Attachment ID"),
  }, async (params) => {
    return client.jiraGetAttachment(params.attachmentId);
  });

  server.tool("jira_delete_attachment", "Delete an attachment", {
    attachmentId: z.string().describe("Attachment ID"),
  }, async (params) => {
    return client.jiraDeleteAttachment(params.attachmentId);
  });

  // =========================================================================
  // JIRA: Versions CRUD
  // =========================================================================

  server.tool("jira_create_version", "Create a project version/release", {
    name: z.string().describe("Version name"),
    projectId: z.string().describe("Project ID (numeric)"),
    description: z.string().optional().describe("Version description"),
    releaseDate: z.string().optional().describe("Release date (YYYY-MM-DD)"),
    startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    released: z.boolean().optional().describe("Mark as released"),
  }, async (params) => {
    return client.jiraCreateVersion(params);
  });

  server.tool("jira_update_version", "Update a version/release", {
    versionId: z.string().describe("Version ID"),
    name: z.string().optional().describe("New name"),
    description: z.string().optional().describe("New description"),
    released: z.boolean().optional().describe("Mark as released"),
    archived: z.boolean().optional().describe("Mark as archived"),
    releaseDate: z.string().optional().describe("Release date"),
  }, async (params) => {
    const { versionId, ...rest } = params;
    return client.jiraUpdateVersion(versionId, rest);
  });

  server.tool("jira_delete_version", "Delete a version/release", {
    versionId: z.string().describe("Version ID"),
  }, async (params) => {
    return client.jiraDeleteVersion(params.versionId);
  });

  // =========================================================================
  // JIRA: Components CRUD
  // =========================================================================

  server.tool("jira_create_component", "Create a project component", {
    name: z.string().describe("Component name"),
    projectKey: z.string().describe("Project key"),
    description: z.string().optional().describe("Component description"),
    leadAccountId: z.string().optional().describe("Component lead account ID"),
  }, async (params) => {
    return client.jiraCreateComponent(params);
  });

  server.tool("jira_update_component", "Update a component", {
    componentId: z.string().describe("Component ID"),
    name: z.string().optional().describe("New name"),
    description: z.string().optional().describe("New description"),
    leadAccountId: z.string().optional().describe("New lead"),
  }, async (params) => {
    const { componentId, ...rest } = params;
    return client.jiraUpdateComponent(componentId, rest);
  });

  server.tool("jira_delete_component", "Delete a component", {
    componentId: z.string().describe("Component ID"),
  }, async (params) => {
    return client.jiraDeleteComponent(params.componentId);
  });

  // =========================================================================
  // JIRA: Boards Extended
  // =========================================================================

  server.tool("jira_get_board", "Get board details", {
    boardId: z.number().describe("Board ID"),
  }, async (params) => {
    return client.jiraGetBoard(params.boardId);
  });

  server.tool("jira_get_board_backlog", "Get backlog issues for a board", {
    boardId: z.number().describe("Board ID"),
  }, async (params) => {
    return client.jiraGetBoardBacklog(params.boardId);
  });

  server.tool("jira_get_board_configuration", "Get board configuration (columns, etc.)", {
    boardId: z.number().describe("Board ID"),
  }, async (params) => {
    return client.jiraGetBoardConfiguration(params.boardId);
  });

  // =========================================================================
  // JIRA: Sprints CRUD
  // =========================================================================

  server.tool("jira_create_sprint", "Create a new sprint", {
    name: z.string().describe("Sprint name"),
    boardId: z.number().describe("Origin board ID"),
    startDate: z.string().optional().describe("Start date (ISO 8601)"),
    endDate: z.string().optional().describe("End date (ISO 8601)"),
    goal: z.string().optional().describe("Sprint goal"),
  }, async (params) => {
    return client.jiraCreateSprint(params);
  });

  server.tool("jira_get_sprint", "Get sprint details", {
    sprintId: z.number().describe("Sprint ID"),
  }, async (params) => {
    return client.jiraGetSprint(params.sprintId);
  });

  server.tool("jira_update_sprint", "Update a sprint (name, dates, state)", {
    sprintId: z.number().describe("Sprint ID"),
    name: z.string().optional().describe("New name"),
    state: z.enum(["active", "closed", "future"]).optional().describe("New state"),
    startDate: z.string().optional().describe("Start date"),
    endDate: z.string().optional().describe("End date"),
    goal: z.string().optional().describe("Sprint goal"),
  }, async (params) => {
    const { sprintId, ...rest } = params;
    return client.jiraUpdateSprint(sprintId, rest);
  });

  server.tool("jira_delete_sprint", "Delete a sprint", {
    sprintId: z.number().describe("Sprint ID"),
  }, async (params) => {
    return client.jiraDeleteSprint(params.sprintId);
  });

  // =========================================================================
  // JIRA: Epics
  // =========================================================================

  server.tool("jira_get_epic", "Get epic details", {
    epicIdOrKey: z.string().describe("Epic ID or key"),
  }, async (params) => {
    return client.jiraGetEpic(params.epicIdOrKey);
  });

  server.tool("jira_get_epic_issues", "Get issues belonging to an epic", {
    epicIdOrKey: z.string().describe("Epic ID or key"),
  }, async (params) => {
    return client.jiraGetEpicIssues(params.epicIdOrKey);
  });

  server.tool("jira_move_to_epic", "Move issues to an epic", {
    epicIdOrKey: z.string().describe("Target epic ID or key"),
    issueKeys: z.array(z.string()).describe("Issue keys to move"),
  }, async (params) => {
    return client.jiraMoveToEpic(params.epicIdOrKey, params.issueKeys);
  });

  server.tool("jira_remove_from_epic", "Remove issues from their epic", {
    issueKeys: z.array(z.string()).describe("Issue keys to remove from epic"),
  }, async (params) => {
    return client.jiraRemoveFromEpic(params.issueKeys);
  });

  // =========================================================================
  // JIRA: Filters
  // =========================================================================

  server.tool("jira_get_my_filters", "Get current user's saved filters", {}, async () => {
    return client.jiraGetMyFilters();
  });

  server.tool("jira_get_filter", "Get a saved filter by ID", {
    filterId: z.string().describe("Filter ID"),
  }, async (params) => {
    return client.jiraGetFilter(params.filterId);
  });

  server.tool("jira_create_filter", "Create a saved filter", {
    name: z.string().describe("Filter name"),
    jql: z.string().describe("JQL query"),
    description: z.string().optional().describe("Filter description"),
    favourite: z.boolean().optional().describe("Mark as favourite"),
  }, async (params) => {
    return client.jiraCreateFilter(params);
  });

  server.tool("jira_update_filter", "Update a saved filter", {
    filterId: z.string().describe("Filter ID"),
    name: z.string().optional().describe("New name"),
    jql: z.string().optional().describe("New JQL"),
    description: z.string().optional().describe("New description"),
  }, async (params) => {
    const { filterId, ...rest } = params;
    return client.jiraUpdateFilter(filterId, rest);
  });

  server.tool("jira_delete_filter", "Delete a saved filter", {
    filterId: z.string().describe("Filter ID"),
  }, async (params) => {
    return client.jiraDeleteFilter(params.filterId);
  });

  // =========================================================================
  // JIRA: Dashboards
  // =========================================================================

  server.tool("jira_get_dashboards", "Get all dashboards", {}, async () => {
    return client.jiraGetDashboards();
  });

  server.tool("jira_get_dashboard", "Get a specific dashboard", {
    dashboardId: z.string().describe("Dashboard ID"),
  }, async (params) => {
    return client.jiraGetDashboard(params.dashboardId);
  });

  // =========================================================================
  // JIRA: Project Roles & Permissions
  // =========================================================================

  server.tool("jira_get_project_roles", "Get all roles for a project", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetProjectRoles(params.projectKey);
  });

  server.tool("jira_get_project_role", "Get members of a project role", {
    projectKey: z.string().describe("Project key"),
    roleId: z.string().describe("Role ID"),
  }, async (params) => {
    return client.jiraGetProjectRole(params.projectKey, params.roleId);
  });

  server.tool("jira_get_permission_scheme", "Get project permission scheme", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetPermissionScheme(params.projectKey);
  });

  server.tool("jira_get_notification_scheme", "Get project notification scheme", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetNotificationScheme(params.projectKey);
  });

  // =========================================================================
  // JIRA: Ranking & Bulk
  // =========================================================================

  server.tool("jira_rank_issues", "Rank/reorder issues on a board", {
    issueKeys: z.array(z.string()).describe("Issue keys to rank"),
    rankBeforeIssue: z.string().optional().describe("Rank before this issue key"),
    rankAfterIssue: z.string().optional().describe("Rank after this issue key"),
  }, async (params) => {
    return client.jiraRankIssues(params);
  });

  server.tool("jira_bulk_create_issues", "Create multiple issues in one call", {
    issues: z.array(z.record(z.any())).describe("Array of issue creation objects (each with fields)"),
  }, async (params) => {
    return client.jiraBulkCreateIssues(params.issues);
  });

  // =========================================================================
  // CONFLUENCE: Extended
  // =========================================================================

  server.tool("confluence_get_space", "Get details of a specific Confluence space", {
    spaceKey: z.string().describe("Space key"),
  }, async (params) => {
    return client.confluenceGetSpace(params.spaceKey);
  });

  server.tool("confluence_create_space", "Create a new Confluence space", {
    key: z.string().describe("Space key (uppercase, no spaces)"),
    name: z.string().describe("Space name"),
    description: z.string().optional().describe("Space description"),
  }, async (params) => {
    return client.confluenceCreateSpace(params);
  });

  server.tool("confluence_delete_space", "Delete a Confluence space", {
    spaceKey: z.string().describe("Space key"),
  }, async (params) => {
    return client.confluenceDeleteSpace(params.spaceKey);
  });

  server.tool("confluence_get_page_by_title", "Find a page by title in a space", {
    spaceKey: z.string().describe("Space key"),
    title: z.string().describe("Page title"),
  }, async (params) => {
    return client.confluenceGetPageByTitle(params.spaceKey, params.title);
  });

  server.tool("confluence_get_page_version", "Get a specific version of a page", {
    pageId: z.string().describe("Page ID"),
    versionNumber: z.number().describe("Version number"),
  }, async (params) => {
    return client.confluenceGetPageVersion(params.pageId, params.versionNumber);
  });

  server.tool("confluence_get_content_properties", "Get content properties of a page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetContentProperties(params.pageId);
  });

  server.tool("confluence_set_content_property", "Set a content property on a page", {
    pageId: z.string().describe("Page ID"),
    key: z.string().describe("Property key"),
    value: z.any().describe("Property value (JSON)"),
  }, async (params) => {
    return client.confluenceSetContentProperty(params.pageId, params.key, params.value);
  });

  server.tool("confluence_delete_content_property", "Delete a content property from a page", {
    pageId: z.string().describe("Page ID"),
    key: z.string().describe("Property key"),
  }, async (params) => {
    return client.confluenceDeleteContentProperty(params.pageId, params.key);
  });

  server.tool("confluence_get_content_restrictions", "Get restrictions on a page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetContentRestrictions(params.pageId);
  });

  server.tool("confluence_search_users", "Search Confluence users", {
    query: z.string().describe("Search query (name)"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceSearchUsers(params.query, params.limit);
  });

  server.tool("confluence_get_tasks", "Get inline tasks/comments on a page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceGetTasks(params.pageId);
  });

  server.tool("confluence_copy_page", "Copy a page to another space", {
    pageId: z.string().describe("Source page ID"),
    destinationSpaceKey: z.string().describe("Destination space key"),
    title: z.string().optional().describe("New page title"),
  }, async (params) => {
    return client.confluenceCopyPage(params.pageId, params.destinationSpaceKey, params.title);
  });

  server.tool("confluence_move_page", "Move a page under a different parent", {
    pageId: z.string().describe("Page ID to move"),
    targetPageId: z.string().describe("Target parent page ID"),
    position: z.enum(["append", "before", "after"]).optional().describe("Position relative to target (default: append)"),
  }, async (params) => {
    return client.confluenceMovePage(params.pageId, params.targetPageId, params.position);
  });

  // =========================================================================
  // JIRA: Issue Properties
  // =========================================================================

  server.tool("jira_get_issue_properties", "Get all entity properties on an issue", {
    issueKey: z.string().describe("Issue key"),
  }, async (params) => {
    return client.jiraGetIssueProperties(params.issueKey);
  });

  server.tool("jira_get_issue_property", "Get a specific issue entity property", {
    issueKey: z.string().describe("Issue key"),
    propertyKey: z.string().describe("Property key"),
  }, async (params) => {
    return client.jiraGetIssueProperty(params.issueKey, params.propertyKey);
  });

  server.tool("jira_set_issue_property", "Set an issue entity property", {
    issueKey: z.string().describe("Issue key"),
    propertyKey: z.string().describe("Property key"),
    value: z.any().describe("Property value (JSON)"),
  }, async (params) => {
    return client.jiraSetIssueProperty(params.issueKey, params.propertyKey, params.value);
  });

  server.tool("jira_delete_issue_property", "Delete an issue entity property", {
    issueKey: z.string().describe("Issue key"),
    propertyKey: z.string().describe("Property key"),
  }, async (params) => {
    return client.jiraDeleteIssueProperty(params.issueKey, params.propertyKey);
  });

  // =========================================================================
  // JIRA: Create Meta
  // =========================================================================

  server.tool("jira_get_create_meta", "Get metadata for creating issues (required fields per type)", {
    projectKeys: z.array(z.string()).optional().describe("Project keys to include"),
    issueTypeIds: z.array(z.string()).optional().describe("Issue type IDs to include"),
  }, async (params) => {
    return client.jiraGetCreateMeta(params.projectKeys, params.issueTypeIds);
  });

  // =========================================================================
  // JIRA: Groups
  // =========================================================================

  server.tool("jira_get_groups", "Get Jira groups", {
    query: z.string().optional().describe("Filter by name"),
    maxResults: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.jiraGetGroups(params.query, params.maxResults);
  });

  server.tool("jira_get_group_members", "Get members of a Jira group", {
    groupName: z.string().describe("Group name"),
    maxResults: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.jiraGetGroupMembers(params.groupName, params.maxResults);
  });

  // =========================================================================
  // JIRA: Workflows
  // =========================================================================

  server.tool("jira_get_workflows", "Get all workflow definitions", {}, async () => {
    return client.jiraGetWorkflows();
  });

  server.tool("jira_get_workflow_schemes", "Get workflow schemes for a project", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetWorkflowSchemes(params.projectKey);
  });

  // =========================================================================
  // JIRA: Screens
  // =========================================================================

  server.tool("jira_get_screens", "List all screens", {
    maxResults: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.jiraGetScreens(params.maxResults);
  });

  server.tool("jira_get_screen_tabs", "Get tabs for a screen", {
    screenId: z.string().describe("Screen ID"),
  }, async (params) => {
    return client.jiraGetScreenTabs(params.screenId);
  });

  server.tool("jira_get_screen_tab_fields", "Get fields on a screen tab", {
    screenId: z.string().describe("Screen ID"),
    tabId: z.string().describe("Tab ID"),
  }, async (params) => {
    return client.jiraGetScreenTabFields(params.screenId, params.tabId);
  });

  // =========================================================================
  // JIRA: Project Statuses & Types
  // =========================================================================

  server.tool("jira_get_project_statuses", "Get statuses available in a project", {
    projectKey: z.string().describe("Project key"),
  }, async (params) => {
    return client.jiraGetProjectStatuses(params.projectKey);
  });

  server.tool("jira_get_project_types", "Get all project types", {}, async () => {
    return client.jiraGetProjectTypes();
  });

  // =========================================================================
  // JIRA: Notifications
  // =========================================================================

  server.tool("jira_notify_issue", "Send a notification email for an issue", {
    issueKey: z.string().describe("Issue key"),
    subject: z.string().describe("Email subject"),
    textBody: z.string().describe("Email body text"),
    to: z.record(z.any()).optional().describe("Recipients object (users, groups, etc.)"),
  }, async (params) => {
    return client.jiraNotifyIssue(params.issueKey, params);
  });

  // =========================================================================
  // JIRA: Configuration & Audit
  // =========================================================================

  server.tool("jira_get_configuration", "Get global Jira configuration", {}, async () => {
    return client.jiraGetConfiguration();
  });

  server.tool("jira_get_audit_records", "Get Jira audit log records", {
    from: z.string().optional().describe("From date (ISO 8601)"),
    to: z.string().optional().describe("To date (ISO 8601)"),
    filter: z.string().optional().describe("Text filter"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.jiraGetAuditRecords(params);
  });

  // =========================================================================
  // JIRA: Security Schemes
  // =========================================================================

  server.tool("jira_get_issue_security_schemes", "Get all issue security schemes", {}, async () => {
    return client.jiraGetIssueSecuritySchemes();
  });

  // =========================================================================
  // JIRA: Worklog Extended
  // =========================================================================

  server.tool("jira_update_worklog", "Update an existing worklog entry", {
    issueKey: z.string().describe("Issue key"),
    worklogId: z.string().describe("Worklog ID"),
    timeSpent: z.string().optional().describe("New time spent (e.g. '2h 30m')"),
    comment: z.string().optional().describe("New comment"),
    started: z.string().optional().describe("New start time (ISO 8601)"),
  }, async (params) => {
    const { issueKey, worklogId, ...rest } = params;
    return client.jiraUpdateWorklog(issueKey, worklogId, rest);
  });

  server.tool("jira_delete_worklog", "Delete a worklog entry", {
    issueKey: z.string().describe("Issue key"),
    worklogId: z.string().describe("Worklog ID"),
  }, async (params) => {
    return client.jiraDeleteWorklog(params.issueKey, params.worklogId);
  });

  // =========================================================================
  // CONFLUENCE: Restrictions CRUD
  // =========================================================================

  server.tool("confluence_set_restrictions", "Set restrictions on a page", {
    pageId: z.string().describe("Page ID"),
    restrictions: z.any().describe("Restrictions object (operations with users/groups)"),
  }, async (params) => {
    return client.confluenceSetRestrictions(params.pageId, params.restrictions);
  });

  server.tool("confluence_delete_restrictions", "Remove all restrictions from a page", {
    pageId: z.string().describe("Page ID"),
  }, async (params) => {
    return client.confluenceDeleteRestrictions(params.pageId);
  });

  // =========================================================================
  // CONFLUENCE: Space Content & Settings
  // =========================================================================

  server.tool("confluence_get_space_content", "Get all content in a space", {
    spaceKey: z.string().describe("Space key"),
    type: z.enum(["page", "blogpost"]).optional().describe("Content type filter"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceGetSpaceContent(params.spaceKey, params.type, params.limit);
  });

  server.tool("confluence_get_space_settings", "Get space settings", {
    spaceKey: z.string().describe("Space key"),
  }, async (params) => {
    return client.confluenceGetSpaceSettings(params.spaceKey);
  });

  // =========================================================================
  // CONFLUENCE: Templates & Blueprints
  // =========================================================================

  server.tool("confluence_get_templates", "Get page templates", {
    spaceKey: z.string().optional().describe("Space key to filter templates"),
  }, async (params) => {
    return client.confluenceGetTemplates(params.spaceKey);
  });

  server.tool("confluence_get_blueprints", "Get content blueprints", {}, async () => {
    return client.confluenceGetBlueprints();
  });

  server.tool("confluence_create_from_template", "Create a page from a template/blueprint", {
    templateId: z.string().describe("Content template ID"),
    spaceKey: z.string().describe("Space key"),
    title: z.string().describe("Page title"),
    parentId: z.string().optional().describe("Parent page ID"),
  }, async (params) => {
    return client.confluenceCreateFromTemplate(params);
  });

  // =========================================================================
  // CONFLUENCE: Long Tasks
  // =========================================================================

  server.tool("confluence_get_long_tasks", "Get long-running tasks", {
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceGetLongTasks(params.limit);
  });

  server.tool("confluence_get_long_task", "Get a specific long-running task status", {
    taskId: z.string().describe("Task ID"),
  }, async (params) => {
    return client.confluenceGetLongTask(params.taskId);
  });

  // =========================================================================
  // CONFLUENCE: Groups & Audit
  // =========================================================================

  server.tool("confluence_get_groups", "Get Confluence groups", {
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceGetGroups(params.limit);
  });

  server.tool("confluence_get_group_members", "Get members of a Confluence group", {
    groupName: z.string().describe("Group name"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceGetGroupMembers(params.groupName, params.limit);
  });

  server.tool("confluence_get_audit_records", "Get Confluence audit log records", {
    startDate: z.string().optional().describe("Start date"),
    endDate: z.string().optional().describe("End date"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.confluenceGetAuditRecords(params);
  });

  // =========================================================================
  // CONFLUENCE: Attachments CRUD
  // =========================================================================

  server.tool("confluence_delete_attachment", "Delete an attachment from a page", {
    pageId: z.string().describe("Page ID"),
    attachmentId: z.string().describe("Attachment content ID"),
  }, async (params) => {
    return client.confluenceDeleteAttachment(params.pageId, params.attachmentId);
  });

  server.tool("confluence_get_attachment_by_id", "Get attachment details by ID", {
    attachmentId: z.string().describe("Attachment content ID"),
  }, async (params) => {
    return client.confluenceGetAttachmentById(params.attachmentId);
  });

  // =========================================================================
  // JIRA: Permissions
  // =========================================================================

  server.tool("jira_get_my_permissions", "Get current user's permissions", {
    projectKey: z.string().optional().describe("Scope to a project"),
    issueKey: z.string().optional().describe("Scope to an issue"),
  }, async (params) => {
    return client.jiraGetMyPermissions(params);
  });

  server.tool("jira_get_all_permissions", "Get all permissions defined in Jira", {}, async () => {
    return client.jiraGetAllPermissions();
  });

  // =========================================================================
  // JIRA: Status Categories
  // =========================================================================

  server.tool("jira_get_status_categories", "Get all status categories", {}, async () => {
    return client.jiraGetStatusCategories();
  });

  server.tool("jira_get_status_category", "Get a specific status category", {
    idOrKey: z.string().describe("Status category ID or key"),
  }, async (params) => {
    return client.jiraGetStatusCategory(params.idOrKey);
  });

  // =========================================================================
  // JIRA: Custom Fields
  // =========================================================================

  server.tool("jira_get_custom_fields", "Search/list custom fields", {
    search: z.string().optional().describe("Search by name"),
    maxResults: z.number().optional().describe("Max results"),
    startAt: z.number().optional().describe("Pagination offset"),
  }, async (params) => {
    return client.jiraGetCustomFields(params);
  });

  server.tool("jira_get_custom_field_options", "Get options for a custom field", {
    fieldId: z.string().describe("Custom field ID (e.g. customfield_10001)"),
    maxResults: z.number().optional().describe("Max results"),
    startAt: z.number().optional().describe("Pagination offset"),
  }, async (params) => {
    const { fieldId, ...rest } = params;
    return client.jiraGetCustomFieldOptions(fieldId, rest);
  });

  // =========================================================================
  // JIRA: Application Properties
  // =========================================================================

  server.tool("jira_get_application_properties", "Get Jira application properties/settings", {
    key: z.string().optional().describe("Specific property key"),
  }, async (params) => {
    return client.jiraGetApplicationProperties(params.key);
  });

  // =========================================================================
  // JIRA: Security Levels
  // =========================================================================

  server.tool("jira_get_security_level", "Get a specific security level details", {
    levelId: z.string().describe("Security level ID"),
  }, async (params) => {
    return client.jiraGetSecurityLevel(params.levelId);
  });

  // =========================================================================
  // JIRA: Navigator Columns
  // =========================================================================

  server.tool("jira_get_default_columns", "Get default issue navigator columns", {}, async () => {
    return client.jiraGetDefaultColumns();
  });

  // =========================================================================
  // JIRA: Filter Search
  // =========================================================================

  server.tool("jira_get_favourite_filters", "Get current user's favourite filters", {}, async () => {
    return client.jiraGetFavouriteFilters();
  });

  server.tool("jira_search_filters", "Search for filters by name", {
    filterName: z.string().optional().describe("Filter name to search"),
    maxResults: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.jiraSearchFilters(params.filterName, params.maxResults);
  });
}
