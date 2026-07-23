import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PagerdutyConfig } from "../../config.js";
import { PagerdutyClient } from "./client.js";

export function registerPagerdutyTools(server: McpServer, config: PagerdutyConfig) {
  const client = new PagerdutyClient(config);

  server.tool("pd_list_incidents", "List PagerDuty incidents", {
    statuses: z.array(z.string()).optional().describe("Filter by status (triggered, acknowledged, resolved)"),
    urgencies: z.array(z.string()).optional().describe("Filter by urgency (high, low)"),
    since: z.string().optional().describe("Filter from date (ISO 8601)"),
    until: z.string().optional().describe("Filter until date (ISO 8601)"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.listIncidents(params);
  });

  server.tool("pd_get_incident", "Get details of a PagerDuty incident", {
    incident_id: z.string().describe("Incident ID"),
  }, async (params) => {
    return client.getIncident(params.incident_id);
  });

  server.tool("pd_manage_incidents", "Acknowledge or resolve incidents", {
    incident_ids: z.array(z.string()).describe("Incident IDs to manage"),
    status: z.enum(["acknowledged", "resolved"]).optional().describe("New status"),
    urgency: z.enum(["high", "low"]).optional().describe("New urgency"),
  }, async (params) => {
    return client.manageIncidents(params);
  });

  server.tool("pd_add_note", "Add a note to an incident", {
    incident_id: z.string().describe("Incident ID"),
    note: z.string().describe("Note text"),
  }, async (params) => {
    return client.addIncidentNote(params.incident_id, params.note);
  });

  server.tool("pd_list_services", "List PagerDuty services", {
    query: z.string().optional().describe("Filter by name"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.listServices(params);
  });

  server.tool("pd_get_service", "Get details of a PagerDuty service", {
    service_id: z.string().describe("Service ID"),
  }, async (params) => {
    return client.getService(params.service_id);
  });

  server.tool("pd_list_teams", "List PagerDuty teams", {
    query: z.string().optional().describe("Filter by name"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.listTeams(params);
  });

  server.tool("pd_list_oncalls", "List current on-call schedules", {
    schedule_ids: z.array(z.string()).optional().describe("Filter by schedule IDs"),
    user_ids: z.array(z.string()).optional().describe("Filter by user IDs"),
    since: z.string().optional().describe("Start of time range"),
    until: z.string().optional().describe("End of time range"),
    earliest: z.boolean().optional().describe("Only earliest oncall per combination"),
  }, async (params) => {
    return client.listOncalls(params);
  });

  server.tool("pd_list_schedules", "List PagerDuty schedules", {
    query: z.string().optional().describe("Filter by name"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.listSchedules(params);
  });

  server.tool("pd_list_escalation_policies", "List escalation policies", {
    query: z.string().optional().describe("Filter by name"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.listEscalationPolicies(params);
  });

  server.tool("pd_list_users", "List PagerDuty users", {
    query: z.string().optional().describe("Filter by name/email"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.listUsers(params);
  });
}
