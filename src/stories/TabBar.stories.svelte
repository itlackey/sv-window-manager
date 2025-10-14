<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TabBar from '../lib/components/TabBar.svelte';
	import type { Tab } from '../lib/types.js';

	// Sample tab data
	const sampleTabs: Tab[] = [
		{ id: '1', name: 'Welcome', pinned: true, order: 0 },
		{ id: '2', name: 'Documentation', pinned: true, order: 1 },
		{ id: '3', name: 'Project Setup', pinned: false, order: 0 },
		{ id: '4', name: 'Component Library', pinned: false, order: 1 },
		{ id: '5', name: 'Testing Strategy', pinned: false, order: 2 },
		{ id: '6', name: 'Deployment Guide', pinned: false, order: 3 }
	];

	const manyTabs: Tab[] = [
		{ id: '1', name: 'Welcome', pinned: true, order: 0 },
		{ id: '2', name: 'Docs', pinned: true, order: 1 },
		...Array.from({ length: 20 }, (_, i) => ({
			id: `${i + 3}`,
			name: `Tab ${i + 3}`,
			pinned: false,
			order: i
		}))
	];

	const { Story } = defineMeta({
		title: 'Components/TabBar',
		component: TabBar,
		tags: ['autodocs'],
		argTypes: {
			tabs: { control: 'object' },
			activeId: { control: 'text' },
			showConfigError: { control: 'boolean' },
			aiEnabled: { control: 'boolean' }
		}
	});
</script>

<Story name="Default" args={{ tabs: sampleTabs, activeId: '3' }} />

<Story name="With Config Error" args={{ tabs: sampleTabs, activeId: '3', showConfigError: true }} />

<Story name="Many Tabs (Overflow)" args={{ tabs: manyTabs, activeId: '10' }} />

<Story name="No Pinned Tabs" args={{ tabs: sampleTabs.filter(t => !t.pinned), activeId: '3' }} />

<Story name="Only Pinned Tabs" args={{ tabs: sampleTabs.filter(t => t.pinned), activeId: '1' }} />

<Story name="AI Enabled" args={{ tabs: sampleTabs, activeId: '3', aiEnabled: true }} />
