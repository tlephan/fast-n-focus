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
