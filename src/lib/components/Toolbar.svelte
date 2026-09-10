<script lang="ts">
  import { exportFile, type OpenDoc } from "$lib/platform";
  import { renderStandaloneHtml, extractPlainText, baseNameWithoutExt } from "$lib/export";

  let {
    doc,
    content,
    dirty,
    mode,
    saving,
    dark,
    designSet,
    onSetMode,
    onSave,
    onClose,
    onToggleTheme,
    onToggleDesignSet,
    onExportPdf,
    onOpenAbout,
  }: {
    doc: OpenDoc | null;
    content: string;
    dirty: boolean;
    mode: "view" | "edit" | "split";
    saving: boolean;
    dark: boolean;
    designSet: "harbor" | "sage";
    onSetMode: (m: "view" | "edit" | "split") => void;
    onSave: () => void;
    onClose: () => void;
    onToggleTheme: () => void;
    onToggleDesignSet: () => void;
    onExportPdf: () => void;
    onOpenAbout: () => void;
  } = $props();

  const otherSetLabel = $derived(designSet === "harbor" ? "Sage" : "Harbor");

  let exportOpen = $state(false);
  let exportMenuEl: HTMLDivElement | undefined = $state();

  function toggleExport() {
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
    closeExport();
    onExportPdf();
  }
</script>

<svelte:window onclick={handleWindowClick} />

<header class="toolbar">
  <div class="left">
    {#if doc}
      <span class="file-title">
        {doc.name}
        {#if dirty}<span class="dirty-dot" title="Unsaved changes"></span>{/if}
      </span>
    {:else}
      <span class="app-title">MarkDW</span>
    {/if}
  </div>

  <div class="right">
    {#if doc}
      <div class="segmented" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "view"}
          class:active={mode === "view"}
          onclick={() => onSetMode("view")}
        >
          View
        </button>
        <button
          role="tab"
          aria-selected={mode === "split"}
          class:active={mode === "split"}
          onclick={() => onSetMode("split")}
        >
          Split
        </button>
        <button
          role="tab"
          aria-selected={mode === "edit"}
          class:active={mode === "edit"}
          onclick={() => onSetMode("edit")}
        >
          Edit
        </button>
      </div>

      <button class="btn save" disabled={!dirty || saving} onclick={onSave}>
        {saving ? "Saving…" : "Save"}
      </button>

      <div class="export-wrap" bind:this={exportMenuEl}>
        <button
          class="btn"
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

      <button class="icon-btn" title="Close file" aria-label="Close file" onclick={onClose}>
        ×
      </button>

      <div class="divider"></div>
    {/if}

    <button
      class="icon-btn"
      title="Toggle theme"
      aria-label="Toggle theme"
      onclick={onToggleTheme}
    >
      {#if dark}
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.3" />
          <path
            d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
          />
        </svg>
      {:else}
        <svg viewBox="0 0 20 20" fill="none">
          <path
            d="M17 11.5A7 7 0 1 1 8.5 3a5.5 5.5 0 0 0 8.5 8.5Z"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linejoin="round"
          />
        </svg>
      {/if}
    </button>

    <button
      class="icon-btn"
      title="Switch to {otherSetLabel}"
      aria-label="Switch design to {otherSetLabel}"
      onclick={onToggleDesignSet}
    >
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2.5a7.5 7.5 0 1 0 0 15c.9 0 1.5-.72 1.5-1.5 0-.4-.16-.75-.4-1.02-.24-.26-.4-.6-.4-.98 0-.78.6-1.5 1.5-1.5h1.4a2.6 2.6 0 0 0 2.6-2.6c0-4.14-2.96-7.4-6.2-7.4Z"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linejoin="round"
        />
        <circle cx="6.6" cy="8" r="1" fill="currentColor" />
        <circle cx="9.7" cy="5.6" r="1" fill="currentColor" />
        <circle cx="6.6" cy="12" r="1" fill="currentColor" />
      </svg>
    </button>

    <button
      class="icon-btn"
      title="About MarkDW"
      aria-label="About MarkDW"
      onclick={onOpenAbout}
    >
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.25" stroke="currentColor" stroke-width="1.3" />
        <path d="M10 9v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
        <circle cx="10" cy="6.6" r="0.9" fill="currentColor" />
      </svg>
    </button>
  </div>
</header>

<style>
  .toolbar {
    height: 52px;
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--bar);
  }

  .app-title {
    font-weight: 650;
    font-size: 0.92rem;
    color: var(--text-muted);
  }

  .file-title {
    font-weight: 600;
    font-size: 0.92rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .dirty-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    display: inline-block;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .segmented {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 7px;
    overflow: hidden;
  }

  .segmented button {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 500;
    padding: 0.35rem 0.8rem;
  }

  .segmented button.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .btn {
    border: 1px solid var(--border);
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 7px;
    padding: 0.4rem 0.8rem;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .btn.save:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .icon-btn {
    border: none;
    background: none;
    color: var(--text-muted);
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .icon-btn:hover {
    background: var(--surface-alt);
    color: var(--text);
  }

  .icon-btn svg {
    width: 17px;
    height: 17px;
  }

  .divider {
    width: 1px;
    height: 20px;
    background: var(--border);
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
    border-radius: 8px;
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
