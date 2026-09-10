<script lang="ts">
  let { size = 28 }: { size?: number } = $props();
</script>

<img
  class="mark"
  src="/favicon.png"
  alt="MarkDW"
  width={size}
  height={size}
  style="width:{size}px;height:{size}px;border-radius:{Math.round(size * 0.22)}px"
/>

<style>
  .mark {
    display: block;
    flex-shrink: 0;
    object-fit: cover;
  }
</style>
