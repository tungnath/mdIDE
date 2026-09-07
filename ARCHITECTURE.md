# Architecture

High-level shape of Marker: what runs where, how the pieces talk to each other,
and how it ships. For file-by-file detail and design rationale, see
[TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md).

## System overview

Marker is a single Svelte/SvelteKit frontend that runs unmodified in two
different hosts. Which host it's running in is detected at runtime, and a
platform-abstraction layer swaps out how files actually get read/written.

```mermaid
flowchart TB
    subgraph Frontend["Frontend (SvelteKit, static/SPA adapter)"]
        UI["UI components<br/>Sidebar · Toolbar · Preview · Editor"]
        Platform["platform.ts<br/>(backend detection + unified API)"]
        UI --> Platform
    end

    subgraph Desktop["Desktop host"]
        Tauri["Tauri runtime<br/>(Rust)"]
        FS["std::fs commands<br/>list / read / write"]
        Dialog["tauri-plugin-dialog<br/>native OS pickers"]
        Tauri --> FS
        Tauri --> Dialog
    end

    subgraph Browser["Browser host"]
        FSA["File System Access API<br/>(Chrome / Edge)"]
        Fallback["input[type=file] + download<br/>(Firefox / Safari)"]
    end

    Platform -->|"isTauri() === true"| Tauri
    Platform -->|"isTauri() === false,<br/>FSA supported"| FSA
    Platform -->|"isTauri() === false,<br/>FSA unsupported"| Fallback
```

The same `build/` output (one `npm run build`) is what both the Tauri window
loads locally and what gets deployed to Netlify. There is no server-rendered
or backend-hosted logic anywhere — every "backend" operation is either a
native OS call (desktop) or a browser API (web).

## Component architecture

```mermaid
flowchart TB
    Page["+page.svelte<br/>(owns all state, orchestrates everything)"]
    Page --> Sidebar
    Page --> Toolbar
    Page --> Empty["EmptyState"]
    Page --> Preview["MarkdownPreview"]
    Page --> Editor["MarkdownEditor<br/>(lazy-loaded)"]
    Page --> Confirm["ConfirmDialog"]

    Sidebar -->|"onSelectEntry"| Page
    Toolbar -->|"onSetMode / onSave / onClose"| Page
    Preview -.->|"renders content (read-only)"| Content(("content: string"))
    Editor -.->|"reads + writes via onChange"| Content
```

`+page.svelte` is the single source of truth: one `content` string, one
`savedContent` snapshot to diff against for the dirty flag, and a `mode`
(`view` / `edit` / `split`) that decides which pane(s) render against that
same string. Nothing else holds independent state.

## Data flow: opening and saving a file

```mermaid
sequenceDiagram
    participant User
    participant UI as "+page.svelte"
    participant Platform as "platform.ts"
    participant Backend as "Tauri (Rust) or Browser API"

    User->>UI: click file in sidebar
    UI->>Platform: openEntry(entry)
    Platform->>Backend: read file (with retry, on desktop)
    Backend-->>Platform: raw text
    Platform-->>UI: OpenDoc { read(), save() }
    UI->>UI: normalize CRLF→LF<br/>content = savedContent = text
    UI->>User: render in View mode

    User->>UI: edits in Edit/Split pane
    UI->>UI: content updates, dirty = (content !== savedContent)
    User->>UI: Ctrl/Cmd+S
    UI->>Platform: doc.save(content)
    Platform->>Backend: write file (with retry, on desktop)
    Backend-->>UI: savedContent = content
```

## Deployment architecture

```mermaid
flowchart LR
    Repo["GitHub repo<br/>tungnath/mdIDE"]

    Repo -->|"push to master"| CI["ci.yml<br/>type-check only, no artifacts"]
    Repo -->|"push tag v*"| Release["release.yml<br/>4-way build matrix"]
    Repo -->|"push to master"| Netlify["Netlify<br/>(auto-deploy from netlify.toml)"]

    Release --> Win["Windows<br/>.msi + .exe (NSIS)"]
    Release --> MacArm["macOS arm64<br/>.dmg"]
    Release --> MacX64["macOS x64<br/>.dmg"]
    Release --> Linux["Linux<br/>.deb + .rpm + .AppImage"]

    Win --> GHR["Draft GitHub Release"]
    MacArm --> GHR
    MacX64 --> GHR
    Linux --> GHR

    Netlify --> Web["markdw.netlify.app<br/>(browser build, live)"]
```

Desktop builds are OS-native — Tauri links against each platform's own
WebView (WebView2 / WKWebView / WebKitGTK), so each leg of the release matrix
must run on that actual OS; there is no single-machine cross-compile path for
the full GUI bundle. See [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) for the
manual, one-by-one equivalent of what the CI matrix automates.

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Desktop shell | [Tauri 2](https://tauri.app) (Rust) | Native WebView, ~10MB installers vs. Electron's ~100MB+; first-party plugin ecosystem (`dialog`, `fs`) and release tooling (`tauri-action`) |
| Frontend framework | SvelteKit (static/SPA adapter, no server) | Small runtime, compiles away rather than shipping a VDOM; SPA mode needed since there's no Node server on desktop |
| Editor | [CodeMirror 6](https://codemirror.net) | Purpose-built for text editing, far lighter than Monaco; lazy-loaded so it doesn't cost anything until Edit/Split is opened |
| Markdown rendering | `marked` + `marked-highlight` + `highlight.js` + `DOMPurify` | GFM support, syntax-highlighted fences, and mandatory sanitization since rendered content is untrusted file input |
| Backend logic | Rust `std::fs`, exposed as `#[tauri::command]`s | The only "backend" work is list/read/write files — no case for a second runtime (e.g. Python) to do that |

Alternatives considered and set aside: Electron (too heavy for the stated
"very lightweight" requirement), Neutralino.js (lighter binaries, but a
thinner native API surface and no first-party CI release action), Streamlit
(server-rerun model is fundamentally unsuited to keystroke-level editing),
and a Python backend (would mean bundling a second runtime for logic Rust's
standard library already covers in a few lines).
