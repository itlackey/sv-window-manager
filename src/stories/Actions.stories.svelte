<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { resize } from '$lib/bwin/actions/resize.svelte';
  import { drag } from '$lib/bwin/actions/drag.svelte';
  import { drop } from '$lib/bwin/actions/drop.svelte';

  const { Story } = defineMeta({
    title: 'Actions/Svelte Actions',
    parameters: {
      layout: 'centered'
    }
  });
</script>

<!-- Resize Action Demo -->
<Story name="Resize Action">
  {#snippet template()}
    <script lang="ts">
      import { resize } from '$lib/bwin/actions/resize.svelte';

      let element: HTMLElement | undefined = $state();
      let width = $state(200);
      let height = $state(200);
      let isResizing = $state(false);

      function handleResize(e: CustomEvent) {
        width = e.detail.width;
        height = e.detail.height;
      }

      function handleResizeStart() {
        isResizing = true;
      }

      function handleResizeEnd() {
        isResizing = false;
      }
    </script>

    <div style="padding: 40px;">
      <h3>Resize Action Demo</h3>
      <p>Drag the handle at the bottom-right corner to resize</p>

      <div
        bind:this={element}
        use:resize={{
          onresize: handleResize,
          onresizestart: handleResizeStart,
          onresizeend: handleResizeEnd
        }}
        style="
          width: {width}px;
          height: {height}px;
          background: #f0f0f0;
          border: 2px solid {isResizing ? '#4CAF50' : '#ccc'};
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: {isResizing ? 'none' : 'border-color 0.3s'};
        "
      >
        <div>
          <div><strong>Width:</strong> {Math.round(width)}px</div>
          <div><strong>Height:</strong> {Math.round(height)}px</div>
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            {isResizing ? 'Resizing...' : 'Ready'}
          </div>
        </div>
      </div>

      <div style="margin-top: 16px; font-size: 14px; color: #666;">
        <p><strong>Try:</strong> Drag the corner handle to resize the box</p>
        <p>The border turns green while resizing</p>
      </div>
    </div>
  {/snippet}
</Story>

<!-- Drag Action Demo -->
<Story name="Drag Action">
  {#snippet template()}
    <script lang="ts">
      import { drag } from '$lib/bwin/actions/drag.svelte';

      let isDragging = $state(false);
      let dragStartX = $state(0);
      let dragStartY = $state(0);

      function handleDragStart(e: CustomEvent) {
        isDragging = true;
        dragStartX = e.detail.x;
        dragStartY = e.detail.y;
      }

      function handleDragEnd(e: CustomEvent) {
        isDragging = false;
      }

      function handleDrag(e: CustomEvent) {
        // Dragging in progress
      }
    </script>

    <div style="padding: 40px;">
      <h3>Drag Action Demo</h3>
      <p>Click and drag the box to move it around</p>

      <div style="position: relative; width: 400px; height: 300px; border: 2px dashed #ccc; background: #fafafa;">
        <div
          use:drag={{
            ondragstart: handleDragStart,
            ondragend: handleDragEnd,
            ondrag: handleDrag,
            canDrag: () => true
          }}
          style="
            position: absolute;
            left: 50px;
            top: 50px;
            width: 120px;
            height: 80px;
            background: {isDragging ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: {isDragging ? 'grabbing' : 'grab'};
            user-select: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          "
        >
          <div style="text-align: center;">
            <div><strong>Drag Me!</strong></div>
            <div style="font-size: 12px; margin-top: 4px;">
              {isDragging ? 'Dragging...' : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 16px; font-size: 14px; color: #666;">
        <p><strong>Try:</strong> Click and drag the blue box</p>
        <p>The box turns green while dragging</p>
      </div>
    </div>
  {/snippet}
</Story>

<!-- Drop Action Demo -->
<Story name="Drop Action">
  {#snippet template()}
    <script lang="ts">
      import { drag } from '$lib/bwin/actions/drag.svelte';
      import { drop } from '$lib/bwin/actions/drop.svelte';

      let isDragging = $state(false);
      let isOverDropZone = $state(false);
      let dropCount = $state(0);

      function handleDragStart() {
        isDragging = true;
      }

      function handleDragEnd() {
        isDragging = false;
        isOverDropZone = false;
      }

      function handleDragEnter() {
        isOverDropZone = true;
      }

      function handleDragLeave() {
        isOverDropZone = false;
      }

      function handleDrop(e: CustomEvent) {
        dropCount++;
        isOverDropZone = false;
        isDragging = false;
      }
    </script>

    <div style="padding: 40px;">
      <h3>Drop Action Demo</h3>
      <p>Drag the item to the drop zone</p>

      <div style="display: flex; gap: 40px; align-items: center;">
        <!-- Draggable Item -->
        <div
          use:drag={{
            ondragstart: handleDragStart,
            ondragend: handleDragEnd,
            canDrag: () => true
          }}
          style="
            width: 100px;
            height: 100px;
            background: #2196F3;
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: {isDragging ? 'grabbing' : 'grab'};
            user-select: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            flex-shrink: 0;
          "
        >
          <strong>Drag Me!</strong>
        </div>

        <!-- Drop Zone -->
        <div
          use:drop={{
            ondragenter: handleDragEnter,
            ondragleave: handleDragLeave,
            ondrop: handleDrop,
            canDrop: () => true
          }}
          style="
            width: 200px;
            height: 200px;
            border: 3px dashed {isOverDropZone ? '#4CAF50' : '#ccc'};
            background: {isOverDropZone ? '#E8F5E9' : '#fafafa'};
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          "
        >
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">
              {isOverDropZone ? '✓' : '📦'}
            </div>
            <div style="font-weight: bold; color: {isOverDropZone ? '#4CAF50' : '#666'};">
              {isOverDropZone ? 'Drop Here!' : 'Drop Zone'}
            </div>
            <div style="margin-top: 8px; font-size: 14px; color: #666;">
              Drops: {dropCount}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 24px; font-size: 14px; color: #666;">
        <p><strong>Try:</strong> Drag the blue box to the drop zone</p>
        <p>The drop zone turns green when you hover over it</p>
        <p>Drop counter increments each time you successfully drop</p>
      </div>
    </div>
  {/snippet}
</Story>

<!-- Combined Demo: All Actions Together -->
<Story name="All Actions Combined">
  {#snippet template()}
    <script lang="ts">
      import { resize } from '$lib/bwin/actions/resize.svelte';
      import { drag } from '$lib/bwin/actions/drag.svelte';

      let width = $state(300);
      let height = $state(200);
      let isDragging = $state(false);
      let isResizing = $state(false);

      function handleResize(e: CustomEvent) {
        width = e.detail.width;
        height = e.detail.height;
      }

      function handleDragStart() {
        isDragging = true;
      }

      function handleDragEnd() {
        isDragging = false;
      }
    </script>

    <div style="padding: 40px;">
      <h3>Combined Actions Demo</h3>
      <p>This element can be both dragged AND resized</p>

      <div style="position: relative; width: 600px; height: 400px; border: 2px dashed #ccc; background: #fafafa;">
        <div
          use:drag={{
            ondragstart: handleDragStart,
            ondragend: handleDragEnd,
            canDrag: () => !isResizing
          }}
          use:resize={{
            onresize: handleResize,
            onresizestart: () => isResizing = true,
            onresizeend: () => isResizing = false
          }}
          style="
            position: absolute;
            left: 50px;
            top: 50px;
            width: {width}px;
            height: {height}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: {isDragging ? 'grabbing' : 'grab'};
            user-select: none;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          "
        >
          <div style="text-align: center;">
            <div><strong>Drag & Resize Me!</strong></div>
            <div style="font-size: 14px; margin-top: 8px;">
              {width.toFixed(0)} × {height.toFixed(0)} px
            </div>
            <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
              {isDragging ? 'Dragging...' : isResizing ? 'Resizing...' : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 24px; font-size: 14px; color: #666;">
        <p><strong>Try:</strong></p>
        <ul>
          <li>Drag from the center to move the element</li>
          <li>Drag from the corner to resize it</li>
          <li>Dragging is disabled while resizing</li>
        </ul>
      </div>
    </div>
  {/snippet}
</Story>
