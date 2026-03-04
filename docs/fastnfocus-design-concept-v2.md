# FastnFocus — Design Concept

> A fast, minimal task manager for macOS, Windows, and Web. Add tasks, get them done.

---

## 1. Vision

A **local-first TODO app** that does four things well: **add, update, delete, and complete tasks**. No bloat. Runs on macOS, Windows, and Web from a single codebase.

---

## 2. Core Features

| Feature | Description |
|---------|-------------|
| **Add task** | Create a task with title and optional description |
| **Update task** | Edit title, description, or other fields |
| **Delete task** | Remove a task permanently |
| **Mark done** | Toggle a task between pending and done; completed tasks are hidden into a collapsible "Completed" section |
| **Link tasks** | Connect related tasks together (e.g., "blocked by", "related to") |
| **Reorder tasks** | Drag-and-drop to reorder; position persisted |
| **Priority label** | Tag a task as high, medium, or low priority |
| **Two boards** | **Today** (focused work) and **Backlog** (everything else); move tasks between boards |
| **Search** | Search tasks by title across both boards |
| **Auto-cleanup** | Tasks older than 30 days are automatically deleted (done or not) |
| **About** | Shows app version, build info; accessible from menu / settings icon |

---

## 3. Data Model

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  board: "today" | "backlog";   // which board the task lives on
  priority: "high" | "medium" | "low";
  position: number;             // sort order within board (lower = higher)
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface TaskLink {
  id: string;
  sourceTaskId: string;       // the task that has the link
  targetTaskId: string;       // the task it links to
  type: "related" | "blocks" | "blocked_by";
  createdAt: DateTime;
}
```

SQLite schema:

```sql
CREATE TABLE tasks (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  description TEXT,
  done       INTEGER NOT NULL DEFAULT 0,
  board      TEXT NOT NULL DEFAULT 'backlog' CHECK (board IN ('today', 'backlog')),
  priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  position   REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE task_links (
  id             TEXT PRIMARY KEY,
  source_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('related', 'blocks', 'blocked_by')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_task_id, target_task_id, type)
);

-- Tracks DB schema version for safe upgrades
CREATE TABLE schema_version (
  version    INTEGER NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO schema_version (version) VALUES (1);
```

> **Note:** better-sqlite3 runs in the Electron main process. The renderer communicates via IPC (`ipcMain.handle` / `ipcRenderer.invoke`) for all database operations.

### Database Migration Strategy

On app launch, the app reads `schema_version` and runs any pending migrations sequentially. This ensures upgrades never break existing data.

```
App starts → read schema_version → compare with app's latest version
  → if behind: run migration scripts v(N) → v(N+1) → … in a transaction
  → if current: proceed normally
```

Rules:
- Migrations are **additive** (add columns / tables, never drop or rename destructively).
- Each migration runs inside a **transaction** — if it fails, no partial changes.
- SQLite file is the single source of truth; no data loss on upgrade.

---

## 4. Technical Architecture

### Platform Strategy

Single codebase targets **Web, macOS, and Windows** via Electron (Node.js-based desktop shell) + a shared web frontend.

```
                  Shared UI (React / TypeScript)
                 ┌──────────────────────────────┐
                 │  Web App     Desktop App      │
                 │  (Browser)   (Electron shell)  │
                 │              ├─ macOS (.dmg)   │
                 │              └─ Windows (.msi) │
                 └──────────┬───────────────────┘
                            │
                  ┌─────────────────────────┐
                  │  App Core (Node.js)      │
                  │  CRUD · SQLite (main)    │
                  └──────┬──────────────────┘
                         │
                      SQLite
                     (local)
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React + TypeScript + TanStack Router/Query | Type-safe, fast, large ecosystem |
| **UI Components** | shadcn/ui + Tailwind CSS | Clean, accessible, consistent across platforms |
| **Desktop Shell** | **Electron** (Node.js) | Single codebase → macOS + Windows + Web. Mature ecosystem, full Node.js API access |
| **Backend** | **Node.js** (Electron main process + IPC) | Handles CRUD, SQLite access, and system-level operations via main process |
| **Database** | **SQLite** (via better-sqlite3) | Embedded, zero-config, local-first, synchronous API for simplicity |
| **Web DB** | wa-sqlite + OPFS | SQLite in-browser with persistent storage |

### Storage

- **Desktop:** SQLite file in user's app data directory (via `app.getPath('userData')`).
- **Web:** SQLite in-browser via wa-sqlite + OPFS.
- **No server required.** Fully local.

---

## 5. UI Design

### Main View — Two-Board Layout

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  FastnFocus            "Get tasks done in under 2 weeks - Focus - No excuse"  │
│  [🔍 Search tasks...]                              [All ▾] [+ Add Task]       │
├──────────────────────────────────┬────────────────────────────────────────────┤
│  TODAY                           │  BACKLOG                                   │
│  ─────                           │  ───────                                   │
│                                  │                                            │
│  ☐  🔴 Design database schema   │  ☐  🟡 Write unit tests                  │
│     "Define tables for tasks"    │     🔗 related: Build API endpoints       │
│     🔗 blocks: Build API         │                                           │
│                                  │  ☐  🟢 Update README                     │
│  ☐  🟡 Build API endpoints      │                                           │
│     🔗 blocked by: Design DB     │  ☐  🟡 Set up CI pipeline                │
│                                  │                                           │
│  ▸ Completed (1)                 │  ▸ Completed (0)                           │
│                                  │                                           │
├──────────────────────────────────┼────────────────────────────────────────────┤
│  3 tasks · 1 done                │  4 tasks · 0 done                          │
└──────────────────────────────────┴────────────────────────────────────────────┘

Priority:  🔴 high   🟡 medium   🟢 low
Filter:    [All] [Pending] [Done]
Reorder:   Drag handle ≡ on left (not shown for clarity)
Move:      Drag task between boards, or right-click → Move to Today / Backlog
```

### Add / Edit Task Dialog

```
┌─────────────────────────────────────────────┐
│  Add Task                              [✕]  │
├─────────────────────────────────────────────┤
│                                             │
│  Title:    [________________________]       │
│                                             │
│  Desc:     [________________________]       │
│            [________________________]       │
│                                             │
│  Priority: (●) High  (○) Medium  (○) Low   │
│                                             │
│  Board:    (●) Today  (○) Backlog           │
│                                             │
│  Links:    [+ Link to task...]              │
│            ├─ blocks: Build API endpoints   │
│            └─ [✕ remove]                    │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancel]  [Save]         │
└─────────────────────────────────────────────┘
```

### Link Task Picker

```
┌─────────────────────────────────────────────┐
│  Link to task                          [✕]  │
├─────────────────────────────────────────────┤
│  Search: [______________]                   │
│                                             │
│  Type:   (○) Related  (●) Blocks  (○) Blocked by │
│                                             │
│  ☐ Design database schema                  │
│  ☐ Build API endpoints                     │
│  ☐ Write unit tests                        │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancel]  [Link]         │
└─────────────────────────────────────────────┘
```

---

## 6. MVP Scope

### Phase 1 — Desktop App (macOS + Windows)

- [ ] Two-board UI: Today + Backlog (add, edit, delete, toggle done)
- [ ] Move tasks between boards (drag-and-drop or context menu)
- [ ] Link tasks together (related, blocks, blocked by)
- [ ] SQLite storage via Electron IPC + better-sqlite3
- [ ] Filter: All / Pending / Done
- [ ] Search tasks by title
- [ ] Auto-cleanup: purge tasks older than 30 days on app launch
- [ ] Database migration on upgrade (schema_version table)
- [ ] About dialog: show app version and build info
- [ ] Electron build for macOS (.dmg) + Windows (.msi) via electron-builder

### Phase 2 — Web App

- [ ] Web build with wa-sqlite + OPFS
- [ ] Same UI, runs in-browser with local persistence
- [ ] No server required

### Future (optional)

- Tags / categories
- Due dates & reminders
- Cloud sync
- AI features (planning, prioritization)
