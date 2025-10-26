/**
 * Centralized Test Selectors for sv-window-manager E2E Tests
 *
 * This module provides consistent CSS selectors and accessible selectors
 * for use across all Playwright e2e tests.
 */

/**
 * CSS Class Selectors
 *
 * These match the constants defined in src/lib/bwin/constants.ts
 */
export const CSS_SELECTORS = {
	// Main containers
	testPage: '.test-page',
	frameContainer: '.frame-container',
	testControls: '.test-controls',
	addPaneControls: '.add-pane-controls',
	testInfo: '.test-info',

	// Window manager elements
	pane: '.pane',
	muntin: '.muntin',
	muntinVertical: '.muntin.vertical',
	muntinHorizontal: '.muntin.horizontal',

	// Glass components
	glass: '.glass',
	glassHeader: '.glass-header',
	glassTitle: '.glass-title',
	glassContent: '.glass-content',
	glassTabs: '.glass-tabs',
	glassTab: '.glass-tab',
	glassActions: '.glass-actions',
	glassAction: '.glass-action',

	// Action buttons (specific)
	closeAction: '.glass-action--close',
	minimizeAction: '.glass-action--minimize',
	maximizeAction: '.glass-action--maximize',

	// Sill (minimized panes)
	sill: '.sill',
	minimizedGlass: '.bw-minimized-glass',

	// Form elements
	targetPaneSelect: '#target-pane',
	positionSelect: '#position',
	titleInput: '#pane-title',

	// Messages
	errorMessage: '.error-message',
	addPaneInstructions: '.add-pane-instructions',

	// Control groups
	controlGroup: '.control-group',
	formField: '.form-field',
	formRow: '.form-row',
	addPaneForm: '.add-pane-form'
} as const;

/**
 * Data Attribute Selectors
 *
 * These match the constants defined in src/lib/bwin/constants.ts
 */
export const DATA_ATTRIBUTES = {
	sashId: 'data-sash-id',
	dropArea: 'data-drop-area',
	canDrop: 'data-can-drop',
	canDrag: 'data-can-drag',
	position: 'data-position',
	resizable: 'data-resizable',
	maximized: 'data-maximized'
} as const;

/**
 * Accessible Role-Based Selectors
 *
 * Functions that return Playwright-compatible selector strings
 * for use with page.getByRole()
 */
export const ACCESSIBLE_SELECTORS = {
	// Radio buttons
	simpleLayoutRadio: { role: 'radio' as const, name: 'Simple Layout (2 panes)' },
	complexLayoutRadio: { role: 'radio' as const, name: 'Complex Layout (3 panes, nested)' },

	// Checkbox
	debugModeCheckbox: { role: 'checkbox' as const, name: 'Debug Mode' },

	// Button
	addPaneButton: { role: 'button' as const, name: 'Add Pane' },

	// Form labels
	targetPaneLabel: 'Target Pane:',
	positionLabel: 'Position:',
	titleLabel: 'Title:'
} as const;

/**
 * Position Values
 *
 * Valid position options for the position dropdown
 */
export const POSITIONS = {
	top: 'top',
	right: 'right',
	bottom: 'bottom',
	left: 'left'
} as const;

/**
 * Expected Text Content
 *
 * Common text strings to search for in the UI
 */
export const TEXT_CONTENT = {
	// Page header
	pageTitle: 'Frame Component Test - SV BWIN',
	pageHeading: 'Frame Component Test',
	pageSubheading: 'Testing the declarative Svelte 5 Frame component',

	// Default pane content (Simple Layout)
	leftPaneTitle: 'Left Pane',
	rightPaneTitle: 'Right Pane',
	leftPaneContent: 'This is the left pane content',
	rightPaneContent: 'This is the right pane content',

	// Default pane content (Complex Layout)
	topPaneTitle: 'Top Pane',
	bottomLeftTitle: 'Bottom Left',
	bottomRightTitle: 'Bottom Right',
	topPaneContent: 'This is a top pane with nested children below',
	bottomLeftContent: 'Nested pane demonstrating complex layouts',
	bottomRightContent: 'Try dragging the muntins',

	// Form instructions
	addPaneInstructions: 'Select a target pane to split',

	// Error messages
	errorNoTarget: 'Please select a target pane',
	errorNotInitialized: 'BinaryWindow component not initialized',

	// Section headings
	componentFeaturesHeading: 'Component Features',
	architectureHeading: 'Architecture',
	howItWorksHeading: 'How It Works'
} as const;

/**
 * Default Values
 *
 * Default values and expected states
 */
export const DEFAULTS = {
	// Initial state
	initialPaneCount: 2,
	initialMuntinCount: 1,
	complexLayoutPaneCount: 3,
	complexLayoutMuntinCount: 2,

	// Container dimensions
	containerHeight: 500,
	containerBackgroundColor: 'rgb(224, 224, 224)',

	// Form defaults
	defaultTitlePattern: /New Pane \d+/,

	// Timing
	defaultWaitMs: 300,
	layoutSwitchWaitMs: 500,
	animationWaitMs: 500
} as const;

/**
 * Helper function to build data attribute selector
 *
 * @param attribute - Data attribute name
 * @param value - Attribute value
 * @returns CSS selector string
 *
 * @example
 * const selector = buildDataSelector('sashId', 'sash-1');
 * // Returns: '[data-sash-id="sash-1"]'
 */
export function buildDataSelector(attribute: keyof typeof DATA_ATTRIBUTES, value: string): string {
	return `[${DATA_ATTRIBUTES[attribute]}="${value}"]`;
}

/**
 * Helper function to build class selector with modifiers
 *
 * @param baseClass - Base CSS class
 * @param modifiers - Optional modifier classes
 * @returns CSS selector string
 *
 * @example
 * const selector = buildClassSelector('muntin', ['vertical']);
 * // Returns: '.muntin.vertical'
 */
export function buildClassSelector(baseClass: string, modifiers?: string[]): string {
	if (!modifiers || modifiers.length === 0) {
		return `.${baseClass}`;
	}
	return `.${baseClass}.${modifiers.join('.')}`;
}

/**
 * Helper to get pane selector by sash ID
 *
 * @param sashId - The sash ID
 * @returns CSS selector string
 *
 * @example
 * const selector = getPaneBySashId('sash-1');
 * // Returns: '.pane[data-sash-id="sash-1"]'
 */
export function getPaneBySashId(sashId: string): string {
	return `${CSS_SELECTORS.pane}${buildDataSelector('sashId', sashId)}`;
}

/**
 * Helper to get glass title selector with specific text
 *
 * @param titleText - Title text to match
 * @returns Object for use with page.locator()
 *
 * @example
 * const locator = page.locator(...getGlassTitleSelector('Left Pane'));
 */
export function getGlassTitleSelector(titleText: string) {
	return [CSS_SELECTORS.glassTitle, { hasText: titleText }] as const;
}
