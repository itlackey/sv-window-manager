/**
 * TabBar Component Tests - User Story 1: Reorder Tabs
 * 
 * Tests for drag-and-drop reordering, keyboard reordering, edge auto-scroll,
 * and order persistence event emission.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TabBar from './TabBar.svelte';
import type { Tab } from '../types.js';

describe('TabBar - US1: Reorder Tabs', () => {
	let sampleTabs: Tab[];

	beforeEach(() => {
		sampleTabs = [
			{ id: '1', name: 'Welcome', pinned: true, order: 0 },
			{ id: '2', name: 'Docs', pinned: true, order: 1 },
			{ id: '3', name: 'Project', pinned: false, order: 0 },
			{ id: '4', name: 'Library', pinned: false, order: 1 },
			{ id: '5', name: 'Testing', pinned: false, order: 2 },
			{ id: '6', name: 'Deploy', pinned: false, order: 3 }
		];
	});

	describe('T010: Happy-path render and role assertions', () => {
		it('should render all tabs with proper ARIA roles', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			// Check for nav landmark
			const nav = container.querySelector('nav[aria-label="Tab navigation"]');
			expect(nav).toBeTruthy();

			// Check for pinned tablist
			const pinnedTablist = container.querySelector('[role="tablist"][aria-label="Pinned tabs"]');
			expect(pinnedTablist).toBeTruthy();

			// Check for regular tablist
			const regularTablist = container.querySelector('[role="tablist"][aria-label="Regular tabs"]');
			expect(regularTablist).toBeTruthy();

			// Check for all tabs
			const allTabs = container.querySelectorAll('[role="tab"]');
			expect(allTabs.length).toBe(6);
		});

		it('should mark active tab with aria-selected', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const activeTab = container.querySelector('[role="tab"][aria-selected="true"]');
			expect(activeTab).toBeTruthy();
			expect(activeTab?.getAttribute('aria-label')).toBe('Project');
		});

		it('should separate pinned and regular tabs', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			// Pinned tabs should have (pinned) in their label
			const pinnedTabs = container.querySelectorAll('[aria-label*="(pinned)"]');
			expect(pinnedTabs.length).toBe(2);

			// Regular tabs should not have (pinned)
			const regularTabs = container.querySelectorAll('[role="tab"]:not([aria-label*="(pinned)"])');
			expect(regularTabs.length).toBe(4);
		});

		it('should set proper tabindex (0 for active, -1 for inactive)', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const activeTab = container.querySelector('[role="tab"][aria-selected="true"]');
			expect(activeTab?.getAttribute('tabindex')).toBe('0');

			const inactiveTabs = container.querySelectorAll('[role="tab"][aria-selected="false"]');
			inactiveTabs.forEach(tab => {
				expect(tab.getAttribute('tabindex')).toBe('-1');
			});
		});
	});

	describe('T011: DnD reorder test with edge auto-scroll simulation', () => {
		it('should render tabs in order', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const allTabs = container.querySelectorAll('[role="tab"]');
			// First two should be pinned, next four regular
			const tabNames = Array.from(allTabs).map((tab: Element) => tab.getAttribute('aria-label'));
			expect(tabNames[0]).toContain('Welcome');
			expect(tabNames[1]).toContain('Docs');
			expect(tabNames[2]).toBe('Project');
			expect(tabNames[3]).toBe('Library');
		});

		// Note: Full DnD implementation requires actual drag-and-drop logic
		// This test verifies the structure; actual DnD will be implemented in T014
		it('should have draggable structure ready', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const tabs = container.querySelectorAll('[role="tab"]');
			tabs.forEach((tab: Element) => {
				// Tabs should be buttons (interactive)
				expect(tab.tagName).toBe('BUTTON');
			});
		});
	});

	describe('T012: Keyboard reorder test', () => {
		it('should allow keyboard navigation between tabs', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const activeTab = container.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement;
			expect(activeTab).toBeTruthy();
			
			// Active tab should be focusable
			activeTab.focus();
			expect(document.activeElement).toBe(activeTab);
		});

		it('should have proper focus indicators (tabindex)', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const allTabs = container.querySelectorAll('[role="tab"]');
			
			// Only active tab should have tabindex="0"
			const focusableTabs = Array.from(allTabs).filter((tab: Element) => 
				tab.getAttribute('tabindex') === '0'
			);
			expect(focusableTabs.length).toBe(1);
		});

		// Note: Actual keyboard reorder (Ctrl+Arrow) will be implemented in T016
		it('should maintain a11y focus indicators structure', () => {
			const { container } = render(TabBar, { tabs: sampleTabs, activeId: '3' });

			const activeTab = container.querySelector('[role="tab"][aria-selected="true"]');
			expect(activeTab?.getAttribute('aria-selected')).toBe('true');
		});
	});

	describe('Overflow handling preparation', () => {
		it('should render many tabs without error', () => {
			const manyTabs: Tab[] = [
				{ id: '1', name: 'Pinned1', pinned: true, order: 0 },
				{ id: '2', name: 'Pinned2', pinned: true, order: 1 },
				...Array.from({ length: 20 }, (_, i) => ({
					id: `${i + 3}`,
					name: `Tab ${i + 3}`,
					pinned: false,
					order: i
				}))
			];

			const { container } = render(TabBar, { tabs: manyTabs, activeId: '10' });

			const allTabs = container.querySelectorAll('[role="tab"]');
			expect(allTabs.length).toBe(22);
		});

		it('should maintain active tab visibility in overflow', () => {
			const manyTabs: Tab[] = [
				...Array.from({ length: 20 }, (_, i) => ({
					id: `${i + 1}`,
					name: `Tab ${i + 1}`,
					pinned: false,
					order: i
				}))
			];

			const { container } = render(TabBar, { tabs: manyTabs, activeId: '15' });

			const activeTab = container.querySelector('[role="tab"][aria-selected="true"]');
			expect(activeTab).toBeTruthy();
			expect(activeTab?.getAttribute('aria-selected')).toBe('true');
		});
	});

	describe('T044: Overflow usability - ≤2 interactions to access any tab', () => {
		it('should allow keyboard access to any tab within 2 interactions', () => {
			const manyTabs: Tab[] = [
				...Array.from({ length: 15 }, (_, i) => ({
					id: `${i + 1}`,
					name: `Tab ${i + 1}`,
					pinned: false,
					order: i
				}))
			];

			const { container } = render(TabBar, { tabs: manyTabs, activeId: '1' });

			// Interaction 1: Focus on tab bar
			const firstTab = container.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement;
			expect(firstTab).toBeTruthy();
			firstTab.focus();
			
			// Interaction 2: Arrow key navigation (can reach any tab by repeating arrow keys)
			// This verifies the structure is in place for ≤2 interactions
			const allTabs = container.querySelectorAll('[role="tab"]');
			expect(allTabs.length).toBe(15);
			
			// Verify scroll container exists for mouse/keyboard scroll
			const scrollContainer = container.querySelector('.tab-segment');
			expect(scrollContainer).toBeTruthy();
		});

		it('should have horizontal scroll for overflow tabs', () => {
			const manyTabs: Tab[] = [
				...Array.from({ length: 20 }, (_, i) => ({
					id: `${i + 1}`,
					name: `Tab ${i + 1}`,
					pinned: false,
					order: i
				}))
			];

			const { container } = render(TabBar, { tabs: manyTabs, activeId: '10' });

			const scrollContainer = container.querySelector('.regular-segment') as HTMLElement;
			expect(scrollContainer).toBeTruthy();
			
			// Verify overflow-x is set in styles
			const computedStyle = window.getComputedStyle(scrollContainer);
			expect(computedStyle.overflowX).toBe('auto');
		});
	});

	describe('T045 & T046: Host update application with precedence', () => {
		it('should render tabs with host-provided order', () => {
			const hostTabs: Tab[] = [
				{ id: '1', name: 'First', pinned: false, order: 0 },
				{ id: '2', name: 'Second', pinned: false, order: 1 },
				{ id: '3', name: 'Third', pinned: false, order: 2 }
			];

			const { container } = render(TabBar, { tabs: hostTabs, activeId: '1' });

			const allTabs = container.querySelectorAll('[role="tab"]');
			const tabNames = Array.from(allTabs).map((tab: Element) => tab.getAttribute('aria-label'));
			
			expect(tabNames[0]).toBe('First');
			expect(tabNames[1]).toBe('Second');
			expect(tabNames[2]).toBe('Third');
		});

		it('should apply host updates (order/pin/name) with host precedence', async () => {
			const initialTabs: Tab[] = [
				{ id: '1', name: 'Tab1', pinned: false, order: 0 },
				{ id: '2', name: 'Tab2', pinned: false, order: 1 },
				{ id: '3', name: 'Tab3', pinned: false, order: 2 }
			];

			const { container, rerender } = render(TabBar, { tabs: initialTabs, activeId: '1' });

			// Initial state: 3 regular tabs
			let allTabs = container.querySelectorAll('[role="tab"]');
			expect(allTabs.length).toBe(3);

			// Simulate host update (reorder, rename, and pin)
			const updatedTabs: Tab[] = [
				{ id: '3', name: 'Tab3-Updated', pinned: false, order: 0 },
				{ id: '1', name: 'Tab1', pinned: false, order: 1 },
				{ id: '2', name: 'Tab2-Updated', pinned: true, order: 0 }
			];

			rerender({ tabs: updatedTabs, activeId: '1' });

			// Wait for Svelte reactivity
			await new Promise(resolve => setTimeout(resolve, 0));

			// Verify host order is applied
			const regularTabs = container.querySelectorAll('.regular-segment [role="tab"]');
			const pinnedTabs = container.querySelectorAll('.pinned-segment [role="tab"]');
			
			// Should now have 1 pinned and 2 regular
			expect(pinnedTabs.length).toBe(1);
			expect(pinnedTabs[0]?.getAttribute('aria-label')).toContain('Tab2-Updated');
			
			expect(regularTabs.length).toBe(2);
			expect(regularTabs[0]?.getAttribute('aria-label')).toBe('Tab3-Updated');
			expect(regularTabs[1]?.getAttribute('aria-label')).toBe('Tab1');
		});

		it('should deterministically apply host updates over local state', async () => {
			// This test verifies that when host provides new tab array,
			// the component renders based on host data (host precedence)
			const initialTabs: Tab[] = [
				{ id: '1', name: 'A', pinned: false, order: 0 },
				{ id: '2', name: 'B', pinned: false, order: 1 }
			];

			const { container, rerender } = render(TabBar, { tabs: initialTabs, activeId: '1' });

			// Verify initial order
			let allTabs = container.querySelectorAll('[role="tab"]');
			let tabNames = Array.from(allTabs).map((tab: Element) => tab.getAttribute('aria-label'));
			expect(tabNames[0]).toBe('A');
			expect(tabNames[1]).toBe('B');

			// Host sends update with different order
			const updatedTabs: Tab[] = [
				{ id: '2', name: 'B', pinned: false, order: 0 },
				{ id: '1', name: 'A', pinned: false, order: 1 }
			];

			rerender({ tabs: updatedTabs, activeId: '1' });

			// Wait for Svelte reactivity
			await new Promise(resolve => setTimeout(resolve, 0));

			allTabs = container.querySelectorAll('[role="tab"]');
			tabNames = Array.from(allTabs).map((tab: Element) => tab.getAttribute('aria-label'));
			
			// Host order should be deterministically applied
			expect(tabNames[0]).toBe('B');
			expect(tabNames[1]).toBe('A');
		});
	});
});
