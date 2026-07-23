import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChannelsConfig } from "../../config.js";
import { ChannelsClient } from "./client.js";

export function registerChannelsTools(server: McpServer, _config: ChannelsConfig) {
  const client = new ChannelsClient();

  server.tool("channels_investigate_server", "Investigate a channel server - check all status JSONs", {
    hostname: z.string().describe("Channel server hostname (e.g. cha3.abn.green.sophos)"),
  }, async (params) => {
    return client.investigateServer(params.hostname);
  });

  server.tool("channels_check_channel_log", "Read latest entries from a channel's chan.log", {
    hostname: z.string().describe("Channel server hostname"),
    channel_path: z.string().describe("Full path to channel directory"),
    lines: z.number().optional().describe("Lines to read (default 50)"),
  }, async (params) => {
    return client.checkChannelLog(params.hostname, params.channel_path, params.lines);
  });

  server.tool("channels_check_antispam_publishing", "Check for active antispam-publishing incident", {}, async () => {
    return client.checkAntispamPublishing();
  });

  server.tool("channels_get_server_problems", "Get Zabbix alerts for a channel server", {
    hostname: z.string().describe("Channel server hostname"),
  }, async (params) => {
    return client.getServerProblems(params.hostname);
  });

  server.tool("channels_check_large_files", "Check for large files on a channel server", {
    hostname: z.string().describe("Channel server hostname"),
  }, async (params) => {
    return client.checkLargeFiles(params.hostname);
  });

  server.tool("channels_list_servers", "List all channel servers with roles and priorities", {}, async () => {
    return client.listServers();
  });

  server.tool("channels_acknowledge_alerts", "Acknowledge Zabbix alerts with a message", {
    event_ids: z.array(z.string()).describe("Event IDs to acknowledge"),
    message: z.string().describe("Acknowledgement message"),
  }, async (params) => {
    return client.acknowledgeAlerts(params.event_ids, params.message);
  });

  server.tool("channels_create_linfra_ticket", "Create a LINFRA Jira ticket", {
    summary: z.string().describe("Ticket summary"),
    description: z.string().describe("Ticket description"),
  }, async (params) => {
    return client.createLinfraTicket(params.summary, params.description);
  });

  server.tool("channels_search_related_incidents", "Search Jira for related past incidents", {
    keywords: z.string().describe("Search keywords"),
    project: z.string().optional().describe("Jira project (default: SIM)"),
  }, async (params) => {
    return client.searchRelatedIncidents(params.keywords, params.project);
  });
}
