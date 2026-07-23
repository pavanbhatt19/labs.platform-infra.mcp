# Platform Infra MCP

A unified MCP (Model Context Protocol) server that aggregates 8 infrastructure backends into a single tool for the team.

## Included Providers

| Provider | Tools | Description |
|----------|-------|-------------|
| **vSphere** | 17 tools | VM lifecycle, snapshots, hosts, datastores, networks |
| **Atlassian** | 12 tools | Jira issues, transitions, comments + Confluence pages, spaces |
| **PagerDuty** | 10 tools | Incidents, services, oncalls, schedules, escalation policies |
| **Zabbix** | 10 tools | Hosts, problems, triggers, history, maintenance windows |
| **MySQL** | 11 tools | Queries, schema, explain, replication, table stats |
| **Channels** | 9 tools | Channel server investigation, logs, alerts (internal) |
| **LXC** | 5 tools | Execute commands across LXC hosts, file management |
| **AWS Docs** | 3 tools | Search and read AWS documentation |

**Total: ~77 tools** available through a single MCP server.

## Quick Start (for your team)

### 1. Install globally (one-time)

```bash
npm install -g @sophos/platform-infra-mcp
```

### 2. Add to Kiro

Add to your `.kiro/settings/mcp.json` — only include env vars for the providers you use:

```json
{
  "mcpServers": {
    "platform-infra": {
      "command": "platform-infra-mcp",
      "env": {
        "VCENTER_HOST": "abn-vc1.green.sophos",
        "VCENTER_USERNAME": "your-user",
        "VCENTER_PASSWORD": "your-pass",
        "ATLASSIAN_HOST": "https://sophos.atlassian.net",
        "ATLASSIAN_EMAIL": "your-email",
        "ATLASSIAN_API_TOKEN": "your-token",
        "PAGERDUTY_API_TOKEN": "your-token",
        "PAGERDUTY_USER_EMAIL": "your-email",
        "ZABBIX_URL": "https://your-zabbix",
        "ZABBIX_API_TOKEN": "your-token",
        "MYSQL_HOST": "your-host",
        "MYSQL_USER": "your-user",
        "MYSQL_PASSWORD": "your-pass",
        "LXC_HOSTS": "host1,host2,host3",
        "LXC_SSH_USER": "root"
      }
    }
  }
}
```

That's it. Each provider auto-enables when its required env vars are present.
No credentials for a provider = provider silently disabled (no errors).

### 3. Verify

Open Kiro, start a session, and ask:
> "List all VMs in vSphere"

or

> "Show current PagerDuty incidents"

---

## For developers (contributing to this repo)

```bash
git clone git@github.com:sophos/labs.platform-infra.mcp.git
cd labs.platform-infra.mcp
npm install
npm run build

# Run locally during development
npm run dev
```

## Publishing a new version

```bash
npm version patch   # or minor/major
npm publish         # auto-builds via prepublishOnly
```

## Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `VCENTER_HOST` | vSphere | vCenter hostname/IP |
| `VCENTER_USERNAME` | vSphere | vCenter username |
| `VCENTER_PASSWORD` | vSphere | vCenter password |
| `VCENTER_IGNORE_SSL` | vSphere | Ignore SSL errors (default: true) |
| `ATLASSIAN_HOST` | Atlassian | Instance URL |
| `ATLASSIAN_EMAIL` | Atlassian | Account email |
| `ATLASSIAN_API_TOKEN` | Atlassian | API token |
| `PAGERDUTY_API_TOKEN` | PagerDuty | REST API token |
| `PAGERDUTY_USER_EMAIL` | PagerDuty | Your PD email (for write ops) |
| `ZABBIX_URL` | Zabbix | Zabbix server URL |
| `ZABBIX_API_TOKEN` | Zabbix | API token (or use user/pass) |
| `ZABBIX_USERNAME` | Zabbix | Username (alternative to token) |
| `ZABBIX_PASSWORD` | Zabbix | Password (alternative to token) |
| `MYSQL_HOST` | MySQL | MySQL hostname |
| `MYSQL_PORT` | MySQL | Port (default: 3306) |
| `MYSQL_USER` | MySQL | Username |
| `MYSQL_PASSWORD` | MySQL | Password |
| `MYSQL_DATABASE` | MySQL | Default database |
| `LXC_HOSTS` | LXC | Comma-separated host list |
| `LXC_SSH_USER` | LXC | SSH username (default: root) |
| `LXC_SSH_KEY_PATH` | LXC | SSH key path (or uses agent) |

## Architecture

```
src/
├── index.ts          # MCP server entry point
├── config.ts         # Environment-based configuration
├── utils/
│   └── http.ts       # Shared response helpers
└── providers/
    ├── vsphere/      # VMware vCenter
    ├── atlassian/    # Jira + Confluence
    ├── pagerduty/    # Incident management
    ├── zabbix/       # Monitoring
    ├── mysql/        # Database
    ├── channels/     # Channel servers (internal)
    ├── lxc/          # LXC host management
    └── aws-docs/     # AWS documentation
```

## Adding New Providers

1. Create `src/providers/<name>/client.ts` — API interaction logic
2. Create `src/providers/<name>/index.ts` — Tool registration
3. Add config interface to `src/config.ts`
4. Register in `src/index.ts`

## License

MIT - Internal use at Sophos Labs
