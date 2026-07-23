import { Client } from "ssh2";
import { LxcConfig } from "../../config.js";
import { toolResult, toolError } from "../../utils/http.js";

export class LxcClient {
  private config: LxcConfig;

  constructor(config: LxcConfig) {
    this.config = config;
  }

  private async sshExec(host: string, command: string, timeout?: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const timer = setTimeout(() => {
        conn.end();
        reject(new Error(`Command timed out after ${timeout || 30000}ms`));
      }, timeout || 30000);

      conn.on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) { clearTimeout(timer); conn.end(); reject(err); return; }
          let output = "";
          let stderr = "";
          stream.on("data", (data: Buffer) => { output += data.toString(); });
          stream.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });
          stream.on("close", (code: number) => {
            clearTimeout(timer);
            conn.end();
            resolve(output || stderr);
          });
        });
      });
      conn.on("error", (err) => { clearTimeout(timer); reject(err); });

      const connectOpts: Record<string, any> = {
        host,
        port: 22,
        username: this.config.sshUser,
      };
      if (this.config.sshKeyPath) {
        const fs = require("fs");
        connectOpts.privateKey = fs.readFileSync(this.config.sshKeyPath);
      } else {
        connectOpts.agent = process.env.SSH_AUTH_SOCK;
      }
      conn.connect(connectOpts);
    });
  }

  async exec(host: string, command: string, timeout?: number) {
    try {
      const output = await this.sshExec(host, command, timeout);
      return toolResult({ host, command, output });
    } catch (error: any) {
      return toolError(`Failed to exec on ${host}: ${error.message}`);
    }
  }

  async execAll(command: string, timeout?: number) {
    try {
      const results = await Promise.allSettled(
        this.config.hosts.map(async (host) => {
          const output = await this.sshExec(host, command, timeout);
          return { host, output };
        })
      );
      const formatted = results.map((r, i) => ({
        host: this.config.hosts[i],
        status: r.status,
        output: r.status === "fulfilled" ? r.value.output : (r as PromiseRejectedResult).reason.message,
      }));
      return toolResult(formatted);
    } catch (error: any) {
      return toolError(`Failed to exec on all hosts: ${error.message}`);
    }
  }

  async listHosts() {
    return toolResult({ hosts: this.config.hosts, sshUser: this.config.sshUser });
  }

  async ping() {
    try {
      const results = await Promise.allSettled(
        this.config.hosts.map(async (host) => {
          await this.sshExec(host, "echo pong", 5000);
          return { host, status: "reachable" };
        })
      );
      const formatted = results.map((r, i) => ({
        host: this.config.hosts[i],
        status: r.status === "fulfilled" ? "reachable" : "unreachable",
        error: r.status === "rejected" ? (r as PromiseRejectedResult).reason.message : undefined,
      }));
      return toolResult(formatted);
    } catch (error: any) {
      return toolError(`Ping failed: ${error.message}`);
    }
  }

  async writeFile(path: string, content: string, host?: string) {
    try {
      const hosts = host ? [host] : this.config.hosts;
      const escapedContent = content.replace(/'/g, "'\\''");
      const command = `echo '${escapedContent}' > ${path}`;
      const results = await Promise.allSettled(
        hosts.map(async (h) => {
          await this.sshExec(h, command);
          return { host: h, status: "written" };
        })
      );
      const formatted = results.map((r, i) => ({
        host: hosts[i],
        status: r.status === "fulfilled" ? "success" : "failed",
        error: r.status === "rejected" ? (r as PromiseRejectedResult).reason.message : undefined,
      }));
      return toolResult(formatted);
    } catch (error: any) {
      return toolError(`Failed to write file: ${error.message}`);
    }
  }
}
