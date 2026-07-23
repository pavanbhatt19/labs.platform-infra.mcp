#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { registerVsphereTools } from "./providers/vsphere/index.js";
import { registerAtlassianTools } from "./providers/atlassian/index.js";
import { registerPagerdutyTools } from "./providers/pagerduty/index.js";
import { registerZabbixTools } from "./providers/zabbix/index.js";
import { registerMysqlTools } from "./providers/mysql/index.js";
import { registerChannelsTools } from "./providers/channels/index.js";
import { registerLxcTools } from "./providers/lxc/index.js";
import { registerAwsDocsTools } from "./providers/aws-docs/index.js";

async function main() {
  const config = loadConfig();

  const server = new McpServer({
    name: "platform-infra-mcp",
    version: "1.0.0",
  });

  // Register all providers
  if (config.vsphere.enabled) {
    registerVsphereTools(server, config.vsphere);
  }

  if (config.atlassian.enabled) {
    registerAtlassianTools(server, config.atlassian);
  }

  if (config.pagerduty.enabled) {
    registerPagerdutyTools(server, config.pagerduty);
  }

  if (config.zabbix.enabled) {
    registerZabbixTools(server, config.zabbix);
  }

  if (config.mysql.enabled) {
    registerMysqlTools(server, config.mysql);
  }

  if (config.channels.enabled) {
    registerChannelsTools(server, config.channels);
  }

  if (config.lxc.enabled) {
    registerLxcTools(server, config.lxc);
  }

  if (config.awsDocs.enabled) {
    registerAwsDocsTools(server, config.awsDocs);
  }

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Platform Infra MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
