<script lang="ts" context="module">
	import { defineMeta } from '@storybook/addon-svelte-csf';

	// Import all examples
	import BasicSetup from '../examples/01-basic-setup.svelte';
	import DynamicPanes from '../examples/02-dynamic-panes.svelte';
	import CustomContent from '../examples/03-custom-content.svelte';
	import DragDrop from '../examples/04-drag-drop.svelte';
	import GlassActions from '../examples/05-glass-actions.svelte';
	import ResponsiveFit from '../examples/06-responsive-fit.svelte';

	const { Story } = defineMeta({
		title: 'Examples',
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component: `
# BinaryWindow Examples

This collection of examples demonstrates the key features and capabilities of the sv-window-manager library.
Each example is self-contained and showcases a specific aspect of the window manager.

## Available Examples

1. **Basic Setup** - Simple 2-pane layout with minimal configuration
2. **Dynamic Panes** - Add and remove panes programmatically
3. **Custom Content** - Mount custom Svelte components using BwinHost
4. **Drag & Drop** - Rearrange panes by dragging headers
5. **Glass Actions** - Window controls (minimize, maximize, close)
6. **Responsive Fit** - Automatic container resizing

## Getting Started

Each example includes:
- Inline comments explaining the code
- Visual demonstrations of features
- Interactive controls where applicable
- Best practices and tips

Browse through the stories below to see each example in action.
					`
				}
			}
		}
	});
</script>

<!-- Example 1: Basic Setup -->
<Story name="BasicSetup">
	{#snippet template()}
		<div style="width: 100%; height: 100vh; display: flex; flex-direction: column;">
			<div style="padding: 20px; background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
				<h2 style="margin: 0 0 8px 0; color: #111827;">Example 1: Basic Window Setup</h2>
				<p style="margin: 0; color: #6b7280;">
					The simplest possible BinaryWindow setup with a static 2-pane layout.
					This demonstrates the fundamentals of using the window manager.
				</p>
			</div>
			<div style="flex: 1;">
				<BasicSetup />
			</div>
		</div>
	{/snippet}
</Story>

<!-- Example 2: Dynamic Panes -->
<Story name="DynamicPanes">
	{#snippet template()}
		<div style="width: 100%; height: 100vh; display: flex; flex-direction: column;">
			<div style="padding: 20px; background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
				<h2 style="margin: 0 0 8px 0; color: #111827;">Example 2: Dynamic Pane Management</h2>
				<p style="margin: 0; color: #6b7280;">
					Add and remove panes dynamically with button controls. Essential for interactive
					applications where panes are created based on user actions.
				</p>
			</div>
			<div style="flex: 1;">
				<DynamicPanes />
			</div>
		</div>
	{/snippet}
</Story>

<!-- Example 3: Custom Content -->
<Story name="CustomContent">
	{#snippet template()}
		<div style="width: 100%; height: 100vh; display: flex; flex-direction: column;">
			<div style="padding: 20px; background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
				<h2 style="margin: 0 0 8px 0; color: #111827;">Example 3: Custom Glass Content</h2>
				<p style="margin: 0; color: #6b7280;">
					Use BwinHost to mount custom Svelte components in panes. This pattern provides full
					Svelte reactivity and component composition.
				</p>
			</div>
			<div style="flex: 1;">
				<CustomContent />
			</div>
		</div>
	{/snippet}
</Story>

<!-- Example 4: Drag & Drop -->
<Story name="DragAndDrop">
	{#snippet template()}
		<div style="width: 100%; height: 100vh; display: flex; flex-direction: column;">
			<div style="padding: 20px; background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
				<h2 style="margin: 0 0 8px 0; color: #111827;">Example 4: Drag & Drop</h2>
				<p style="margin: 0; color: #6b7280;">
					Rearrange panes by dragging their headers. Built-in drag and drop functionality
					makes it easy to reorganize your layout on the fly.
				</p>
			</div>
			<div style="flex: 1;">
				<DragDrop />
			</div>
		</div>
	{/snippet}
</Story>

<!-- Example 5: Glass Actions -->
<Story name="GlassActions">
	{#snippet template()}
		<div style="width: 100%; height: 100vh; display: flex; flex-direction: column;">
			<div style="padding: 20px; background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
				<h2 style="margin: 0 0 8px 0; color: #111827;">Example 5: Glass Actions (Minimize/Maximize/Close)</h2>
				<p style="margin: 0; color: #6b7280;">
					Window management controls for each pane. Minimize to sill, maximize to full window,
					or close panes with standard action buttons.
				</p>
			</div>
			<div style="flex: 1;">
				<GlassActions />
			</div>
		</div>
	{/snippet}
</Story>

<!-- Example 6: Responsive Fit -->
<Story name="ResponsiveFit">
	{#snippet template()}
		<div style="width: 100%; height: 100vh; display: flex; flex-direction: column;">
			<div style="padding: 20px; background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
				<h2 style="margin: 0 0 8px 0; color: #111827;">Example 6: Responsive Layout (Container Fit)</h2>
				<p style="margin: 0; color: #6b7280;">
					Automatic resizing to fit parent container. Perfect for responsive applications
					that need to adapt to different screen sizes.
				</p>
			</div>
			<div style="flex: 1; overflow: auto;">
				<ResponsiveFit />
			</div>
		</div>
	{/snippet}
</Story>

<!-- All Examples Overview -->
<Story name="AllExamples">
	{#snippet template()}
		<div style="width: 100%; min-height: 100vh; padding: 40px; background: #f9fafb;">
			<div style="max-width: 1200px; margin: 0 auto;">
				<h1 style="margin: 0 0 12px 0; color: #111827;">BinaryWindow Examples Gallery</h1>
				<p style="margin: 0 0 40px 0; color: #6b7280; font-size: 18px;">
					Browse through all examples to see the full capabilities of sv-window-manager.
				</p>

				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
					<!-- Example 1 Card -->
					<div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
						<div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
							<h3 style="margin: 0 0 8px 0; color: #667eea;">01 - Basic Setup</h3>
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								Simple 2-pane layout with minimal configuration
							</p>
						</div>
						<div style="height: 250px; background: #f3f4f6;">
							<BasicSetup />
						</div>
					</div>

					<!-- Example 2 Card -->
					<div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
						<div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
							<h3 style="margin: 0 0 8px 0; color: #667eea;">02 - Dynamic Panes</h3>
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								Add and remove panes programmatically
							</p>
						</div>
						<div style="height: 250px; background: #f3f4f6;">
							<DynamicPanes />
						</div>
					</div>

					<!-- Example 3 Card -->
					<div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
						<div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
							<h3 style="margin: 0 0 8px 0; color: #667eea;">03 - Custom Content</h3>
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								Mount custom Svelte components
							</p>
						</div>
						<div style="height: 250px; background: #f3f4f6;">
							<CustomContent />
						</div>
					</div>

					<!-- Example 4 Card -->
					<div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
						<div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
							<h3 style="margin: 0 0 8px 0; color: #667eea;">04 - Drag & Drop</h3>
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								Rearrange panes by dragging headers
							</p>
						</div>
						<div style="height: 250px; background: #f3f4f6;">
							<DragDrop />
						</div>
					</div>

					<!-- Example 5 Card -->
					<div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
						<div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
							<h3 style="margin: 0 0 8px 0; color: #667eea;">05 - Glass Actions</h3>
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								Minimize, maximize, and close controls
							</p>
						</div>
						<div style="height: 250px; background: #f3f4f6;">
							<GlassActions />
						</div>
					</div>

					<!-- Example 6 Card -->
					<div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
						<div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
							<h3 style="margin: 0 0 8px 0; color: #667eea;">06 - Responsive Fit</h3>
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								Automatic container resizing
							</p>
						</div>
						<div style="height: 250px; background: #f3f4f6;">
							<ResponsiveFit />
						</div>
					</div>
				</div>

				<!-- Quick Start Guide -->
				<div style="margin-top: 60px; padding: 32px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
					<h2 style="margin: 0 0 16px 0; color: #111827;">Quick Start Guide</h2>
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
						<div>
							<h4 style="margin: 0 0 8px 0; color: #667eea;">1. Install</h4>
							<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0;"><code>npm install sv-window-manager</code></pre>
						</div>
						<div>
							<h4 style="margin: 0 0 8px 0; color: #667eea;">2. Import</h4>
							<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0;"><code>import { BinaryWindow } from 'sv-window-manager';</code></pre>
						</div>
						<div>
							<h4 style="margin: 0 0 8px 0; color: #667eea;">3. Use</h4>
							<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0;"><code>&lt;BinaryWindow {settings} /&gt;</code></pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
