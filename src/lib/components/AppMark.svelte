<script lang="ts">
  let { size = 28 }: { size?: number } = $props();
</script>

<span
  class="mark"
  style="width:{size}px;height:{size}px;font-size:{Math.round(size * 0.42)}px;border-radius:{Math.round(size * 0.28)}px"
>
  M
</span>

<style>
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--accent);
    color: var(--accent-fg);
    font-family: var(--font-mono);
    font-weight: 700;
  }
</style>
