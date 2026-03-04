import Database from 'better-sqlite3';

let db: Database.Database;

const MIGRATIONS: { version: number; up: string[] }[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE IF NOT EXISTS tasks (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        description TEXT,
        done       INTEGER NOT NULL DEFAULT 0,
        board      TEXT NOT NULL DEFAULT 'backlog' CHECK (board IN ('today', 'backlog')),
        priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
        position   REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS task_links (
        id             TEXT PRIMARY KEY,
        source_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        target_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        type           TEXT NOT NULL CHECK (type IN ('related', 'blocks', 'blocked_by')),
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(source_task_id, target_task_id, type)
      )`,
      `CREATE TABLE IF NOT EXISTS schema_version (
        version    INTEGER NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `INSERT INTO schema_version (version) VALUES (1)`,
    ],
  },
];

export function initDatabase(dbPath: string) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Check current version
  let currentVersion = 0;
  try {
    const row = db.prepare('SELECT MAX(version) as version FROM schema_version').get() as
      | { version: number }
      | undefined;
    if (row?.version) {
      currentVersion = row.version;
    }
  } catch {
    // Table doesn't exist yet, version is 0
  }

  // Run pending migrations
  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      const runMigration = db.transaction(() => {
        for (const sql of migration.up) {
          db.prepare(sql).run();
        }
      });
      runMigration();
    }
  }
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}
