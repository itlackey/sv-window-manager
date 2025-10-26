<script lang="ts">
	interface TestPaneProps {
		title: string;
		position: string;
		timestamp: string;
	}

	let { title, position, timestamp }: TestPaneProps = $props();
</script>

<div class="test-pane">
	<h3>{title}</h3>
	<p>This is a dynamically added pane at position <strong>{position}</strong>.</p>
	<p class="timestamp">Added at {timestamp}</p>
</div>

<style>
	.test-pane {
		padding: 1rem;
		height: 100%;
		overflow: auto;
	}

	h3 {
		margin: 0 0 0.5rem 0;
	}

	p {
		margin: 0;
	}

	.timestamp {
		margin: 0.5rem 0 0 0;
		font-size: 0.9rem;
		color: #666;
	}

	strong {
		color: #667eea;
	}
</style>
