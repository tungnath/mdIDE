<script lang="ts">
  import { version } from "../../../package.json";
  import { backendKind } from "$lib/platform";

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  const currentModeLabel =
    backendKind === "tauri"
      ? "Desktop app"
      : backendKind === "fsa"
        ? "Web app (Chrome/Edge)"
        : "Web app (limited browser support)";
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <div
    class="overlay"
    role="button"
    tabindex="-1"
    aria-label="Close dialog"
    onclick={onClose}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") onClose();
    }}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="modal thin-scroll"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="head">
        <svg class="mark" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" stroke-width="2.2" />
          <path d="M11 30V18l6 7 6-7v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M31 18v12M31 30l5-5M31 30l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <h2 id="about-title">MarkDW</h2>
          <p class="version">Version {version} · {currentModeLabel}</p>
        </div>
        <button class="close" onclick={onClose} aria-label="Close">×</button>
      </div>

      <p class="tagline">
        A very lightweight markdown viewer and editor — View, Edit, and Split
        modes, on desktop or in the browser.
      </p>

      <div class="body">
        <section>
          <h3>Desktop app</h3>
          <ul>
            <li>Files are read and written directly on your machine, only when you open, save, or export - via native file dialogs you control.</li>
            <li>Nothing is ever sent over the network. There's no server, no account, no analytics or telemetry.</li>
            <li>Clipboard content is read only when you click "New from Clipboard," never automatically.</li>
            <li>Your theme preference is the only thing stored locally (in the app's own local data folder) - no file content is cached or retained outside the files you explicitly save.</li>
          </ul>
        </section>

        <section>
          <h3>Web app</h3>
          <ul>
            <li>Runs entirely in your browser as a static site - no backend server, no database, no file uploads. File content never leaves your device.</li>
            <li>In Chrome/Edge: folder browsing and save-in-place use the browser's File System Access API - you grant per-file/folder permission, and the site can only touch what you explicitly picked.</li>
            <li>In other browsers: opening a file reads it locally via a plain file picker (never uploaded); "saving" downloads a new copy - the original file is untouched.</li>
            <li>Only your theme preference is stored, in your browser's local storage, scoped to this site - nothing is sent to a server, and no cookies or trackers are used.</li>
          </ul>
        </section>
      </div>

      <div class="foot">
        <button class="btn" onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 14, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 1.5rem;
    width: 460px;
    max-width: 100%;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
  }

  .head {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .mark {
    width: 32px;
    height: 32px;
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .head > div {
    flex: 1;
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .version {
    margin: 0.15rem 0 0;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .close {
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 1.3rem;
    line-height: 1;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .close:hover {
    background: var(--surface-alt);
    color: var(--text);
  }

  .tagline {
    margin: 1rem 0 0;
    color: var(--text);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .body {
    margin-top: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  section {
    background: var(--surface-alt);
    border-radius: 8px;
    padding: 0.85rem 0.95rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-muted);
  }

  ul {
    margin: 0;
    padding-left: 1.1em;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  li {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text);
  }

  .foot {
    margin-top: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .btn {
    border: 1px solid var(--border);
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 7px;
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .btn:hover {
    filter: brightness(0.97);
  }
</style>
