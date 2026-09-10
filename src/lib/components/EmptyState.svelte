<script lang="ts">
  let {
    supportsFolder,
    onOpenFolder,
    onOpenFile,
    onNewFromClipboard,
  }: {
    supportsFolder: boolean;
    onOpenFolder: () => void;
    onOpenFile: () => void;
    onNewFromClipboard: () => void;
  } = $props();
</script>

<div class="empty">
  <div class="card">
    <svg class="mark" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" stroke-width="2.2" />
      <path d="M11 30V18l6 7 6-7v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M31 18v12M31 30l5-5M31 30l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <h1>MarkDW</h1>
    <p>Open a single file, or browse a folder to see all its markdown files.</p>
    <div class="buttons">
      <button class="btn primary" onclick={onOpenFile}>Open File…</button>
      {#if supportsFolder}
        <button class="btn" onclick={onOpenFolder}>Open Folder…</button>
      {/if}
      <button class="btn" onclick={onNewFromClipboard}>New from Clipboard</button>
    </div>
    {#if !supportsFolder}
      <p class="note">
        Folder browsing and in-place saving need a Chromium-based browser (or
        the desktop app). Files opened here can still be edited and
        downloaded.
      </p>
    {/if}
  </div>
</div>

<style>
  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .card {
    text-align: center;
    max-width: 380px;
    padding: 2rem;
  }

  .mark {
    width: 44px;
    height: 44px;
    color: var(--accent);
    margin-bottom: 0.75rem;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: 1.7rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  p {
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.55;
    margin: 0 0 1.4rem;
  }

  .buttons {
    display: flex;
    gap: 0.6rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    border: 1px solid var(--border);
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 8px;
    padding: 0.55rem 1.1rem;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }

  .note {
    margin-top: 1.4rem;
    font-size: 0.78rem;
  }
</style>
