<script lang="ts">
	let { sessionId, data } = $props();

	// Mock file tree
	const files = [
		{
			name: 'src',
			type: 'folder',
			expanded: true,
			children: [
				{ name: 'lib', type: 'folder', expanded: false, children: [] },
				{
					name: 'routes',
					type: 'folder',
					expanded: true,
					children: [
						{ name: '+page.svelte', type: 'file', size: '12.4 KB' },
						{ name: 'ChatSession.svelte', type: 'file', size: '3.2 KB' },
						{ name: 'TerminalSession.svelte', type: 'file', size: '2.8 KB' }
					]
				},
				{ name: 'app.css', type: 'file', size: '1.2 KB' }
			]
		},
		{
			name: 'static',
			type: 'folder',
			expanded: false,
			children: []
		},
		{ name: 'package.json', type: 'file', size: '2.1 KB' },
		{ name: 'README.md', type: 'file', size: '4.8 KB' },
		{ name: 'tsconfig.json', type: 'file', size: '856 B' }
	];

	function getFileIcon(file: { type: string; name: string }) {
		if (file.type === 'folder') return '📁';
		const ext = file.name.split('.').pop();
		switch (ext) {
			case 'svelte':
				return '🔷';
			case 'ts':
			case 'js':
				return '📜';
			case 'json':
				return '📋';
			case 'css':
				return '🎨';
			case 'md':
				return '📝';
			default:
				return '📄';
		}
	}
</script>

<div class="filebrowser-session">
	<div class="browser-header">
		<div class="breadcrumb">
			<span class="icon">📁</span>
			<span class="path">{data.rootPath || '/home/user/projects'}</span>
		</div>
		<div class="actions">
			<button class="icon-btn" title="New File">➕</button>
			<button class="icon-btn" title="Refresh">🔄</button>
		</div>
	</div>

	<div class="browser-toolbar">
		<input type="text" class="search" placeholder="Search files..." />
	</div>

	<div class="file-tree">
		{#each files as item}
			<div class="file-item" style="padding-left: 12px">
				<div class="file-content">
					<span class="expand-icon">{item.type === 'folder' ? (item.expanded ? '▼' : '▶') : ' '}</span>
					<span class="file-icon">{getFileIcon(item)}</span>
					<span class="file-name">{item.name}</span>
					{#if item.type === 'file'}
						<span class="file-size">{item.size}</span>
					{/if}
				</div>

				{#if item.type === 'folder' && item.expanded && item.children}
					{#each item.children as child}
						<div class="file-item nested" style="padding-left: 32px">
							<div class="file-content">
								<span class="expand-icon"
									>{child.type === 'folder' ? (child.expanded ? '▼' : '▶') : ' '}</span
								>
								<span class="file-icon">{getFileIcon(child)}</span>
								<span class="file-name">{child.name}</span>
								{#if child.type === 'file'}
									<span class="file-size">{child.size}</span>
								{/if}
							</div>

							{#if child.type === 'folder' && child.expanded && child.children}
								{#each child.children as grandchild}
									<div class="file-item nested" style="padding-left: 52px">
										<div class="file-content">
											<span class="expand-icon"> </span>
											<span class="file-icon">{getFileIcon(grandchild)}</span>
											<span class="file-name">{grandchild.name}</span>
											{#if grandchild.type === 'file'}
												<span class="file-size">{grandchild.size}</span>
											{/if}
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.filebrowser-session {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.browser-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}

	.breadcrumb .icon {
		font-size: 18px;
	}

	.breadcrumb .path {
		font-weight: 500;
		opacity: 0.95;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.icon-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.icon-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.browser-toolbar {
		padding: 12px 16px;
		background: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
	}

	.search {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s;
	}

	.search:focus {
		border-color: #f093fb;
	}

	.file-tree {
		flex: 1;
		overflow-y: auto;
		padding: 8px 0;
	}

	.file-item {
		user-select: none;
	}

	.file-content {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		cursor: pointer;
		transition: background 0.15s;
		font-size: 14px;
	}

	.file-content:hover {
		background: #f3f4f6;
	}

	.expand-icon {
		width: 12px;
		font-size: 10px;
		color: #6b7280;
	}

	.file-icon {
		font-size: 16px;
	}

	.file-name {
		flex: 1;
		color: #374151;
		font-weight: 500;
	}

	.file-size {
		color: #9ca3af;
		font-size: 12px;
		margin-left: auto;
	}

	.file-item.nested {
		border-left: 1px solid #e5e7eb;
		margin-left: 12px;
	}

	/* Scrollbar styling */
	.file-tree::-webkit-scrollbar {
		width: 8px;
	}

	.file-tree::-webkit-scrollbar-track {
		background: #f8f9fa;
	}

	.file-tree::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 4px;
	}

	.file-tree::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
