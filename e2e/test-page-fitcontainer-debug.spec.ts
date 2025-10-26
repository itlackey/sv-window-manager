// e2e/test-page-fitcontainer-debug.spec.ts
// Diagnostic test to investigate fitContainer issue on initial page load
import { test, expect } from '@playwright/test';

interface ConsoleLog {
	type: string;
	text: string;
	timestamp?: string;
}

test.describe('FitContainer Debug - Initial Load Investigation', () => {
	test('DEBUG: Capture Initial Page Load State', async ({ page }) => {
		// Enable console logging
		const consoleLogs: ConsoleLog[] = [];
		page.on('console', (msg) => {
			const text = msg.text();
			consoleLogs.push({
				type: msg.type(),
				text: text,
				timestamp: new Date().toISOString()
			});
			console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
		});

		// Navigate to test page
		console.log('\n=== NAVIGATING TO TEST PAGE ===');
		await page.goto('http://localhost:5173/test');

		// Wait for page to load
		await page.waitForLoadState('domcontentloaded');
		console.log('=== DOM CONTENT LOADED ===');

		// Wait a bit for effects to run
		await page.waitForTimeout(500);

		// Take initial screenshot
		await page.screenshot({
			path: '/home/founder3/code/github/itlackey/sv-window-manager/debug-initial-load.png',
			fullPage: true
		});
		console.log('=== SCREENSHOT SAVED: debug-initial-load.png ===');

		// Check for frame container
		const frameContainer = page.locator('.frame-container');
		await expect(frameContainer).toBeVisible();

		// Get container dimensions
		const containerBox = await frameContainer.boundingBox();
		console.log('\n=== FRAME CONTAINER DIMENSIONS ===');
		console.log(JSON.stringify(containerBox, null, 2));

		// Get BinaryWindow root element
		const bwContainer = page.locator('.bw-container');
		const bwBox = await bwContainer.boundingBox();
		console.log('\n=== BW-CONTAINER DIMENSIONS ===');
		console.log(JSON.stringify(bwBox, null, 2));

		// Get window element
		const windowElement = page.locator('.window');
		const windowBox = await windowElement.boundingBox();
		console.log('\n=== WINDOW ELEMENT DIMENSIONS ===');
		console.log(JSON.stringify(windowBox, null, 2));

		// Get pane dimensions
		const panes = page.locator('.pane');
		const paneCount = await panes.count();
		console.log(`\n=== PANE COUNT: ${paneCount} ===`);

		for (let i = 0; i < paneCount; i++) {
			const pane = panes.nth(i);
			const paneBox = await pane.boundingBox();
			const paneId = await pane.getAttribute('data-sash-id');
			console.log(`\nPane ${i} (${paneId}):`);
			console.log(JSON.stringify(paneBox, null, 2));
		}

		// Get computed styles
		const containerStyles = await frameContainer.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				width: styles.width,
				height: styles.height,
				display: styles.display,
				position: styles.position,
				boxSizing: styles.boxSizing
			};
		});
		console.log('\n=== FRAME CONTAINER COMPUTED STYLES ===');
		console.log(JSON.stringify(containerStyles, null, 2));

		const bwStyles = await bwContainer.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				width: styles.width,
				height: styles.height,
				display: styles.display,
				position: styles.position
			};
		});
		console.log('\n=== BW-CONTAINER COMPUTED STYLES ===');
		console.log(JSON.stringify(bwStyles, null, 2));

		const windowStyles = await windowElement.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				width: styles.width,
				height: styles.height,
				display: styles.display,
				position: styles.position
			};
		});
		console.log('\n=== WINDOW ELEMENT COMPUTED STYLES ===');
		console.log(JSON.stringify(windowStyles, null, 2));

		// Get rootSash dimensions from component
		const rootSashInfo = await page.evaluate(() => {
			// Access the Svelte component internals (this is a hack for debugging)
			return {
				message: 'Root sash dimensions would need to be exposed via debug mode or API'
			};
		});
		console.log('\n=== ROOT SASH INFO ===');
		console.log(JSON.stringify(rootSashInfo, null, 2));

		// Filter fitContainer related logs
		const fitContainerLogs = consoleLogs.filter(
			(log) =>
				log.text.includes('fitContainer') ||
				log.text.includes('Initial setup') ||
				log.text.includes('Set dimensions')
		);
		console.log('\n=== FITCONTAINER CONSOLE LOGS ===');
		fitContainerLogs.forEach((log) => {
			console.log(`[${log.type}] ${log.text}`);
		});

		// Check if there were any errors
		const errorLogs = consoleLogs.filter((log) => log.type === 'error');
		console.log('\n=== ERROR LOGS ===');
		if (errorLogs.length > 0) {
			errorLogs.forEach((log) => {
				console.log(`[ERROR] ${log.text}`);
			});
		} else {
			console.log('No errors found');
		}

		// Check if there were any warnings
		const warningLogs = consoleLogs.filter((log) => log.type === 'warning');
		console.log('\n=== WARNING LOGS ===');
		if (warningLogs.length > 0) {
			warningLogs.forEach((log) => {
				console.log(`[WARNING] ${log.text}`);
			});
		} else {
			console.log('No warnings found');
		}
	});

	test('DEBUG: Compare State After Add Pane', async ({ page }) => {
		// Enable console logging
		const consoleLogs: ConsoleLog[] = [];
		page.on('console', (msg) => {
			consoleLogs.push({
				type: msg.type(),
				text: msg.text(),
				timestamp: new Date().toISOString()
			});
		});

		// Navigate and wait for initial load
		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(500);

		console.log('\n=== BEFORE ADD PANE ===');

		// Get dimensions before
		const frameContainer = page.locator('.frame-container');
		const containerBoxBefore = await frameContainer.boundingBox();
		const windowBoxBefore = await page.locator('.window').boundingBox();
		const bwBoxBefore = await page.locator('.bw-container').boundingBox();

		console.log('Frame Container:', containerBoxBefore);
		console.log('Window Element:', windowBoxBefore);
		console.log('BW Container:', bwBoxBefore);

		// Take screenshot before
		await page.screenshot({
			path: '/home/founder3/code/github/itlackey/sv-window-manager/debug-before-add-pane.png',
			fullPage: true
		});

		// Clear console logs
		consoleLogs.length = 0;

		// Add a pane
		console.log('\n=== ADDING PANE ===');
		await page.getByRole('button', { name: 'Add Pane' }).click();

		// Wait for pane to be added
		await page.waitForTimeout(500);

		console.log('\n=== AFTER ADD PANE ===');

		// Get dimensions after
		const containerBoxAfter = await frameContainer.boundingBox();
		const windowBoxAfter = await page.locator('.window').boundingBox();
		const bwBoxAfter = await page.locator('.bw-container').boundingBox();

		console.log('Frame Container:', containerBoxAfter);
		console.log('Window Element:', windowBoxAfter);
		console.log('BW Container:', bwBoxAfter);

		// Take screenshot after
		await page.screenshot({
			path: '/home/founder3/code/github/itlackey/sv-window-manager/debug-after-add-pane.png',
			fullPage: true
		});

		// Filter fitContainer related logs from add pane operation
		const fitContainerLogsAfter = consoleLogs.filter(
			(log) => log.text.includes('fitContainer') || log.text.includes('Set dimensions')
		);
		console.log('\n=== FITCONTAINER LOGS AFTER ADD PANE ===');
		fitContainerLogsAfter.forEach((log) => {
			console.log(`[${log.type}] ${log.text}`);
		});

		// Compare dimensions
		console.log('\n=== DIMENSION COMPARISON ===');
		console.log(
			'Container changed:',
			containerBoxBefore?.width !== containerBoxAfter?.width ||
				containerBoxBefore?.height !== containerBoxAfter?.height
		);
		console.log(
			'Window changed:',
			windowBoxBefore?.width !== windowBoxAfter?.width ||
				windowBoxBefore?.height !== windowBoxAfter?.height
		);
		console.log(
			'BW Container changed:',
			bwBoxBefore?.width !== bwBoxAfter?.width || bwBoxBefore?.height !== bwBoxAfter?.height
		);
	});

	test('DEBUG: Check Debug Mode Rendering', async ({ page }) => {
		// Navigate to test page
		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(500);

		console.log('\n=== ENABLING DEBUG MODE ===');

		// Enable debug mode
		await page.getByRole('checkbox', { name: 'Debug Mode' }).check();
		await page.waitForTimeout(500);

		// Take screenshot with debug mode
		await page.screenshot({
			path: '/home/founder3/code/github/itlackey/sv-window-manager/debug-mode-enabled.png',
			fullPage: true
		});

		// Check if sash IDs are visible
		const windowElement = page.locator('.window');
		const debugContent = await windowElement.textContent();
		console.log('\n=== DEBUG MODE CONTENT ===');
		console.log(debugContent);

		// Get all pane content
		const panes = page.locator('.pane');
		const paneCount = await panes.count();
		console.log(`\n=== PANE CONTENT (${paneCount} panes) ===`);

		for (let i = 0; i < paneCount; i++) {
			const pane = panes.nth(i);
			const content = await pane.textContent();
			const sashId = await pane.getAttribute('data-sash-id');
			console.log(`\nPane ${i} (${sashId}):`);
			console.log(content);
		}
	});

	test('DEBUG: Test Container Resize Behavior', async ({ page }) => {
		const consoleLogs: ConsoleLog[] = [];
		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('fitContainer') || text.includes('ResizeObserver')) {
				console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
				consoleLogs.push({
					type: msg.type(),
					text: text
				});
			}
		});

		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(500);

		console.log('\n=== INITIAL DIMENSIONS ===');
		const frameContainer = page.locator('.frame-container');
		const initialBox = await frameContainer.boundingBox();
		console.log(JSON.stringify(initialBox, null, 2));

		// Simulate container resize by changing viewport
		console.log('\n=== RESIZING VIEWPORT ===');
		await page.setViewportSize({ width: 1400, height: 900 });
		await page.waitForTimeout(500);

		const resizedBox = await frameContainer.boundingBox();
		console.log(JSON.stringify(resizedBox, null, 2));

		console.log('\n=== RESIZE OBSERVER LOGS ===');
		const resizeLogs = consoleLogs.filter(
			(log) => log.text.includes('ResizeObserver') || log.text.includes('fitContainer')
		);
		resizeLogs.forEach((log) => console.log(log.text));

		// Take screenshot after resize
		await page.screenshot({
			path: '/home/founder3/code/github/itlackey/sv-window-manager/debug-after-resize.png',
			fullPage: true
		});
	});
});
