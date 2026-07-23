import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { VsphereConfig } from "../../config.js";
import { VsphereClient } from "./client.js";

export function registerVsphereTools(server: McpServer, config: VsphereConfig) {
  const client = new VsphereClient(config);

  // --- Connection ---
  server.tool("vsphere_connect", "Connect to vCenter Server", {}, async () => {
    return client.connect();
  });

  server.tool("vsphere_disconnect", "Disconnect from vCenter", {}, async () => {
    return client.disconnect();
  });

  // --- VMs ---
  server.tool("vsphere_list_vms", "List all virtual machines", {
    names: z.array(z.string()).optional().describe("Filter by VM name(s)"),
    power_states: z.array(z.enum(["POWERED_ON", "POWERED_OFF", "SUSPENDED"])).optional().describe("Filter by power state"),
  }, async (params) => {
    return client.listVms(params);
  });

  server.tool("vsphere_get_vm", "Get VM details", {
    vm_id: z.string().describe("VM identifier (e.g. vm-123)"),
  }, async (params) => {
    return client.getVm(params.vm_id);
  });

  server.tool("vsphere_vm_power", "Power action on VM (start/stop/suspend/reset)", {
    vm_id: z.string().describe("VM identifier"),
    action: z.enum(["start", "stop", "suspend", "reset"]).describe("Power action"),
  }, async (params) => {
    return client.vmPower(params.vm_id, params.action);
  });

  server.tool("vsphere_create_vm", "Create a new virtual machine", {
    name: z.string().describe("VM name"),
    guest_OS: z.string().describe("Guest OS type (e.g. UBUNTU_64, WINDOWS_9_64)"),
    cpu_count: z.number().optional().describe("Number of CPUs (default: 2)"),
    memory_MiB: z.number().optional().describe("Memory in MiB (default: 4096)"),
    disk_capacity_GiB: z.number().optional().describe("Disk size in GiB (default: 40)"),
    datastore: z.string().optional().describe("Datastore ID"),
    network: z.string().optional().describe("Network ID"),
    folder: z.string().optional().describe("Folder ID"),
    resource_pool: z.string().optional().describe("Resource pool ID"),
  }, async (params) => {
    return client.createVm(params);
  });

  server.tool("vsphere_clone_vm", "Clone a virtual machine", {
    source_vm_id: z.string().describe("Source VM ID"),
    name: z.string().describe("Name for new VM"),
    datastore: z.string().optional().describe("Datastore ID"),
    folder: z.string().optional().describe("Folder ID"),
    resource_pool: z.string().optional().describe("Resource pool ID"),
  }, async (params) => {
    return client.cloneVm(params);
  });

  server.tool("vsphere_delete_vm", "Delete a VM (must be powered off)", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.deleteVm(params.vm_id);
  });

  server.tool("vsphere_edit_vm", "Edit VM configuration", {
    vm_id: z.string().describe("VM identifier"),
    name: z.string().optional().describe("New VM name"),
    cpu_count: z.number().optional().describe("New CPU count"),
    memory_MiB: z.number().optional().describe("New memory in MiB"),
    cores_per_socket: z.number().optional().describe("Cores per socket"),
  }, async (params) => {
    return client.editVm(params);
  });

  // --- Snapshots ---
  server.tool("vsphere_list_snapshots", "List VM snapshots", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listSnapshots(params.vm_id);
  });

  server.tool("vsphere_create_snapshot", "Create a VM snapshot", {
    vm_id: z.string().describe("VM identifier"),
    name: z.string().describe("Snapshot name"),
    description: z.string().optional().describe("Snapshot description"),
    memory: z.boolean().optional().describe("Include memory state"),
  }, async (params) => {
    return client.createSnapshot(params);
  });

  // --- Guest Info ---
  server.tool("vsphere_get_guest_identity", "Get guest OS info from VMware Tools", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getGuestIdentity(params.vm_id);
  });

  server.tool("vsphere_get_guest_networking", "Get guest network details", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getGuestNetworking(params.vm_id);
  });

  // --- Infrastructure ---
  server.tool("vsphere_list_hosts", "List all ESXi hosts", {}, async () => {
    return client.listHosts();
  });

  server.tool("vsphere_list_datastores", "List all datastores", {}, async () => {
    return client.listDatastores();
  });

  server.tool("vsphere_list_networks", "List all networks", {}, async () => {
    return client.listNetworks();
  });

  server.tool("vsphere_list_clusters", "List all clusters", {}, async () => {
    return client.listClusters();
  });

  server.tool("vsphere_list_folders", "List folders in inventory", {
    type: z.enum(["DATACENTER", "DATASTORE", "HOST", "NETWORK", "VIRTUAL_MACHINE"]).optional().describe("Filter by folder type"),
  }, async (params) => {
    return client.listFolders(params.type);
  });

  server.tool("vsphere_list_resource_pools", "List all resource pools", {}, async () => {
    return client.listResourcePools();
  });
}
