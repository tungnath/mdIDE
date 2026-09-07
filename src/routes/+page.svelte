<script lang="ts">
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import MarkdownPreview from "$lib/components/MarkdownPreview.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { theme } from "$lib/theme.svelte";
  import {
    pickFolder,
    pickFile,
    listMarkdownFiles,
    openEntry,
    supportsFolderBrowsing,
    type Folder,
    type FileEntry,
    type OpenDoc,
  } from "$lib/platform";

  let folder = $state<Folder | null>(null);
  let files = $state<FileEntry[]>([]);
  let currentDoc = $state<OpenDoc | null>(null);
  let content = $state("");
  let savedContent = $state("");
  let mode = $state<"view" | "edit" | "split">("view");
  let activeId = $state<string | null>(null);
  let saving = $state(false);
  let errorMsg = $state<string | null>(null);
  let retryAction = $state<(() => void) | null>(null);

  let dirty = $derived(currentDoc !== null && content !== savedContent);

  // Loaded on demand (first time Edit mode is opened) to keep startup light.
  let EditorComponent = $state<typeof import("$lib/components/MarkdownEditor.svelte").default | null>(
    null,
  );
  let editorLoading = $state(false);

  $effect(() => {
    if ((mode === "edit" || mode === "split") && !EditorComponent && !editorLoading) {
      editorLoading = true;
      import("$lib/components/MarkdownEditor.svelte").then((m) => {
        EditorComponent = m.default;
        editorLoading = false;
      });
    }
  });

  let confirmOpen = $state(false);
  let confirmMessage = $state("");
  let pendingResolve: ((v: boolean) => void) | null = null;

  function guardUnsaved(): Promise<boolean> {
    if (!dirty) return Promise.resolve(true);
    confirmMessage = `"${currentDoc?.name}" has unsaved changes. What would you like to do?`;
    confirmOpen = true;
    return new Promise((resolve) => {
      pendingResolve = resolve;
    });
  }

  async function onConfirmAction(value: string) {
    confirmOpen = false;
    if (value === "save") {
      await handleSave();
      pendingResolve?.(true);
    } else if (value === "discard") {
      pendingResolve?.(true);
    } else {
      pendingResolve?.(false);
    }
    pendingResolve = null;
  }

  async function loadDoc(doc: OpenDoc, id: string | null) {
    try {
      const raw = await doc.read();
      // Normalize line endings so CodeMirror's internal LF-only doc model
      // matches what we compare against for the dirty check — otherwise
      // opening a CRLF file marks it dirty the instant the editor mounts.
      const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      currentDoc = doc;
      content = text;
      savedContent = text;
      mode = "view";
      activeId = id;
      errorMsg = null;
      retryAction = null;
    } catch (e) {
      errorMsg = `Failed to open "${doc.name}": ${e}`;
      retryAction = () => loadDoc(doc, id);
    }
  }

  async function refreshFolderListing(f: Folder) {
    try {
      files = await listMarkdownFiles(f);
      errorMsg = null;
      retryAction = null;
    } catch (e) {
      files = [];
      errorMsg = `Failed to read folder "${f.name}": ${e}`;
      retryAction = () => refreshFolderListing(f);
    }
  }

  async function handleOpenFolder() {
    if (!(await guardUnsaved())) return;
    const f = await pickFolder();
    if (!f) return;
    folder = f;
    currentDoc = null;
    content = "";
    savedContent = "";
    activeId = null;
    await refreshFolderListing(f);
  }

  async function handleOpenFile() {
    if (!(await guardUnsaved())) return;
    const doc = await pickFile();
    if (!doc) return;
    await loadDoc(doc, null);
  }

  async function handleSelectEntry(entry: FileEntry) {
    if (entry.id === activeId) return;
    if (!(await guardUnsaved())) return;
    const doc = await openEntry(entry);
    await loadDoc(doc, entry.id);
  }

  function handleCloseFolder() {
    guardUnsaved().then((ok) => {
      if (!ok) return;
      folder = null;
      files = [];
      currentDoc = null;
      content = "";
      savedContent = "";
      activeId = null;
    });
  }

  function handleCloseFile() {
    guardUnsaved().then((ok) => {
      if (!ok) return;
      currentDoc = null;
      content = "";
      savedContent = "";
      activeId = null;
      mode = "view";
    });
  }

  async function handleSave() {
    if (!currentDoc) return;
    saving = true;
    try {
      await currentDoc.save(content);
      savedContent = content;
      errorMsg = null;
      retryAction = null;
    } catch (e) {
      errorMsg = `Failed to save "${currentDoc.name}": ${e}`;
      retryAction = () => handleSave();
    } finally {
      saving = false;
    }
  }

  function setMode(m: "view" | "edit" | "split") {
    mode = m;
  }

  function handleKeydown(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (currentDoc && dirty) handleSave();
    } else if (meta && e.key.toLowerCase() === "e") {
      e.preventDefault();
      if (currentDoc) setMode(mode === "view" ? "edit" : "view");
    }
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onbeforeunload={handleBeforeUnload} />

<div class="app">
  <Sidebar
    {folder}
    {files}
    {activeId}
    supportsFolder={supportsFolderBrowsing}
    onOpenFolder={handleOpenFolder}
    onOpenFile={handleOpenFile}
    onCloseFolder={handleCloseFolder}
    onSelectEntry={handleSelectEntry}
  />

  <div class="main">
    <Toolbar
      doc={currentDoc}
      {dirty}
      {mode}
      {saving}
      dark={theme.current === "dark"}
      onSetMode={setMode}
      onSave={handleSave}
      onClose={handleCloseFile}
      onToggleTheme={() => theme.toggle()}
    />

    {#if errorMsg}
      <div class="error-banner">
        <span>{errorMsg}</span>
        <div class="error-actions">
          {#if retryAction}
            <button
              onclick={() => {
                const fn = retryAction;
                errorMsg = null;
                retryAction = null;
                fn?.();
              }}
            >
              Retry
            </button>
          {/if}
          <button onclick={() => { errorMsg = null; retryAction = null; }} aria-label="Dismiss">×</button>
        </div>
      </div>
    {/if}

    {#snippet editorOrLoading()}
      {#if EditorComponent}
        <EditorComponent
          value={content}
          dark={theme.current === "dark"}
          onChange={(v: string) => (content = v)}
        />
      {:else}
        <div class="editor-loading">Loading editor…</div>
      {/if}
    {/snippet}

    {#if currentDoc}
      {#if mode === "view"}
        <MarkdownPreview source={content} />
      {:else if mode === "split"}
        <div class="split">
          <div class="split-pane">{@render editorOrLoading()}</div>
          <div class="split-divider"></div>
          <div class="split-pane">
            <MarkdownPreview source={content} />
          </div>
        </div>
      {:else}
        {@render editorOrLoading()}
      {/if}
    {:else}
      <EmptyState
        supportsFolder={supportsFolderBrowsing}
        onOpenFolder={handleOpenFolder}
        onOpenFile={handleOpenFile}
      />
    {/if}
  </div>
</div>

<ConfirmDialog
  open={confirmOpen}
  title="Unsaved changes"
  message={confirmMessage}
  actions={[
    { label: "Cancel", value: "cancel" },
    { label: "Discard", value: "discard", variant: "danger" },
    { label: "Save", value: "save", variant: "primary" },
  ]}
  onAction={onConfirmAction}
/>

<style>
  .app {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100%;
  }

  .error-banner {
    background: color-mix(in srgb, var(--danger) 12%, var(--surface));
    color: var(--danger);
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .error-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .error-actions button {
    border: 1px solid currentColor;
    background: none;
    color: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
  }

  .error-actions button:last-child {
    border: none;
    font-size: 1.1rem;
    padding: 0 0.2rem;
  }

  .editor-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .split {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  .split-pane {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .split-divider {
    width: 1px;
    flex-shrink: 0;
    background: var(--border);
  }
</style>
