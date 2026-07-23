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
}
