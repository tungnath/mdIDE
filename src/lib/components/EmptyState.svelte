<script lang="ts">
  import AppMark from "./AppMark.svelte";

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
    <AppMark size={64} />
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
    container-type: inline-size;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 460px;
  }

  .card > :global(img) {
    margin-bottom: 1.25rem;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: 1.9rem;
    font-weight: 600;
    margin: 0 0 0.9rem;
  }

  p {
    color: var(--text-muted);
    font-size: 0.96rem;
    line-height: 1.65;
    max-width: 340px;
    margin: 0 auto 2.2rem;
  }

  .buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .btn {
    border: 1px solid var(--border);
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 10px;
    padding: 0.7rem 1.4rem;
    font-size: 0.92rem;
    font-weight: 600;
    flex: 0 1 auto;
  }

  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }

  /* Stack full-width once the available pane (not the viewport - the
     sidebar can eat into it) gets tight, instead of an uneven 2-then-1
     wrap. */
  @container (max-width: 420px) {
    .buttons {
      flex-direction: column;
    }

    .btn {
      flex: 1 1 auto;
    }
  }

  .note {
    margin-top: 1.6rem;
    font-size: 0.78rem;
    max-width: 340px;
  }
</style>
