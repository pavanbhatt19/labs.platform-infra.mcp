import axios, { AxiosInstance } from "axios";
import { AtlassianConfig } from "../../config.js";
import { toolResult, toolError } from "../../utils/http.js";

export class AtlassianClient {
  private config: AtlassianConfig;
  private http: AxiosInstance;

  constructor(config: AtlassianConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.host,
      timeout: 30000,
      headers: {
        "Authorization": `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString("base64")}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
  }

  // --- Jira ---
  async jiraSearch(jql: string, fields?: string[], maxResults?: number) {
    try {
      const response = await this.http.post("/rest/api/3/search", {
        jql,
        fields: fields || ["summary", "status", "assignee", "priority", "issuetype"],
        maxResults: maxResults || 50,
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Jira search failed: ${error.response?.data?.errorMessages || error.message}`);
    }
  }

  async jiraGetIssue(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get issue: ${error.message}`);
    }
  }

  async jiraCreateIssue(params: Record<string, any>) {
    try {
      const fields: Record<string, any> = {
        project: { key: params.projectKey },
        issuetype: { name: params.issueType },
        summary: params.summary,
      };
      if (params.description) fields.description = { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: params.description }] }] };
      if (params.fields) Object.assign(fields, params.fields);
      const response = await this.http.post("/rest/api/3/issue", { fields });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create issue: ${error.response?.data?.errors || error.message}`);
    }
  }

  async jiraUpdateIssue(issueKey: string, fields: Record<string, any>) {
    try {
      await this.http.put(`/rest/api/3/issue/${issueKey}`, { fields });
      return toolResult({ status: "updated", issueKey });
    } catch (error: any) {
      return toolError(`Failed to update issue: ${error.message}`);
    }
  }

  async jiraAddComment(issueKey: string, comment: string) {
    try {
      const body = { body: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }] } };
      const response = await this.http.post(`/rest/api/3/issue/${issueKey}/comment`, body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add comment: ${error.message}`);
    }
  }

  async jiraGetTransitions(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/transitions`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get transitions: ${error.message}`);
    }
  }

  async jiraTransitionIssue(issueKey: string, transitionId: string) {
    try {
      await this.http.post(`/rest/api/3/issue/${issueKey}/transitions`, { transition: { id: transitionId } });
      return toolResult({ status: "transitioned", issueKey });
    } catch (error: any) {
      return toolError(`Failed to transition issue: ${error.message}`);
    }
  }

  async jiraListProjects() {
    try {
      const response = await this.http.get("/rest/api/3/project");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list projects: ${error.message}`);
    }
  }

  // --- Confluence ---
  async confluenceSearch(cql: string, limit?: number) {
    try {
      const response = await this.http.get("/wiki/rest/api/content/search", {
        params: { cql, limit: limit || 25 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Confluence search failed: ${error.message}`);
    }
  }

  async confluenceGetPage(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}`, {
        params: { expand: "body.storage,version,space" },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get page: ${error.message}`);
    }
  }

  async confluenceCreatePage(params: Record<string, any>) {
    try {
      const body: Record<string, any> = {
        type: "page",
        title: params.title,
        space: { key: params.spaceKey },
        body: { storage: { value: params.body, representation: "storage" } },
      };
      if (params.parentId) body.ancestors = [{ id: params.parentId }];
      const response = await this.http.post("/wiki/rest/api/content", body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create page: ${error.message}`);
    }
  }

  async confluenceListSpaces(limit?: number) {
    try {
      const response = await this.http.get("/wiki/rest/api/space", {
        params: { limit: limit || 25 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list spaces: ${error.message}`);
    }
  }

  // --- Jira: Issue operations ---
  async jiraDeleteIssue(issueKey: string) {
    try {
      await this.http.delete(`/rest/api/3/issue/${issueKey}`);
      return toolResult({ status: "deleted", issueKey });
    } catch (error: any) {
      return toolError(`Failed to delete issue: ${error.message}`);
    }
  }

  async jiraAssignIssue(issueKey: string, accountId: string) {
    try {
      await this.http.put(`/rest/api/3/issue/${issueKey}/assignee`, { accountId });
      return toolResult({ status: "assigned", issueKey, accountId });
    } catch (error: any) {
      return toolError(`Failed to assign issue: ${error.message}`);
    }
  }

  async jiraGetComments(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/comment`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get comments: ${error.message}`);
    }
  }

  async jiraSearchUsers(query: string, maxResults?: number) {
    try {
      const response = await this.http.get("/rest/api/3/user/search", {
        params: { query, maxResults: maxResults || 50 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to search users: ${error.message}`);
    }
  }

  // --- Jira: Labels ---
  async jiraAddLabels(issueKey: string, labels: string[]) {
    try {
      await this.http.put(`/rest/api/3/issue/${issueKey}`, {
        update: { labels: labels.map(l => ({ add: l })) },
      });
      return toolResult({ status: "labels_added", issueKey, labels });
    } catch (error: any) {
      return toolError(`Failed to add labels: ${error.message}`);
    }
  }

  async jiraRemoveLabels(issueKey: string, labels: string[]) {
    try {
      await this.http.put(`/rest/api/3/issue/${issueKey}`, {
        update: { labels: labels.map(l => ({ remove: l })) },
      });
      return toolResult({ status: "labels_removed", issueKey, labels });
    } catch (error: any) {
      return toolError(`Failed to remove labels: ${error.message}`);
    }
  }

  // --- Jira: Watchers ---
  async jiraGetWatchers(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/watchers`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get watchers: ${error.message}`);
    }
  }

  async jiraAddWatcher(issueKey: string, accountId: string) {
    try {
      await this.http.post(`/rest/api/3/issue/${issueKey}/watchers`, JSON.stringify(accountId));
      return toolResult({ status: "watcher_added", issueKey, accountId });
    } catch (error: any) {
      return toolError(`Failed to add watcher: ${error.message}`);
    }
  }

  async jiraRemoveWatcher(issueKey: string, accountId: string) {
    try {
      await this.http.delete(`/rest/api/3/issue/${issueKey}/watchers`, { params: { accountId } });
      return toolResult({ status: "watcher_removed", issueKey, accountId });
    } catch (error: any) {
      return toolError(`Failed to remove watcher: ${error.message}`);
    }
  }

  // --- Jira: Worklogs ---
  async jiraGetWorklogs(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/worklog`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get worklogs: ${error.message}`);
    }
  }

  async jiraAddWorklog(issueKey: string, timeSpent: string, comment?: string, started?: string) {
    try {
      const body: Record<string, any> = { timeSpent };
      if (comment) body.comment = { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }] };
      if (started) body.started = started;
      const response = await this.http.post(`/rest/api/3/issue/${issueKey}/worklog`, body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add worklog: ${error.message}`);
    }
  }

  // --- Jira: Links ---
  async jiraGetIssueLinkTypes() {
    try {
      const response = await this.http.get("/rest/api/3/issueLinkType");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get link types: ${error.message}`);
    }
  }

  async jiraLinkIssues(type: string, inwardIssue: string, outwardIssue: string) {
    try {
      await this.http.post("/rest/api/3/issueLink", {
        type: { name: type },
        inwardIssue: { key: inwardIssue },
        outwardIssue: { key: outwardIssue },
      });
      return toolResult({ status: "linked", type, inwardIssue, outwardIssue });
    } catch (error: any) {
      return toolError(`Failed to link issues: ${error.message}`);
    }
  }

  // --- Jira: Components & Versions ---
  async jiraGetComponents(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/components`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get components: ${error.message}`);
    }
  }

  async jiraGetVersions(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/versions`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get versions: ${error.message}`);
    }
  }

  async jiraGetProject(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get project: ${error.message}`);
    }
  }

  // --- Jira: Boards & Sprints ---
  async jiraListBoards(projectKeyOrId?: string, type?: string) {
    try {
      const params: Record<string, any> = {};
      if (projectKeyOrId) params.projectKeyOrId = projectKeyOrId;
      if (type) params.type = type;
      const response = await this.http.get("/rest/agile/1.0/board", { params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list boards: ${error.message}`);
    }
  }

  async jiraGetSprints(boardId: number, state?: string) {
    try {
      const params: Record<string, any> = {};
      if (state) params.state = state;
      const response = await this.http.get(`/rest/agile/1.0/board/${boardId}/sprint`, { params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get sprints: ${error.message}`);
    }
  }

  async jiraGetSprintIssues(sprintId: number) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/sprint/${sprintId}/issue`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get sprint issues: ${error.message}`);
    }
  }

  async jiraMoveToSprint(sprintId: number, issueKeys: string[]) {
    try {
      await this.http.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, { issues: issueKeys });
      return toolResult({ status: "moved", sprintId, issueKeys });
    } catch (error: any) {
      return toolError(`Failed to move to sprint: ${error.message}`);
    }
  }

  // --- Jira: Bulk ---
  async jiraBulkTransition(issueKeys: string[], transitionId: string) {
    try {
      const results = await Promise.allSettled(
        issueKeys.map(key =>
          this.http.post(`/rest/api/3/issue/${key}/transitions`, { transition: { id: transitionId } })
        )
      );
      const formatted = results.map((r, i) => ({
        issueKey: issueKeys[i],
        status: r.status === "fulfilled" ? "transitioned" : "failed",
        error: r.status === "rejected" ? (r as PromiseRejectedResult).reason.message : undefined,
      }));
      return toolResult(formatted);
    } catch (error: any) {
      return toolError(`Bulk transition failed: ${error.message}`);
    }
  }

  // --- Confluence: Extended ---
  async confluenceUpdatePage(pageId: string, title: string, body: string, version: number) {
    try {
      const payload = {
        type: "page",
        title,
        body: { storage: { value: body, representation: "storage" } },
        version: { number: version + 1 },
      };
      const response = await this.http.put(`/wiki/rest/api/content/${pageId}`, payload);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update page: ${error.message}`);
    }
  }

  async confluenceDeletePage(pageId: string) {
    try {
      await this.http.delete(`/wiki/rest/api/content/${pageId}`);
      return toolResult({ status: "deleted", pageId });
    } catch (error: any) {
      return toolError(`Failed to delete page: ${error.message}`);
    }
  }

  async confluenceGetChildren(pageId: string, limit?: number) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/child/page`, {
        params: { limit: limit || 25 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get children: ${error.message}`);
    }
  }

  async confluenceGetComments(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/child/comment`, {
        params: { expand: "body.storage" },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get comments: ${error.message}`);
    }
  }

  async confluenceAddComment(pageId: string, body: string) {
    try {
      const payload = {
        type: "comment",
        container: { id: pageId, type: "page" },
        body: { storage: { value: body, representation: "storage" } },
      };
      const response = await this.http.post("/wiki/rest/api/content", payload);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add comment: ${error.message}`);
    }
  }

  async confluenceGetLabels(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/label`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get labels: ${error.message}`);
    }
  }

  async confluenceAddLabels(pageId: string, labels: string[]) {
    try {
      const body = labels.map(name => ({ prefix: "global", name }));
      const response = await this.http.post(`/wiki/rest/api/content/${pageId}/label`, body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add labels: ${error.message}`);
    }
  }

  async confluenceRemoveLabel(pageId: string, label: string) {
    try {
      await this.http.delete(`/wiki/rest/api/content/${pageId}/label/${label}`);
      return toolResult({ status: "removed", pageId, label });
    } catch (error: any) {
      return toolError(`Failed to remove label: ${error.message}`);
    }
  }

  async confluenceGetPageHistory(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/version`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get page history: ${error.message}`);
    }
  }

  async confluenceGetAttachments(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/child/attachment`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get attachments: ${error.message}`);
    }
  }
}
