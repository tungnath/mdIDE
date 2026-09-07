<script lang="ts">
  import type { OpenDoc } from "$lib/platform";

  let {
    doc,
    dirty,
    mode,
    saving,
    dark,
    onSetMode,
    onSave,
    onClose,
    onToggleTheme,
  }: {
    doc: OpenDoc | null;
    dirty: boolean;
    mode: "view" | "edit" | "split";
    saving: boolean;
    dark: boolean;
    onSetMode: (m: "view" | "edit" | "split") => void;
    onSave: () => void;
    onClose: () => void;
    onToggleTheme: () => void;
  } = $props();
</script>

<header class="toolbar">
  <div class="left">
    {#if doc}
      <span class="file-title">
        {doc.name}
        {#if dirty}<span class="dirty-dot" title="Unsaved changes"></span>{/if}
      </span>
    {:else}
      <span class="app-title">Marker</span>
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
    background: var(--surface);
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
    background: var(--surface);
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
</style>
