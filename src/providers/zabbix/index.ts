import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ZabbixConfig } from "../../config.js";
import { ZabbixClient } from "./client.js";

export function registerZabbixTools(server: McpServer, config: ZabbixConfig) {
  const client = new ZabbixClient(config);

  server.tool("zabbix_get_hosts", "List monitored hosts", {
    name: z.string().optional().describe("Filter by host name"),
    groupIds: z.array(z.string()).optional().describe("Filter by group IDs"),
    status: z.number().optional().describe("0=enabled, 1=disabled"),
  }, async (params) => {
    return client.getHosts(params);
  });

  server.tool("zabbix_get_problems", "Get active problems/alerts", {
    hostIds: z.array(z.string()).optional().describe("Filter by host IDs"),
    severity: z.number().optional().describe("Filter by severity (0-5)"),
    recent: z.boolean().optional().describe("Only recent problems"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.getProblems(params);
  });

  server.tool("zabbix_acknowledge_problem", "Acknowledge a problem", {
    eventIds: z.array(z.string()).describe("Event IDs to acknowledge"),
    message: z.string().describe("Acknowledgement message"),
  }, async (params) => {
    return client.acknowledgeProblem(params.eventIds, params.message);
  });

  server.tool("zabbix_get_triggers", "Get triggers with optional filtering", {
    hostIds: z.array(z.string()).optional().describe("Filter by host IDs"),
    onlyActive: z.boolean().optional().describe("Only PROBLEM state triggers"),
    minSeverity: z.number().optional().describe("Minimum severity (0-5)"),
    limit: z.number().optional().describe("Max results"),
  }, async (params) => {
    return client.getTriggers(params);
  });

  server.tool("zabbix_get_host_groups", "List host groups", {
    name: z.string().optional().describe("Filter by group name"),
  }, async (params) => {
    return client.getHostGroups(params);
  });

  server.tool("zabbix_get_items", "Get monitoring items for a host", {
    hostId: z.string().describe("Host ID"),
    name: z.string().optional().describe("Filter by item name"),
    limit: z.number().optional().describe("Max results (default 50)"),
  }, async (params) => {
    return client.getItems(params.hostId, params.name, params.limit);
  });

  server.tool("zabbix_get_history", "Get historical metric data", {
    itemId: z.string().describe("Item ID"),
    historyType: z.number().optional().describe("0=float, 1=string, 3=integer"),
    limit: z.number().optional().describe("Number of records (default 20)"),
  }, async (params) => {
    return client.getHistory(params.itemId, params.historyType, params.limit);
  });

  server.tool("zabbix_get_maintenances", "List maintenance windows", {}, async () => {
    return client.getMaintenances();
  });

  server.tool("zabbix_create_maintenance", "Create a maintenance window", {
    name: z.string().describe("Maintenance name"),
    hostIds: z.array(z.string()).describe("Host IDs"),
    activeFrom: z.number().describe("Start time (Unix timestamp)"),
    activeTill: z.number().describe("End time (Unix timestamp)"),
    description: z.string().optional().describe("Description"),
  }, async (params) => {
    return client.createMaintenance(params);
  });
}
