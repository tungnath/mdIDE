<script lang="ts">
  import { renderMarkdown } from "$lib/markdown";

  let { source }: { source: string } = $props();

  let html = $derived(renderMarkdown(source));
</script>

<div class="preview thin-scroll">
  <div class="prose">{@html html}</div>
</div>

<style>
  .preview {
    flex: 1;
    overflow-y: auto;
    height: 100%;
  }
</style>
