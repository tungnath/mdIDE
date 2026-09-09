# Technical Design

Module-by-module reference and the reasoning behind the non-obvious
decisions. For the system-level picture (diagrams, deployment, stack
rationale), see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Directory structure

```
src/
  routes/
    +layout.svelte      applies the light/dark theme, loads global CSS
    +layout.ts           ssr = false (SvelteKit SPA mode - no Node server)
    +page.svelte          all app state + orchestration (the only "brain")
  lib/
    platform.ts           backend detection + unified file/folder API
    markdown.ts            marked + highlight.js + DOMPurify render pipeline
    theme.svelte.ts        light/dark theme store (localStorage-backed)
    styles/app.css          CSS custom-property theme tokens + typography
    components/
      Sidebar.svelte         folder listing, open file/folder buttons
      Toolbar.svelte          file title, View/Split/Edit switch, Save, theme toggle
      MarkdownPreview.svelte   renders sanitized HTML (View pane)
      MarkdownEditor.svelte    CodeMirror 6 wrapper (Edit pane, lazy-loaded)
      EmptyState.svelte        no-file-open welcome screen
      ConfirmDialog.svelte     generic Save/Discard/Cancel modal

src-tauri/
  src/
    lib.rs                 Tauri commands: list_md_files, read_md_file, write_md_file
    main.rs                 entry point, calls markdw_lib::run()
  tauri.conf.json           app identity, window config, bundle targets
  capabilities/default.json  Tauri v2 permission grants (core, opener, dialog)

.github/workflows/
  ci.yml                    type-check on every push/PR to master
  release.yml                4-platform build matrix, triggered by a v* tag
```

## State management

Everything lives in `+page.svelte` as Svelte 5 runes (`$state`/`$derived`/
`$effect`) — there's no store library, no global singleton beyond the theme.
The core state:

```ts
let folder: Folder | null            // currently browsed folder, if any
let files: FileEntry[]                // that folder's top-level .md files
let currentDoc: OpenDoc | null        // the open file's read()/save() handle
let content: string                   // live text buffer (both panes read/write this)
let savedContent: string              // snapshot from the last successful load/save
let mode: "view" | "edit" | "split"
let dirty = $derived(content !== savedContent)
```

`dirty` is never set directly — it's always derived from comparing two
strings. This matters: see "CRLF normalization" below for why that
comparison has to happen on normalized text, not raw file bytes.

Every operation that could discard unsaved work (opening another file,
opening a folder, closing) goes through `guardUnsaved()`, which — if
`dirty` — shows `ConfirmDialog` and returns a promise that resolves once the
user picks Save / Discard / Cancel. Nothing bypasses this path.

## `platform.ts` — the backend abstraction

A discriminated union (`kind: "tauri" | "fsa"`) rather than a class
hierarchy, because the two backends' primitives are genuinely different
shapes: Tauri deals in path *strings*, the File System Access API deals in
opaque `FileSystemHandle` objects that can't be serialized to a string at
all. Forcing them into a common "path" interface would have meant faking a
path for the browser case; the union just carries whatever each backend
actually has.

```ts
backendKind: "tauri" | "fsa" | "fallback"   // decided once, at module load, via isTauri()
```

- **`tauri`**: real desktop app. Folder/file pickers via
  `@tauri-apps/plugin-dialog`; read/write via Rust commands (see below).
- **`fsa`**: Chrome/Edge in a browser. `showDirectoryPicker()` /
  `showOpenFilePicker()`; save writes directly back to the handle via
  `createWritable()` — genuine save-in-place, no download involved.
- **`fallback`**: Firefox/Safari, or any browser without the File System
  Access API. No folder browsing (there's no way to list a real directory's
  contents without it). Single-file open via a plain `<input type=file>`;
  "save" downloads a new copy, since there's no permission model to write
  back to the original file. The UI is honest about this — `EmptyState`
  shows a note explaining the limitation rather than silently degrading.

## `markdown.ts` — render pipeline

```
source string → marked.parse() → DOMPurify.sanitize() → {@html} in Svelte
```

- `marked-highlight` wires `highlight.js` into fenced code blocks. Only ~17
  common languages are registered individually (not the full `highlight.js`
  bundle) to keep the render path's footprint down.
- **Sanitization is not optional.** The rendered content is an arbitrary
  file the user opened — treat it as untrusted input, same as any other
  markdown-to-HTML pipeline that isn't rendering content it authored itself.
  `DOMPurify.sanitize()` runs on every render, no exceptions.
- Both `marked.parse()` and the per-fence `hljs.highlight()` call are
  wrapped in `try/catch`. A parse exception degrades to an escaped
  `<pre>` dump of the raw source with a visible notice, rather than
  throwing past the component boundary — Svelte has no built-in error
  boundary for a thrown `$derived`, so an uncaught exception here would
  otherwise blank the whole view. This was a real bug, not a hypothetical
  one — see "Custom renderer `this` binding" below.

## Rust commands (`src-tauri/src/lib.rs`)

Three commands, each a thin wrapper over `std::fs`:

```rust
list_md_files(dir: String) -> Vec<{ name, path }>   // flat, not recursive
read_md_file(path: String) -> String
write_md_file(path: String, contents: String)
```

No `tauri-plugin-fs` scope/allowlist is used — these are plain custom
commands with full filesystem access, which is the standard pattern for a
local desktop editor that needs to open files anywhere the user points a
native OS dialog at (an fs-plugin allowlist would need to somehow
pre-enumerate every folder the user might ever browse to, which defeats the
point of a folder picker).

Both `read_md_file` and `write_md_file` go through a shared retry helper:

```rust
fn with_retries<T>(op: impl FnMut() -> io::Result<T>) -> Result<T, String>
```

Up to 4 attempts with a short backoff. This exists specifically because
Windows AV/indexer processes transiently lock a just-touched file — a single
failed read isn't necessarily a real error, and a plain hard-fail would
otherwise put the burden on the user to retry manually (which is exactly the
symptom that was originally reported: files "opening after 3-4 attempts").

`read_md_file` also decodes with `String::from_utf8_lossy` rather than
`fs::read_to_string`, which hard-errors on any byte sequence that isn't
strictly valid UTF-8. A file with an encoding quirk now opens (with
replacement characters where needed) instead of refusing to open at all.

## Key design decisions

**CRLF normalization on load.** CodeMirror 6 stores its document internally
with `\n` line endings regardless of what was loaded — `view.state.doc.toString()`
never contains `\r`. If a CRLF file is loaded into `content` as-is and then
the editor mounts, the very first sync effect sees the raw CRLF text differ
from CodeMirror's own LF-normalized text, dispatches a "fix," and that
dispatch fires `onChange` — marking the file dirty before the user has typed
anything. Fix: normalize `\r\n`/`\r` → `\n` once, in `loadDoc`, so `content`
and CodeMirror's internal representation agree from the start. Consequence:
files are always saved back with LF line endings, even if they were
originally CRLF — a deliberate, disclosed trade-off (standard, git-friendly
behavior), not an oversight.

**Custom renderer `this` binding.** The original link-renderer override did:

```ts
const renderer = new marked.Renderer();
const originalLink = renderer.link.bind(renderer);   // bound to a standalone,
renderer.link = (token) => originalLink(token);        // never-wired-up instance
marked.use({ renderer });
```

`new marked.Renderer()` has no `.parser` reference — that only gets attached
to the live renderer instance marked constructs internally. Pre-binding to
the standalone instance meant `this.parser.parseInline(...)` threw
`Cannot read properties of undefined (reading 'parseInline')` for any link
whose text needed inline parsing — a real crash, reproduced live against
this project's own README-style files with nested links. Fixed by following
marked's documented extension pattern instead — a plain object merged via
`marked.use()`, so `this` resolves to the live instance at call time:

```ts
marked.use({ renderer: { link(token) { return marked.Renderer.prototype.link.call(this, token); } } });
```

**Lazy-loaded editor.** `MarkdownEditor.svelte` (CodeMirror + language-data +
theme, ~630KB — the single largest chunk in the app) is imported dynamically
the first time `mode` becomes `"edit"` or `"split"`, not at startup. Most
sessions start in View mode; there's no reason to pay CodeMirror's parse/
execute cost before it's needed, especially on modest hardware.

**Single file at a time, flat folder listing.** No tabs, no recursive
folder tree — deliberately, to match "browse and close file" and "only .md
files present in that folder" as stated, and because both add real UI/state
complexity that wasn't asked for. Revisit only if usage shows a real need.

**Retryable errors, not silent ones.** Every failure path (`loadDoc`,
folder listing, save) stores a `retryAction` closure alongside the error
message, surfaced as a Retry button in the error banner. This exists
because the two real bugs found during development (the marked crash, and
Windows file locks) both manifested as "this file won't open" with no
obvious next step for the user — a retry affordance is cheap insurance
against the next as-yet-unknown failure mode of the same shape.

## Security considerations

- **XSS**: every rendered markdown file goes through `DOMPurify.sanitize()`
  before reaching `{@html}`. No exceptions, no "trusted source" bypass.
- **Filesystem access**: unscoped by design on desktop (see Rust commands,
  above) — appropriate for a local editor the user explicitly points at
  files via native OS dialogs, not appropriate if this were ever extended to
  open arbitrary untrusted remote content.
- **Browser mode**: the File System Access API's own permission model
  (per-origin, user-gesture-gated pickers) is the only access control; the
  app adds nothing on top and needs nothing more, since it never talks to a
  server.
- **Content Security Policy**: currently `null` in `tauri.conf.json`
  (disabled). Worth revisiting if the app ever loads remote resources —
  right now it doesn't (no network calls, no remote fonts/scripts).

## Performance notes

- Initial bundle is dominated by `marked` + `highlight.js` + `DOMPurify`
  (needed immediately, View is the default mode) — CodeMirror's much larger
  footprint is deferred (see above).
- Rendering is not memoized across mode switches — flipping View → Edit →
  View re-runs the full markdown pipeline each time via Svelte's `$derived`.
  Acceptable for the file sizes this app targets; would need revisiting if
  ever used on very large documents.
- Release (optimized) Tauri builds start in roughly 0.7-1.4s on average
  hardware; `npm run tauri dev` is 3-5x heavier (unminified JS, debug Rust
  build, live dev server) and is not representative of real-world
  performance — always benchmark against a release build.

## Known limitations

- Line endings are normalized to LF on save (see above) — original CRLF is
  not preserved.
- No auto-updater is wired up, despite Tauri producing `.app.tar.gz` updater
  artifacts as a bundler side-effect on macOS builds; those files currently
  go unused. Adding `tauri-plugin-updater` would be required to make them
  do anything.
- Builds are unsigned — Windows SmartScreen and macOS Gatekeeper both warn
  on first launch. Code signing (a paid certificate on both platforms) would
  remove this but wasn't in scope.
- Browser fallback mode (Firefox/Safari) has no folder browsing and no
  save-in-place — this is a platform limitation (no File System Access API),
  not something fixable in application code.
