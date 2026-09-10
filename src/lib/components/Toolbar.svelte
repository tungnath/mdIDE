<script lang="ts">
  import { exportFile, type OpenDoc } from "$lib/platform";
  import { renderStandaloneHtml, extractPlainText, baseNameWithoutExt } from "$lib/export";
  import AppMark from "./AppMark.svelte";

  let {
    doc,
    content,
    dirty,
    mode,
    saving,
    onSetMode,
    onSave,
    onClose,
    onExportPdf,
  }: {
    doc: OpenDoc | null;
    content: string;
    dirty: boolean;
    mode: "view" | "edit" | "split";
    saving: boolean;
    onSetMode: (m: "view" | "edit" | "split") => void;
    onSave: () => void;
    onClose: () => void;
    onExportPdf: () => void;
  } = $props();

  let exportOpen = $state(false);
  let exportMenuEl: HTMLDivElement | undefined = $state();

  function toggleExport() {
    if (!doc) return;
    exportOpen = !exportOpen;
  }

  function closeExport() {
    exportOpen = false;
  }

  function handleWindowClick(e: MouseEvent) {
    if (exportOpen && exportMenuEl && !exportMenuEl.contains(e.target as Node)) {
      exportOpen = false;
    }
  }

  async function exportHtml() {
    if (!doc) return;
    const base = baseNameWithoutExt(doc.name);
    closeExport();
    await exportFile(`${base}.html`, renderStandaloneHtml(content, base), "text/html");
  }

  async function exportText() {
    if (!doc) return;
    const base = baseNameWithoutExt(doc.name);
    closeExport();
    await exportFile(`${base}.txt`, extractPlainText(content), "text/plain");
  }

  function exportPdf() {
    if (!doc) return;
    closeExport();
    onExportPdf();
  }
</script>

<svelte:window onclick={handleWindowClick} />

<header class="toolbar">
  <div class="left">
    <AppMark size={28} />

    <span class="chip">
      {#if dirty}<span class="dot"></span>{/if}
      <span class="chip-text">{doc ? doc.name : "No file open"}</span>
    </span>
  </div>

  <div class="right">
    <div class="segmented" role="tablist" aria-disabled={!doc}>
      <button
        role="tab"
        aria-selected={mode === "view"}
        class:active={mode === "view"}
        disabled={!doc}
        onclick={() => onSetMode("view")}
      >
        View
      </button>
      <button
        role="tab"
        aria-selected={mode === "split"}
        class:active={mode === "split"}
        disabled={!doc}
        onclick={() => onSetMode("split")}
      >
        Split
      </button>
      <button
        role="tab"
        aria-selected={mode === "edit"}
        class:active={mode === "edit"}
        disabled={!doc}
        onclick={() => onSetMode("edit")}
      >
        Edit
      </button>
    </div>

    <button class="pill" disabled={!doc || !dirty || saving} onclick={onSave}>
      {saving ? "Saving…" : "Save"}
    </button>

    <div class="export-wrap" bind:this={exportMenuEl}>
      <button
        class="pill filled"
        disabled={!doc}
        onclick={toggleExport}
        aria-haspopup="menu"
        aria-expanded={exportOpen}
      >
        Export ▾
      </button>
      {#if exportOpen}
        <div class="export-menu" role="menu">
          <button role="menuitem" onclick={exportHtml}>as HTML</button>
          <button role="menuitem" onclick={exportPdf}>as PDF…</button>
          <button role="menuitem" onclick={exportText}>as Plain Text</button>
        </div>
      {/if}
    </div>

    <button
      class="icon-btn"
      title="Close file"
      aria-label="Close file"
      disabled={!doc}
      onclick={onClose}
    >
      ×
    </button>
  </div>
</header>

<style>
  .toolbar {
    height: 56px;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.1rem;
    border-bottom: 1px solid var(--border);
    background: var(--bar);
    gap: 1rem;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--surface-alt);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    min-width: 0;
  }

  .chip-text {
    font-size: 0.86rem;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent2);
    flex-shrink: 0;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .segmented {
    display: flex;
    gap: 0.15rem;
    background: var(--surface-alt);
    border-radius: 999px;
    padding: 0.2rem;
  }

  .segmented button {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.4rem 1rem;
    border-radius: 999px;
  }

  .segmented button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }

  .segmented button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .pill {
    border: 1px solid var(--border);
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 999px;
    padding: 0.45rem 1.1rem;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .pill.filled {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }

  .pill:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .icon-btn {
    border: none;
    background: none;
    color: var(--text-muted);
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .icon-btn:hover:not(:disabled) {
    background: var(--surface-alt);
    color: var(--text);
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .export-wrap {
    position: relative;
  }

  .export-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow);
    padding: 0.3rem;
    display: flex;
    flex-direction: column;
    min-width: 150px;
    z-index: 10;
  }

  .export-menu button {
    border: none;
    background: none;
    color: var(--text);
    text-align: left;
    padding: 0.45rem 0.6rem;
    border-radius: 6px;
    font-size: 0.84rem;
  }

  .export-menu button:hover {
    background: var(--surface-alt);
  }
</style>
