<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import {
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    listSavedLayouts
  } from '$lib/bwin/persistence.js';

  const { Story } = defineMeta({
    title: 'Features/State Persistence',
    component: BinaryWindow,
    parameters: {
      layout: 'fullscreen'
    }
  });
</script>

<!-- Save and Load Layout -->
<Story name="Save and Load Layout">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';
      import { saveToLocalStorage, loadFromLocalStorage } from '$lib/bwin/persistence.js';

      let bwin: any = $state();
      let saveMessage = $state('');
      let loadMessage = $state('');
      let savedLayouts = $state<string[]>([]);

      // Component mapping for serialization
      const componentMap: Record<string, any> = {
        ChatSession
      };

      function componentToKey(component: any): string | undefined {
        if (component === ChatSession) return 'ChatSession';
        return undefined;
      }

      $effect(() => {
        if (bwin?.rootSash) {
          // Load saved layouts list
          const layouts = Object.keys(localStorage)
            .filter(key => key.startsWith('bwin-layout-'))
            .map(key => key.replace('bwin-layout-', ''));
          savedLayouts = layouts;
        }
      });

      function addSamplePanes() {
        if (!bwin?.addPane) return;

        try {
          bwin.addPane('root', {
            position: 'right',
            title: 'Pane 1',
            component: ChatSession,
            componentProps: { initialMessage: 'First pane' }
          });

          setTimeout(() => {
            bwin.addPane('pane-0', {
              position: 'bottom',
              title: 'Pane 2',
              component: ChatSession,
              componentProps: { initialMessage: 'Second pane' }
            });
          }, 100);

          setTimeout(() => {
            bwin.addPane('pane-1', {
              position: 'right',
              title: 'Pane 3',
              component: ChatSession,
              componentProps: { initialMessage: 'Third pane' }
            });
          }, 200);
        } catch (e: any) {
          console.error('Failed to add panes:', e);
        }
      }

      function saveLayout() {
        if (!bwin?.rootSash) {
          saveMessage = 'Error: BinaryWindow not initialized';
          return;
        }

        const result = saveToLocalStorage('demo-layout', bwin.rootSash, {
          componentToKey
        });

        if (result.success) {
          saveMessage = `✓ Layout saved successfully! (${result.serialized?.paneCount} panes)`;

          // Update saved layouts list
          const layouts = Object.keys(localStorage)
            .filter(key => key.startsWith('bwin-layout-'))
            .map(key => key.replace('bwin-layout-', ''));
          savedLayouts = layouts;
        } else {
          saveMessage = `✗ Save failed: ${result.error?.message}`;
        }

        setTimeout(() => {
          saveMessage = '';
        }, 3000);
      }

      function loadLayout() {
        const result = loadFromLocalStorage('demo-layout', {
          componentMap
        });

        if (result.success && result.tree) {
          // Here you would reconstruct the panes from the loaded tree
          loadMessage = `✓ Layout loaded successfully! (${result.tree.paneCount} panes)`;
          console.log('Loaded tree:', result.tree);
        } else {
          loadMessage = `✗ Load failed: ${result.error?.message || 'No saved layout found'}`;
        }

        setTimeout(() => {
          loadMessage = '';
        }, 3000);
      }

      function clearLayout() {
        removeFromLocalStorage('demo-layout');
        saveMessage = '✓ Layout cleared from storage';

        // Update saved layouts list
        const layouts = Object.keys(localStorage)
          .filter(key => key.startsWith('bwin-layout-'))
          .map(key => key.replace('bwin-layout-', ''));
        savedLayouts = layouts;

        setTimeout(() => {
          saveMessage = '';
        }, 2000);
      }
    </script>

    <div style="display: flex; flex-direction: column; height: 100vh;">
      <!-- Control Panel -->
      <div style="padding: 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
        <h3 style="margin: 0 0 12px 0;">State Persistence Demo</h3>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
          <button
            onclick={addSamplePanes}
            style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Add Sample Panes
          </button>

          <button
            onclick={saveLayout}
            style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Save Layout
          </button>

          <button
            onclick={loadLayout}
            style="padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Load Layout
          </button>

          <button
            onclick={clearLayout}
            style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Clear Storage
          </button>
        </div>

        <div style="font-size: 14px;">
          {#if saveMessage}
            <div style="color: {saveMessage.startsWith('✓') ? '#4CAF50' : '#f44336'}; font-weight: 500;">
              {saveMessage}
            </div>
          {/if}
          {#if loadMessage}
            <div style="color: {loadMessage.startsWith('✓') ? '#4CAF50' : '#f44336'}; font-weight: 500;">
              {loadMessage}
            </div>
          {/if}
          {#if savedLayouts.length > 0}
            <div style="margin-top: 8px; color: #666;">
              <strong>Saved layouts:</strong> {savedLayouts.join(', ')}
            </div>
          {/if}
        </div>

        <div style="margin-top: 12px; padding: 12px; background: #fff; border-radius: 4px; font-size: 13px; color: #666;">
          <p style="margin: 0;"><strong>Instructions:</strong></p>
          <ol style="margin: 8px 0 0 0; padding-left: 20px;">
            <li>Click "Add Sample Panes" to create a multi-pane layout</li>
            <li>Click "Save Layout" to persist the current state to localStorage</li>
            <li>Refresh the page, then click "Load Layout" to restore the layout</li>
            <li>Click "Clear Storage" to remove the saved layout</li>
          </ol>
        </div>
      </div>

      <!-- BinaryWindow -->
      <div style="flex: 1; overflow: hidden;">
        <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
      </div>
    </div>
  {/snippet}
</Story>

<!-- JSON Serialization Demo -->
<Story name="JSON Serialization">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';
      import { serializeTree, deserializeTree } from '$lib/bwin/persistence.js';

      let bwin: any = $state();
      let jsonOutput = $state('');

      function componentToKey(component: any): string | undefined {
        if (component === ChatSession) return 'ChatSession';
        return undefined;
      }

      $effect(() => {
        if (bwin?.rootSash && bwin?.addPane) {
          // Add sample panes for demo
          setTimeout(() => {
            try {
              bwin.addPane('root', {
                position: 'right',
                title: 'Pane 1',
                component: ChatSession,
                componentProps: { initialMessage: 'Hello' }
              });

              setTimeout(() => {
                bwin.addPane('pane-0', {
                  position: 'bottom',
                  title: 'Pane 2',
                  component: ChatSession,
                  componentProps: { initialMessage: 'World' }
                });

                // Serialize after panes are added
                setTimeout(() => {
                  const result = serializeTree(bwin.rootSash, { componentToKey });
                  if (result.success && result.data) {
                    jsonOutput = JSON.stringify(result.data, null, 2);
                  }
                }, 300);
              }, 200);
            } catch (e) {
              console.error('Failed to add panes:', e);
            }
          }, 200);
        }
      });
    </script>

    <div style="display: flex; height: 100vh;">
      <!-- Left: BinaryWindow -->
      <div style="flex: 1; overflow: hidden; border-right: 1px solid #ddd;">
        <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
      </div>

      <!-- Right: JSON Output -->
      <div style="flex: 1; overflow: auto; padding: 16px; background: #f5f5f5;">
        <h3 style="margin-top: 0;">Serialized JSON</h3>
        <p style="font-size: 14px; color: #666;">
          This is the JSON representation of the current layout:
        </p>
        <pre style="
          background: #fff;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #ddd;
          overflow: auto;
          font-size: 12px;
          line-height: 1.5;
        ">{jsonOutput || 'Generating...'}</pre>
      </div>
    </div>
  {/snippet}
</Story>
