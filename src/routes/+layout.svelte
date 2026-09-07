<script lang="ts">
  import "../lib/styles/app.css";
  import { theme, applyTheme } from "$lib/theme.svelte";

  let { children } = $props();

  $effect(() => {
    applyTheme(theme.current);
  });
</script>

{@render children()}
