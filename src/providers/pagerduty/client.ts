import axios, { AxiosInstance } from "axios";
import { PagerdutyConfig } from "../../config.js";
import { toolResult, toolError } from "../../utils/http.js";

export class PagerdutyClient {
  private http: AxiosInstance;
  private userEmail: string;

  constructor(config: PagerdutyConfig) {
    this.userEmail = config.userEmail;
    this.http = axios.create({
      baseURL: "https://api.pagerduty.com",
      timeout: 30000,
      headers: {
        "Authorization": `Token token=${config.apiToken}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.pagerduty+json;version=2",
      },
    });
  }

  async listIncidents(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.statuses) query["statuses[]"] = params.statuses;
      if (params.urgencies) query["urgencies[]"] = params.urgencies;
      if (params.since) query.since = params.since;
      if (params.until) query.until = params.until;
      if (params.limit) query.limit = params.limit;
      const response = await this.http.get("/incidents", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list incidents: ${error.message}`);
    }
  }

  async getIncident(incidentId: string) {
    try {
      const response = await this.http.get(`/incidents/${incidentId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get incident: ${error.message}`);
    }
  }

  async manageIncidents(params: Record<string, any>) {
    try {
      const incidents = params.incident_ids.map((id: string) => {
        const incident: Record<string, any> = { id, type: "incident_reference" };
        if (params.status) incident.status = params.status;
        if (params.urgency) incident.urgency = params.urgency;
        return incident;
      });
      const response = await this.http.put("/incidents", { incidents }, {
        headers: { "From": this.userEmail },
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to manage incidents: ${error.message}`);
    }
  }

  async addIncidentNote(incidentId: string, note: string) {
    try {
      const response = await this.http.post(`/incidents/${incidentId}/notes`, {
        note: { content: note },
      }, { headers: { "From": this.userEmail } });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add note: ${error.message}`);
    }
  }

  async listServices(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.query) query.query = params.query;
      if (params.limit) query.limit = params.limit;
      const response = await this.http.get("/services", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list services: ${error.message}`);
    }
  }

  async getService(serviceId: string) {
    try {
      const response = await this.http.get(`/services/${serviceId}`);
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get service: ${error.message}`);
    }
  }

  async listTeams(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.query) query.query = params.query;
      if (params.limit) query.limit = params.limit;
      const response = await this.http.get("/teams", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list teams: ${error.message}`);
    }
  }

  async listOncalls(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.schedule_ids) query["schedule_ids[]"] = params.schedule_ids;
      if (params.user_ids) query["user_ids[]"] = params.user_ids;
      if (params.since) query.since = params.since;
      if (params.until) query.until = params.until;
      if (params.earliest !== undefined) query.earliest = params.earliest;
      const response = await this.http.get("/oncalls", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list oncalls: ${error.message}`);
    }
  }

  async listSchedules(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.query) query.query = params.query;
      if (params.limit) query.limit = params.limit;
      const response = await this.http.get("/schedules", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list schedules: ${error.message}`);
    }
  }

  async listEscalationPolicies(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.query) query.query = params.query;
      if (params.limit) query.limit = params.limit;
      const response = await this.http.get("/escalation_policies", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list escalation policies: ${error.message}`);
    }
  }

  async listUsers(params: Record<string, any>) {
    try {
      const query: Record<string, any> = {};
      if (params.query) query.query = params.query;
      if (params.limit) query.limit = params.limit;
      const response = await this.http.get("/users", { params: query });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list users: ${error.message}`);
    }
  }
}
