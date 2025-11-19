/**
 * Pane Templates & Presets
 *
 * This module provides a template system for creating and applying pre-defined
 * window layouts. Templates define the structure of panes (position, size, etc.)
 * without the actual content, allowing for reusable layout patterns.
 *
 * @module templates
 */

import type { Sash } from './sash.js';
import { BwinErrors } from './errors.js';

/**
 * Represents a pane in a template
 */
export interface TemplatePane {
	/** Unique identifier for this pane in the template */
	id: string;
	/** Position relative to parent (top, right, bottom, left, or root for first pane) */
	position: 'top' | 'right' | 'bottom' | 'left' | 'root';
	/** Optional size ratio (0-1) for the pane */
	size?: number;
	/** Optional title for the pane */
	title?: string;
	/** Optional metadata for the pane */
	metadata?: Record<string, unknown>;
}

/**
 * A layout template definition
 */
export interface LayoutTemplate {
	/** Unique identifier for the template */
	id: string;
	/** Human-readable name */
	name: string;
	/** Description of the layout */
	description?: string;
	/** Array of panes in the order they should be created */
	panes: TemplatePane[];
	/** Optional metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Options for applying a template
 */
export interface ApplyTemplateOptions {
	/** Function to create content for each pane */
	paneFactory?: (pane: TemplatePane, index: number) => {
		component?: any;
		componentProps?: Record<string, unknown>;
		title?: string;
	};
	/** Whether to clear existing panes before applying template */
	clearExisting?: boolean;
}

/**
 * Result of applying a template
 */
export interface ApplyTemplateResult {
	/** Whether the template was applied successfully */
	success: boolean;
	/** Error if application failed */
	error?: Error;
	/** Number of panes created */
	panesCreated?: number;
	/** IDs of created panes */
	paneIds?: string[];
}

/**
 * Built-in layout templates
 */
export const BUILTIN_TEMPLATES: Record<string, LayoutTemplate> = {
	'two-column': {
		id: 'two-column',
		name: 'Two Column',
		description: 'Simple two-column layout with equal split',
		panes: [
			{ id: 'left', position: 'root', size: 0.5, title: 'Left Panel' },
			{ id: 'right', position: 'right', size: 0.5, title: 'Right Panel' }
		]
	},

	'three-column': {
		id: 'three-column',
		name: 'Three Column',
		description: 'Three-column layout with equal splits',
		panes: [
			{ id: 'left', position: 'root', size: 0.33, title: 'Left Panel' },
			{ id: 'center', position: 'right', size: 0.5, title: 'Center Panel' },
			{ id: 'right', position: 'right', size: 0.5, title: 'Right Panel' }
		]
	},

	'sidebar-left': {
		id: 'sidebar-left',
		name: 'Sidebar Left',
		description: 'Left sidebar (30%) with main content area (70%)',
		panes: [
			{ id: 'sidebar', position: 'root', size: 0.3, title: 'Sidebar' },
			{ id: 'main', position: 'right', size: 0.7, title: 'Main' }
		]
	},

	'sidebar-right': {
		id: 'sidebar-right',
		name: 'Sidebar Right',
		description: 'Main content area (70%) with right sidebar (30%)',
		panes: [
			{ id: 'main', position: 'root', size: 0.7, title: 'Main' },
			{ id: 'sidebar', position: 'right', size: 0.3, title: 'Sidebar' }
		]
	},

	'grid-2x2': {
		id: 'grid-2x2',
		name: '2x2 Grid',
		description: 'Four equal quadrants in a 2x2 grid',
		panes: [
			{ id: 'top-left', position: 'root', size: 0.5, title: 'Top Left' },
			{ id: 'top-right', position: 'right', size: 0.5, title: 'Top Right' },
			{ id: 'bottom-left', position: 'bottom', size: 0.5, title: 'Bottom Left' },
			{ id: 'bottom-right', position: 'bottom', size: 0.5, title: 'Bottom Right' }
		]
	},

	'horizontal-split': {
		id: 'horizontal-split',
		name: 'Horizontal Split',
		description: 'Two horizontal panes with equal split',
		panes: [
			{ id: 'top', position: 'root', size: 0.5, title: 'Top Panel' },
			{ id: 'bottom', position: 'bottom', size: 0.5, title: 'Bottom Panel' }
		]
	},

	'dashboard': {
		id: 'dashboard',
		name: 'Dashboard',
		description: 'Dashboard layout with header, sidebar, main content, and footer',
		panes: [
			{ id: 'header', position: 'root', size: 0.1, title: 'Header' },
			{ id: 'content-area', position: 'bottom', size: 0.9 },
			{ id: 'sidebar', position: 'root', size: 0.25, title: 'Sidebar' },
			{ id: 'main-footer', position: 'right', size: 0.75 },
			{ id: 'main', position: 'root', size: 0.85, title: 'Main Content' },
			{ id: 'footer', position: 'bottom', size: 0.15, title: 'Footer' }
		],
		metadata: {
			complexity: 'high'
		}
	},

	'ide': {
		id: 'ide',
		name: 'IDE Layout',
		description: 'IDE-style layout with file browser, editor, and terminal',
		panes: [
			{ id: 'explorer', position: 'root', size: 0.2, title: 'Explorer' },
			{ id: 'editor-terminal', position: 'right', size: 0.8 },
			{ id: 'editor', position: 'root', size: 0.7, title: 'Editor' },
			{ id: 'terminal', position: 'bottom', size: 0.3, title: 'Terminal' }
		],
		metadata: {
			category: 'development'
		}
	}
};

/**
 * Custom template registry
 */
const customTemplates: Map<string, LayoutTemplate> = new Map();

/**
 * Registers a custom template
 *
 * @param template - The template to register
 * @throws {BwinError} If template ID already exists
 *
 * @example
 * ```typescript
 * registerTemplate({
 *   id: 'my-layout',
 *   name: 'My Custom Layout',
 *   panes: [
 *     { id: 'pane1', position: 'root', size: 0.6 },
 *     { id: 'pane2', position: 'right', size: 0.4 }
 *   ]
 * });
 * ```
 */
export function registerTemplate(template: LayoutTemplate): void {
	if (BUILTIN_TEMPLATES[template.id]) {
		throw BwinErrors.invalidConfiguration(
			`Template ID "${template.id}" conflicts with built-in template. Choose a different ID.`
		);
	}

	if (customTemplates.has(template.id)) {
		throw BwinErrors.keyAlreadyExists(template.id);
	}

	// Validate template structure
	if (!template.panes || template.panes.length === 0) {
		throw BwinErrors.invalidConfiguration('Template must have at least one pane');
	}

	const rootPanes = template.panes.filter((p) => p.position === 'root');
	if (rootPanes.length !== 1) {
		throw BwinErrors.invalidConfiguration('Template must have exactly one root pane');
	}

	customTemplates.set(template.id, template);
}

/**
 * Unregisters a custom template
 *
 * @param templateId - ID of the template to unregister
 * @returns true if template was unregistered, false if not found
 *
 * @example
 * ```typescript
 * unregisterTemplate('my-layout');
 * ```
 */
export function unregisterTemplate(templateId: string): boolean {
	return customTemplates.delete(templateId);
}

/**
 * Gets a template by ID (checks both built-in and custom templates)
 *
 * @param templateId - ID of the template to retrieve
 * @returns The template or undefined if not found
 *
 * @example
 * ```typescript
 * const template = getTemplate('two-column');
 * if (template) {
 *   console.log(template.name); // "Two Column"
 * }
 * ```
 */
export function getTemplate(templateId: string): LayoutTemplate | undefined {
	return BUILTIN_TEMPLATES[templateId] || customTemplates.get(templateId);
}

/**
 * Lists all available templates (built-in and custom)
 *
 * @param filter - Optional filter function
 * @returns Array of templates
 *
 * @example
 * ```typescript
 * // Get all templates
 * const all = listTemplates();
 *
 * // Get templates by category
 * const devTemplates = listTemplates(t =>
 *   t.metadata?.category === 'development'
 * );
 * ```
 */
export function listTemplates(
	filter?: (template: LayoutTemplate) => boolean
): LayoutTemplate[] {
	const all = [
		...Object.values(BUILTIN_TEMPLATES),
		...Array.from(customTemplates.values())
	];

	return filter ? all.filter(filter) : all;
}

/**
 * Validates a template structure
 *
 * @param template - The template to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const result = validateTemplate(myTemplate);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateTemplate(template: LayoutTemplate): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!template.id) {
		errors.push('Template must have an ID');
	}

	if (!template.name) {
		errors.push('Template must have a name');
	}

	if (!template.panes || !Array.isArray(template.panes)) {
		errors.push('Template must have a panes array');
		return { valid: false, errors };
	}

	if (template.panes.length === 0) {
		errors.push('Template must have at least one pane');
	}

	const rootPanes = template.panes.filter((p) => p.position === 'root');
	if (rootPanes.length === 0) {
		errors.push('Template must have exactly one root pane');
	} else if (rootPanes.length > 1) {
		errors.push(`Template has ${rootPanes.length} root panes, must have exactly one`);
	}

	// Validate each pane
	template.panes.forEach((pane, index) => {
		if (!pane.id) {
			errors.push(`Pane at index ${index} must have an ID`);
		}

		if (!pane.position) {
			errors.push(`Pane "${pane.id}" must have a position`);
		}

		const validPositions = ['top', 'right', 'bottom', 'left', 'root'];
		if (pane.position && !validPositions.includes(pane.position)) {
			errors.push(`Pane "${pane.id}" has invalid position "${pane.position}"`);
		}

		if (pane.size !== undefined) {
			if (typeof pane.size !== 'number') {
				errors.push(`Pane "${pane.id}" size must be a number`);
			} else if (pane.size <= 0 || pane.size > 1) {
				errors.push(`Pane "${pane.id}" size must be between 0 and 1 (got ${pane.size})`);
			}
		}
	});

	// Check for duplicate IDs
	const ids = new Set<string>();
	template.panes.forEach((pane) => {
		if (ids.has(pane.id)) {
			errors.push(`Duplicate pane ID: "${pane.id}"`);
		}
		ids.add(pane.id);
	});

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Clears all custom templates
 *
 * @example
 * ```typescript
 * clearCustomTemplates();
 * ```
 */
export function clearCustomTemplates(): void {
	customTemplates.clear();
}

/**
 * Exports a template to JSON string
 *
 * @param template - The template to export
 * @param pretty - Whether to format with indentation
 * @returns JSON string representation
 *
 * @example
 * ```typescript
 * const template = getTemplate('two-column');
 * const json = exportTemplateToJSON(template, true);
 * ```
 */
export function exportTemplateToJSON(template: LayoutTemplate, pretty = false): string {
	return JSON.stringify(template, null, pretty ? 2 : 0);
}

/**
 * Imports a template from JSON string
 *
 * @param json - JSON string representation of template
 * @returns The parsed template
 * @throws {BwinError} If JSON is invalid or template structure is invalid
 *
 * @example
 * ```typescript
 * const json = '{"id":"my-layout","name":"My Layout",...}';
 * const template = importTemplateFromJSON(json);
 * registerTemplate(template);
 * ```
 */
export function importTemplateFromJSON(json: string): LayoutTemplate {
	try {
		const template = JSON.parse(json) as LayoutTemplate;

		const validation = validateTemplate(template);
		if (!validation.valid) {
			throw BwinErrors.invalidConfiguration(
				`Invalid template structure: ${validation.errors.join(', ')}`
			);
		}

		return template;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw BwinErrors.invalidConfiguration('Invalid JSON format');
		}
		throw error;
	}
}
