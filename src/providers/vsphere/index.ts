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

  server.tool("vsphere_get_resource_pool", "Get resource pool details", {
    pool_id: z.string().describe("Resource pool identifier"),
  }, async (params) => {
    return client.getResourcePool(params.pool_id);
  });

  // --- Snapshot extras ---
  server.tool("vsphere_revert_snapshot", "Revert a VM to a specific snapshot", {
    vm_id: z.string().describe("VM identifier"),
    snapshot_id: z.string().describe("Snapshot identifier"),
  }, async (params) => {
    return client.revertSnapshot(params.vm_id, params.snapshot_id);
  });

  server.tool("vsphere_delete_snapshot", "Delete a VM snapshot", {
    vm_id: z.string().describe("VM identifier"),
    snapshot_id: z.string().describe("Snapshot identifier"),
  }, async (params) => {
    return client.deleteSnapshot(params.vm_id, params.snapshot_id);
  });

  // --- Host details ---
  server.tool("vsphere_get_host", "Get detailed information about an ESXi host", {
    host_id: z.string().describe("Host identifier"),
  }, async (params) => {
    return client.getHost(params.host_id);
  });

  server.tool("vsphere_host_maintenance", "Enter or exit maintenance mode on an ESXi host", {
    host_id: z.string().describe("Host identifier"),
    action: z.enum(["enter", "exit"]).describe("Maintenance action"),
  }, async (params) => {
    return client.hostMaintenance(params.host_id, params.action);
  });

  // --- Datastore/Cluster details ---
  server.tool("vsphere_get_datastore", "Get datastore details", {
    datastore_id: z.string().describe("Datastore identifier"),
  }, async (params) => {
    return client.getDatastore(params.datastore_id);
  });

  server.tool("vsphere_get_cluster", "Get cluster details (DRS, HA status)", {
    cluster_id: z.string().describe("Cluster identifier"),
  }, async (params) => {
    return client.getCluster(params.cluster_id);
  });

  // --- Datacenters ---
  server.tool("vsphere_list_datacenters", "List all datacenters", {}, async () => {
    return client.listDatacenters();
  });

  // --- Tags ---
  server.tool("vsphere_list_tag_categories", "List all tag categories", {}, async () => {
    return client.listTagCategories();
  });

  server.tool("vsphere_list_tags", "List tags, optionally by category", {
    category_id: z.string().optional().describe("Category ID to filter by"),
  }, async (params) => {
    return client.listTags(params.category_id);
  });

  server.tool("vsphere_get_tag", "Get tag details", {
    tag_id: z.string().describe("Tag identifier"),
  }, async (params) => {
    return client.getTag(params.tag_id);
  });

  server.tool("vsphere_attach_tag", "Attach a tag to an object", {
    tag_id: z.string().describe("Tag identifier"),
    object_id: z.string().describe("Object identifier (e.g. vm-123)"),
    object_type: z.string().describe("Object type (e.g. VirtualMachine, HostSystem, Datastore)"),
  }, async (params) => {
    return client.attachTag(params.tag_id, params.object_id, params.object_type);
  });

  server.tool("vsphere_detach_tag", "Detach a tag from an object", {
    tag_id: z.string().describe("Tag identifier"),
    object_id: z.string().describe("Object identifier"),
    object_type: z.string().describe("Object type"),
  }, async (params) => {
    return client.detachTag(params.tag_id, params.object_id, params.object_type);
  });

  server.tool("vsphere_list_attached_tags", "List all tags attached to an object", {
    object_id: z.string().describe("Object identifier"),
    object_type: z.string().describe("Object type (e.g. VirtualMachine)"),
  }, async (params) => {
    return client.listAttachedTags(params.object_id, params.object_type);
  });

  // --- Content Libraries ---
  server.tool("vsphere_list_content_libraries", "List content libraries", {}, async () => {
    return client.listContentLibraries();
  });

  server.tool("vsphere_list_library_items", "List items in a content library", {
    library_id: z.string().describe("Content library ID"),
  }, async (params) => {
    return client.listLibraryItems(params.library_id);
  });

  server.tool("vsphere_deploy_library_item", "Deploy a VM from a library item (OVF/template)", {
    item_id: z.string().describe("Library item ID"),
    name: z.string().describe("Name for the deployed VM"),
    resource_pool: z.string().optional().describe("Resource pool ID"),
    folder: z.string().optional().describe("Folder ID"),
    datastore: z.string().optional().describe("Datastore ID"),
  }, async (params) => {
    return client.deployLibraryItem(params);
  });

  // --- Disks ---
  server.tool("vsphere_list_disks", "List disks attached to a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listDisks(params.vm_id);
  });

  server.tool("vsphere_add_disk", "Add a new disk to a VM", {
    vm_id: z.string().describe("VM identifier"),
    capacity_GiB: z.number().describe("Disk capacity in GiB"),
  }, async (params) => {
    return client.addDisk(params.vm_id, params.capacity_GiB);
  });

  server.tool("vsphere_remove_disk", "Remove a disk from a VM", {
    vm_id: z.string().describe("VM identifier"),
    disk_id: z.string().describe("Disk identifier (e.g. 2000)"),
  }, async (params) => {
    return client.removeDisk(params.vm_id, params.disk_id);
  });

  // --- NICs ---
  server.tool("vsphere_list_nics", "List network adapters on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listNics(params.vm_id);
  });

  server.tool("vsphere_add_nic", "Add a network adapter to a VM", {
    vm_id: z.string().describe("VM identifier"),
    network: z.string().describe("Network ID to connect to"),
    start_connected: z.boolean().optional().describe("Connect on power on (default: true)"),
  }, async (params) => {
    return client.addNic(params.vm_id, params.network, params.start_connected);
  });

  server.tool("vsphere_remove_nic", "Remove a network adapter from a VM", {
    vm_id: z.string().describe("VM identifier"),
    nic_id: z.string().describe("NIC identifier (e.g. 4000)"),
  }, async (params) => {
    return client.removeNic(params.vm_id, params.nic_id);
  });

  // --- VM Hardware Info ---
  server.tool("vsphere_get_vm_hardware", "Get full VM hardware summary", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmHardware(params.vm_id);
  });

  server.tool("vsphere_get_vm_boot", "Get VM boot configuration (BIOS/EFI, delay)", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmBoot(params.vm_id);
  });

  server.tool("vsphere_update_vm_boot", "Update VM boot config (type, delay, retry)", {
    vm_id: z.string().describe("VM identifier"),
    type: z.enum(["BIOS", "EFI"]).optional().describe("Boot firmware type"),
    delay: z.number().optional().describe("Boot delay in ms"),
    enter_setup_mode: z.boolean().optional().describe("Enter BIOS/EFI setup on next boot"),
    retry: z.boolean().optional().describe("Retry boot on failure"),
    retry_delay: z.number().optional().describe("Retry delay in ms"),
  }, async (params) => {
    const { vm_id, ...rest } = params;
    return client.updateVmBoot(vm_id, rest);
  });

  server.tool("vsphere_get_vm_boot_device", "Get VM boot device order", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmBootDevice(params.vm_id);
  });

  // --- VM Hardware: CD/Floppy/Serial/Parallel ---
  server.tool("vsphere_list_cdroms", "List CD-ROM drives on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listCdroms(params.vm_id);
  });

  server.tool("vsphere_list_floppies", "List floppy drives on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listFloppies(params.vm_id);
  });

  server.tool("vsphere_list_serial_ports", "List serial ports on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listSerialPorts(params.vm_id);
  });

  server.tool("vsphere_list_parallel_ports", "List parallel ports on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listParallelPorts(params.vm_id);
  });

  // --- VM Hardware: Storage Adapters ---
  server.tool("vsphere_list_scsi_adapters", "List SCSI adapters on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listScsiAdapters(params.vm_id);
  });

  server.tool("vsphere_list_sata_adapters", "List SATA adapters on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.listSataAdapters(params.vm_id);
  });

  // --- VM Guest Operations ---
  server.tool("vsphere_get_vm_guest_power", "Get guest OS power state", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmGuestPower(params.vm_id);
  });

  server.tool("vsphere_vm_guest_shutdown", "Graceful guest OS shutdown (requires VMware Tools)", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.vmGuestShutdown(params.vm_id);
  });

  server.tool("vsphere_vm_guest_reboot", "Graceful guest OS reboot (requires VMware Tools)", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.vmGuestReboot(params.vm_id);
  });

  server.tool("vsphere_vm_guest_standby", "Put guest OS in standby (requires VMware Tools)", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.vmGuestStandby(params.vm_id);
  });

  server.tool("vsphere_get_vm_guest_filesystem", "Get guest local filesystem info", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmGuestLocalFilesystem(params.vm_id);
  });

  // --- VM Tools ---
  server.tool("vsphere_get_vm_tools", "Get VMware Tools status and version", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmTools(params.vm_id);
  });

  server.tool("vsphere_upgrade_vm_tools", "Upgrade VMware Tools on a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.upgradeVmTools(params.vm_id);
  });

  // --- VM Storage Policy ---
  server.tool("vsphere_get_vm_storage_policy", "Get VM storage policy compliance", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmStoragePolicy(params.vm_id);
  });

  // --- VM Console ---
  server.tool("vsphere_get_vm_console_ticket", "Get a console ticket (VMRC/WEBMKS) for a VM", {
    vm_id: z.string().describe("VM identifier"),
    type: z.enum(["VMRC", "WEBMKS"]).optional().describe("Console type (default: VMRC)"),
  }, async (params) => {
    return client.getVmConsoleTicket(params.vm_id, params.type);
  });

  // --- Network/Datacenter details ---
  server.tool("vsphere_get_network", "Get details of a specific network", {
    network_id: z.string().describe("Network identifier"),
  }, async (params) => {
    return client.getNetwork(params.network_id);
  });

  server.tool("vsphere_get_datacenter", "Get details of a specific datacenter", {
    datacenter_id: z.string().describe("Datacenter identifier"),
  }, async (params) => {
    return client.getDatacenter(params.datacenter_id);
  });

  // --- Tag Category CRUD ---
  server.tool("vsphere_create_tag_category", "Create a new tag category", {
    name: z.string().describe("Category name"),
    description: z.string().optional().describe("Category description"),
    cardinality: z.enum(["SINGLE", "MULTIPLE"]).optional().describe("Single or multiple tags per object (default: MULTIPLE)"),
    associable_types: z.array(z.string()).optional().describe("Object types this category can be associated with (empty = all)"),
  }, async (params) => {
    return client.createTagCategory(params);
  });

  server.tool("vsphere_delete_tag_category", "Delete a tag category", {
    category_id: z.string().describe("Category identifier"),
  }, async (params) => {
    return client.deleteTagCategory(params.category_id);
  });

  // --- Tag CRUD ---
  server.tool("vsphere_create_tag", "Create a new tag in a category", {
    name: z.string().describe("Tag name"),
    category_id: z.string().describe("Category ID this tag belongs to"),
    description: z.string().optional().describe("Tag description"),
  }, async (params) => {
    return client.createTag(params);
  });

  server.tool("vsphere_delete_tag", "Delete a tag", {
    tag_id: z.string().describe("Tag identifier"),
  }, async (params) => {
    return client.deleteTag(params.tag_id);
  });

  server.tool("vsphere_list_objects_attached_to_tag", "List all objects that have a specific tag", {
    tag_id: z.string().describe("Tag identifier"),
  }, async (params) => {
    return client.listObjectsAttachedToTag(params.tag_id);
  });

  // --- VM Templates ---
  server.tool("vsphere_list_vm_templates", "List VM templates in content library", {}, async () => {
    return client.listVmTemplates();
  });

  server.tool("vsphere_get_vm_template", "Get VM template details", {
    template_id: z.string().describe("Template library item ID"),
  }, async (params) => {
    return client.getVmTemplate(params.template_id);
  });

  server.tool("vsphere_deploy_vm_template", "Deploy a VM from a template", {
    template_id: z.string().describe("Template library item ID"),
    name: z.string().describe("Name for the deployed VM"),
    resource_pool: z.string().optional().describe("Resource pool ID"),
    folder: z.string().optional().describe("Folder ID"),
    datastore: z.string().optional().describe("Datastore ID"),
    powered_on: z.boolean().optional().describe("Power on after deploy (default: false)"),
  }, async (params) => {
    return client.deployVmTemplate(params);
  });

  // --- OVF ---
  server.tool("vsphere_filter_ovf_library_item", "Get deployment options for an OVF library item", {
    item_id: z.string().describe("Library item ID"),
    target_resource_pool: z.string().describe("Target resource pool ID"),
  }, async (params) => {
    return client.filterOvfLibraryItem(params.item_id, params.target_resource_pool);
  });

  // --- VM Relocate (vMotion) ---
  server.tool("vsphere_relocate_vm", "Relocate/vMotion a VM to another host or datastore", {
    vm_id: z.string().describe("VM identifier"),
    host: z.string().optional().describe("Target host ID"),
    resource_pool: z.string().optional().describe("Target resource pool ID"),
    datastore: z.string().optional().describe("Target datastore ID"),
    folder: z.string().optional().describe("Target folder ID"),
  }, async (params) => {
    const { vm_id, ...rest } = params;
    return client.relocateVm(vm_id, rest);
  });

  // --- VM Register/Unregister ---
  server.tool("vsphere_register_vm", "Register an existing VM from a datastore path", {
    path: z.string().describe("Datastore path to the .vmx file"),
    name: z.string().optional().describe("VM name"),
    datastore: z.string().optional().describe("Datastore ID"),
    folder: z.string().optional().describe("Folder ID"),
    resource_pool: z.string().optional().describe("Resource pool ID"),
  }, async (params) => {
    return client.registerVm(params);
  });

  server.tool("vsphere_unregister_vm", "Unregister a VM (remove from inventory without deleting files)", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.unregisterVm(params.vm_id);
  });

  // --- VM Instant Clone ---
  server.tool("vsphere_instant_clone_vm", "Instant clone a running VM (forkable VMs)", {
    source_vm_id: z.string().describe("Source VM ID (must be running)"),
    name: z.string().describe("Name for the cloned VM"),
    resource_pool: z.string().optional().describe("Resource pool ID"),
    folder: z.string().optional().describe("Folder ID"),
    datastore: z.string().optional().describe("Datastore ID"),
  }, async (params) => {
    return client.instantCloneVm(params);
  });
}