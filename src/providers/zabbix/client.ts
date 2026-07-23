import axios, { AxiosInstance } from "axios";
import { ZabbixConfig } from "../../config.js";
import { toolResult, toolError } from "../../utils/http.js";

export class ZabbixClient {
  private config: ZabbixConfig;
  private http: AxiosInstance;
  private authToken: string | null = null;
  private requestId = 1;

  constructor(config: ZabbixConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: `${config.url}/api_jsonrpc.php`,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
  }

  private async rpc(method: string, params: Record<string, any>) {
    await this.ensureAuth();
    const response = await this.http.post("", {
      jsonrpc: "2.0",
      method,
      params,
      id: this.requestId++,
      auth: this.authToken,
    });
    if (response.data.error) {
      throw new Error(response.data.error.data || response.data.error.message);
    }
    return response.data.result;
  }

  private async ensureAuth() {
    if (this.authToken) return;
    if (this.config.apiToken) {
      this.authToken = this.config.apiToken;
    } else if (this.config.username && this.config.password) {
      const response = await this.http.post("", {
        jsonrpc: "2.0",
        method: "user.login",
        params: { username: this.config.username, password: this.config.password },
        id: this.requestId++,
      });
      if (response.data.error) throw new Error(response.data.error.message);
      this.authToken = response.data.result;
    }
  }

  async getHosts(params: Record<string, any>) {
    try {
      const rpcParams: Record<string, any> = {
        output: ["hostid", "host", "name", "status", "description"],
        selectInterfaces: ["ip", "port"],
      };
      if (params.name) rpcParams.search = { name: params.name };
      if (params.groupIds) rpcParams.groupids = params.groupIds;
      if (params.status !== undefined) rpcParams.filter = { status: params.status };
      const result = await this.rpc("host.get", rpcParams);
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get hosts: ${error.message}`);
    }
  }

  async getProblems(params: Record<string, any>) {
    try {
      const rpcParams: Record<string, any> = {
        output: "extend",
        selectTags: "extend",
        recent: params.recent !== false,
        sortfield: ["eventid"],
        sortorder: "DESC",
      };
      if (params.hostIds) rpcParams.hostids = params.hostIds;
      if (params.severity !== undefined) rpcParams.severities = [params.severity];
      if (params.limit) rpcParams.limit = params.limit;
      const result = await this.rpc("problem.get", rpcParams);
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get problems: ${error.message}`);
    }
  }

  async acknowledgeProblem(eventIds: string[], message: string) {
    try {
      const result = await this.rpc("event.acknowledge", {
        eventids: eventIds,
        action: 6, // acknowledge + add message
        message,
      });
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to acknowledge: ${error.message}`);
    }
  }

  async getTriggers(params: Record<string, any>) {
    try {
      const rpcParams: Record<string, any> = {
        output: ["triggerid", "description", "priority", "status", "value", "lastchange"],
        selectHosts: ["hostid", "name"],
        sortfield: "priority",
        sortorder: "DESC",
      };
      if (params.hostIds) rpcParams.hostids = params.hostIds;
      if (params.onlyActive) rpcParams.filter = { value: 1 };
      if (params.minSeverity) rpcParams.min_severity = params.minSeverity;
      if (params.limit) rpcParams.limit = params.limit;
      const result = await this.rpc("trigger.get", rpcParams);
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get triggers: ${error.message}`);
    }
  }

  async getHostGroups(params: Record<string, any>) {
    try {
      const rpcParams: Record<string, any> = { output: "extend" };
      if (params.name) rpcParams.search = { name: params.name };
      const result = await this.rpc("hostgroup.get", rpcParams);
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get host groups: ${error.message}`);
    }
  }

  async getItems(hostId: string, name?: string, limit?: number) {
    try {
      const rpcParams: Record<string, any> = {
        output: ["itemid", "name", "key_", "lastvalue", "units", "status"],
        hostids: [hostId],
        limit: limit || 50,
      };
      if (name) rpcParams.search = { name };
      const result = await this.rpc("item.get", rpcParams);
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get items: ${error.message}`);
    }
  }

  async getHistory(itemId: string, historyType?: number, limit?: number) {
    try {
      const result = await this.rpc("history.get", {
        output: "extend",
        history: historyType || 0,
        itemids: [itemId],
        sortfield: "clock",
        sortorder: "DESC",
        limit: limit || 20,
      });
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get history: ${error.message}`);
    }
  }

  async getMaintenances() {
    try {
      const result = await this.rpc("maintenance.get", {
        output: "extend",
        selectHosts: ["hostid", "name"],
        selectTimeperiods: "extend",
      });
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to get maintenances: ${error.message}`);
    }
  }

  async createMaintenance(params: Record<string, any>) {
    try {
      const result = await this.rpc("maintenance.create", {
        name: params.name,
        active_since: params.activeFrom,
        active_till: params.activeTill,
        hostids: params.hostIds,
        timeperiods: [{ timeperiod_type: 0, start_date: params.activeFrom, period: params.activeTill - params.activeFrom }],
        description: params.description || "",
      });
      return toolResult(result);
    } catch (error: any) {
      return toolError(`Failed to create maintenance: ${error.message}`);
    }
  }
}
