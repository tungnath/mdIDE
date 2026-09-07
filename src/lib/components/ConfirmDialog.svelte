<script lang="ts">
  interface Action {
    label: string;
    value: string;
    variant?: "primary" | "danger" | "default";
  }

  let {
    open,
    title,
    message,
    actions,
    onAction,
  }: {
    open: boolean;
    title: string;
    message: string;
    actions: Action[];
    onAction: (value: string) => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onAction("cancel");
  }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <div
    class="overlay"
    role="button"
    tabindex="-1"
    aria-label="Close dialog"
    onclick={() => onAction("cancel")}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") onAction("cancel");
    }}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onclick={(e) => e.stopPropagation()}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div class="actions">
        {#each actions as action (action.value)}
          <button
            class="btn {action.variant ?? 'default'}"
            onclick={() => onAction(action.value)}
          >
            {action.label}
          </button>
        {/each}
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
  }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 1.5rem;
    width: 380px;
    max-width: calc(100vw - 2rem);
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.05rem;
  }

  p {
    margin: 0 0 1.3rem;
    color: var(--text-muted);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn {
    border: 1px solid var(--border);
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 7px;
    padding: 0.45rem 0.9rem;
    font-size: 0.88rem;
    font-weight: 500;
  }

  .btn:hover {
    filter: brightness(0.97);
  }

  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }

  .btn.danger {
    background: transparent;
    border-color: var(--danger);
    color: var(--danger);
  }
</style>
