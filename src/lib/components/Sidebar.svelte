<script lang="ts">
  import type { Folder, FileEntry } from "$lib/platform";

  let {
    folder,
    files,
    activeId,
    supportsFolder,
    dark,
    designSet,
    onOpenFolder,
    onOpenFile,
    onNewFromClipboard,
    onCloseFolder,
    onSelectEntry,
    onToggleTheme,
    onToggleDesignSet,
    onOpenAbout,
  }: {
    folder: Folder | null;
    files: FileEntry[];
    activeId: string | null;
    supportsFolder: boolean;
    dark: boolean;
    designSet: "harbor" | "sage";
    onOpenFolder: () => void;
    onOpenFile: () => void;
    onNewFromClipboard: () => void;
    onCloseFolder: () => void;
    onSelectEntry: (entry: FileEntry) => void;
    onToggleTheme: () => void;
    onToggleDesignSet: () => void;
    onOpenAbout: () => void;
  } = $props();

  function initialExpanded(): boolean {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("sidebarExpanded");
    return stored === null ? true : stored === "true";
  }

  let expanded = $state(initialExpanded());
  const otherSetLabel = $derived(designSet === "harbor" ? "Sage" : "Harbor");

  function toggleExpanded() {
    expanded = !expanded;
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarExpanded", String(expanded));
    }
  }
</script>

<div class="rail-wrap">
  <aside class="rail">
    <button
      class="rail-btn"
      class:active={expanded}
      title={expanded ? "Collapse file panel" : "Expand file panel"}
      aria-label={expanded ? "Collapse file panel" : "Expand file panel"}
      onclick={toggleExpanded}
    >
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" stroke="currentColor" stroke-width="1.3" />
        <path d="M8 3.5v13" stroke="currentColor" stroke-width="1.3" />
      </svg>
    </button>

    <button class="rail-btn" title="Open File…" aria-label="Open File" onclick={onOpenFile}>
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M5 2.5h7l3 3v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linejoin="round"
        />
        <path d="M12 2.5v3h3" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
      </svg>
    </button>

    {#if supportsFolder}
      <button class="rail-btn" title="Open Folder…" aria-label="Open Folder" onclick={onOpenFolder}>
        <svg viewBox="0 0 20 20" fill="none">
          <path
            d="M2.5 5.5a1 1 0 0 1 1-1H8l1.5 2h7a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    {/if}

    <button
      class="rail-btn"
      title="New from Clipboard"
      aria-label="New from Clipboard"
      onclick={onNewFromClipboard}
    >
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="4.5" y="4" width="11" height="14" rx="1.6" stroke="currentColor" stroke-width="1.3" />
        <path d="M7.5 4V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.3" />
        <path d="M7 9.5h6M7 13h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      </svg>
    </button>

    <div class="rail-spacer"></div>

    <button
      class="rail-btn"
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
      class="rail-btn"
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

    <button class="rail-btn" title="About MarkDW" aria-label="About MarkDW" onclick={onOpenAbout}>
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.25" stroke="currentColor" stroke-width="1.3" />
        <path d="M10 9v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
        <circle cx="10" cy="6.6" r="0.9" fill="currentColor" />
      </svg>
    </button>
  </aside>

  {#if expanded}
    <div class="panel">
      {#if folder}
        <div class="folder-header">
          <span class="folder-name" title={folder.name}>{folder.name}</span>
          <button
            class="icon-btn"
            title="Close folder"
            onclick={onCloseFolder}
            aria-label="Close folder"
          >
            ×
          </button>
        </div>

        <div class="file-list">
          {#if files.length === 0}
            <p class="empty-note">No .md files in this folder.</p>
          {:else}
            {#each files as f (f.id)}
              <button
                class="file-item"
                class:active={f.id === activeId}
                onclick={() => onSelectEntry(f)}
                title={f.name}
              >
                <svg class="icon" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 2.5h7l3 3v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linejoin="round"
                  />
                  <path d="M12 2.5v3h3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                </svg>
                <span class="name">{f.name}</span>
              </button>
            {/each}
          {/if}
        </div>
      {:else}
        <div class="empty-panel">
          <p class="empty-note">No folder open.</p>
          <p class="empty-hint">
            {supportsFolder ? "Use the folder icon to browse one." : "Open a single file instead."}
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rail-wrap {
    display: flex;
    height: 100%;
    border-right: 1px solid var(--border);
    background: var(--surface-alt);
  }

  .rail {
    width: 52px;
    min-width: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.6rem 0;
  }

  .rail-spacer {
    flex: 1;
  }

  .rail-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    color: var(--text-muted);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rail-btn svg {
    width: 18px;
    height: 18px;
  }

  .rail-btn:hover {
    background: var(--surface);
    color: var(--text);
  }

  .rail-btn.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .panel {
    width: 220px;
    min-width: 220px;
    border-left: 1px solid var(--border);
    background: var(--surface-alt);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .folder-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 0.75rem 0.5rem;
    color: var(--text-muted);
  }

  .folder-name {
    flex: 1;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }

  .icon-btn {
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 1.1rem;
    line-height: 1;
    width: 20px;
    height: 20px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background: var(--surface);
    color: var(--text);
  }

  .file-list {
    overflow-y: auto;
    padding: 0.25rem;
    flex: 1;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    border: none;
    background: none;
    color: var(--text);
    padding: 0.4rem 0.55rem;
    border-radius: 6px;
    font-size: 0.86rem;
    text-align: left;
  }

  .file-item .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-item:hover {
    background: var(--surface);
  }

  .file-item.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-left: 2px solid var(--accent);
    padding-left: calc(0.55rem - 2px);
  }

  .empty-panel {
    padding: 1rem 0.9rem;
  }

  .empty-note {
    color: var(--text-muted);
    font-size: 0.82rem;
    margin: 0 0 0.3rem;
  }

  .empty-hint {
    color: var(--text-muted);
    font-size: 0.74rem;
    opacity: 0.85;
    margin: 0;
  }
</style>
