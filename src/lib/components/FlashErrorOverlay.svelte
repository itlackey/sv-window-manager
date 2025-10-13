<script lang="ts">
	// Flash Error Overlay
	// Purpose: transient, non-blocking error surface shown above the shell.
	// Shows only the latest message. Supports click-to-copy and auto-expire per item.
	// Notes:
	// - Timers are managed in a plain record for reactivity (avoid mutating Maps in place).
	// - We dispatch both a Svelte event and a DOM CustomEvent for host/test integration.
	import { createEventDispatcher } from 'svelte';
	import type { FlashItem } from '../types.js';

	interface Props {
		items?: FlashItem[];
	}

	const { items = [] }: Props = $props();
	const dispatch = createEventDispatcher<{ dismiss: { id: string } }>();
	// DOM ref used only for event dispatch; declared as $state for Svelte 5 bind:this
	let rootEl = $state<HTMLDivElement | null>(null);

	// Track timers per id to auto-dismiss (reactive record avoids direct Map mutations)
	let timers: Record<string, ReturnType<typeof setTimeout>> = {};

	function scheduleTimers(list: FlashItem[]) {
		// clear old timers for items not present
		let next: Record<string, ReturnType<typeof setTimeout>> = { ...timers };
		for (const id of Object.keys(timers)) {
			if (!list.find((i) => i.id === id)) {
				clearTimeout(timers[id]);
				delete next[id];
			}
		}
		// schedule new timers for incoming items
		for (const it of list) {
			if (it.expiresInMs && !next[it.id]) {
				const t = setTimeout(() => {
					const n = { ...next };
					delete n[it.id];
					next = n;
					timers = n;
					dispatch('dismiss', { id: it.id });
					// Mirror as a DOM event so non-Svelte hosts/tests can listen consistently
					try {
						rootEl?.dispatchEvent?.(
							new CustomEvent('dismiss', { detail: { id: it.id }, bubbles: true })
						);
					} catch {
						/* no-op: DOM not available */
					}
				}, it.expiresInMs);
				next = { ...next, [it.id]: t };
			}
		}
		timers = next;
	}

	$effect(() => {
		scheduleTimers(items);
	});

	async function copy(msg: string) {
		// Clipboard access is optional and may be blocked; we silently ignore failures.
		try {
			await navigator.clipboard?.writeText?.(msg);
		} catch {
			// ignore in environments without clipboard
		}
	}

	function close(id: string) {
		// Manual dismissal clears the timer (if any) and emits both Svelte and DOM events.
		const tmr = timers[id];
		if (tmr) clearTimeout(tmr);
		const n = { ...timers };
		delete n[id];
		timers = n;
		dispatch('dismiss', { id });
		try {
			rootEl?.dispatchEvent?.(new CustomEvent('dismiss', { detail: { id }, bubbles: true }));
		} catch {
			/* no-op: DOM not available */
		}
	}

	const current = $derived(items[items.length - 1]);
</script>

{#if current}
	<div class="overlay" bind:this={rootEl} role="dialog" aria-live="polite" aria-label="Flash error">
		<div class="card" role="document">
			<div class="content">{current.message}</div>
			<div class="actions">
				<button
					type="button"
					class="btn"
					aria-label="Copy error"
					onclick={() => copy(current.message)}>Copy</button
				>
				<button type="button" class="btn" aria-label="Dismiss" onclick={() => close(current.id)}
					>Close</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: start center;
		padding-top: 2rem;
		background: color-mix(in oklab, black 30%, transparent);
		z-index: 2000;
	}
	.card {
		background: #1e1e1e;
		color: white;
		border: 1px solid color-mix(in oklab, white 15%, transparent);
		border-radius: 8px;
		padding: 12px;
		min-width: 280px;
		max-width: min(90vw, 720px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
	}
	.content {
		white-space: pre-wrap;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
		justify-content: end;
	}
	.btn {
		font: inherit;
		padding: 6px 10px;
		border-radius: 6px;
	}
	.btn:focus {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.overlay {
			transition: none;
		}
	}
</style>
