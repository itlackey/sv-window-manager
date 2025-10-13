<script lang="ts">
	// Simple example panel content to validate container integration
	const { title = 'Example Panel' } = $props<{ title?: string }>();
</script>

<section aria-label="Example panel" class="example-panel">
	<h2 class="sr-only">Side Panel</h2>
	<div class="panel-body" data-testid="example-panel-body">
		{title}
	</div>
</section>

<style>
	.example-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}
	.panel-body {
		flex: 1 1 auto;
		overflow: auto;
		padding: 0.5rem;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap; /* added line */
		border: 0;
	}
</style>
