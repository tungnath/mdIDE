<script lang="ts">
  import { version } from "../../../package.json";
  import { backendKind } from "$lib/platform";
  import AppMark from "./AppMark.svelte";

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
        <span class="eyebrow">About MarkDW</span>
        <button class="close" onclick={onClose} aria-label="Close">×</button>
      </div>

      <div class="identity">
        <AppMark size={40} />
        <div>
          <h2 id="about-title">MarkDW</h2>
          <p class="version">Version {version} · {currentModeLabel}</p>
        </div>
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
          </ul>
        </section>

        <section>
          <h3>Web app</h3>
          <ul>
            <li>Runs entirely in your browser as a static site - no backend server, no database, no file uploads. File content never leaves your device.</li>
            <li>In Chrome/Edge: folder browsing and save-in-place use the browser's File System Access API, scoped to only what you pick.</li>
            <li>Other browsers: opening reads a file locally; "saving" downloads a copy - the original is untouched.</li>
          </ul>
        </section>
      </div>

      <div class="foot">
        <span class="note">Only your theme preference is stored locally.</span>
        <button class="btn" onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 14, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow);
    width: 520px;
    max-width: 100%;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1.2rem;
    border-bottom: 1px solid var(--border);
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .close {
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 1.3rem;
    line-height: 1;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .close:hover {
    background: var(--surface-alt);
    color: var(--text);
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.3rem 1.2rem 0;
  }

  h2 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 600;
  }

  .version {
    margin: 0.2rem 0 0;
    color: var(--text-muted);
    font-size: 0.78rem;
    font-family: var(--font-mono);
  }

  .tagline {
    margin: 1rem 1.2rem 0;
    color: var(--text);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .body {
    margin: 1.1rem 1.2rem 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }

  @media (max-width: 480px) {
    .body {
      grid-template-columns: 1fr;
    }
  }

  section {
    background: var(--surface-alt);
    border-radius: 10px;
    padding: 0.9rem 1rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent2);
  }

  ul {
    margin: 0;
    padding-left: 1.05em;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  li {
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--text);
  }

  .foot {
    margin-top: 1.2rem;
    padding: 0.9rem 1.2rem;
    background: var(--note-bg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-radius: 0 0 14px 14px;
  }

  .note {
    font-size: 0.76rem;
    color: var(--text-muted);
  }

  .btn {
    border: 1px solid var(--accent);
    background: var(--accent);
    color: var(--accent-fg);
    border-radius: 999px;
    padding: 0.5rem 1.2rem;
    font-size: 0.83rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .btn:hover {
    filter: brightness(1.05);
  }
</style>
