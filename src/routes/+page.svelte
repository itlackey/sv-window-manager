<script lang="ts">
	import ChatSession from './components/ChatSession.svelte';
	import TerminalSession from './components/TerminalSession.svelte';
	import FileBrowserSession from './components/FileBrowserSession.svelte';
	import FileEditorSession from './components/FileEditorSession.svelte';
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import type { Component } from 'svelte';

	let bwinRef = $state<BinaryWindow | undefined>();
	let activeSection = $state('demo');
	let demoStarted = $state(false);
	let sessionCounter = $state(0);

	// Mock API data for sessions (sessionId -> {type, data})
	const sessionData: Record<string, { type: string; data: Record<string, any> }> = {
		chat1: { type: 'chat', data: { welcome: 'Welcome to Chat Session!' } },
		terminal1: { type: 'terminal', data: { initCommand: "echo 'Terminal Ready'" } },
		files1: { type: 'filebrowser', data: { rootPath: '/home/user/projects' } },
		editor1: {
			type: 'fileeditor',
			data: { filename: 'README.md', content: '# Welcome\n\nStart editing...' }
		}
	};

	async function fetchSessionInfo(sessionType: string) {
		// Map session type to mock data
		const mockDataMap: Record<string, { type: string; data: Record<string, any> }> = {
			chat: { type: 'chat', data: { welcome: 'Welcome to Chat Session!' } },
			terminal: { type: 'terminal', data: { initCommand: "echo 'Terminal Ready'" } },
			filebrowser: { type: 'filebrowser', data: { rootPath: '/home/user/projects' } },
			fileeditor: {
				type: 'fileeditor',
				data: { filename: 'README.md', content: '# Welcome\n\nStart editing...' }
			}
		};
		return mockDataMap[sessionType] || { type: 'chat', data: { welcome: 'Default Session' } };
	}

	async function addSession(sessionType: string) {
		console.log('[addSession] Called with sessionType:', sessionType);
		if (!bwinRef) {
			console.warn('[addSession] BinaryWindow not initialized');
			return;
		}

		try {
			// Generate unique session ID
			sessionCounter++;
			const sessionId = `${sessionType}${sessionCounter}`;
			console.log('[addSession] Session ID:', sessionId);

			const info = await fetchSessionInfo(sessionType);
			console.log('[addSession] Session info:', info);

			// Component mapping - type-safe and extensible
			const componentMap: Record<string, Component<any>> = {
				chat: ChatSession,
				terminal: TerminalSession,
				filebrowser: FileBrowserSession,
				fileeditor: FileEditorSession
			};

			const component = componentMap[info.type] || ChatSession;
			console.log('[addSession] Component:', component);

			// Get the root sash to start traversal
			const rootSash = bwinRef.getRootSash();
			console.log('[addSession] Root sash:', rootSash);
			if (!rootSash) {
				console.warn('[addSession] Root sash not found');
				return;
			}

			// Find a LEAF pane (a sash with no children) using getAllLeafDescendants
			// This is more reliable than manual traversal and guaranteed to find a leaf
			const leafNodes = rootSash.getAllLeafDescendants();
			console.log('[addSession] Leaf nodes:', leafNodes);
			if (leafNodes.length === 0) {
				console.error('[addSession] No leaf nodes found in tree');
				return;
			}

			// Use the last leaf node (typically the rightmost/bottommost pane)
			const targetSash = leafNodes[leafNodes.length - 1];
			console.log('[addSession] Target sash:', targetSash);

			// Add the pane with the component
			console.log('[addSession] Calling addPane with:', {
				id: sessionId,
				position: 'right',
				component,
				title: `${info.type.charAt(0).toUpperCase() + info.type.slice(1)} - ${sessionId}`
			});
			bwinRef.addPane(targetSash.id, {
				id: sessionId,
				position: 'right',
				component,
				componentProps: {
					sessionId,
					data: { ...info.data }
				},
				title: `${info.type.charAt(0).toUpperCase() + info.type.slice(1)} - ${sessionId}`
			});
			console.log('[addSession] addPane completed');
		} catch (error) {
			console.error('[addSession] Failed to add session:', error);
			// In production, you might want to show a user-visible error message
		}
	}

	async function startDemo() {
		console.log('[startDemo] Starting demo...');
		demoStarted = true;
		// Wait a tick to ensure BinaryWindow is mounted and bound
		await new Promise((resolve) => setTimeout(resolve, 50));
		console.log('[startDemo] BinaryWindow should be ready, adding sessions...');
		// Add initial sessions to demonstrate the window manager
		await addSession('chat');
		setTimeout(() => addSession('terminal'), 200);
		setTimeout(() => addSession('fileeditor'), 400);
	}

	function addChatSession() {
		addSession('chat');
	}

	function addTerminalSession() {
		addSession('terminal');
	}

	function addFileBrowserSession() {
		addSession('filebrowser');
	}

	function addEditorSession() {
		addSession('fileeditor');
	}

	function resetDemo() {
		// Reload the page to reset
		window.location.reload();
	}
</script>

<svelte:head>
	<title>SV BWIN - Window Manager Component Library</title>
	<meta
		name="description"
		content="A Svelte 5 component library providing tiling window management for web applications"
	/>
</svelte:head>

<div class="page-container">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1>SV BWIN</h1>
			<p class="subtitle">Tiling Window Manager for Svelte 5</p>
			<p class="description">
				A modern Svelte 5 component library that wraps bwin.js to provide powerful tiling window
				management in your web applications. Create dynamic, resizable layouts with ease using
				familiar Svelte components syntax and a simple API.
			</p>
			<div class="hero-actions">
				<button class="btn-primary" onclick={() => (activeSection = 'demo')}> Try the Demo </button>
				<button class="btn-secondary" onclick={() => (activeSection = 'usage')}>
					Get Started
				</button>
			</div>
		</div>
	</section>

	<!-- Navigation -->
	<nav class="nav-tabs">
		<button class={{ active: activeSection === 'demo' }} onclick={() => (activeSection = 'demo')}>
			Live Demo
		</button>
		<button class={{ active: activeSection === 'usage' }} onclick={() => (activeSection = 'usage')}>
			Installation & Usage
		</button>
		<button
			class={{ active: activeSection === 'styling' }}
			onclick={() => (activeSection = 'styling')}
		>
			Styling
		</button>
	</nav>

	<!-- Content Sections -->
	<main class="main-content">
		{#if activeSection === 'demo'}
			<section class="section">
				<h2>Interactive Demo</h2>
				<p>Experience the window manager in action. Click "Start Demo" to load sample sessions.</p>

				<div class="demo-controls">
					{#if !demoStarted}
						<button class="btn-primary" onclick={startDemo}>Start Demo</button>
					{:else}
						<button class="btn-secondary" onclick={resetDemo}>Reset Demo</button>
						<div class="demo-actions">
							<button onclick={addChatSession}>Add Chat</button>
							<button onclick={addTerminalSession}>Add Terminal</button>
							<button onclick={addFileBrowserSession}>Add File Browser</button>
							<button onclick={addEditorSession}>Add Editor</button>
						</div>
					{/if}
				</div>

				<div class="demo-container">
					<BinaryWindow
						bind:this={bwinRef}
						settings={{ width: 900, height: 500, fitContainer: true, debug: false }}
					/>
				</div>

				<div class="demo-instructions">
					<h3>Try these interactions:</h3>
					<ul>
						<li>Drag window headers to reposition panes</li>
						<li>Resize panes by dragging the dividers (muntins)</li>
						<li>Close windows using the × button</li>
						<li>Add multiple sessions and arrange them as you like</li>
					</ul>
				</div>
			</section>
		{/if}

		{#if activeSection === 'usage'}
			<section class="section">
				<h2>Installation & Usage</h2>

				<h3>Installation</h3>
				<pre><code>npm install sv-window-manager</code></pre>

				<div class="info-box">
					<strong>Requirements:</strong>
					<ul>
						<li>Svelte 5 or later</li>
						<li>SvelteKit (recommended) or Vite</li>
					</ul>
				</div>

				<h3>1. Import the Component</h3>
				<pre><code
						>&lt;script lang="ts"&gt;
  import BinaryWindow from 'sv-window-manager';
  import YourComponent from './YourComponent.svelte';
  import type {'{'} Component {'}'} from 'svelte';

  let bwin = $state&lt;BinaryWindow | undefined&gt;();
&lt;/script&gt;</code
					></pre>

				<h3>2. Add BinaryWindow to Your Page</h3>
				<pre><code
						>&lt;BinaryWindow
  bind:this={'{bwin}'}
  settings={'{{'} fitContainer: true {'}}'}
/&gt;</code
					></pre>

				<h3>3. Dynamically Add Panes</h3>
				<pre><code
						>async function addPane() {'{'}
  if (!bwin) return;

  // Get the root sash to add panes relative to
  const rootSash = bwin.getRootSash();
  if (!rootSash) return;

  // Add a pane with your component
  bwin.addPane(rootSash.id, {'{'}
    id: 'unique-pane-id',      // Custom pane ID
    position: 'right',          // 'top' | 'right' | 'bottom' | 'left'
    component: YourComponent,   // Svelte component to render
    componentProps: {'{'}          // Props passed to component
      sessionId: 'session-1',
      data: {'{'} title: 'My Pane' {'}'}
    {'}'},
    title: 'My Pane Title'      // Glass header title
  {'}'});
{'}'}</code
					></pre>

				<h3>Complete Example</h3>
				<pre><code
						>&lt;script lang="ts"&gt;
  import BinaryWindow from 'sv-window-manager';
  import ChatComponent from './ChatComponent.svelte';
  import type {'{'} Component {'}'} from 'svelte';

  let bwin = $state&lt;BinaryWindow | undefined&gt;();

  function addChatSession(id: string, title: string) {'{'}
    if (!bwin) return;

    const rootSash = bwin.getRootSash();
    if (!rootSash) return;

    // Find a leaf pane (a sash with no children) using getAllLeafDescendants
    // This is more reliable than manual traversal
    const leafNodes = rootSash.getAllLeafDescendants();
    if (leafNodes.length === 0) return;

    // Use the last leaf node (typically the rightmost/bottommost pane)
    const targetSash = leafNodes[leafNodes.length - 1];

    bwin.addPane(targetSash.id, {'{'}
      id,
      position: 'right',
      component: ChatComponent,
      componentProps: {'{'}
        sessionId: id,
        data: {'{'} title, timestamp: new Date() {'}'}
      {'}'},
      title
    {'}'});
  {'}'}
&lt;/script&gt;

&lt;BinaryWindow bind:this={'{bwin}'} settings={'{{'} fitContainer: true {'}}'}  /&gt;

&lt;button onclick={'{() => addChatSession("chat-1", "Chat Session")}'}&gt;
  Add Chat
&lt;/button&gt;</code
					></pre>

				<h3>Component Props</h3>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Prop</th>
								<th>Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>settings</code></td>
								<td><code>SashConfig | ConfigRoot | Record&lt;string, unknown&gt;</code></td>
								<td
									>Configuration object for the window manager. Can include properties like <code
										>width</code
									>, <code>height</code>, <code>fitContainer</code>, <code>debug</code>, and other
									layout options.</td
								>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Common Settings Properties</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Property</th>
								<th>Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>width</code></td>
								<td><code>number</code></td>
								<td>Width of the window container in pixels</td>
							</tr>
							<tr>
								<td><code>height</code></td>
								<td><code>number</code></td>
								<td>Height of the window container in pixels</td>
							</tr>
							<tr>
								<td><code>fitContainer</code></td>
								<td><code>boolean</code></td>
								<td>Automatically resize to fit parent container (default: true)</td>
							</tr>
							<tr>
								<td><code>debug</code></td>
								<td><code>boolean</code></td>
								<td>Enable debug logging to console (default: false)</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3>Methods</h3>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Method</th>
								<th>Signature</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>addPane</code></td>
								<td>
									<code
										>addPane(targetPaneSashId: string, props: Record&lt;string, unknown&gt;): Sash</code
									>
								</td>
								<td
									>Add a new pane relative to a target pane. Props include position, size, id,
									component (required), componentProps, title, actions, draggable, and other Glass
									properties.</td
								>
							</tr>
							<tr>
								<td><code>removePane</code></td>
								<td><code>removePane(sashId: string): void</code></td>
								<td>Remove a pane by its sash ID</td>
							</tr>
							<tr>
								<td><code>getRootSash</code></td>
								<td><code>getRootSash(): Sash | undefined</code></td>
								<td>Get the root sash of the layout tree</td>
							</tr>
							<tr>
								<td><code>fit</code></td>
								<td><code>fit(): void</code></td>
								<td>Reflow the window layout to fit current container dimensions</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3>TypeScript Support</h3>
				<div class="info-box">
					<p>BinaryWindow is fully typed with TypeScript for type-safe development.</p>
				</div>

				<h4>AddPane Props Interface</h4>
				<pre><code
						>// Props accepted by the addPane method
interface AddPaneProps {'{'}
  // Required (unless replacing a placeholder pane)
  position: 'top' | 'right' | 'bottom' | 'left';

  // Optional - Pane configuration
  id?: string;                  // Custom pane ID
  size?: string | number;       // Pane size (px, %, or ratio)

  // Required - Svelte component integration
  component: Component;         // Svelte component to mount (required)
  componentProps?: Record&lt;string, any&gt;;  // Props for component

  // Optional - Glass properties
  title?: string | HTMLElement | Snippet; // Header title
  actions?: GlassAction[] | boolean;      // Action buttons or false to hide
  draggable?: boolean;                     // Enable drag-and-drop (default: true)

  // Additional Glass props can be passed as needed
  [key: string]: any;
{'}'}</code
					></pre>
			</section>
		{/if}

		{#if activeSection === 'styling'}
			<section class="section">
				<h2>Styling</h2>

				<p>
					Customize the appearance using CSS custom properties. All variables are prefixed with <code
						>--bw-</code
					> to avoid naming conflicts.
				</p>

				<h3>Available CSS Variables</h3>

				<h4>Typography</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-font-family</code></td>
								<td><code>system-ui</code></td>
								<td>Font family for all window manager text</td>
							</tr>
							<tr>
								<td><code>--bw-font-size</code></td>
								<td><code>14px</code></td>
								<td>Base font size for window manager components</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Accent & Colors</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-accent-color</code></td>
								<td><code>hsl(210, 100%, 50%)</code></td>
								<td>Primary accent color used for focus states and hover highlights</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Pane & Background</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-pane-bg-color</code></td>
								<td><code>hsl(0, 0%, 95%)</code></td>
								<td>Background color for panes (visible when glass is transparent or absent)</td>
							</tr>
							<tr>
								<td><code>--bw-drop-area-bg-color</code></td>
								<td><code>color-mix(in srgb, black 5%, transparent)</code></td>
								<td>Background color for drop target areas during drag operations</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Glass (Window) Styling</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-glass-bg-color</code></td>
								<td><code>white</code></td>
								<td>Background color for glass (window) content area</td>
							</tr>
							<tr>
								<td><code>--bw-glass-bg-color-disabled</code></td>
								<td><code>hsl(0, 0%, 97%)</code></td>
								<td>Background color for disabled glass elements</td>
							</tr>
							<tr>
								<td><code>--bw-glass-border-color</code></td>
								<td><code>hsl(0, 0%, 10%)</code></td>
								<td>Border color for glass windows</td>
							</tr>
							<tr>
								<td><code>--bw-glass-border-color-disabled</code></td>
								<td><code>hsl(0, 0%, 80%)</code></td>
								<td>Border color for disabled glass elements</td>
							</tr>
							<tr>
								<td><code>--bw-glass-border-radius</code></td>
								<td><code>2px</code></td>
								<td>Border radius for glass windows</td>
							</tr>
							<tr>
								<td><code>--bw-glass-clearance</code></td>
								<td><code>2px</code></td>
								<td>Spacing between glass windows and pane edges</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Glass Header</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-glass-header-height</code></td>
								<td><code>30px</code></td>
								<td>Height of glass window headers</td>
							</tr>
							<tr>
								<td><code>--bw-glass-header-gap</code></td>
								<td><code>4px</code></td>
								<td>Gap between header elements (title, actions)</td>
							</tr>
							<tr>
								<td><code>--bw-glass-header-bg-color</code></td>
								<td><code>hsl(0, 0%, 97%)</code></td>
								<td>Background color for glass window headers</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Glass Actions (Buttons)</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-action-gap</code></td>
								<td><code>2px</code></td>
								<td>Gap between action buttons in glass header</td>
							</tr>
							<tr>
								<td><code>--bw-glass-action-bg-color</code></td>
								<td><code>transparent</code></td>
								<td>Background color for glass action buttons</td>
							</tr>
							<tr>
								<td><code>--bw-glass-action-hover-bg</code></td>
								<td><code>transparent</code></td>
								<td>Background color for glass action buttons on hover</td>
							</tr>
							<tr>
								<td><code>--bw-glass-action-hover-color</code></td>
								<td><code>var(--bw-accent-color)</code></td>
								<td>Text color for glass action buttons on hover</td>
							</tr>
							<tr>
								<td><code>--bw-glass-action-border</code></td>
								<td><code>none</code></td>
								<td>Border style for glass action buttons</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Muntin (Dividers/Splitters)</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-muntin-bg-color</code></td>
								<td><code>hsl(0, 0%, 80%)</code></td>
								<td>Background color for muntins (dividers between panes)</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h4>Sill (Taskbar for Minimized Windows)</h4>
				<div class="props-table">
					<table>
						<thead>
							<tr>
								<th>Variable</th>
								<th>Default Value</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>--bw-sill-height</code></td>
								<td><code>32px</code></td>
								<td>Height of the sill (taskbar) for minimized windows</td>
							</tr>
							<tr>
								<td><code>--bw-sill-gap</code></td>
								<td><code>8px</code></td>
								<td>Gap between minimized window buttons in sill</td>
							</tr>
							<tr>
								<td><code>--bw-sill-padding</code></td>
								<td><code>4px 8px</code></td>
								<td>Padding inside the sill container</td>
							</tr>
							<tr>
								<td><code>--bw-sill-bg-color</code></td>
								<td><code>rgba(0, 0, 0, 0.05)</code></td>
								<td>Background color for the sill</td>
							</tr>
							<tr>
								<td><code>--bw-sill-border-color</code></td>
								<td><code>hsl(0, 0%, 80%)</code></td>
								<td>Border color for the sill</td>
							</tr>
							<tr>
								<td><code>--bw-minimized-glass-height</code></td>
								<td><code>10px</code></td>
								<td>Height of minimized glass buttons in the sill</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3>Example: Dark Theme</h3>
				<pre><code
						>:root {'{'}
  /* Override key colors for dark theme */
  --bw-pane-bg-color: #1e1e1e;
  --bw-glass-bg-color: #252526;
  --bw-glass-border-color: #3a3a3a;
  --bw-glass-header-bg-color: #2d2d30;
  --bw-muntin-bg-color: #3a3a3a;
  --bw-sill-bg-color: rgba(255, 255, 255, 0.05);
  --bw-accent-color: #0078d4;
{'}'}</code
					></pre>

				<h3>Example: Custom Accent Color</h3>
				<pre><code
						>:root {'{'}
  /* Purple accent theme */
  --bw-accent-color: #7c3aed;
  --bw-glass-action-hover-color: #7c3aed;
{'}'}</code
					></pre>
			</section>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="footer">
		<p>
			Built with Svelte 5 |
			<a href="https://bhjsdev.github.io/bwin-docs/" target="_blank" rel="noopener noreferrer">
				bwin.js Documentation
			</a>
			|
			<a
				href="https://github.com/itlackey/sv-window-manager"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</a>
		</p>
	</footer>
</div>

<style>
	:root {
		/* Base Colors */
		--accent-color-base: #0461ad;
		/* --accent-color-base: #667eea; */
		/* Accent Color Variations - derived using color-mix */
		--accent-color: color-mix(in srgb, var(--accent-color-base) 60%, transparent);
		--accent-color-strong: color-mix(in srgb, var(--accent-color-base) 90%, black 30%);
		--accent-color-light: color-mix(in srgb, var(--accent-color-base) 60%, white 40%);
		--accent-gradient-end: color-mix(in srgb, var(--accent-color-base) 70%, #c44569 30%);

		/* Background Colors */
		--bg-color: #f8f9fa;
		--bg-color-dark: color-mix(in srgb, black 80%, white);
		--bg-white: white;

		/* Border Colors */
		--border-color: #dee2e6;
		--border-color-light: #e9ecef;

		/* Text Colors */
		--text-dark: #212529;
		--text-medium: #495057;
		--text-muted: #6c757d;

		/* Info Box Colors - derived from accent */
		--info-bg: color-mix(in srgb, var(--accent-color-base) 8%, white);
		--info-border: color-mix(in srgb, var(--accent-color-base) 40%, white);
		--info-text: color-mix(in srgb, var(--accent-color-base) 50%, black 60%);

		/** bwin properties*/

		/* Typography */
		--bw-font-family: inherit;
		--bw-font-size: inherit;

		/* Window Manager Colors - using derived accent colors */
		--bw-drop-area-bg-color: var(--accent-color-light);
		--bw-pane-bg-color: var(--bg-color-dark);
		--bw-muntin-bg-color: var(--accent-color-strong);
		--bw-glass-bg-color: var(--bg-color);
		--bw-glass-border-color: var(--accent-color);
		--bw-glass-border-color-disabled: var(--disabled-color);
		--bw-glass-bg-color-disabled: var(--accent-color-light);
		--bw-glass-header-bg-color: var(--accent-color);
		--bw-glass-tab-hover-bg: var(--accent-color-light);
		--bw-glass-action-hover-bg: var(--accent-color-light);
		--bw-minimized-glass-hover-bg: var(--accent-color-light);

		/* Sizing & Spacing */
		--bw-container-width: stretch;
		--bw-container-height: 500px;
		--bw-glass-clearance: 2px;
		--bw-glass-border-radius: 5px;
		--bw-glass-header-height: 30px;
		--bw-glass-header-gap: 4px;
		--bw-sill-gap: 6px;
		--bw-action-gap: 2px;
		--bw-minimized-glass-height: 10px;
		--bw-minimized-glass-basis: 10%;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(
			135deg,
			var(--accent-color-base) 0%,
			var(--accent-gradient-end) 100%
		);
		min-height: 100vh;
	}

	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		background: var(--bg-white);
		min-height: 100vh;
		box-shadow: 0 0 50px color-mix(in srgb, black 10%, transparent);
	}

	/* Hero Section */
	.hero {
		background: linear-gradient(
			135deg,
			var(--accent-color-base) 0%,
			var(--accent-gradient-end) 100%
		);
		color: var(--bg-white);
		padding: 4rem 2rem;
		text-align: center;
	}

	.hero-content h1 {
		font-size: 3.5rem;
		margin: 0 0 1rem 0;
		font-weight: 700;
	}

	.subtitle {
		font-size: 1.5rem;
		margin: 0 0 1.5rem 0;
		opacity: 0.9;
	}

	.description {
		font-size: 1.1rem;
		max-width: 700px;
		margin: 0 auto 2rem auto;
		line-height: 1.6;
		opacity: 0.95;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Buttons */
	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.btn-primary {
		background: var(--bg-white);
		color: var(--accent-color-base);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px color-mix(in srgb, black 20%, transparent);
	}

	.btn-secondary {
		background: color-mix(in srgb, var(--bg-white) 20%, transparent);
		color: var(--bg-white);
		border: 2px solid var(--bg-white);
	}

	.btn-secondary:hover {
		background: color-mix(in srgb, var(--bg-white) 30%, transparent);
	}

	/* Navigation */
	.nav-tabs {
		display: flex;
		background: var(--bg-color);
		border-bottom: 2px solid var(--border-color-light);

		overflow-x: auto;
	}

	.nav-tabs button {
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		padding: 1rem 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		color: var(--text-medium);
		font-weight: 500;
		white-space: nowrap;
	}

	.nav-tabs button:hover {
		background: var(--border-color-light);
		color: var(--accent-color-base);
	}

	.nav-tabs button.active {
		color: var(--accent-color-base);
		border-bottom-color: var(--accent-color-base);
		background: var(--bg-white);
	}

	/* Main Content */
	.main-content {
		padding: 2rem;
	}

	.section {
		max-width: 900px;
		margin: 0 auto;
	}

	.section h2 {
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
		color: var(--text-dark);
	}

	.section h3 {
		font-size: 1.5rem;
		margin: 2rem 0 1rem 0;
		color: var(--text-medium);
	}

	.section p {
		line-height: 1.8;
		color: var(--text-medium);
		margin-bottom: 1.5rem;
	}

	/* Code blocks */
	pre {
		background: var(--bg-color);
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
		border: 1px solid var(--border-color);
		margin: 1rem 0;
	}

	code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9rem;
		color: var(--text-dark);
	}

	:not(pre) > code {
		background: var(--bg-color);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		border: 1px solid var(--border-color);
	}

	/* Demo Section */
	.demo-controls {
		margin: 2rem 0;
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.demo-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.demo-actions button {
		background: var(--border-color-light);
		color: var(--text-medium);
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}

	.demo-actions button:hover {
		background: var(--accent-color-base);
		color: var(--bg-white);
	}

	.demo-container {
		width: 100%;
		height: 500px;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		overflow: visible;
		margin: 2rem 0 3rem 0; /* Extra bottom margin for sill */
		background: var(--bg-color);
		padding-bottom: 48px; /* Space for sill below window */
	}

	.demo-instructions {
		background: var(--bg-color);
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid var(--accent-color-base);
	}

	.demo-instructions h3 {
		margin-top: 0;
		color: var(--accent-color-base);
	}

	.demo-instructions ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.demo-instructions li {
		margin: 0.5rem 0;
		line-height: 1.6;
		color: var(--text-medium);
	}

	/* Info Box */
	.info-box {
		background: var(--info-bg);
		border: 1px solid var(--info-border);
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1.5rem 0;
	}

	.info-box strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--info-text);
	}

	.info-box ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.info-box li {
		margin: 0.25rem 0;
		color: var(--info-text);
	}

	/* Tables */
	.props-table {
		overflow-x: auto;
		margin: 1.5rem 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--bg-white);
		border: 1px solid var(--border-color);
	}

	th,
	td {
		text-align: left;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-color);
	}

	th {
		background: var(--bg-color);
		font-weight: 600;
		color: var(--text-medium);
	}

	td {
		color: var(--text-medium);
	}

	tr:hover {
		background: var(--bg-color);
	}

	/* Footer */
	.footer {
		background: var(--bg-color);
		padding: 2rem;
		text-align: center;
		border-top: 1px solid var(--border-color);
		color: var(--text-muted);
	}

	.footer a {
		color: var(--accent-color-base);
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2.5rem;
		}

		.subtitle {
			font-size: 1.2rem;
		}

		.section h2 {
			font-size: 2rem;
		}

		.main-content {
			padding: 1rem;
		}

		.demo-container {
			height: 400px;
		}
	}
</style>
