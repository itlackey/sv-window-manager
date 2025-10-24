<script lang="ts">
	import ChatSession from './ChatSession.svelte';
	import TerminalSession from './TerminalSession.svelte';
	import FileBrowserSession from './FileBrowserSession.svelte';
	import FileEditorSession from './FileEditorSession.svelte';
	import BwinHost from '$lib/components/BwinHost.svelte';

	let bwinHostRef = $state<BwinHost | undefined>();
	let activeSection = $state('demo');
	let demoStarted = $state(false);

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

	async function fetchSessionInfo(id: string) {
		return sessionData[id] || { type: 'chat', data: { welcome: 'Default Session' } };
	}

	async function addSession(sessionId: string) {
		if (!bwinHostRef) return;

		const info = await fetchSessionInfo(sessionId);
		let Component;

		switch (info.type) {
			case 'chat':
				Component = ChatSession;
				break;
			case 'terminal':
				Component = TerminalSession;
				break;
			case 'filebrowser':
				Component = FileBrowserSession;
				break;
			case 'fileeditor':
				Component = FileEditorSession;
				break;
			default:
				Component = ChatSession;
		}

		bwinHostRef.addPane(sessionId, {}, Component, { sessionId, data: { ...info.data } });
	}

	async function startDemo() {
		demoStarted = true;
		// Wait a tick to ensure BwinHost is mounted and bound
		await new Promise(resolve => setTimeout(resolve, 50));
		// Add initial sessions to demonstrate the window manager
		await addSession('chat1');
		setTimeout(() => addSession('terminal1'), 200);
		setTimeout(() => addSession('editor1'), 400);
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
							<button onclick={() => addSession('chat1')}>Add Chat</button>
							<button onclick={() => addSession('terminal1')}>Add Terminal</button>
							<button onclick={() => addSession('files1')}>Add File Browser</button>
							<button onclick={() => addSession('editor1')}>Add Editor</button>
						</div>
					{/if}
				</div>

				<div class="demo-container">
					<BwinHost bind:this={bwinHostRef} config={{ fitContainer: true }} />
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

				<h3>1. Import the Component and Types</h3>
				<pre><code
						>&lt;script lang="ts"&gt;
  import BwinHost from 'sv-window-manager';
  import type {'{'}
    BwinConfig,
    PaneConfig,
    SessionComponentProps
  {'}'} from 'sv-window-manager';
  import YourComponent from './YourComponent.svelte';

  let bwinHost = $state&lt;BwinHost | undefined&gt;();
&lt;/script&gt;</code
					></pre>

				<h3>2. Add BwinHost to Your Page</h3>
				<pre><code
						>&lt;BwinHost
  bind:this={'{bwinHost}'}
  config={'{{'} fitContainer: true {'}}'}
/&gt;</code
					></pre>

				<h3>3. Dynamically Add Panes</h3>
				<pre><code
						>async function addPane() {'{'}
  if (!bwinHost) return;

  const paneConfig: PaneConfig = {'{'}
    position: 'right',  // 'top' | 'right' | 'bottom' | 'left'
  {'}'};

  const componentProps: SessionComponentProps = {'{'}
    sessionId: 'session-1',
    data: {'{'}
      title: 'My Pane'
    {'}'}
  {'}'};

  // Add a pane with your component
  bwinHost.addPane(
    'unique-pane-id',     // Unique identifier for the pane
    paneConfig,           // Pane configuration
    YourComponent,        // Svelte component to render
    componentProps        // Props to pass to the component
  );
{'}'}</code
					></pre>

				<h3>Complete Example</h3>
				<pre><code
						>&lt;script lang="ts"&gt;
  import BwinHost from 'sv-window-manager';
  import type {'{'}
    BwinConfig,
    PaneConfig,
    SessionComponentProps
  {'}'} from 'sv-window-manager';
  import ChatComponent from './ChatComponent.svelte';

  let bwinHost = $state&lt;BwinHost | undefined&gt;();

  const config: BwinConfig = {'{'}
    fitContainer: true
  {'}'};

  function addChatSession(id: string, title: string) {'{'}
    if (!bwinHost) return;

    const paneConfig: PaneConfig = {'{'}
      position: 'right'
    {'}'};

    const props: SessionComponentProps = {'{'}
      sessionId: id,
      data: {'{'}
        title,
        timestamp: new Date()
      {'}'}
    {'}'};

    bwinHost.addPane(id, paneConfig, ChatComponent, props);
  {'}'}
&lt;/script&gt;

&lt;BwinHost bind:this={'{bwinHost}'} {'{config}'} /&gt;

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
								<td><code>config</code></td>
								<td><code>BwinConfig</code></td>
								<td>Configuration for bwin.js (e.g., <code>{'{'}fitContainer: true{'}'}</code>)</td>
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
										>addPane(sessionId: string, paneConfig: PaneConfig, Component:
										Component&lt;any&gt;, componentProps?: Record&lt;string, any&gt;): void</code
									>
								</td>
								<td
									>Add a new pane with a Svelte component. The component will be mounted and
									rendered within the pane.</td
								>
							</tr>
							<tr>
								<td><code>getInfo</code></td>
								<td><code>getInfo(): any</code></td>
								<td
									>Get information about the current window manager state (returns root sash node)</td
								>
							</tr>
						</tbody>
					</table>
				</div>

				<h3>TypeScript Interfaces</h3>
				<div class="info-box">
					<p>The library provides comprehensive TypeScript types for type-safe integration:</p>
				</div>

				<h4>BwinConfig</h4>
				<pre><code
						>interface BwinConfig {'{'}
  /** Whether the window manager should fit its container */
  fitContainer?: boolean;
  /** Additional bwin.js configuration options */
  [key: string]: any;
{'}'}</code
					></pre>

				<h4>PaneConfig</h4>
				<pre><code
						>interface PaneConfig {'{'}
  /** Position where the pane should be added relative to the target node */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** The content element to display in the pane */
  content?: HTMLElement;
  /** Additional pane configuration options */
  [key: string]: any;
{'}'}</code
					></pre>

				<h4>SessionComponentProps</h4>
				<pre><code
						>interface SessionComponentProps {'{'}
  /** Unique identifier for the session */
  sessionId: string;
  /** Additional data for the session component */
  data?: Record&lt;string, any&gt;;
  /** Additional props */
  [key: string]: any;
{'}'}</code
					></pre>
			</section>
		{/if}

		{#if activeSection === 'styling'}
			<section class="section">
				<h2>Styling</h2>

				<p>Customize the appearance using CSS custom properties:</p>

				<h3>Available CSS Variables</h3>
				<pre><code
						>:root {'{'}
  /* Colors */
  --bw-drop-area-bg-color: hsla(226, 50%, 75%, 0.6);
  --bw-pane-bg-color: hsla(0, 0%, 20%, 1);
  --bw-muntin-bg-color: hsla(226, 80%, 27%, 0.9);
  --bw-glass-bg-color: hsla(0, 0%, 95%, 1);
  --bw-glass-border-color: hsla(226, 80%, 27%, 0.9);
  --bw-glass-header-bg-color: hsla(226, 80%, 27%, 0.6);
  --bw-glass-tab-hover-bg: hsla(226, 50%, 75%, 0.6);

  /* Sizing & Spacing */
  --bw-container-width: stretch;
  --bw-container-height: 100vh;
  --bw-glass-clearance: 2px;
  --bw-glass-border-radius: 5px;
  --bw-glass-header-height: 30px;
  --bw-glass-header-gap: 4px;
  --bw-sill-gap: 6px;

  /* Typography */
  --bw-font-family: inherit;
  --bw-font-size: inherit;
{'}'}</code
					></pre>

				<h3>Example: Dark Theme</h3>
				<pre><code
						>:root {'{'}
  --bw-glass-bg-color: #1e1e1e;
  --bw-glass-border-color: #3a3a3a;
  --bw-glass-header-bg-color: #252526;
  --bw-muntin-bg-color: #2d2d30;
  --bw-pane-bg-color: #1e1e1e;
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
		overflow: hidden;
		margin: 2rem 0;
		background: var(--bg-color);
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
