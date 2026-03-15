import type { AIPlugin } from './plugin.interface';
import type { ToolRegistry } from '../tool.registry';

export interface DatabasePluginOptions {
  /**
   * Query executor function — receives a SQL string and returns rows.
   * Pass your DB client's query function here.
   *
   * @example
   * ```ts
   * new DatabasePlugin({
   *   query: (sql) => db.$queryRawUnsafe(sql),
   *   allowedTables: ['users', 'products', 'orders'],
   * })
   * ```
   */
  query: (sql: string) => Promise<unknown[]>;
  /** Whitelist of tables the agent is allowed to query (required for safety) */
  allowedTables: string[];
  /** Optional schema description given to the agent for context */
  schemaDescription?: string;
}

/**
 * Database Plugin — allows agents to query database tables (read-only).
 * Registers `list_tables`, `describe_table`, and `query_database` tools.
 *
 * ⚠️ Only SELECT queries are allowed. Supply `allowedTables` to restrict access.
 */
export class DatabasePlugin implements AIPlugin {
  readonly name = 'database';
  private readonly queryFn: (sql: string) => Promise<unknown[]>;
  private readonly allowedTables: Set<string>;
  private readonly schemaDescription: string;

  constructor(options: DatabasePluginOptions) {
    this.queryFn = options.query;
    this.allowedTables = new Set(options.allowedTables);
    this.schemaDescription = options.schemaDescription ?? '';
  }

  register(registry: ToolRegistry): void {
    const self = this;

    registry.registerTool({
      name: 'list_tables',
      description: 'List all available database tables the agent can query',
      parameters: { type: 'object', properties: {} },
      instance: self,
      handler: async () => Array.from(self.allowedTables),
    });

    registry.registerTool({
      name: 'query_database',
      description:
        'Execute a read-only SQL SELECT query against the database. ' +
        (self.schemaDescription ? `Schema: ${self.schemaDescription}` : ''),
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'A SELECT SQL query. Only SELECT is permitted.',
          },
        },
        required: ['sql'],
      },
      instance: self,
      handler: async (...args: unknown[]) => {
        const sql = (args[0] as string).trim();
        self.validateQuery(sql);
        return self.queryFn(sql);
      },
    });
  }

  private validateQuery(sql: string): void {
    // Normalize ALL whitespace (spaces, tabs, newlines) to single space so
    // multi-line or tab-indented bypass attempts are caught correctly.
    const normalized = sql.replace(/\s+/g, ' ').toLowerCase().trim();

    // Only allow SELECT at the very start
    if (!normalized.startsWith('select ') && normalized !== 'select') {
      throw new Error('Only SELECT queries are allowed.');
    }

    // Forbidden tokens — covers common SQL injection vectors
    const forbidden = [
      ';',            // statement terminator — prevents stacked queries
      '--',           // line comment
      '/*',           // block comment open
      '*/',           // block comment close (belt-and-suspenders)
      'drop',
      'delete',
      'update',
      'insert',
      'alter',
      'create',
      'truncate',
      'union',        // UNION-based injection
      'with ',        // Common Table Expressions (CTEs) — can wrap forbidden ops
      'into ',        // SELECT INTO / INSERT INTO
      'exec ',        // EXEC / EXECUTE stored procedures
      'execute ',
      'xp_',          // SQL Server extended stored procedures
      'information_schema',  // schema enumeration
      'sys.',         // system catalog tables
      'pg_',          // PostgreSQL system tables
    ];

    for (const token of forbidden) {
      if (normalized.includes(token)) {
        throw new Error(`Forbidden SQL token detected: "${token}". Query rejected.`);
      }
    }

    // Check table access — deny any table not in the whitelist
    const usedTables = this.extractTables(normalized);
    if (usedTables.length === 0) {
      throw new Error('Could not determine tables used in query. Query rejected for safety.');
    }
    for (const table of usedTables) {
      if (!this.allowedTables.has(table)) {
        throw new Error(`Access denied: table "${table}" is not in the allowed list.`);
      }
    }
  }

  private extractTables(sql: string): string[] {
    const matches = sql.match(/(?:from|join)\s+(\w+)/g) ?? [];
    return matches.map((m) => m.split(/\s+/)[1]!).filter(Boolean);
  }
}
