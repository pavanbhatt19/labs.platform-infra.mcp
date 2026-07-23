import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import { MysqlConfig } from "../../config.js";
import { toolResult, toolError } from "../../utils/http.js";

export class MysqlClient {
  private config: MysqlConfig;
  private pool: Pool | null = null;

  constructor(config: MysqlConfig) {
    this.config = config;
  }

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 5,
        multipleStatements: true,
      });
    }
    return this.pool;
  }

  async query(sql: string) {
    try {
      const pool = this.getPool();
      const [rows] = await pool.query(sql);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Query failed: ${error.message}`);
    }
  }

  async listDatabases() {
    try {
      const pool = this.getPool();
      const [rows] = await pool.query<RowDataPacket[]>("SHOW DATABASES");
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to list databases: ${error.message}`);
    }
  }

  async listTables(database?: string) {
    try {
      const pool = this.getPool();
      const sql = database ? `SHOW TABLES FROM \`${database}\`` : "SHOW TABLES";
      const [rows] = await pool.query<RowDataPacket[]>(sql);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to list tables: ${error.message}`);
    }
  }

  async describeTable(table: string, database?: string) {
    try {
      const pool = this.getPool();
      const fullTable = database ? `\`${database}\`.\`${table}\`` : `\`${table}\``;
      const [rows] = await pool.query<RowDataPacket[]>(`DESCRIBE ${fullTable}`);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to describe table: ${error.message}`);
    }
  }

  async showProcesslist() {
    try {
      const pool = this.getPool();
      const [rows] = await pool.query<RowDataPacket[]>("SHOW FULL PROCESSLIST");
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to show processlist: ${error.message}`);
    }
  }

  async showStatus(filter?: string) {
    try {
      const pool = this.getPool();
      const sql = filter ? `SHOW GLOBAL STATUS LIKE '${filter}'` : "SHOW GLOBAL STATUS";
      const [rows] = await pool.query<RowDataPacket[]>(sql);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to show status: ${error.message}`);
    }
  }

  async showVariables(filter?: string) {
    try {
      const pool = this.getPool();
      const sql = filter ? `SHOW GLOBAL VARIABLES LIKE '${filter}'` : "SHOW GLOBAL VARIABLES";
      const [rows] = await pool.query<RowDataPacket[]>(sql);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to show variables: ${error.message}`);
    }
  }

  async explain(sql: string, format?: string) {
    try {
      const pool = this.getPool();
      const fmt = format || "TRADITIONAL";
      const [rows] = await pool.query<RowDataPacket[]>(`EXPLAIN FORMAT=${fmt} ${sql}`);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Explain failed: ${error.message}`);
    }
  }

  async tableStats(database?: string) {
    try {
      const pool = this.getPool();
      const db = database || this.config.database;
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT table_name, engine, table_rows, data_length, index_length, auto_increment
         FROM information_schema.tables WHERE table_schema = ?`,
        [db]
      );
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to get table stats: ${error.message}`);
    }
  }

  async showIndexes(table: string, database?: string) {
    try {
      const pool = this.getPool();
      const fullTable = database ? `\`${database}\`.\`${table}\`` : `\`${table}\``;
      const [rows] = await pool.query<RowDataPacket[]>(`SHOW INDEX FROM ${fullTable}`);
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to show indexes: ${error.message}`);
    }
  }

  async replicaStatus() {
    try {
      const pool = this.getPool();
      const [rows] = await pool.query<RowDataPacket[]>("SHOW REPLICA STATUS");
      return toolResult(rows);
    } catch (error: any) {
      return toolError(`Failed to get replica status: ${error.message}`);
    }
  }
}
