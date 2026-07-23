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

  // =========================================================================
  // JIRA: Metadata & Config
  // =========================================================================

  async jiraGetIssueTypes(projectKey?: string) {
    try {
      if (projectKey) {
        const response = await this.http.get(`/rest/api/3/project/${projectKey}/statuses`);
        return toolResult(response.data);
      }
      const response = await this.http.get("/rest/api/3/issuetype");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get issue types: ${error.message}`);
    }
  }

  async jiraGetPriorities() {
    try {
      const response = await this.http.get("/rest/api/3/priority");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get priorities: ${error.message}`);
    }
  }

  async jiraGetStatuses() {
    try {
      const response = await this.http.get("/rest/api/3/status");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get statuses: ${error.message}`);
    }
  }

  async jiraGetResolutions() {
    try {
      const response = await this.http.get("/rest/api/3/resolution");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get resolutions: ${error.message}`);
    }
  }

  async jiraGetFields() {
    try {
      const response = await this.http.get("/rest/api/3/field");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get fields: ${error.message}`);
    }
  }

  async jiraGetServerInfo() {
    try {
      const response = await this.http.get("/rest/api/3/serverInfo");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get server info: ${error.message}`);
    }
  }

  async jiraGetMyself() {
    try {
      const response = await this.http.get("/rest/api/3/myself");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get myself: ${error.message}`);
    }
  }

  async jiraGetUser(accountId: string) {
    try {
      const response = await this.http.get("/rest/api/3/user", { params: { accountId } });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get user: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Issue Extended
  // =========================================================================

  async jiraGetIssueChangelog(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/changelog`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get changelog: ${error.message}`);
    }
  }

  async jiraGetIssueEditMeta(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/editmeta`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get edit meta: ${error.message}`);
    }
  }

  async jiraUpdateComment(issueKey: string, commentId: string, body: string) {
    try {
      const payload = { body: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: body }] }] } };
      const response = await this.http.put(`/rest/api/3/issue/${issueKey}/comment/${commentId}`, payload);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update comment: ${error.message}`);
    }
  }

  async jiraDeleteComment(issueKey: string, commentId: string) {
    try {
      await this.http.delete(`/rest/api/3/issue/${issueKey}/comment/${commentId}`);
      return toolResult({ status: "deleted", issueKey, commentId });
    } catch (error: any) {
      return toolError(`Failed to delete comment: ${error.message}`);
    }
  }

  async jiraGetIssueRemoteLinks(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/remotelink`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get remote links: ${error.message}`);
    }
  }

  async jiraCreateRemoteLink(issueKey: string, url: string, title: string) {
    try {
      const response = await this.http.post(`/rest/api/3/issue/${issueKey}/remotelink`, {
        object: { url, title },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create remote link: ${error.message}`);
    }
  }

  async jiraDeleteIssueLink(linkId: string) {
    try {
      await this.http.delete(`/rest/api/3/issueLink/${linkId}`);
      return toolResult({ status: "deleted", linkId });
    } catch (error: any) {
      return toolError(`Failed to delete issue link: ${error.message}`);
    }
  }

  async jiraGetIssueVotes(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/votes`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get votes: ${error.message}`);
    }
  }

  async jiraAddVote(issueKey: string) {
    try {
      await this.http.post(`/rest/api/3/issue/${issueKey}/votes`);
      return toolResult({ status: "voted", issueKey });
    } catch (error: any) {
      return toolError(`Failed to add vote: ${error.message}`);
    }
  }

  async jiraRemoveVote(issueKey: string) {
    try {
      await this.http.delete(`/rest/api/3/issue/${issueKey}/votes`);
      return toolResult({ status: "vote_removed", issueKey });
    } catch (error: any) {
      return toolError(`Failed to remove vote: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Attachments
  // =========================================================================

  async jiraGetIssueAttachments(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}`, { params: { fields: "attachment" } });
      return toolResult(response.data.fields?.attachment || []);
    } catch (error: any) {
      return toolError(`Failed to get attachments: ${error.message}`);
    }
  }

  async jiraGetAttachment(attachmentId: string) {
    try {
      const response = await this.http.get(`/rest/api/3/attachment/${attachmentId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get attachment: ${error.message}`);
    }
  }

  async jiraDeleteAttachment(attachmentId: string) {
    try {
      await this.http.delete(`/rest/api/3/attachment/${attachmentId}`);
      return toolResult({ status: "deleted", attachmentId });
    } catch (error: any) {
      return toolError(`Failed to delete attachment: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Versions/Releases CRUD
  // =========================================================================

  async jiraCreateVersion(params: Record<string, any>) {
    try {
      const response = await this.http.post("/rest/api/3/version", {
        name: params.name,
        projectId: params.projectId,
        description: params.description,
        releaseDate: params.releaseDate,
        startDate: params.startDate,
        released: params.released || false,
        archived: params.archived || false,
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create version: ${error.message}`);
    }
  }

  async jiraUpdateVersion(versionId: string, params: Record<string, any>) {
    try {
      const response = await this.http.put(`/rest/api/3/version/${versionId}`, params);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update version: ${error.message}`);
    }
  }

  async jiraDeleteVersion(versionId: string) {
    try {
      await this.http.delete(`/rest/api/3/version/${versionId}`);
      return toolResult({ status: "deleted", versionId });
    } catch (error: any) {
      return toolError(`Failed to delete version: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Components CRUD
  // =========================================================================

  async jiraCreateComponent(params: Record<string, any>) {
    try {
      const response = await this.http.post("/rest/api/3/component", {
        name: params.name,
        project: params.projectKey,
        description: params.description,
        leadAccountId: params.leadAccountId,
        assigneeType: params.assigneeType || "PROJECT_DEFAULT",
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create component: ${error.message}`);
    }
  }

  async jiraUpdateComponent(componentId: string, params: Record<string, any>) {
    try {
      const response = await this.http.put(`/rest/api/3/component/${componentId}`, params);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update component: ${error.message}`);
    }
  }

  async jiraDeleteComponent(componentId: string) {
    try {
      await this.http.delete(`/rest/api/3/component/${componentId}`);
      return toolResult({ status: "deleted", componentId });
    } catch (error: any) {
      return toolError(`Failed to delete component: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Boards Extended
  // =========================================================================

  async jiraGetBoard(boardId: number) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/board/${boardId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get board: ${error.message}`);
    }
  }

  async jiraGetBoardBacklog(boardId: number) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/board/${boardId}/backlog`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get backlog: ${error.message}`);
    }
  }

  async jiraGetBoardConfiguration(boardId: number) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/board/${boardId}/configuration`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get board config: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Sprints CRUD
  // =========================================================================

  async jiraCreateSprint(params: Record<string, any>) {
    try {
      const response = await this.http.post("/rest/agile/1.0/sprint", {
        name: params.name,
        originBoardId: params.boardId,
        startDate: params.startDate,
        endDate: params.endDate,
        goal: params.goal,
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create sprint: ${error.message}`);
    }
  }

  async jiraGetSprint(sprintId: number) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/sprint/${sprintId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get sprint: ${error.message}`);
    }
  }

  async jiraUpdateSprint(sprintId: number, params: Record<string, any>) {
    try {
      const response = await this.http.put(`/rest/agile/1.0/sprint/${sprintId}`, params);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update sprint: ${error.message}`);
    }
  }

  async jiraDeleteSprint(sprintId: number) {
    try {
      await this.http.delete(`/rest/agile/1.0/sprint/${sprintId}`);
      return toolResult({ status: "deleted", sprintId });
    } catch (error: any) {
      return toolError(`Failed to delete sprint: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Epics
  // =========================================================================

  async jiraGetEpic(epicIdOrKey: string) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/epic/${epicIdOrKey}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get epic: ${error.message}`);
    }
  }

  async jiraGetEpicIssues(epicIdOrKey: string) {
    try {
      const response = await this.http.get(`/rest/agile/1.0/epic/${epicIdOrKey}/issue`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get epic issues: ${error.message}`);
    }
  }

  async jiraMoveToEpic(epicIdOrKey: string, issueKeys: string[]) {
    try {
      await this.http.post(`/rest/agile/1.0/epic/${epicIdOrKey}/issue`, { issues: issueKeys });
      return toolResult({ status: "moved", epicIdOrKey, issueKeys });
    } catch (error: any) {
      return toolError(`Failed to move to epic: ${error.message}`);
    }
  }

  async jiraRemoveFromEpic(issueKeys: string[]) {
    try {
      await this.http.post("/rest/agile/1.0/epic/none/issue", { issues: issueKeys });
      return toolResult({ status: "removed_from_epic", issueKeys });
    } catch (error: any) {
      return toolError(`Failed to remove from epic: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Filters
  // =========================================================================

  async jiraGetMyFilters() {
    try {
      const response = await this.http.get("/rest/api/3/filter/my");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get my filters: ${error.message}`);
    }
  }

  async jiraGetFilter(filterId: string) {
    try {
      const response = await this.http.get(`/rest/api/3/filter/${filterId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get filter: ${error.message}`);
    }
  }

  async jiraCreateFilter(params: Record<string, any>) {
    try {
      const response = await this.http.post("/rest/api/3/filter", {
        name: params.name,
        jql: params.jql,
        description: params.description,
        favourite: params.favourite || false,
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create filter: ${error.message}`);
    }
  }

  async jiraUpdateFilter(filterId: string, params: Record<string, any>) {
    try {
      const response = await this.http.put(`/rest/api/3/filter/${filterId}`, params);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update filter: ${error.message}`);
    }
  }

  async jiraDeleteFilter(filterId: string) {
    try {
      await this.http.delete(`/rest/api/3/filter/${filterId}`);
      return toolResult({ status: "deleted", filterId });
    } catch (error: any) {
      return toolError(`Failed to delete filter: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Dashboards
  // =========================================================================

  async jiraGetDashboards() {
    try {
      const response = await this.http.get("/rest/api/3/dashboard");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get dashboards: ${error.message}`);
    }
  }

  async jiraGetDashboard(dashboardId: string) {
    try {
      const response = await this.http.get(`/rest/api/3/dashboard/${dashboardId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get dashboard: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Project Roles & Permissions
  // =========================================================================

  async jiraGetProjectRoles(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/role`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get project roles: ${error.message}`);
    }
  }

  async jiraGetProjectRole(projectKey: string, roleId: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/role/${roleId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get project role: ${error.message}`);
    }
  }

  async jiraGetPermissionScheme(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/permissionscheme`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get permission scheme: ${error.message}`);
    }
  }

  async jiraGetNotificationScheme(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/notificationscheme`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get notification scheme: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Ranking
  // =========================================================================

  async jiraRankIssues(params: Record<string, any>) {
    try {
      const body: Record<string, any> = { issues: params.issueKeys };
      if (params.rankBeforeIssue) body.rankBeforeIssue = params.rankBeforeIssue;
      if (params.rankAfterIssue) body.rankAfterIssue = params.rankAfterIssue;
      await this.http.put("/rest/agile/1.0/issue/rank", body);
      return toolResult({ status: "ranked", issues: params.issueKeys });
    } catch (error: any) {
      return toolError(`Failed to rank issues: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Bulk Create
  // =========================================================================

  async jiraBulkCreateIssues(issues: Record<string, any>[]) {
    try {
      const response = await this.http.post("/rest/api/3/issue/bulk", { issueUpdates: issues });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to bulk create issues: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Extended
  // =========================================================================

  async confluenceGetSpace(spaceKey: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/space/${spaceKey}`, {
        params: { expand: "description.plain,homepage" },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get space: ${error.message}`);
    }
  }

  async confluenceCreateSpace(params: Record<string, any>) {
    try {
      const response = await this.http.post("/wiki/rest/api/space", {
        key: params.key,
        name: params.name,
        description: { plain: { value: params.description || "", representation: "plain" } },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create space: ${error.message}`);
    }
  }

  async confluenceDeleteSpace(spaceKey: string) {
    try {
      await this.http.delete(`/wiki/rest/api/space/${spaceKey}`);
      return toolResult({ status: "deleted", spaceKey });
    } catch (error: any) {
      return toolError(`Failed to delete space: ${error.message}`);
    }
  }

  async confluenceGetPageByTitle(spaceKey: string, title: string) {
    try {
      const response = await this.http.get("/wiki/rest/api/content", {
        params: { spaceKey, title, expand: "body.storage,version" },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get page by title: ${error.message}`);
    }
  }

  async confluenceGetPageVersion(pageId: string, versionNumber: number) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/version/${versionNumber}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get page version: ${error.message}`);
    }
  }

  async confluenceGetContentProperties(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/property`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get content properties: ${error.message}`);
    }
  }

  async confluenceSetContentProperty(pageId: string, key: string, value: any) {
    try {
      const response = await this.http.post(`/wiki/rest/api/content/${pageId}/property`, {
        key,
        value,
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to set content property: ${error.message}`);
    }
  }

  async confluenceDeleteContentProperty(pageId: string, key: string) {
    try {
      await this.http.delete(`/wiki/rest/api/content/${pageId}/property/${key}`);
      return toolResult({ status: "deleted", pageId, key });
    } catch (error: any) {
      return toolError(`Failed to delete content property: ${error.message}`);
    }
  }

  async confluenceGetContentRestrictions(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/restriction`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get restrictions: ${error.message}`);
    }
  }

  async confluenceSearchUsers(query: string, limit?: number) {
    try {
      const response = await this.http.get("/wiki/rest/api/search/user", {
        params: { cql: `user.fullname~"${query}"`, limit: limit || 25 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to search users: ${error.message}`);
    }
  }

  async confluenceGetTasks(pageId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${pageId}/descendant/comment`, {
        params: { expand: "body.storage" },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get tasks: ${error.message}`);
    }
  }

  async confluenceCopyPage(pageId: string, destinationSpaceKey: string, title?: string) {
    try {
      const body: Record<string, any> = {
        copyAttachments: true,
        copyLabels: true,
        destination: { type: "space", value: destinationSpaceKey },
      };
      if (title) body.pageTitle = title;
      const response = await this.http.post(`/wiki/rest/api/content/${pageId}/copy`, body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to copy page: ${error.message}`);
    }
  }

  async confluenceMovePage(pageId: string, targetPageId: string, position?: string) {
    try {
      const body = {
        position: position || "append",
        targetId: targetPageId,
      };
      const response = await this.http.put(`/wiki/rest/api/content/${pageId}/move/${position || "append"}/${targetPageId}`, body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to move page: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Issue Properties
  // =========================================================================

  async jiraGetIssueProperties(issueKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/properties`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get issue properties: ${error.message}`);
    }
  }

  async jiraGetIssueProperty(issueKey: string, propertyKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/issue/${issueKey}/properties/${propertyKey}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get issue property: ${error.message}`);
    }
  }

  async jiraSetIssueProperty(issueKey: string, propertyKey: string, value: any) {
    try {
      await this.http.put(`/rest/api/3/issue/${issueKey}/properties/${propertyKey}`, value);
      return toolResult({ status: "set", issueKey, propertyKey });
    } catch (error: any) {
      return toolError(`Failed to set issue property: ${error.message}`);
    }
  }

  async jiraDeleteIssueProperty(issueKey: string, propertyKey: string) {
    try {
      await this.http.delete(`/rest/api/3/issue/${issueKey}/properties/${propertyKey}`);
      return toolResult({ status: "deleted", issueKey, propertyKey });
    } catch (error: any) {
      return toolError(`Failed to delete issue property: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Create Meta
  // =========================================================================

  async jiraGetCreateMeta(projectKeys?: string[], issueTypeIds?: string[]) {
    try {
      const params: Record<string, any> = { expand: "projects.issuetypes.fields" };
      if (projectKeys?.length) params.projectKeys = projectKeys.join(",");
      if (issueTypeIds?.length) params.issuetypeIds = issueTypeIds.join(",");
      const response = await this.http.get("/rest/api/3/issue/createmeta", { params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get create meta: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Groups
  // =========================================================================

  async jiraGetGroups(query?: string, maxResults?: number) {
    try {
      const params: Record<string, any> = {};
      if (query) params.query = query;
      if (maxResults) params.maxResults = maxResults;
      const response = await this.http.get("/rest/api/3/group/bulk", { params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get groups: ${error.message}`);
    }
  }

  async jiraGetGroupMembers(groupName: string, maxResults?: number) {
    try {
      const response = await this.http.get("/rest/api/3/group/member", {
        params: { groupname: groupName, maxResults: maxResults || 50 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get group members: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Workflows
  // =========================================================================

  async jiraGetWorkflows() {
    try {
      const response = await this.http.get("/rest/api/3/workflow");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get workflows: ${error.message}`);
    }
  }

  async jiraGetWorkflowSchemes(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/workflowscheme`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get workflow schemes: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Screens
  // =========================================================================

  async jiraGetScreens(maxResults?: number) {
    try {
      const response = await this.http.get("/rest/api/3/screens", {
        params: { maxResults: maxResults || 100 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get screens: ${error.message}`);
    }
  }

  async jiraGetScreenTabs(screenId: string) {
    try {
      const response = await this.http.get(`/rest/api/3/screens/${screenId}/tabs`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get screen tabs: ${error.message}`);
    }
  }

  async jiraGetScreenTabFields(screenId: string, tabId: string) {
    try {
      const response = await this.http.get(`/rest/api/3/screens/${screenId}/tabs/${tabId}/fields`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get screen tab fields: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Project Statuses & Types
  // =========================================================================

  async jiraGetProjectStatuses(projectKey: string) {
    try {
      const response = await this.http.get(`/rest/api/3/project/${projectKey}/statuses`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get project statuses: ${error.message}`);
    }
  }

  async jiraGetProjectTypes() {
    try {
      const response = await this.http.get("/rest/api/3/project/type");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get project types: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Notifications
  // =========================================================================

  async jiraNotifyIssue(issueKey: string, params: Record<string, any>) {
    try {
      const body: Record<string, any> = {
        subject: params.subject,
        textBody: params.textBody,
      };
      if (params.to) body.to = params.to;
      await this.http.post(`/rest/api/3/issue/${issueKey}/notify`, body);
      return toolResult({ status: "notified", issueKey });
    } catch (error: any) {
      return toolError(`Failed to notify: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Configuration & Audit
  // =========================================================================

  async jiraGetConfiguration() {
    try {
      const response = await this.http.get("/rest/api/3/configuration");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get configuration: ${error.message}`);
    }
  }

  async jiraGetAuditRecords(params?: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params?.from) query.from = params.from;
      if (params?.to) query.to = params.to;
      if (params?.filter) query.filter = params.filter;
      if (params?.limit) query.limit = params.limit;
      const response = await this.http.get("/rest/api/3/auditing/record", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get audit records: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Security Schemes
  // =========================================================================

  async jiraGetIssueSecuritySchemes() {
    try {
      const response = await this.http.get("/rest/api/3/issuesecurityschemes");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get security schemes: ${error.message}`);
    }
  }

  // =========================================================================
  // JIRA: Worklog Extended
  // =========================================================================

  async jiraUpdateWorklog(issueKey: string, worklogId: string, params: Record<string, any>) {
    try {
      const body: Record<string, any> = {};
      if (params.timeSpent) body.timeSpent = params.timeSpent;
      if (params.comment) body.comment = { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: params.comment }] }] };
      if (params.started) body.started = params.started;
      const response = await this.http.put(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`, body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to update worklog: ${error.message}`);
    }
  }

  async jiraDeleteWorklog(issueKey: string, worklogId: string) {
    try {
      await this.http.delete(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`);
      return toolResult({ status: "deleted", issueKey, worklogId });
    } catch (error: any) {
      return toolError(`Failed to delete worklog: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Restrictions CRUD
  // =========================================================================

  async confluenceSetRestrictions(pageId: string, restrictions: any) {
    try {
      const response = await this.http.put(`/wiki/rest/api/content/${pageId}/restriction`, restrictions);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to set restrictions: ${error.message}`);
    }
  }

  async confluenceDeleteRestrictions(pageId: string) {
    try {
      await this.http.delete(`/wiki/rest/api/content/${pageId}/restriction`);
      return toolResult({ status: "restrictions_removed", pageId });
    } catch (error: any) {
      return toolError(`Failed to delete restrictions: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Space Content
  // =========================================================================

  async confluenceGetSpaceContent(spaceKey: string, type?: string, limit?: number) {
    try {
      const params: Record<string, any> = { limit: limit || 25 };
      if (type) params.type = type;
      const response = await this.http.get(`/wiki/rest/api/space/${spaceKey}/content`, { params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get space content: ${error.message}`);
    }
  }

  async confluenceGetSpaceSettings(spaceKey: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/space/${spaceKey}/settings`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get space settings: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Templates & Blueprints
  // =========================================================================

  async confluenceGetTemplates(spaceKey?: string) {
    try {
      const params: Record<string, any> = {};
      if (spaceKey) params.spaceKey = spaceKey;
      const response = await this.http.get("/wiki/rest/api/template/page", { params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get templates: ${error.message}`);
    }
  }

  async confluenceGetBlueprints() {
    try {
      const response = await this.http.get("/wiki/rest/api/template/blueprint");
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get blueprints: ${error.message}`);
    }
  }

  async confluenceCreateFromTemplate(params: Record<string, any>) {
    try {
      const body = {
        contentTemplateId: params.templateId,
        space: { key: params.spaceKey },
        title: params.title,
        ancestors: params.parentId ? [{ id: params.parentId }] : undefined,
      };
      const response = await this.http.post("/wiki/rest/api/content/blueprint/instance/simple", body);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create from template: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Long Tasks
  // =========================================================================

  async confluenceGetLongTasks(limit?: number) {
    try {
      const response = await this.http.get("/wiki/rest/api/longtask", {
        params: { limit: limit || 50 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get long tasks: ${error.message}`);
    }
  }

  async confluenceGetLongTask(taskId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/longtask/${taskId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get long task: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Groups & Audit
  // =========================================================================

  async confluenceGetGroups(limit?: number) {
    try {
      const response = await this.http.get("/wiki/rest/api/group", {
        params: { limit: limit || 50 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get groups: ${error.message}`);
    }
  }

  async confluenceGetGroupMembers(groupName: string, limit?: number) {
    try {
      const response = await this.http.get(`/wiki/rest/api/group/${groupName}/member`, {
        params: { limit: limit || 50 },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get group members: ${error.message}`);
    }
  }

  async confluenceGetAuditRecords(params?: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params?.startDate) query.startDate = params.startDate;
      if (params?.endDate) query.endDate = params.endDate;
      if (params?.limit) query.limit = params.limit;
      const response = await this.http.get("/wiki/rest/api/audit", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get audit records: ${error.message}`);
    }
  }

  // =========================================================================
  // CONFLUENCE: Attachments CRUD
  // =========================================================================

  async confluenceDeleteAttachment(pageId: string, attachmentId: string) {
    try {
      await this.http.delete(`/wiki/rest/api/content/${attachmentId}`);
      return toolResult({ status: "deleted", pageId, attachmentId });
    } catch (error: any) {
      return toolError(`Failed to delete attachment: ${error.message}`);
    }
  }

  async confluenceGetAttachmentById(attachmentId: string) {
    try {
      const response = await this.http.get(`/wiki/rest/api/content/${attachmentId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get attachment: ${error.message}`);
    }
  }
}
