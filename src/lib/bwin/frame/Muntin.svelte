<script lang="ts">
  import type { Sash } from '../sash.js';

  interface MuntinProps {
    sash: Sash;
    muntinSize?: number;
    onMuntinRender?: (muntinEl: HTMLElement, sash: Sash) => void;
  }

  let { sash, muntinSize = 4, onMuntinRender }: MuntinProps = $props();

  const isVertical = $derived(!!sash.leftChild);
  const isHorizontal = $derived(!!sash.topChild);
  const isResizable = $derived(sash.store.resizable !== false);

  let muntinElement = $state<HTMLElement>();

  // Call the render callback when the muntin mounts or updates
  $effect(() => {
    if (muntinElement && onMuntinRender) {
      onMuntinRender(muntinElement, sash);
    }
  });

  // Compute individual style values
  const width = $derived(
    sash.leftChild ? `${muntinSize}px` : sash.topChild ? `${sash.width}px` : '0px'
  );

  const height = $derived(
    sash.leftChild ? `${sash.height}px` : sash.topChild ? `${muntinSize}px` : '0px'
  );

  const top = $derived(
    sash.leftChild
      ? `${sash.top}px`
      : sash.topChild
        ? `${sash.top + sash.topChild.height - muntinSize / 2}px`
        : '0px'
  );

  const left = $derived(
    sash.leftChild
      ? `${sash.left + sash.leftChild.width - muntinSize / 2}px`
      : sash.topChild
        ? `${sash.left}px`
        : '0px'
  );
</script>

<div
  bind:this={muntinElement}
  class="muntin"
  class:vertical={isVertical}
  class:horizontal={isHorizontal}
  data-sash-id={sash.id}
  data-resizable={isResizable}
  style:width={width}
  style:height={height}
  style:top={top}
  style:left={left}
></div>
