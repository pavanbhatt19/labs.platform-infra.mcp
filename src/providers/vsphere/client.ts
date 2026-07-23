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

  // --- Snapshot operations ---
  async revertSnapshot(vmId: string, snapshotId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/snapshots/${snapshotId}?action=revert`, null, { headers: this.getHeaders() });
      return toolResult({ status: "reverted", vm_id: vmId, snapshot_id: snapshotId });
    } catch (error: any) {
      return toolError(`Failed to revert snapshot: ${error.message}`);
    }
  }

  async deleteSnapshot(vmId: string, snapshotId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}/snapshots/${snapshotId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", vm_id: vmId, snapshot_id: snapshotId });
    } catch (error: any) {
      return toolError(`Failed to delete snapshot: ${error.message}`);
    }
  }

  // --- Hosts ---
  async getHost(hostId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/host/${hostId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get host: ${error.message}`);
    }
  }

  async hostMaintenance(hostId: string, action: "enter" | "exit") {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      if (action === "enter") {
        await http.post(`/vcenter/host/${hostId}?action=enter-maintenance-mode`, null, { headers: this.getHeaders() });
      } else {
        await http.post(`/vcenter/host/${hostId}?action=exit-maintenance-mode`, null, { headers: this.getHeaders() });
      }
      return toolResult({ status: "success", host_id: hostId, action: `${action}_maintenance` });
    } catch (error: any) {
      return toolError(`Failed to ${action} maintenance mode: ${error.message}`);
    }
  }

  // --- Datastores ---
  async getDatastore(datastoreId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/datastore/${datastoreId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get datastore: ${error.message}`);
    }
  }

  // --- Clusters ---
  async getCluster(clusterId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/cluster/${clusterId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get cluster: ${error.message}`);
    }
  }

  // --- Resource Pools ---
  async getResourcePool(poolId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/resource-pool/${poolId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get resource pool: ${error.message}`);
    }
  }

  // --- Datacenters ---
  async listDatacenters() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/datacenter", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list datacenters: ${error.message}`);
    }
  }

  // --- Tags ---
  async listTagCategories() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/cis/tagging/category", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list tag categories: ${error.message}`);
    }
  }

  async listTags(categoryId?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      if (categoryId) {
        const response = await http.post(`/cis/tagging/tag/list-tags-for-category`, { category_id: categoryId }, { headers: this.getHeaders() });
        return toolResult(response.data);
      }
      const response = await http.get("/cis/tagging/tag", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list tags: ${error.message}`);
    }
  }

  async getTag(tagId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/cis/tagging/tag/${tagId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get tag: ${error.message}`);
    }
  }

  async attachTag(tagId: string, objectId: string, objectType: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/cis/tagging/tag-association/${tagId}?action=attach`, {
        object_id: { id: objectId, type: objectType },
      }, { headers: this.getHeaders() });
      return toolResult({ status: "attached", tag_id: tagId, object_id: objectId });
    } catch (error: any) {
      return toolError(`Failed to attach tag: ${error.message}`);
    }
  }

  async detachTag(tagId: string, objectId: string, objectType: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/cis/tagging/tag-association/${tagId}?action=detach`, {
        object_id: { id: objectId, type: objectType },
      }, { headers: this.getHeaders() });
      return toolResult({ status: "detached", tag_id: tagId, object_id: objectId });
    } catch (error: any) {
      return toolError(`Failed to detach tag: ${error.message}`);
    }
  }

  async listAttachedTags(objectId: string, objectType: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post("/cis/tagging/tag-association?action=list-attached-tags", {
        object_id: { id: objectId, type: objectType },
      }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list attached tags: ${error.message}`);
    }
  }

  // --- Content Libraries ---
  async listContentLibraries() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/content/library", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list content libraries: ${error.message}`);
    }
  }

  async listLibraryItems(libraryId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/content/library/item?library_id=${libraryId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list library items: ${error.message}`);
    }
  }

  async deployLibraryItem(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        target: {},
      };
      if (params.resource_pool) spec.target.resource_pool_id = params.resource_pool;
      if (params.folder) spec.target.folder_id = params.folder;
      if (params.datastore) spec.default_datastore_id = params.datastore;
      const response = await http.post(`/vcenter/ovf/library-item/${params.item_id}?action=deploy`, { deployment_spec: spec }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to deploy library item: ${error.message}`);
    }
  }

  // --- Disks ---
  async listDisks(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/disk`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list disks: ${error.message}`);
    }
  }

  async addDisk(vmId: string, capacityGiB: number) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/vcenter/vm/${vmId}/hardware/disk`, {
        new_vmdk: { capacity: capacityGiB * 1024 * 1024 * 1024 },
      }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add disk: ${error.message}`);
    }
  }

  async removeDisk(vmId: string, diskId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}/hardware/disk/${diskId}`, { headers: this.getHeaders() });
      return toolResult({ status: "removed", vm_id: vmId, disk_id: diskId });
    } catch (error: any) {
      return toolError(`Failed to remove disk: ${error.message}`);
    }
  }

  // --- NICs ---
  async listNics(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/ethernet`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list NICs: ${error.message}`);
    }
  }

  async addNic(vmId: string, network: string, startConnected?: boolean) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        backing: { type: "STANDARD_PORTGROUP", network },
        start_connected: startConnected !== false,
      };
      const response = await http.post(`/vcenter/vm/${vmId}/hardware/ethernet`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add NIC: ${error.message}`);
    }
  }

  async removeNic(vmId: string, nicId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}/hardware/ethernet/${nicId}`, { headers: this.getHeaders() });
      return toolResult({ status: "removed", vm_id: vmId, nic_id: nicId });
    } catch (error: any) {
      return toolError(`Failed to remove NIC: ${error.message}`);
    }
  }

  // --- VM Hardware: Boot, CPU, Memory details ---
  async getVmHardware(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM hardware: ${error.message}`);
    }
  }

  async getVmBoot(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/boot`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM boot config: ${error.message}`);
    }
  }

  async updateVmBoot(vmId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.type) spec.type = params.type; // BIOS or EFI
      if (params.delay !== undefined) spec.delay = params.delay;
      if (params.enter_setup_mode !== undefined) spec.enter_setup_mode = params.enter_setup_mode;
      if (params.retry !== undefined) spec.retry = params.retry;
      if (params.retry_delay !== undefined) spec.retry_delay = params.retry_delay;
      await http.patch(`/vcenter/vm/${vmId}/hardware/boot`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to update VM boot: ${error.message}`);
    }
  }

  async getVmBootDevice(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/boot/device`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get boot device: ${error.message}`);
    }
  }

  // --- VM Hardware: CD-ROM ---
  async listCdroms(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/cdrom`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list CD-ROMs: ${error.message}`);
    }
  }

  // --- VM Hardware: Floppy ---
  async listFloppies(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/floppy`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list floppies: ${error.message}`);
    }
  }

  // --- VM Hardware: Parallel/Serial ports ---
  async listSerialPorts(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/serial`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list serial ports: ${error.message}`);
    }
  }

  async listParallelPorts(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/parallel`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list parallel ports: ${error.message}`);
    }
  }

  // --- VM Hardware: SCSI/SATA adapters ---
  async listScsiAdapters(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/adapter/scsi`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list SCSI adapters: ${error.message}`);
    }
  }

  async listSataAdapters(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/adapter/sata`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list SATA adapters: ${error.message}`);
    }
  }

  // --- VM Guest: Power, Processes, Filesystem ---
  async getVmGuestPower(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/guest/power`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get guest power state: ${error.message}`);
    }
  }

  async vmGuestShutdown(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/guest/power?action=shutdown`, null, { headers: this.getHeaders() });
      return toolResult({ status: "shutdown_initiated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to guest shutdown: ${error.message}`);
    }
  }

  async vmGuestReboot(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/guest/power?action=reboot`, null, { headers: this.getHeaders() });
      return toolResult({ status: "reboot_initiated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to guest reboot: ${error.message}`);
    }
  }

  async vmGuestStandby(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/guest/power?action=standby`, null, { headers: this.getHeaders() });
      return toolResult({ status: "standby_initiated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to guest standby: ${error.message}`);
    }
  }

  async getVmGuestLocalFilesystem(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/guest/local-filesystem`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get guest filesystem: ${error.message}`);
    }
  }

  // --- VM Tools ---
  async getVmTools(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/tools`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM tools status: ${error.message}`);
    }
  }

  async upgradeVmTools(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/tools?action=upgrade`, null, { headers: this.getHeaders() });
      return toolResult({ status: "upgrade_initiated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to upgrade VM tools: ${error.message}`);
    }
  }

  // --- VM Storage Policy ---
  async getVmStoragePolicy(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/storage/policy`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM storage policy: ${error.message}`);
    }
  }

  // --- VM Console Ticket ---
  async getVmConsoleTicket(vmId: string, type?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = { type: type || "VMRC" };
      const response = await http.post(`/vcenter/vm/${vmId}/console/tickets`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get console ticket: ${error.message}`);
    }
  }

  // --- Network details ---
  async getNetwork(networkId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/network/${networkId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get network: ${error.message}`);
    }
  }

  // --- Datacenter details ---
  async getDatacenter(datacenterId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/datacenter/${datacenterId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get datacenter: ${error.message}`);
    }
  }

  // --- Tag Category CRUD ---
  async createTagCategory(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        name: params.name,
        description: params.description || "",
        cardinality: params.cardinality || "MULTIPLE",
        associable_types: params.associable_types || [],
      };
      const response = await http.post("/cis/tagging/category", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create tag category: ${error.message}`);
    }
  }

  async deleteTagCategory(categoryId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/cis/tagging/category/${categoryId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", category_id: categoryId });
    } catch (error: any) {
      return toolError(`Failed to delete tag category: ${error.message}`);
    }
  }

  // --- Tag CRUD ---
  async createTag(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        name: params.name,
        description: params.description || "",
        category_id: params.category_id,
      };
      const response = await http.post("/cis/tagging/tag", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create tag: ${error.message}`);
    }
  }

  async deleteTag(tagId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/cis/tagging/tag/${tagId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", tag_id: tagId });
    } catch (error: any) {
      return toolError(`Failed to delete tag: ${error.message}`);
    }
  }

  // --- List objects attached to a tag ---
  async listObjectsAttachedToTag(tagId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/cis/tagging/tag-association/${tagId}?action=list-attached-objects`, null, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list objects for tag: ${error.message}`);
    }
  }

  // --- VM Template (Library) ---
  async listVmTemplates() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/vm-template/library-items", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list VM templates: ${error.message}`);
    }
  }

  async getVmTemplate(templateId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm-template/library-items/${templateId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM template: ${error.message}`);
    }
  }

  async deployVmTemplate(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        placement: {},
      };
      if (params.resource_pool) spec.placement.resource_pool = params.resource_pool;
      if (params.folder) spec.placement.folder = params.folder;
      if (params.datastore) spec.disk_storage = { datastore: params.datastore };
      if (params.powered_on !== undefined) spec.powered_on = params.powered_on;
      const response = await http.post(`/vcenter/vm-template/library-items/${params.template_id}?action=deploy`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to deploy VM template: ${error.message}`);
    }
  }

  // --- OVF import/export ---
  async filterOvfLibraryItem(itemId: string, targetResourcePool: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/vcenter/ovf/library-item/${itemId}?action=filter`, {
        target: { resource_pool_id: targetResourcePool },
      }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to filter OVF: ${error.message}`);
    }
  }

  // --- VM Relocate (vMotion) ---
  async relocateVm(vmId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = { placement: {} };
      if (params.host) spec.placement.host = params.host;
      if (params.resource_pool) spec.placement.resource_pool = params.resource_pool;
      if (params.datastore) spec.placement.datastore = params.datastore;
      if (params.folder) spec.placement.folder = params.folder;
      await http.post(`/vcenter/vm/${vmId}?action=relocate`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "relocate_initiated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to relocate VM: ${error.message}`);
    }
  }

  // --- VM Register/Unregister ---
  async registerVm(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        path: params.path,
        placement: {},
      };
      if (params.name) spec.name = params.name;
      if (params.datastore) spec.datastore = params.datastore;
      if (params.folder) spec.placement.folder = params.folder;
      if (params.resource_pool) spec.placement.resource_pool = params.resource_pool;
      const response = await http.post("/vcenter/vm?action=register", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to register VM: ${error.message}`);
    }
  }

  async unregisterVm(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}?action=unregister`, null, { headers: this.getHeaders() });
      return toolResult({ status: "unregistered", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to unregister VM: ${error.message}`);
    }
  }

  // --- VM Instant Clone ---
  async instantCloneVm(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        source: params.source_vm_id,
        placement: {},
      };
      if (params.resource_pool) spec.placement.resource_pool = params.resource_pool;
      if (params.folder) spec.placement.folder = params.folder;
      if (params.datastore) spec.placement.datastore = params.datastore;
      const response = await http.post("/vcenter/vm?action=instant-clone", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to instant clone VM: ${error.message}`);
    }
  }

  // --- VM Hardware: CPU/Memory details ---
  async getVmCpu(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/cpu`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM CPU: ${error.message}`);
    }
  }

  async updateVmCpu(vmId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.count !== undefined) spec.count = params.count;
      if (params.cores_per_socket !== undefined) spec.cores_per_socket = params.cores_per_socket;
      if (params.hot_add_enabled !== undefined) spec.hot_add_enabled = params.hot_add_enabled;
      if (params.hot_remove_enabled !== undefined) spec.hot_remove_enabled = params.hot_remove_enabled;
      await http.patch(`/vcenter/vm/${vmId}/hardware/cpu`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to update VM CPU: ${error.message}`);
    }
  }

  async getVmMemory(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/memory`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get VM memory: ${error.message}`);
    }
  }

  async updateVmMemory(vmId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.size_MiB !== undefined) spec.size_MiB = params.size_MiB;
      if (params.hot_add_enabled !== undefined) spec.hot_add_enabled = params.hot_add_enabled;
      await http.patch(`/vcenter/vm/${vmId}/hardware/memory`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: vmId });
    } catch (error: any) {
      return toolError(`Failed to update VM memory: ${error.message}`);
    }
  }

  // --- VM Hardware: Individual device get/update ---
  async getDisk(vmId: string, diskId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/disk/${diskId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get disk: ${error.message}`);
    }
  }

  async updateDisk(vmId: string, diskId: string, capacityGiB: number) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.patch(`/vcenter/vm/${vmId}/hardware/disk/${diskId}`, {
        capacity: capacityGiB * 1024 * 1024 * 1024,
      }, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: vmId, disk_id: diskId });
    } catch (error: any) {
      return toolError(`Failed to update disk: ${error.message}`);
    }
  }

  async getNic(vmId: string, nicId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/ethernet/${nicId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get NIC: ${error.message}`);
    }
  }

  async updateNic(vmId: string, nicId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.network) spec.backing = { type: "STANDARD_PORTGROUP", network: params.network };
      if (params.start_connected !== undefined) spec.start_connected = params.start_connected;
      if (params.allow_guest_control !== undefined) spec.allow_guest_control = params.allow_guest_control;
      await http.patch(`/vcenter/vm/${vmId}/hardware/ethernet/${nicId}`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: vmId, nic_id: nicId });
    } catch (error: any) {
      return toolError(`Failed to update NIC: ${error.message}`);
    }
  }

  async connectNic(vmId: string, nicId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/hardware/ethernet/${nicId}?action=connect`, null, { headers: this.getHeaders() });
      return toolResult({ status: "connected", vm_id: vmId, nic_id: nicId });
    } catch (error: any) {
      return toolError(`Failed to connect NIC: ${error.message}`);
    }
  }

  async disconnectNic(vmId: string, nicId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/hardware/ethernet/${nicId}?action=disconnect`, null, { headers: this.getHeaders() });
      return toolResult({ status: "disconnected", vm_id: vmId, nic_id: nicId });
    } catch (error: any) {
      return toolError(`Failed to disconnect NIC: ${error.message}`);
    }
  }

  // --- CD-ROM operations ---
  async getCdrom(vmId: string, cdromId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/hardware/cdrom/${cdromId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get CD-ROM: ${error.message}`);
    }
  }

  async addCdrom(vmId: string, params?: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params?.iso_path) {
        spec.backing = { type: "ISO_FILE", iso_file: params.iso_path };
      }
      if (params?.start_connected !== undefined) spec.start_connected = params.start_connected;
      const response = await http.post(`/vcenter/vm/${vmId}/hardware/cdrom`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add CD-ROM: ${error.message}`);
    }
  }

  async removeCdrom(vmId: string, cdromId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}/hardware/cdrom/${cdromId}`, { headers: this.getHeaders() });
      return toolResult({ status: "removed", vm_id: vmId, cdrom_id: cdromId });
    } catch (error: any) {
      return toolError(`Failed to remove CD-ROM: ${error.message}`);
    }
  }

  async updateCdrom(vmId: string, cdromId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.iso_path) spec.backing = { type: "ISO_FILE", iso_file: params.iso_path };
      if (params.start_connected !== undefined) spec.start_connected = params.start_connected;
      if (params.allow_guest_control !== undefined) spec.allow_guest_control = params.allow_guest_control;
      await http.patch(`/vcenter/vm/${vmId}/hardware/cdrom/${cdromId}`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", vm_id: vmId, cdrom_id: cdromId });
    } catch (error: any) {
      return toolError(`Failed to update CD-ROM: ${error.message}`);
    }
  }

  async connectCdrom(vmId: string, cdromId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/hardware/cdrom/${cdromId}?action=connect`, null, { headers: this.getHeaders() });
      return toolResult({ status: "connected", vm_id: vmId, cdrom_id: cdromId });
    } catch (error: any) {
      return toolError(`Failed to connect CD-ROM: ${error.message}`);
    }
  }

  async disconnectCdrom(vmId: string, cdromId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/vm/${vmId}/hardware/cdrom/${cdromId}?action=disconnect`, null, { headers: this.getHeaders() });
      return toolResult({ status: "disconnected", vm_id: vmId, cdrom_id: cdromId });
    } catch (error: any) {
      return toolError(`Failed to disconnect CD-ROM: ${error.message}`);
    }
  }

  // --- SCSI/SATA Adapter CRUD ---
  async addScsiAdapter(vmId: string, type?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (type) spec.type = type; // BUSLOGIC, LSILOGIC, LSILOGICSAS, PVSCSI
      const response = await http.post(`/vcenter/vm/${vmId}/hardware/adapter/scsi`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add SCSI adapter: ${error.message}`);
    }
  }

  async removeScsiAdapter(vmId: string, adapterId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}/hardware/adapter/scsi/${adapterId}`, { headers: this.getHeaders() });
      return toolResult({ status: "removed", vm_id: vmId, adapter_id: adapterId });
    } catch (error: any) {
      return toolError(`Failed to remove SCSI adapter: ${error.message}`);
    }
  }

  async addSataAdapter(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/vcenter/vm/${vmId}/hardware/adapter/sata`, {}, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add SATA adapter: ${error.message}`);
    }
  }

  async removeSataAdapter(vmId: string, adapterId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/vm/${vmId}/hardware/adapter/sata/${adapterId}`, { headers: this.getHeaders() });
      return toolResult({ status: "removed", vm_id: vmId, adapter_id: adapterId });
    } catch (error: any) {
      return toolError(`Failed to remove SATA adapter: ${error.message}`);
    }
  }

  // --- Guest Operations: Run program, File transfer ---
  async guestRunProgram(vmId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        credentials: { type: "USERNAME_PASSWORD", user_name: params.username, password: params.password },
        path: params.path,
        arguments: params.arguments || "",
        working_directory: params.working_directory || "",
      };
      const response = await http.post(`/vcenter/vm/${vmId}/guest/processes?action=create`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to run program in guest: ${error.message}`);
    }
  }

  async guestGetProcess(vmId: string, pid: number, username: string, password: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/vcenter/vm/${vmId}/guest/processes/${pid}?action=get`, {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
      }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get guest process: ${error.message}`);
    }
  }

  async guestListProcesses(vmId: string, username: string, password: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/vcenter/vm/${vmId}/guest/processes?action=list`, {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
      }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list guest processes: ${error.message}`);
    }
  }

  async guestGetEnvironmentVariables(vmId: string, username: string, password: string, names?: string[]) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.post(`/vcenter/vm/${vmId}/guest/environment?action=list`, {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        names: names || [],
      }, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get guest env vars: ${error.message}`);
    }
  }

  // --- Guest Customization ---
  async listGuestCustomizationSpecs() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/guest/customization-specs", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list customization specs: ${error.message}`);
    }
  }

  async getGuestCustomizationSpec(specName: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/guest/customization-specs/${specName}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get customization spec: ${error.message}`);
    }
  }

  // --- Storage Policies ---
  async listStoragePolicies() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/storage/policies", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list storage policies: ${error.message}`);
    }
  }

  async getStoragePolicyCompliance(vmId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/vm/${vmId}/storage/policy/compliance`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get storage compliance: ${error.message}`);
    }
  }

  // --- Host: Connection, Storage ---
  async connectHost(hostId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/host/${hostId}?action=connect`, null, { headers: this.getHeaders() });
      return toolResult({ status: "connected", host_id: hostId });
    } catch (error: any) {
      return toolError(`Failed to connect host: ${error.message}`);
    }
  }

  async disconnectHost(hostId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/host/${hostId}?action=disconnect`, null, { headers: this.getHeaders() });
      return toolResult({ status: "disconnected", host_id: hostId });
    } catch (error: any) {
      return toolError(`Failed to disconnect host: ${error.message}`);
    }
  }

  // --- Distributed Switches ---
  async listDistributedSwitches() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/network/distributed-switches", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      // May not be available in all editions
      return toolError(`Failed to list distributed switches: ${error.message}`);
    }
  }

  async listDistributedPortgroups() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/network/distributed-port-groups", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list distributed portgroups: ${error.message}`);
    }
  }

  // --- Certificates ---
  async listTlsCertificates() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/certificate-management/vcenter/tls", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list TLS certificates: ${error.message}`);
    }
  }

  async getTrustedRootChains() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/certificate-management/vcenter/trusted-root-chains", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get trusted root chains: ${error.message}`);
    }
  }

  // --- vCenter Services ---
  async listVcenterServices() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/services", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list vCenter services: ${error.message}`);
    }
  }

  async getVcenterService(serviceId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/services/${serviceId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get service: ${error.message}`);
    }
  }

  async startVcenterService(serviceId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/services/${serviceId}?action=start`, null, { headers: this.getHeaders() });
      return toolResult({ status: "started", service_id: serviceId });
    } catch (error: any) {
      return toolError(`Failed to start service: ${error.message}`);
    }
  }

  async stopVcenterService(serviceId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/services/${serviceId}?action=stop`, null, { headers: this.getHeaders() });
      return toolResult({ status: "stopped", service_id: serviceId });
    } catch (error: any) {
      return toolError(`Failed to stop service: ${error.message}`);
    }
  }

  async restartVcenterService(serviceId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/vcenter/services/${serviceId}?action=restart`, null, { headers: this.getHeaders() });
      return toolResult({ status: "restarted", service_id: serviceId });
    } catch (error: any) {
      return toolError(`Failed to restart service: ${error.message}`);
    }
  }

  // --- Appliance Management ---
  async getApplianceHealth() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/health/system", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get appliance health: ${error.message}`);
    }
  }

  async getApplianceVersion() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/system/version", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get appliance version: ${error.message}`);
    }
  }

  async getApplianceNetworking() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/networking", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get appliance networking: ${error.message}`);
    }
  }

  async getApplianceNetworkInterfaces() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/networking/interfaces", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get appliance interfaces: ${error.message}`);
    }
  }

  async getApplianceStorage() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/system/storage", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get appliance storage: ${error.message}`);
    }
  }

  async getApplianceUptime() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/system/uptime", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get appliance uptime: ${error.message}`);
    }
  }

  async getApplianceHealthMemory() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/health/mem", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get memory health: ${error.message}`);
    }
  }

  async getApplianceHealthCpu() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/health/load", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get CPU health: ${error.message}`);
    }
  }

  async getApplianceHealthDatabase() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/health/database-storage", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get database health: ${error.message}`);
    }
  }

  async getApplianceHealthSoftwarePackages() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/health/software-packages", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get software packages health: ${error.message}`);
    }
  }

  // --- Datacenter CRUD ---
  async createDatacenter(name: string, folder?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = { name };
      if (folder) spec.folder = folder;
      const response = await http.post("/vcenter/datacenter", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create datacenter: ${error.message}`);
    }
  }

  async deleteDatacenter(datacenterId: string, force?: boolean) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const params = force ? { force: true } : {};
      await http.delete(`/vcenter/datacenter/${datacenterId}`, { headers: this.getHeaders(), params });
      return toolResult({ status: "deleted", datacenter_id: datacenterId });
    } catch (error: any) {
      return toolError(`Failed to delete datacenter: ${error.message}`);
    }
  }

  // --- Folder CRUD ---
  async createFolder(name: string, type: string, parentFolder?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = { name, type };
      if (parentFolder) spec.parent_folder = parentFolder;
      const response = await http.post("/vcenter/folder", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create folder: ${error.message}`);
    }
  }

  async deleteFolder(folderId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/folder/${folderId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", folder_id: folderId });
    } catch (error: any) {
      return toolError(`Failed to delete folder: ${error.message}`);
    }
  }

  // --- Resource Pool CRUD ---
  async createResourcePool(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        parent: params.parent,
      };
      if (params.cpu_allocation) spec.cpu_allocation = params.cpu_allocation;
      if (params.memory_allocation) spec.memory_allocation = params.memory_allocation;
      const response = await http.post("/vcenter/resource-pool", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create resource pool: ${error.message}`);
    }
  }

  async updateResourcePool(poolId: string, params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {};
      if (params.name) spec.name = params.name;
      if (params.cpu_allocation) spec.cpu_allocation = params.cpu_allocation;
      if (params.memory_allocation) spec.memory_allocation = params.memory_allocation;
      await http.patch(`/vcenter/resource-pool/${poolId}`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "updated", pool_id: poolId });
    } catch (error: any) {
      return toolError(`Failed to update resource pool: ${error.message}`);
    }
  }

  async deleteResourcePool(poolId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/resource-pool/${poolId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", pool_id: poolId });
    } catch (error: any) {
      return toolError(`Failed to delete resource pool: ${error.message}`);
    }
  }

  // --- Host Add/Remove from cluster ---
  async addHostToCluster(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        hostname: params.hostname,
        user_name: params.username,
        password: params.password,
        folder: params.folder,
        thumbprint_verification: params.thumbprint ? "THUMBPRINT" : "NONE",
        thumbprint: params.thumbprint || undefined,
      };
      const response = await http.post("/vcenter/host", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to add host: ${error.message}`);
    }
  }

  async removeHost(hostId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/vcenter/host/${hostId}`, { headers: this.getHeaders() });
      return toolResult({ status: "removed", host_id: hostId });
    } catch (error: any) {
      return toolError(`Failed to remove host: ${error.message}`);
    }
  }

  // --- Content Library CRUD ---
  async createContentLibrary(params: Record<string, any>) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        name: params.name,
        type: params.type || "LOCAL",
        storage_backings: [{ type: "DATASTORE", datastore_id: params.datastore_id }],
      };
      if (params.description) spec.description = params.description;
      const response = await http.post("/content/local-library", spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create content library: ${error.message}`);
    }
  }

  async deleteContentLibrary(libraryId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.delete(`/content/local-library/${libraryId}`, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", library_id: libraryId });
    } catch (error: any) {
      return toolError(`Failed to delete content library: ${error.message}`);
    }
  }

  async getContentLibrary(libraryId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/content/library/${libraryId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get content library: ${error.message}`);
    }
  }

  async getLibraryItem(itemId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/content/library/item/${itemId}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get library item: ${error.message}`);
    }
  }

  async syncSubscribedLibrary(libraryId: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      await http.post(`/content/subscribed-library/${libraryId}?action=sync`, null, { headers: this.getHeaders() });
      return toolResult({ status: "sync_initiated", library_id: libraryId });
    } catch (error: any) {
      return toolError(`Failed to sync library: ${error.message}`);
    }
  }

  // --- Namespaces (vSphere with Tanzu) ---
  async listNamespaces() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/namespaces/instances", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list namespaces: ${error.message}`);
    }
  }

  async getNamespace(namespace: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get(`/vcenter/namespaces/instances/${namespace}`, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get namespace: ${error.message}`);
    }
  }

  async listSupervisorClusters() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/vcenter/namespace-management/clusters", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list supervisor clusters: ${error.message}`);
    }
  }

  // --- Guest File Transfer ---
  async guestCreateTempFile(vmId: string, username: string, password: string, prefix?: string, suffix?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        prefix: prefix || "tmp",
        suffix: suffix || "",
      };
      const response = await http.post(`/vcenter/vm/${vmId}/guest/filesystem?action=create-temporary-file`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create temp file: ${error.message}`);
    }
  }

  async guestCreateTempDirectory(vmId: string, username: string, password: string, prefix?: string, suffix?: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec: Record<string, any> = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        prefix: prefix || "tmp",
        suffix: suffix || "",
      };
      const response = await http.post(`/vcenter/vm/${vmId}/guest/filesystem?action=create-temporary-directory`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to create temp directory: ${error.message}`);
    }
  }

  async guestMakeDirectory(vmId: string, username: string, password: string, path: string, createParents?: boolean) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        path,
        create_parents: createParents || false,
      };
      await http.post(`/vcenter/vm/${vmId}/guest/filesystem/directories?action=create`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "created", path });
    } catch (error: any) {
      return toolError(`Failed to create directory: ${error.message}`);
    }
  }

  async guestDeletePath(vmId: string, username: string, password: string, path: string, recursive?: boolean) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        path,
        recursive: recursive || false,
      };
      await http.post(`/vcenter/vm/${vmId}/guest/filesystem?action=delete`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "deleted", path });
    } catch (error: any) {
      return toolError(`Failed to delete path: ${error.message}`);
    }
  }

  async guestMoveFile(vmId: string, username: string, password: string, srcPath: string, destPath: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        path: srcPath,
        new_path: destPath,
      };
      await http.post(`/vcenter/vm/${vmId}/guest/filesystem?action=move`, spec, { headers: this.getHeaders() });
      return toolResult({ status: "moved", from: srcPath, to: destPath });
    } catch (error: any) {
      return toolError(`Failed to move file: ${error.message}`);
    }
  }

  // --- Guest Windows Registry ---
  async guestListRegistryKeys(vmId: string, username: string, password: string, path: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        path,
      };
      const response = await http.post(`/vcenter/vm/${vmId}/guest/registry?action=list`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to list registry keys: ${error.message}`);
    }
  }

  async guestGetRegistryValue(vmId: string, username: string, password: string, path: string, name: string) {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const spec = {
        credentials: { type: "USERNAME_PASSWORD", user_name: username, password },
        path,
        name,
      };
      const response = await http.post(`/vcenter/vm/${vmId}/guest/registry?action=get-value`, spec, { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get registry value: ${error.message}`);
    }
  }

  // --- Appliance Recovery & Backup ---
  async getApplianceBackupSchedules() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/recovery/backup/schedules", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get backup schedules: ${error.message}`);
    }
  }

  async getApplianceBackupJobs() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/recovery/backup/jobs", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get backup jobs: ${error.message}`);
    }
  }

  // --- Appliance Updates ---
  async getApplianceUpdatePending() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/update/pending", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get pending updates: ${error.message}`);
    }
  }

  async getApplianceUpdateStaged() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/update/staged", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get staged updates: ${error.message}`);
    }
  }

  async getApplianceUpdatePolicy() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/update/policy", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get update policy: ${error.message}`);
    }
  }

  // --- Appliance NTP/DNS/Proxy ---
  async getApplianceNtp() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/ntp", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get NTP config: ${error.message}`);
    }
  }

  async getApplianceDns() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/networking/dns/servers", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get DNS config: ${error.message}`);
    }
  }

  async getApplianceDnsHostname() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/networking/dns/hostname", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get DNS hostname: ${error.message}`);
    }
  }

  async getApplianceProxy() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/networking/proxy", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get proxy config: ${error.message}`);
    }
  }

  async getApplianceFirewall() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/networking/firewall/inbound", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get firewall rules: ${error.message}`);
    }
  }

  // --- Appliance Access ---
  async getApplianceAccessShell() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/access/shell", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get shell access: ${error.message}`);
    }
  }

  async getApplianceAccessSsh() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/access/ssh", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get SSH access: ${error.message}`);
    }
  }

  async getApplianceAccessDcui() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/access/dcui", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get DCUI access: ${error.message}`);
    }
  }

  // --- Appliance Time/Timezone ---
  async getApplianceTimezone() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/system/time/timezone", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get timezone: ${error.message}`);
    }
  }

  async getApplianceTime() {
    try {
      await this.ensureConnected();
      const http = this.getHttp();
      const response = await http.get("/appliance/system/time", { headers: this.getHeaders() });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`Failed to get system time: ${error.message}`);
    }
  }
}
