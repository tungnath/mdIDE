# Marker

A very lightweight, beautiful markdown viewer/editor. Desktop app (via [Tauri](https://tauri.app)) with an optional browser mode.

## Features

- **View**, **Edit**, and **Split** modes, toggleable per file (`Ctrl/Cmd+E` toggles View/Edit)
- Open a single `.md` file, or browse a folder to see all its top-level `.md` files
- Save in place (`Ctrl/Cmd+S`), with an unsaved-changes prompt before switching/closing files
- Light/dark theme, GitHub-flavored markdown, syntax-highlighted code blocks
- Runs as a native desktop app, or in any Chromium-based browser (Chrome/Edge) with full folder browsing and save-in-place via the File System Access API. Other browsers get single-file open/edit with save-as-download.

## Develop

```bash
npm install
npm run tauri dev    # desktop app, hot reload
npm run dev           # browser-only, at http://localhost:1420
```

## Build

```bash
npm run tauri build   # produces an installer/binary in src-tauri/target/release
```

## Stack

Tauri 2 (Rust) + SvelteKit (static/SPA adapter) + CodeMirror 6 + marked + highlight.js. No UI framework beyond Svelte — kept deliberately small.
