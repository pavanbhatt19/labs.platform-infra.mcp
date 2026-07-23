import axios, { AxiosInstance } from "axios";
import https from "https";
import { VsphereConfig } from "../../config.js";
import { toolResult, toolError } from "../../utils/http.js";

export class VsphereClient {
  private config: VsphereConfig;
  private http: AxiosInstance | null = null;
  private sessionId: string | null = null;

  constructor(config: VsphereConfig) {
    this.config = config;
  }

  private getHttp(): AxiosInstance {
    if (!this.http) {
      this.http = axios.create({
        baseURL: `https://${this.config.host}/api`,
        timeout: 30000,
        httpsAgent: this.config.ignoreSsl
          ? new https.Agent({ rejectUnauthorized: false })
          : undefined,
      });
    }
    return this.http;
  }

  private getHeaders(): Record<string, string> {
    if (!this.sessionId) return {};
    return { "vmware-api-session-id": this.sessionId };
  }

  async connect() {
    try {
      const http = this.getHttp();
      const response = await http.post("/session", null, {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      });
      this.sessionId = response.data;
      return toolResult({ status: "connected", host: this.config.host });
    } catch (error: any) {
      return toolError(`Failed to connect to vCenter: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      if (this.sessionId) {
        const http = this.getHttp();
        await http.delete("/session", { headers: this.getHeaders() });
        this.sessionId = null;
      }
      return toolResult({ status: "disconnected" });
    } catch (error: any) {
      return toolError(`Failed to disconnect: ${error.message}`);
    }
  }

  private async ensureConnected() {
    if (!this.sessionId) {
      await this.connect();
    }
  }

  async listVms(params: { names?: string[]; power_states?: string[] }) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const queryParams: Record<string, string> = {};
      if (params.names?.length) queryParams["names"] = params.names.join(",");
      if (params.power_states?.length) queryParams["power_states"] = params.power_states.join(",");
      const response = await http.get("/vcenter/vm", { headers: this.getHeaders(), params: queryParams });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list VMs: ${error.message}`);
    }
  }

  async getVm(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM: ${error.message}`);
    }
  }

  async vmPower(vmId: string, action: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/power/${action}`, null, { headers: this.getHeaders() });
      return toolResult({ status: "success", vm_id: vmId, action });
    } catch (error: any) {
      return toolError(`Failed to ${action} VM: ${error.message}`);
    }
  }

  async createVm(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        guest_OS: params.guest_OS,
        placement: {},
      };
      if (params.cpu_count) spec.cpu = { count: params.cpu_count };
      if (params.memory_MiB) spec.memory = { size_MiB: params.memory_MiB };
      if (params.disk_capacity_GiB) spec.disks = [{ new_vmdk: { capacity: params.disk_capacity_GiB * 1024 * 1024 * 1024 } }];
      if (params.datastore) spec.placement.datastore = params.datastore;
      if (params.folder) spec.placement.folder = params.folder;
      if (params.resource_pool) spec.placement.resource_pool = params.resource_pool;
      if (params.network) spec.nics = [{ backing: { type: "STANDARD_PORTGROUP", network: params.network } }];
      const response = await http.post("/vcenter/vm", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create VM: ${error.message}`);
    }
  }

  async cloneVm(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        source: params.source_vm_id,
        placement: {},
      };
      if (params.datastore) spec.placement.datastore = params.datastore;
      if (params.folder) spec.placement.folder = params.folder;
      if (params.resource_pool) spec.placement.resource_pool = params.resource_pool;
      const response = await http.post("/vcenter/vm?action=clone", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to clone VM: ${error.message}`);
    }
  }

  async deleteVm(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to delete VM: ${error.message}`);
    }
  }

  async editVm(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.name) spec.name = params.name;
      if (params.cpu_count) spec.cpu = { count: params.cpu_count };
      if (params.memory_MiB) spec.memory = { size_MiB: params.memory_MiB };
      if (params.cores_per_socket) spec.cpu = { ...spec.cpu, cores_per_socket: params.cores_per_socket };
      await http.patch(`/vcenter/vm/${params.vm_id}`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: params.vm_id });
    } catch (error: any) {
      return toolError(`Failed to edit VM: ${error.message}`);
    }
  }

  async listSnapshots(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/snapshots`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list snapshots: ${error.message}`);
    }
  }

  async createSnapshot(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = { name: params.name };
      if (params.description) spec.description = params.description;
      if (params.memory !== undefined) spec.memory = params.memory;
      const response = await http.post(`/vcenter/vm/${params.vm_id}/snapshots`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create snapshot: ${error.message}`);
    }
  }

  async getGuestIdentity(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/guest/identity`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get guest identity: ${error.message}`);
    }
  }

  async getGuestNetworking(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/guest/networking/interfaces`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get guest networking: ${error.message}`);
    }
  }

  async listHosts() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/host", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list hosts: ${error.message}`);
    }
  }

  async listDatastores() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/datastore", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list datastores: ${error.message}`);
    }
  }

  async listNetworks() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/network", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list networks: ${error.message}`);
    }
  }

  async listClusters() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/cluster", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list clusters: ${error.message}`);
    }
  }

  async listFolders(type?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const params = type ? { type } : {};
      const response = await http.get("/vcenter/folder", { headers: this.getHeaders(), params });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list folders: ${error.message}`);
    }
  }

  async listResourcePools() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/resource-pool", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list resource pools: ${error.message}`);
    }
  }
}
