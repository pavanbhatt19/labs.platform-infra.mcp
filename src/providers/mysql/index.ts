import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MysqlConfig } from "../../config.js";
import { MysqlClient } from "./client.js";

export function registerMysqlTools(server: McpServer, config: MysqlConfig) {
  const client = new MysqlClient(config);

  server.tool("mysql_query", "Execute a SQL query", {
    sql: z.string().describe("SQL query to execute"),
  }, async (params) => {
    return client.query(params.sql);
  });

  server.tool("mysql_list_databases", "List all databases", {}, async () => {
    return client.listDatabases();
  });

  server.tool("mysql_list_tables", "List all tables in a database", {
    database: z.string().optional().describe("Database name"),
  }, async (params) => {
    return client.listTables(params.database);
  });

  server.tool("mysql_describe_table", "Show table structure", {
    table: z.string().describe("Table name"),
    database: z.string().optional().describe("Database name"),
  }, async (params) => {
    return client.describeTable(params.table, params.database);
  });

  server.tool("mysql_show_processlist", "Show active connections", {}, async () => {
    return client.showProcesslist();
  });

  server.tool("mysql_show_status", "Show server status variables", {
    filter: z.string().optional().describe("Filter pattern (e.g. 'Threads%')"),
  }, async (params) => {
    return client.showStatus(params.filter);
  });

  server.tool("mysql_show_variables", "Show server configuration variables", {
    filter: z.string().optional().describe("Filter pattern (e.g. 'innodb%')"),
  }, async (params) => {
    return client.showVariables(params.filter);
  });

  server.tool("mysql_explain", "Run EXPLAIN on a query", {
    sql: z.string().describe("SQL query to explain"),
    format: z.enum(["TRADITIONAL", "JSON", "TREE"]).optional().describe("Output format"),
  }, async (params) => {
    return client.explain(params.sql, params.format);
  });

  server.tool("mysql_table_stats", "Show table statistics", {
    database: z.string().optional().describe("Database name"),
  }, async (params) => {
    return client.tableStats(params.database);
  });

  server.tool("mysql_show_indexes", "Show indexes on a table", {
    table: z.string().describe("Table name"),
    database: z.string().optional().describe("Database name"),
  }, async (params) => {
    return client.showIndexes(params.table, params.database);
  });

  server.tool("mysql_replica_status", "Show replication status", {}, async () => {
    return client.replicaStatus();
  });
}
