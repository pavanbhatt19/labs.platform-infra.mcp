import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LxcConfig } from "../../config.js";
import { LxcClient } from "./client.js";

export function registerLxcTools(server: McpServer, config: LxcConfig) {
  const client = new LxcClient(config);

  server.tool("lxc_exec", "Execute a command on a specific LXC host", {
    host: z.string().describe("Target LXC host hostname/IP"),
    command: z.string().describe("Shell command to execute"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default 30000)"),
  }, async (params) => {
    return client.exec(params.host, params.command, params.timeout);
  });

  server.tool("lxc_exec_all", "Execute a command on ALL LXC hosts", {
    command: z.string().describe("Shell command to execute on all hosts"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default 30000)"),
  }, async (params) => {
    return client.execAll(params.command, params.timeout);
  });

  server.tool("lxc_list_hosts", "List all configured LXC hosts", {}, async () => {
    return client.listHosts();
  });

  server.tool("lxc_ping", "Test SSH connectivity to all LXC hosts", {}, async () => {
    return client.ping();
  });

  server.tool("lxc_write_file", "Write content to a file on LXC host(s)", {
    path: z.string().describe("Absolute file path on the remote host"),
    content: z.string().describe("File content to write"),
    host: z.string().optional().describe("Specific host (omit for all hosts)"),
  }, async (params) => {
    return client.writeFile(params.path, params.content, params.host);
  });
}
