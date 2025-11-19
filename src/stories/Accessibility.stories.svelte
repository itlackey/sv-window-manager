<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import { createKeyboardShortcuts } from '$lib/bwin/keyboard-shortcuts.js';
  import { createAriaAnnouncer } from '$lib/bwin/aria-announcer.js';

  const { Story } = defineMeta({
    title: 'Features/Accessibility',
    component: BinaryWindow,
    parameters: {
      layout: 'fullscreen'
    }
  });
</script>

<!-- Keyboard Shortcuts Demo -->
<Story name="Keyboard Shortcuts">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';
      import { createKeyboardShortcuts, type KeyboardShortcut } from '$lib/bwin/keyboard-shortcuts.js';

      let bwin: any = $state();
      let shortcuts: any = $state();
      let eventLog = $state<string[]>([]);

      function logEvent(message: string) {
        eventLog = [message, ...eventLog].slice(0, 10); // Keep last 10 events
      }

      $effect(() => {
        if (bwin) {
          // Initialize keyboard shortcuts
          shortcuts = createKeyboardShortcuts(bwin, {
            enabled: true,
            shortcuts: [
              {
                key: 'ctrl+n',
                description: 'Add new pane',
                handler: () => {
                  logEvent('Ctrl+N: Adding new pane...');
                  if (bwin.rootSash) {
                    const paneCount = bwin.rootSash.getAllLeafDescendants().length;
                    bwin.addPane('root', {
                      position: paneCount % 2 === 0 ? 'right' : 'bottom',
                      title: `Pane ${paneCount + 1}`,
                      component: ChatSession,
                      componentProps: { initialMessage: `Created via Ctrl+N` }
                    });
                  }
                }
              },
              {
                key: 'ctrl+shift+c',
                description: 'Close all panes',
                handler: () => {
                  logEvent('Ctrl+Shift+C: Closing all panes...');
                  // Custom handler for demo
                }
              }
            ]
          });

          // Add initial panes
          setTimeout(() => {
            if (bwin.addPane) {
              bwin.addPane('root', {
                position: 'right',
                title: 'Pane 1',
                component: ChatSession,
                componentProps: { initialMessage: 'Try pressing Ctrl+N to add a new pane!' }
              });
            }
          }, 200);

          return () => {
            if (shortcuts?.destroy) {
              shortcuts.destroy();
            }
          };
        }
      });

      function toggleShortcuts() {
        if (shortcuts) {
          if (shortcuts.enabled) {
            shortcuts.disable();
            logEvent('Keyboard shortcuts disabled');
          } else {
            shortcuts.enable();
            logEvent('Keyboard shortcuts enabled');
          }
        }
      }
    </script>

    <div style="display: flex; flex-direction: column; height: 100vh;">
      <!-- Control Panel -->
      <div style="padding: 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
        <h3 style="margin: 0 0 12px 0;">Keyboard Shortcuts Demo</h3>

        <div style="margin-bottom: 12px;">
          <button
            onclick={toggleShortcuts}
            style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            {shortcuts?.enabled ? 'Disable' : 'Enable'} Shortcuts
          </button>
        </div>

        <div style="background: #fff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
          <strong>Available Shortcuts:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li><kbd>Ctrl+W</kbd> - Close focused pane (default)</li>
            <li><kbd>Ctrl+Tab</kbd> - Next pane (default)</li>
            <li><kbd>Ctrl+Shift+Tab</kbd> - Previous pane (default)</li>
            <li><kbd>Escape</kbd> - Cancel operation (default)</li>
            <li><kbd>Ctrl+N</kbd> - Add new pane (custom)</li>
            <li><kbd>Ctrl+Shift+C</kbd> - Close all panes (custom)</li>
          </ul>
        </div>

        <div style="background: #fff3cd; padding: 12px; border-radius: 4px; border: 1px solid #ffc107; margin-bottom: 12px;">
          <strong>Event Log:</strong>
          <div style="font-size: 13px; margin-top: 8px; max-height: 100px; overflow: auto;">
            {#if eventLog.length === 0}
              <div style="color: #666; font-style: italic;">No events yet. Try pressing some keyboard shortcuts!</div>
            {:else}
              {#each eventLog as event}
                <div style="padding: 2px 0; font-family: monospace;">{event}</div>
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <!-- BinaryWindow -->
      <div style="flex: 1; overflow: hidden;">
        <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
      </div>
    </div>
  {/snippet}
</Story>

<!-- ARIA Announcements Demo -->
<Story name="ARIA Announcements">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';
      import { createAriaAnnouncer } from '$lib/bwin/aria-announcer.js';

      let bwin: any = $state();
      let announcer: any = $state();
      let announcements = $state<string[]>([]);
      let paneCount = $state(0);

      $effect(() => {
        if (bwin) {
          // Initialize ARIA announcer
          announcer = createAriaAnnouncer({
            enabled: true,
            debounceMs: 300
          });

          // Monitor announcements for display
          const originalAnnounce = announcer.announce;
          announcer.announce = (message: string, mode?: any) => {
            announcements = [message, ...announcements].slice(0, 15);
            originalAnnounce.call(announcer, message, mode);
          };

          return () => {
            if (announcer?.destroy) {
              announcer.destroy();
            }
          };
        }
      });

      function addPane() {
        if (!bwin?.addPane) return;

        paneCount++;
        const title = `Pane ${paneCount}`;

        bwin.addPane('root', {
          position: paneCount % 2 === 0 ? 'right' : 'bottom',
          title,
          component: ChatSession,
          componentProps: { initialMessage: `Pane ${paneCount}` }
        });

        announcer?.announcePaneAdded(title);
      }

      function removePane() {
        if (!bwin?.rootSash) return;

        const leaves = bwin.rootSash.getAllLeafDescendants();
        if (leaves.length > 0) {
          const pane = leaves[leaves.length - 1];
          const title = pane.store?.title || pane.id;

          // Remove pane (would need actual removal logic)
          announcer?.announcePaneRemoved(title);
        }
      }

      function focusPane() {
        if (!bwin?.rootSash) return;

        const leaves = bwin.rootSash.getAllLeafDescendants();
        if (leaves.length > 0) {
          const pane = leaves[0];
          const title = pane.store?.title || pane.id;
          announcer?.announcePaneFocused(title);
        }
      }

      function resizePane() {
        announcer?.announcePaneResized(400, 300);
      }

      function minimizePane() {
        if (!bwin?.rootSash) return;

        const leaves = bwin.rootSash.getAllLeafDescendants();
        if (leaves.length > 0) {
          const pane = leaves[0];
          const title = pane.store?.title || pane.id;
          announcer?.announcePaneMinimized(title);
        }
      }

      function maximizePane() {
        if (!bwin?.rootSash) return;

        const leaves = bwin.rootSash.getAllLeafDescendants();
        if (leaves.length > 0) {
          const pane = leaves[0];
          const title = pane.store?.title || pane.id;
          announcer?.announcePaneMaximized(title);
        }
      }

      function toggleAnnouncer() {
        if (announcer) {
          if (announcer.enabled) {
            announcer.disable();
            announcements = ['Announcer disabled', ...announcements].slice(0, 15);
          } else {
            announcer.enable();
            announcements = ['Announcer enabled', ...announcements].slice(0, 15);
          }
        }
      }
    </script>

    <div style="display: flex; flex-direction: column; height: 100vh;">
      <!-- Control Panel -->
      <div style="padding: 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
        <h3 style="margin: 0 0 12px 0;">ARIA Announcements Demo</h3>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <button
            onclick={addPane}
            style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Add Pane
          </button>

          <button
            onclick={removePane}
            style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Remove Pane
          </button>

          <button
            onclick={focusPane}
            style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Focus Pane
          </button>

          <button
            onclick={resizePane}
            style="padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Resize Pane
          </button>

          <button
            onclick={minimizePane}
            style="padding: 8px 16px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Minimize Pane
          </button>

          <button
            onclick={maximizePane}
            style="padding: 8px 16px; background: #009688; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Maximize Pane
          </button>

          <button
            onclick={toggleAnnouncer}
            style="padding: 8px 16px; background: #607D8B; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            {announcer?.enabled ? 'Disable' : 'Enable'} Announcer
          </button>
        </div>

        <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; border: 1px solid #2196F3;">
          <strong>ARIA Announcements (Last 15):</strong>
          <div style="font-size: 13px; margin-top: 8px; max-height: 120px; overflow: auto;">
            {#if announcements.length === 0}
              <div style="color: #666; font-style: italic;">No announcements yet. Try the buttons above!</div>
            {:else}
              {#each announcements as announcement}
                <div style="padding: 4px 0; border-bottom: 1px solid #bbdefb;">
                  <span style="color: #1976d2;">📢</span> {announcement}
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <div style="background: #fff; padding: 12px; border-radius: 4px; margin-top: 12px; font-size: 13px;">
          <strong>💡 Note:</strong> Screen readers will announce these messages via ARIA live regions.
          To test properly, use a screen reader like NVDA (Windows), JAWS (Windows), or VoiceOver (macOS).
        </div>
      </div>

      <!-- BinaryWindow -->
      <div style="flex: 1; overflow: hidden;">
        <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
      </div>
    </div>
  {/snippet}
</Story>

<!-- Focus Management Demo -->
<Story name="Focus Management">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';

      let bwin: any = $state();
      let focusedPaneId = $state<string | null>(null);

      $effect(() => {
        if (bwin?.addPane) {
          setTimeout(() => {
            // Add sample panes
            bwin.addPane('root', {
              position: 'right',
              title: 'Pane 1',
              component: ChatSession,
              componentProps: { initialMessage: 'Press Tab to navigate between panes' }
            });

            setTimeout(() => {
              bwin.addPane('pane-0', {
                position: 'bottom',
                title: 'Pane 2',
                component: ChatSession,
                componentProps: { initialMessage: 'Use Ctrl+Tab to cycle focus' }
              });
            }, 200);

            setTimeout(() => {
              bwin.addPane('pane-1', {
                position: 'right',
                title: 'Pane 3',
                component: ChatSession,
                componentProps: { initialMessage: 'Shift+Tab goes backwards' }
              });
            }, 400);
          }, 200);
        }
      });
    </script>

    <div style="display: flex; flex-direction: column; height: 100vh;">
      <!-- Control Panel -->
      <div style="padding: 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
        <h3 style="margin: 0 0 12px 0;">Focus Management Demo</h3>

        <div style="background: #fff; padding: 12px; border-radius: 4px;">
          <strong>Keyboard Navigation:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li><kbd>Tab</kbd> - Move forward through focusable elements</li>
            <li><kbd>Shift+Tab</kbd> - Move backward through focusable elements</li>
            <li><kbd>Ctrl+Tab</kbd> - Next pane</li>
            <li><kbd>Ctrl+Shift+Tab</kbd> - Previous pane</li>
            <li><kbd>Enter</kbd> / <kbd>Space</kbd> - Activate button</li>
          </ul>
        </div>

        <div style="background: #e8f5e9; padding: 12px; border-radius: 4px; margin-top: 12px; border: 1px solid #4CAF50;">
          <strong>✓ WCAG 2.1 AA Compliance:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
            <li>All interactive elements are keyboard accessible</li>
            <li>Logical tab order maintained</li>
            <li>Visible focus indicators</li>
            <li>No keyboard traps</li>
          </ul>
        </div>
      </div>

      <!-- BinaryWindow -->
      <div style="flex: 1; overflow: hidden;">
        <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
      </div>
    </div>
  {/snippet}
</Story>
