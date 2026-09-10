<script lang="ts">
  import type { Folder, FileEntry } from "$lib/platform";

  let {
    folder,
    files,
    activeId,
    supportsFolder,
    onOpenFolder,
    onOpenFile,
    onNewFromClipboard,
    onCloseFolder,
    onSelectEntry,
  }: {
    folder: Folder | null;
    files: FileEntry[];
    activeId: string | null;
    supportsFolder: boolean;
    onOpenFolder: () => void;
    onOpenFile: () => void;
    onNewFromClipboard: () => void;
    onCloseFolder: () => void;
    onSelectEntry: (entry: FileEntry) => void;
  } = $props();
</script>

<aside class="sidebar">
  <div class="actions">
    <button class="btn" onclick={onOpenFile}>Open File…</button>
    {#if supportsFolder}
      <button class="btn" onclick={onOpenFolder}>Open Folder…</button>
    {/if}
    <button class="btn" onclick={onNewFromClipboard}>New from Clipboard</button>
  </div>

  {#if folder}
    <div class="folder-header">
      <svg class="icon" viewBox="0 0 20 20" fill="none">
        <path
          d="M2.5 5.5a1 1 0 0 1 1-1H8l1.5 2h7a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linejoin="round"
        />
      </svg>
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
    <p class="empty-note">No folder open.</p>
  {/if}
</aside>

<style>
  .sidebar {
    width: 260px;
    min-width: 260px;
    border-right: 1px solid var(--border);
    background: var(--surface-alt);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .btn {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: 7px;
    padding: 0.45rem 0.7rem;
    font-size: 0.84rem;
    font-weight: 500;
    text-align: left;
  }

  .btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .folder-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.7rem 0.75rem 0.4rem;
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

  .empty-note {
    color: var(--text-muted);
    font-size: 0.82rem;
    padding: 1rem 0.9rem;
  }
</style>
