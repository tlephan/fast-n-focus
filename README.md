# FastnFocus

> A fast, minimal task manager for macOS, Windows, and Web. Add tasks, get them done.

*"Get tasks done in under 2 weeks — Focus — No excuse"*

## Features

- **Two boards** — Today (focused work) and Backlog (everything else)
- **Task CRUD** — Add, edit, delete, and mark tasks done
- **Drag-and-drop** — Reorder tasks within a board
- **Move tasks** — Drag or click to move between Today and Backlog
- **Link tasks** — Connect tasks as related, blocks, or blocked by
- **Priority labels** — High (🔴), Medium (🟡), Low (🟢)
- **Search** — Find tasks by title across both boards
- **Filter** — All, Pending, or Done
- **Auto-cleanup** — Tasks older than 30 days are purged on launch
- **About dialog** — App version and build info
- **Local-first** — All data stored locally in SQLite. No server required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| UI Components | shadcn/ui + Radix UI + Lucide icons |
| Desktop Shell | Electron |
| Backend | Node.js (Electron main process + IPC) |
| Database | SQLite (better-sqlite3) |
| Drag & Drop | @dnd-kit |
| Data Fetching | TanStack Query |
| Build | Vite + vite-plugin-electron + electron-builder |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Development

```bash
npx vite
```

This starts the Vite dev server and auto-launches the Electron app.

### Production Build

```bash
npm run build:electron
```

Outputs packaged app to `release/`.

## Project Structure

```
fast-n-focus/
├── electron/               # Electron main process
│   ├── main.ts             # App entry, window, auto-cleanup
│   ├── preload.ts          # Secure IPC bridge (contextBridge)
│   ├── database.ts         # SQLite init + migrations
│   └── ipc/
│       ├── tasks.ts        # Task CRUD/toggle/move/reorder/search
│       └── taskLinks.ts    # Task link create/delete/get
├── src/                    # React frontend (renderer)
│   ├── App.tsx             # Main two-board layout
│   ├── main.tsx            # React entry point
│   ├── api.ts              # Typed wrapper over electronAPI
│   ├── hooks.ts            # TanStack Query hooks
│   ├── types.ts            # TypeScript interfaces
│   ├── index.css           # Tailwind + CSS variables
│   ├── lib/utils.ts        # cn() utility
│   └── components/
│       ├── TaskCard.tsx     # Draggable task card
│       ├── BoardColumn.tsx  # Board with sorting + completed section
│       ├── TaskDialog.tsx   # Add/edit task dialog
│       ├── LinkTaskDialog.tsx # Link picker dialog
│       └── AboutDialog.tsx  # Version/build info
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.electron.json
├── tailwind.config.js
└── postcss.config.js
```

## License

MIT
