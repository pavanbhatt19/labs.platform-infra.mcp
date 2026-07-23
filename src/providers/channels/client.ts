import { Client } from "ssh2";
import { toolResult, toolError } from "../../utils/http.js";

export class ChannelsClient {
  private async sshExec(hostname: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      conn.on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) { conn.end(); reject(err); return; }
          let output = "";
          stream.on("data", (data: Buffer) => { output += data.toString(); });
          stream.stderr.on("data", (data: Buffer) => { output += data.toString(); });
          stream.on("close", () => { conn.end(); resolve(output); });
        });
      });
      conn.on("error", reject);
      conn.connect({ host: hostname, port: 22, username: "root", agent: process.env.SSH_AUTH_SOCK });
    });
  }

  async investigateServer(hostname: string) {
    try {
      const checks = await Promise.allSettled([
        this.sshExec(hostname, "cat /var/channels/status/chirp.json 2>/dev/null || echo '{}'"),
        this.sshExec(hostname, "cat /var/channels/status/chmedic.json 2>/dev/null || echo '{}'"),
        this.sshExec(hostname, "cat /var/channels/status/chcheck.json 2>/dev/null || echo '{}'"),
        this.sshExec(hostname, "cat /var/channels/status/large_file_alert.json 2>/dev/null || echo '{}'"),
      ]);
      const results = {
        hostname,
        chirp: checks[0].status === "fulfilled" ? JSON.parse(checks[0].value || "{}") : null,
        chmedic: checks[1].status === "fulfilled" ? JSON.parse(checks[1].value || "{}") : null,
        chcheck: checks[2].status === "fulfilled" ? JSON.parse(checks[2].value || "{}") : null,
        large_file_alert: checks[3].status === "fulfilled" ? JSON.parse(checks[3].value || "{}") : null,
      };
      return toolResult(results);
    } catch (error: any) {
      return toolError(`Failed to investigate ${hostname}: ${error.message}`);
    }
  }

  async checkChannelLog(hostname: string, channelPath: string, lines?: number) {
    try {
      const numLines = lines || 50;
      const output = await this.sshExec(hostname, `tail -n ${numLines} ${channelPath}/chan.log`);
      return toolResult({ hostname, channel_path: channelPath, log: output });
    } catch (error: any) {
      return toolError(`Failed to check channel log: ${error.message}`);
    }
  }

  async checkAntispamPublishing() {
    try {
      // Check connectivity to antispam-publishing.labs.sophos
      const output = await this.sshExec("antispam-publishing.labs.sophos", "echo 'reachable'");
      return toolResult({ status: output.includes("reachable") ? "ok" : "unreachable" });
    } catch (error: any) {
      return toolResult({ status: "unreachable", error: error.message });
    }
  }

  async getServerProblems(hostname: string) {
    try {
      // This would integrate with Zabbix API - placeholder for channel-specific logic
      return toolResult({ hostname, message: "Use zabbix_get_problems with the host ID for this server" });
    } catch (error: any) {
      return toolError(`Failed to get server problems: ${error.message}`);
    }
  }

  async checkLargeFiles(hostname: string) {
    try {
      const output = await this.sshExec(hostname, "find /var/channels -type f -size +100M -exec ls -lh {} \\; 2>/dev/null");
      return toolResult({ hostname, large_files: output || "No large files found" });
    } catch (error: any) {
      return toolError(`Failed to check large files: ${error.message}`);
    }
  }

  async listServers() {
    // Channel server registry - hardcoded for now, could be loaded from config
    return toolResult({
      message: "Configure channel servers in environment or config file",
      servers: [],
    });
  }

  async acknowledgeAlerts(eventIds: string[], message: string) {
    return toolResult({ message: "Use zabbix_acknowledge_problem tool for alert acknowledgement", eventIds, acknowledgement: message });
  }

  async createLinfraTicket(summary: string, description: string) {
    return toolResult({ message: "Use jira_create_issue with projectKey=LINFRA", summary, description });
  }

  async searchRelatedIncidents(keywords: string, project?: string) {
    return toolResult({ message: `Use jira_search with JQL: project = ${project || "SIM"} AND text ~ "${keywords}"` });
  }
}
