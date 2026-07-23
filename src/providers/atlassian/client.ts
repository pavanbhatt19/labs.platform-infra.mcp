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
}
