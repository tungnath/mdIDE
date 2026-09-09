# MarkDW

A very lightweight, beautiful markdown viewer/editor. Desktop app (via [Tauri](https://tauri.app)) with an optional browser mode.

## Download

Grab the latest installer for your platform from the [Releases page](https://github.com/tungnath/mdIDE/releases/latest):

| Platform | File |
|---|---|
| Windows | `MarkDW_<version>_x64-setup.exe` — or the `.msi`, either works |
| macOS (Apple Silicon) | `MarkDW_<version>_aarch64.dmg` |
| macOS (Intel) | `MarkDW_<version>_x64.dmg` |
| Linux (Debian/Ubuntu) | `MarkDW_<version>_amd64.deb` |
| Linux (Fedora/RHEL) | `MarkDW-<version>-1.x86_64.rpm` |
| Linux (any distro) | `MarkDW_<version>_amd64.AppImage` |

Each release also includes a `.app.tar.gz` per macOS architecture — those are auto-update artifacts, not meant for manual download.

Builds are unsigned, so first launch may warn you: Windows SmartScreen shows an "unrecognized publisher" prompt (click "More info" → "Run anyway"), and macOS Gatekeeper blocks the app until you right-click → Open once.

Prefer not to install anything? Try it in the browser at **[markdw.netlify.app](https://markdw.netlify.app/)** — full folder browsing and save-in-place work in Chrome/Edge; other browsers get single-file open/edit with save-as-download.

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

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system diagrams, deployment topology, stack rationale
- [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) — module reference, key design decisions, security/performance notes
