export interface VsphereConfig {
  enabled: boolean;
  host: string;
  username: string;
  password: string;
  ignoreSsl: boolean;
}

export interface AtlassianConfig {
  enabled: boolean;
  host: string;
  email: string;
  apiToken: string;
}

export interface PagerdutyConfig {
  enabled: boolean;
  apiToken: string;
  userEmail: string;
}

export interface ZabbixConfig {
  enabled: boolean;
  url: string;
  apiToken?: string;
  username?: string;
  password?: string;
}

export interface MysqlConfig {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

export interface ChannelsConfig {
  enabled: boolean;
}

export interface LxcConfig {
  enabled: boolean;
  hosts: string[];
  sshUser: string;
  sshKeyPath?: string;
}

export interface AwsDocsConfig {
  enabled: boolean;
}

export interface AppConfig {
  vsphere: VsphereConfig;
  atlassian: AtlassianConfig;
  pagerduty: PagerdutyConfig;
  zabbix: ZabbixConfig;
  mysql: MysqlConfig;
  channels: ChannelsConfig;
  lxc: LxcConfig;
  awsDocs: AwsDocsConfig;
}

function envBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

export function loadConfig(): AppConfig {
  return {
    vsphere: {
      enabled: !!process.env.VCENTER_HOST,
      host: process.env.VCENTER_HOST || "",
      username: process.env.VCENTER_USERNAME || "",
      password: process.env.VCENTER_PASSWORD || "",
      ignoreSsl: envBool(process.env.VCENTER_IGNORE_SSL, true),
    },
    atlassian: {
      enabled: !!process.env.ATLASSIAN_HOST && !!process.env.ATLASSIAN_API_TOKEN,
      host: process.env.ATLASSIAN_HOST || "",
      email: process.env.ATLASSIAN_EMAIL || "",
      apiToken: process.env.ATLASSIAN_API_TOKEN || "",
    },
    pagerduty: {
      enabled: !!process.env.PAGERDUTY_API_TOKEN,
      apiToken: process.env.PAGERDUTY_API_TOKEN || "",
      userEmail: process.env.PAGERDUTY_USER_EMAIL || "",
    },
    zabbix: {
      enabled: !!process.env.ZABBIX_URL,
      url: process.env.ZABBIX_URL || "",
      apiToken: process.env.ZABBIX_API_TOKEN,
      username: process.env.ZABBIX_USERNAME,
      password: process.env.ZABBIX_PASSWORD,
    },
    mysql: {
      enabled: !!process.env.MYSQL_HOST,
      host: process.env.MYSQL_HOST || "",
      port: parseInt(process.env.MYSQL_PORT || "3306", 10),
      user: process.env.MYSQL_USER || "",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
    },
    channels: {
      enabled: true, // Always enabled - uses SSH internally
    },
    lxc: {
      enabled: !!process.env.LXC_HOSTS,
      hosts: (process.env.LXC_HOSTS || "").split(",").filter(Boolean),
      sshUser: process.env.LXC_SSH_USER || "root",
      sshKeyPath: process.env.LXC_SSH_KEY_PATH,
    },
    awsDocs: {
      enabled: true, // Always enabled - no credentials needed
    },
  };
}
