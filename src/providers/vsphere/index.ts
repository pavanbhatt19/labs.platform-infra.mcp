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

  // --- VM CPU/Memory ---
  server.tool("vsphere_get_vm_cpu", "Get VM CPU configuration details", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmCpu(params.vm_id);
  });

  server.tool("vsphere_update_vm_cpu", "Update VM CPU (count, cores, hot-add)", {
    vm_id: z.string().describe("VM identifier"),
    count: z.number().optional().describe("CPU count"),
    cores_per_socket: z.number().optional().describe("Cores per socket"),
    hot_add_enabled: z.boolean().optional().describe("Enable CPU hot-add"),
    hot_remove_enabled: z.boolean().optional().describe("Enable CPU hot-remove"),
  }, async (params) => {
    const { vm_id, ...rest } = params;
    return client.updateVmCpu(vm_id, rest);
  });

  server.tool("vsphere_get_vm_memory", "Get VM memory configuration details", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getVmMemory(params.vm_id);
  });

  server.tool("vsphere_update_vm_memory", "Update VM memory (size, hot-add)", {
    vm_id: z.string().describe("VM identifier"),
    size_MiB: z.number().optional().describe("Memory in MiB"),
    hot_add_enabled: z.boolean().optional().describe("Enable memory hot-add"),
  }, async (params) => {
    const { vm_id, ...rest } = params;
    return client.updateVmMemory(vm_id, rest);
  });

  // --- Individual device get/update ---
  server.tool("vsphere_get_disk", "Get details of a specific disk", {
    vm_id: z.string().describe("VM identifier"),
    disk_id: z.string().describe("Disk identifier"),
  }, async (params) => {
    return client.getDisk(params.vm_id, params.disk_id);
  });

  server.tool("vsphere_update_disk", "Resize/expand a disk", {
    vm_id: z.string().describe("VM identifier"),
    disk_id: z.string().describe("Disk identifier"),
    capacity_GiB: z.number().describe("New capacity in GiB (can only grow)"),
  }, async (params) => {
    return client.updateDisk(params.vm_id, params.disk_id, params.capacity_GiB);
  });

  server.tool("vsphere_get_nic", "Get details of a specific NIC", {
    vm_id: z.string().describe("VM identifier"),
    nic_id: z.string().describe("NIC identifier"),
  }, async (params) => {
    return client.getNic(params.vm_id, params.nic_id);
  });

  server.tool("vsphere_update_nic", "Update NIC configuration (change network, etc.)", {
    vm_id: z.string().describe("VM identifier"),
    nic_id: z.string().describe("NIC identifier"),
    network: z.string().optional().describe("New network ID"),
    start_connected: z.boolean().optional().describe("Connect on power on"),
    allow_guest_control: z.boolean().optional().describe("Allow guest control"),
  }, async (params) => {
    const { vm_id, nic_id, ...rest } = params;
    return client.updateNic(vm_id, nic_id, rest);
  });

  server.tool("vsphere_connect_nic", "Connect a NIC (hot-plug)", {
    vm_id: z.string().describe("VM identifier"),
    nic_id: z.string().describe("NIC identifier"),
  }, async (params) => {
    return client.connectNic(params.vm_id, params.nic_id);
  });

  server.tool("vsphere_disconnect_nic", "Disconnect a NIC (hot-unplug)", {
    vm_id: z.string().describe("VM identifier"),
    nic_id: z.string().describe("NIC identifier"),
  }, async (params) => {
    return client.disconnectNic(params.vm_id, params.nic_id);
  });

  // --- CD-ROM CRUD ---
  server.tool("vsphere_get_cdrom", "Get CD-ROM device details", {
    vm_id: z.string().describe("VM identifier"),
    cdrom_id: z.string().describe("CD-ROM identifier"),
  }, async (params) => {
    return client.getCdrom(params.vm_id, params.cdrom_id);
  });

  server.tool("vsphere_add_cdrom", "Add a CD-ROM drive to a VM", {
    vm_id: z.string().describe("VM identifier"),
    iso_path: z.string().optional().describe("Datastore path to ISO file"),
    start_connected: z.boolean().optional().describe("Connect on power on"),
  }, async (params) => {
    const { vm_id, ...rest } = params;
    return client.addCdrom(vm_id, rest);
  });

  server.tool("vsphere_remove_cdrom", "Remove a CD-ROM drive from a VM", {
    vm_id: z.string().describe("VM identifier"),
    cdrom_id: z.string().describe("CD-ROM identifier"),
  }, async (params) => {
    return client.removeCdrom(params.vm_id, params.cdrom_id);
  });

  server.tool("vsphere_update_cdrom", "Update CD-ROM (mount/unmount ISO)", {
    vm_id: z.string().describe("VM identifier"),
    cdrom_id: z.string().describe("CD-ROM identifier"),
    iso_path: z.string().optional().describe("ISO path (null to eject)"),
    start_connected: z.boolean().optional().describe("Connect on power on"),
    allow_guest_control: z.boolean().optional().describe("Allow guest control"),
  }, async (params) => {
    const { vm_id, cdrom_id, ...rest } = params;
    return client.updateCdrom(vm_id, cdrom_id, rest);
  });

  server.tool("vsphere_connect_cdrom", "Connect a CD-ROM device", {
    vm_id: z.string().describe("VM identifier"),
    cdrom_id: z.string().describe("CD-ROM identifier"),
  }, async (params) => {
    return client.connectCdrom(params.vm_id, params.cdrom_id);
  });

  server.tool("vsphere_disconnect_cdrom", "Disconnect a CD-ROM device", {
    vm_id: z.string().describe("VM identifier"),
    cdrom_id: z.string().describe("CD-ROM identifier"),
  }, async (params) => {
    return client.disconnectCdrom(params.vm_id, params.cdrom_id);
  });

  // --- SCSI/SATA Adapter CRUD ---
  server.tool("vsphere_add_scsi_adapter", "Add a SCSI adapter to a VM", {
    vm_id: z.string().describe("VM identifier"),
    type: z.enum(["BUSLOGIC", "LSILOGIC", "LSILOGICSAS", "PVSCSI"]).optional().describe("SCSI adapter type"),
  }, async (params) => {
    return client.addScsiAdapter(params.vm_id, params.type);
  });

  server.tool("vsphere_remove_scsi_adapter", "Remove a SCSI adapter from a VM", {
    vm_id: z.string().describe("VM identifier"),
    adapter_id: z.string().describe("SCSI adapter identifier"),
  }, async (params) => {
    return client.removeScsiAdapter(params.vm_id, params.adapter_id);
  });

  server.tool("vsphere_add_sata_adapter", "Add a SATA adapter to a VM", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.addSataAdapter(params.vm_id);
  });

  server.tool("vsphere_remove_sata_adapter", "Remove a SATA adapter from a VM", {
    vm_id: z.string().describe("VM identifier"),
    adapter_id: z.string().describe("SATA adapter identifier"),
  }, async (params) => {
    return client.removeSataAdapter(params.vm_id, params.adapter_id);
  });

  // --- Guest Operations ---
  server.tool("vsphere_guest_run_program", "Run a program inside the guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    path: z.string().describe("Path to executable in guest"),
    arguments: z.string().optional().describe("Program arguments"),
    working_directory: z.string().optional().describe("Working directory in guest"),
  }, async (params) => {
    return client.guestRunProgram(params.vm_id, params);
  });

  server.tool("vsphere_guest_get_process", "Get info about a guest process by PID", {
    vm_id: z.string().describe("VM identifier"),
    pid: z.number().describe("Process ID in guest"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
  }, async (params) => {
    return client.guestGetProcess(params.vm_id, params.pid, params.username, params.password);
  });

  server.tool("vsphere_guest_list_processes", "List running processes in guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
  }, async (params) => {
    return client.guestListProcesses(params.vm_id, params.username, params.password);
  });

  server.tool("vsphere_guest_get_environment_variables", "Get guest OS environment variables", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    names: z.array(z.string()).optional().describe("Specific variable names to get"),
  }, async (params) => {
    return client.guestGetEnvironmentVariables(params.vm_id, params.username, params.password, params.names);
  });

  // --- Guest Customization ---
  server.tool("vsphere_list_customization_specs", "List guest customization specifications", {}, async () => {
    return client.listGuestCustomizationSpecs();
  });

  server.tool("vsphere_get_customization_spec", "Get a guest customization spec by name", {
    spec_name: z.string().describe("Customization spec name"),
  }, async (params) => {
    return client.getGuestCustomizationSpec(params.spec_name);
  });

  // --- Storage Policies ---
  server.tool("vsphere_list_storage_policies", "List all storage policies", {}, async () => {
    return client.listStoragePolicies();
  });

  server.tool("vsphere_get_storage_policy_compliance", "Check VM storage policy compliance", {
    vm_id: z.string().describe("VM identifier"),
  }, async (params) => {
    return client.getStoragePolicyCompliance(params.vm_id);
  });

  // --- Host Connection ---
  server.tool("vsphere_connect_host", "Connect an ESXi host to vCenter", {
    host_id: z.string().describe("Host identifier"),
  }, async (params) => {
    return client.connectHost(params.host_id);
  });

  server.tool("vsphere_disconnect_host", "Disconnect an ESXi host from vCenter", {
    host_id: z.string().describe("Host identifier"),
  }, async (params) => {
    return client.disconnectHost(params.host_id);
  });

  // --- Distributed Switches ---
  server.tool("vsphere_list_distributed_switches", "List distributed virtual switches", {}, async () => {
    return client.listDistributedSwitches();
  });

  server.tool("vsphere_list_distributed_portgroups", "List distributed port groups", {}, async () => {
    return client.listDistributedPortgroups();
  });

  // --- Certificates ---
  server.tool("vsphere_list_tls_certificates", "List vCenter TLS certificates", {}, async () => {
    return client.listTlsCertificates();
  });

  server.tool("vsphere_get_trusted_root_chains", "Get trusted root certificate chains", {}, async () => {
    return client.getTrustedRootChains();
  });

  // --- vCenter Services ---
  server.tool("vsphere_list_services", "List all vCenter services", {}, async () => {
    return client.listVcenterServices();
  });

  server.tool("vsphere_get_service", "Get details of a vCenter service", {
    service_id: z.string().describe("Service identifier"),
  }, async (params) => {
    return client.getVcenterService(params.service_id);
  });

  server.tool("vsphere_start_service", "Start a vCenter service", {
    service_id: z.string().describe("Service identifier"),
  }, async (params) => {
    return client.startVcenterService(params.service_id);
  });

  server.tool("vsphere_stop_service", "Stop a vCenter service", {
    service_id: z.string().describe("Service identifier"),
  }, async (params) => {
    return client.stopVcenterService(params.service_id);
  });

  server.tool("vsphere_restart_service", "Restart a vCenter service", {
    service_id: z.string().describe("Service identifier"),
  }, async (params) => {
    return client.restartVcenterService(params.service_id);
  });

  // --- Appliance Management ---
  server.tool("vsphere_get_appliance_health", "Get vCenter appliance overall health", {}, async () => {
    return client.getApplianceHealth();
  });

  server.tool("vsphere_get_appliance_version", "Get vCenter appliance version info", {}, async () => {
    return client.getApplianceVersion();
  });

  server.tool("vsphere_get_appliance_networking", "Get vCenter appliance network config", {}, async () => {
    return client.getApplianceNetworking();
  });

  server.tool("vsphere_get_appliance_network_interfaces", "Get vCenter appliance network interfaces", {}, async () => {
    return client.getApplianceNetworkInterfaces();
  });

  server.tool("vsphere_get_appliance_storage", "Get vCenter appliance storage usage", {}, async () => {
    return client.getApplianceStorage();
  });

  server.tool("vsphere_get_appliance_uptime", "Get vCenter appliance uptime", {}, async () => {
    return client.getApplianceUptime();
  });

  server.tool("vsphere_get_appliance_health_memory", "Get vCenter memory health status", {}, async () => {
    return client.getApplianceHealthMemory();
  });

  server.tool("vsphere_get_appliance_health_cpu", "Get vCenter CPU load health", {}, async () => {
    return client.getApplianceHealthCpu();
  });

  server.tool("vsphere_get_appliance_health_database", "Get vCenter database storage health", {}, async () => {
    return client.getApplianceHealthDatabase();
  });

  server.tool("vsphere_get_appliance_health_software", "Get vCenter software packages health", {}, async () => {
    return client.getApplianceHealthSoftwarePackages();
  });

  // --- Datacenter CRUD ---
  server.tool("vsphere_create_datacenter", "Create a new datacenter", {
    name: z.string().describe("Datacenter name"),
    folder: z.string().optional().describe("Parent folder ID"),
  }, async (params) => {
    return client.createDatacenter(params.name, params.folder);
  });

  server.tool("vsphere_delete_datacenter", "Delete a datacenter", {
    datacenter_id: z.string().describe("Datacenter identifier"),
    force: z.boolean().optional().describe("Force delete even if not empty"),
  }, async (params) => {
    return client.deleteDatacenter(params.datacenter_id, params.force);
  });

  // --- Folder CRUD ---
  server.tool("vsphere_create_folder", "Create a new folder", {
    name: z.string().describe("Folder name"),
    type: z.enum(["DATACENTER", "DATASTORE", "HOST", "NETWORK", "VIRTUAL_MACHINE"]).describe("Folder type"),
    parent_folder: z.string().optional().describe("Parent folder ID"),
  }, async (params) => {
    return client.createFolder(params.name, params.type, params.parent_folder);
  });

  server.tool("vsphere_delete_folder", "Delete a folder", {
    folder_id: z.string().describe("Folder identifier"),
  }, async (params) => {
    return client.deleteFolder(params.folder_id);
  });

  // --- Resource Pool CRUD ---
  server.tool("vsphere_create_resource_pool", "Create a new resource pool", {
    name: z.string().describe("Resource pool name"),
    parent: z.string().describe("Parent resource pool or cluster ID"),
    cpu_allocation: z.record(z.any()).optional().describe("CPU allocation config"),
    memory_allocation: z.record(z.any()).optional().describe("Memory allocation config"),
  }, async (params) => {
    return client.createResourcePool(params);
  });

  server.tool("vsphere_update_resource_pool", "Update a resource pool", {
    pool_id: z.string().describe("Resource pool identifier"),
    name: z.string().optional().describe("New name"),
    cpu_allocation: z.record(z.any()).optional().describe("CPU allocation config"),
    memory_allocation: z.record(z.any()).optional().describe("Memory allocation config"),
  }, async (params) => {
    const { pool_id, ...rest } = params;
    return client.updateResourcePool(pool_id, rest);
  });

  server.tool("vsphere_delete_resource_pool", "Delete a resource pool", {
    pool_id: z.string().describe("Resource pool identifier"),
  }, async (params) => {
    return client.deleteResourcePool(params.pool_id);
  });

  // --- Host Add/Remove ---
  server.tool("vsphere_add_host", "Add an ESXi host to vCenter inventory", {
    hostname: z.string().describe("ESXi hostname or IP"),
    username: z.string().describe("ESXi root username"),
    password: z.string().describe("ESXi root password"),
    folder: z.string().optional().describe("Host folder ID"),
    thumbprint: z.string().optional().describe("SSL thumbprint for verification"),
  }, async (params) => {
    return client.addHostToCluster(params);
  });

  server.tool("vsphere_remove_host", "Remove an ESXi host from vCenter inventory", {
    host_id: z.string().describe("Host identifier"),
  }, async (params) => {
    return client.removeHost(params.host_id);
  });

  // --- Content Library CRUD ---
  server.tool("vsphere_create_content_library", "Create a new local content library", {
    name: z.string().describe("Library name"),
    datastore_id: z.string().describe("Backing datastore ID"),
    description: z.string().optional().describe("Library description"),
  }, async (params) => {
    return client.createContentLibrary(params);
  });

  server.tool("vsphere_delete_content_library", "Delete a content library", {
    library_id: z.string().describe("Library identifier"),
  }, async (params) => {
    return client.deleteContentLibrary(params.library_id);
  });

  server.tool("vsphere_get_content_library", "Get content library details", {
    library_id: z.string().describe("Library identifier"),
  }, async (params) => {
    return client.getContentLibrary(params.library_id);
  });

  server.tool("vsphere_get_library_item", "Get a specific library item details", {
    item_id: z.string().describe("Library item identifier"),
  }, async (params) => {
    return client.getLibraryItem(params.item_id);
  });

  server.tool("vsphere_sync_subscribed_library", "Sync a subscribed content library", {
    library_id: z.string().describe("Subscribed library identifier"),
  }, async (params) => {
    return client.syncSubscribedLibrary(params.library_id);
  });

  // --- Namespaces (vSphere with Tanzu) ---
  server.tool("vsphere_list_namespaces", "List Supervisor namespaces (Tanzu)", {}, async () => {
    return client.listNamespaces();
  });

  server.tool("vsphere_get_namespace", "Get Supervisor namespace details", {
    namespace: z.string().describe("Namespace name"),
  }, async (params) => {
    return client.getNamespace(params.namespace);
  });

  server.tool("vsphere_list_supervisor_clusters", "List Supervisor clusters (Tanzu)", {}, async () => {
    return client.listSupervisorClusters();
  });

  // --- Guest File Transfer ---
  server.tool("vsphere_guest_create_temp_file", "Create a temp file in guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    prefix: z.string().optional().describe("Filename prefix"),
    suffix: z.string().optional().describe("Filename suffix"),
  }, async (params) => {
    return client.guestCreateTempFile(params.vm_id, params.username, params.password, params.prefix, params.suffix);
  });

  server.tool("vsphere_guest_create_temp_directory", "Create a temp directory in guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    prefix: z.string().optional().describe("Directory prefix"),
    suffix: z.string().optional().describe("Directory suffix"),
  }, async (params) => {
    return client.guestCreateTempDirectory(params.vm_id, params.username, params.password, params.prefix, params.suffix);
  });

  server.tool("vsphere_guest_make_directory", "Create a directory in guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    path: z.string().describe("Directory path to create"),
    create_parents: z.boolean().optional().describe("Create parent directories"),
  }, async (params) => {
    return client.guestMakeDirectory(params.vm_id, params.username, params.password, params.path, params.create_parents);
  });

  server.tool("vsphere_guest_delete_path", "Delete a file or directory in guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    path: z.string().describe("Path to delete"),
    recursive: z.boolean().optional().describe("Recursive delete for directories"),
  }, async (params) => {
    return client.guestDeletePath(params.vm_id, params.username, params.password, params.path, params.recursive);
  });

  server.tool("vsphere_guest_move_file", "Move/rename a file in guest OS", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    src_path: z.string().describe("Source path"),
    dest_path: z.string().describe("Destination path"),
  }, async (params) => {
    return client.guestMoveFile(params.vm_id, params.username, params.password, params.src_path, params.dest_path);
  });

  // --- Guest Windows Registry ---
  server.tool("vsphere_guest_list_registry_keys", "List Windows registry keys (Windows guests only)", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    path: z.string().describe("Registry path (e.g. HKLM\\SOFTWARE)"),
  }, async (params) => {
    return client.guestListRegistryKeys(params.vm_id, params.username, params.password, params.path);
  });

  server.tool("vsphere_guest_get_registry_value", "Get a Windows registry value (Windows guests only)", {
    vm_id: z.string().describe("VM identifier"),
    username: z.string().describe("Guest OS username"),
    password: z.string().describe("Guest OS password"),
    path: z.string().describe("Registry key path"),
    name: z.string().describe("Value name"),
  }, async (params) => {
    return client.guestGetRegistryValue(params.vm_id, params.username, params.password, params.path, params.name);
  });

  // --- Appliance Recovery & Backup ---
  server.tool("vsphere_get_backup_schedules", "Get vCenter backup schedules", {}, async () => {
    return client.getApplianceBackupSchedules();
  });

  server.tool("vsphere_get_backup_jobs", "Get vCenter backup job history", {}, async () => {
    return client.getApplianceBackupJobs();
  });

  // --- Appliance Updates ---
  server.tool("vsphere_get_pending_updates", "Get pending vCenter updates", {}, async () => {
    return client.getApplianceUpdatePending();
  });

  server.tool("vsphere_get_staged_updates", "Get staged vCenter updates", {}, async () => {
    return client.getApplianceUpdateStaged();
  });

  server.tool("vsphere_get_update_policy", "Get vCenter auto-update policy", {}, async () => {
    return client.getApplianceUpdatePolicy();
  });

  // --- Appliance NTP/DNS/Proxy/Firewall ---
  server.tool("vsphere_get_appliance_ntp", "Get vCenter NTP configuration", {}, async () => {
    return client.getApplianceNtp();
  });

  server.tool("vsphere_get_appliance_dns", "Get vCenter DNS servers", {}, async () => {
    return client.getApplianceDns();
  });

  server.tool("vsphere_get_appliance_dns_hostname", "Get vCenter DNS hostname", {}, async () => {
    return client.getApplianceDnsHostname();
  });

  server.tool("vsphere_get_appliance_proxy", "Get vCenter proxy configuration", {}, async () => {
    return client.getApplianceProxy();
  });

  server.tool("vsphere_get_appliance_firewall", "Get vCenter firewall inbound rules", {}, async () => {
    return client.getApplianceFirewall();
  });

  // --- Appliance Access ---
  server.tool("vsphere_get_appliance_access_shell", "Get vCenter shell access status", {}, async () => {
    return client.getApplianceAccessShell();
  });

  server.tool("vsphere_get_appliance_access_ssh", "Get vCenter SSH access status", {}, async () => {
    return client.getApplianceAccessSsh();
  });

  server.tool("vsphere_get_appliance_access_dcui", "Get vCenter DCUI access status", {}, async () => {
    return client.getApplianceAccessDcui();
  });

  // --- Appliance Time ---
  server.tool("vsphere_get_appliance_timezone", "Get vCenter timezone", {}, async () => {
    return client.getApplianceTimezone();
  });

  server.tool("vsphere_get_appliance_time", "Get vCenter system time", {}, async () => {
    return client.getApplianceTime();
  });
}