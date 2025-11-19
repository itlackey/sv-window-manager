import { describe, it, expect, beforeEach } from 'vitest';
import {
	BUILTIN_TEMPLATES,
	registerTemplate,
	unregisterTemplate,
	getTemplate,
	listTemplates,
	validateTemplate,
	clearCustomTemplates,
	exportTemplateToJSON,
	importTemplateFromJSON,
	type LayoutTemplate
} from './templates.js';

describe('templates', () => {
	beforeEach(() => {
		clearCustomTemplates();
	});

	describe('BUILTIN_TEMPLATES', () => {
		it('includes two-column template', () => {
			expect(BUILTIN_TEMPLATES['two-column']).toBeDefined();
			expect(BUILTIN_TEMPLATES['two-column'].name).toBe('Two Column');
			expect(BUILTIN_TEMPLATES['two-column'].panes).toHaveLength(2);
		});

		it('includes three-column template', () => {
			expect(BUILTIN_TEMPLATES['three-column']).toBeDefined();
			expect(BUILTIN_TEMPLATES['three-column'].panes).toHaveLength(3);
		});

		it('includes sidebar-left template', () => {
			expect(BUILTIN_TEMPLATES['sidebar-left']).toBeDefined();
			const sidebar = BUILTIN_TEMPLATES['sidebar-left'].panes.find((p) => p.id === 'sidebar');
			expect(sidebar?.size).toBe(0.3);
		});

		it('includes sidebar-right template', () => {
			expect(BUILTIN_TEMPLATES['sidebar-right']).toBeDefined();
		});

		it('includes grid-2x2 template', () => {
			expect(BUILTIN_TEMPLATES['grid-2x2']).toBeDefined();
			expect(BUILTIN_TEMPLATES['grid-2x2'].panes).toHaveLength(4);
		});

		it('includes horizontal-split template', () => {
			expect(BUILTIN_TEMPLATES['horizontal-split']).toBeDefined();
		});

		it('includes dashboard template', () => {
			expect(BUILTIN_TEMPLATES['dashboard']).toBeDefined();
			expect(BUILTIN_TEMPLATES['dashboard'].panes.length).toBeGreaterThan(3);
		});

		it('includes ide template', () => {
			expect(BUILTIN_TEMPLATES['ide']).toBeDefined();
			expect(BUILTIN_TEMPLATES['ide'].metadata?.category).toBe('development');
		});

		it('all built-in templates have exactly one root pane', () => {
			Object.values(BUILTIN_TEMPLATES).forEach((template) => {
				const rootPanes = template.panes.filter((p) => p.position === 'root');
				expect(rootPanes.length).toBe(1);
			});
		});

		it('all built-in templates are valid', () => {
			Object.values(BUILTIN_TEMPLATES).forEach((template) => {
				const result = validateTemplate(template);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});
	});

	describe('registerTemplate', () => {
		it('registers a custom template', () => {
			const template: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom Layout',
				panes: [
					{ id: 'pane1', position: 'root', size: 0.5 },
					{ id: 'pane2', position: 'right', size: 0.5 }
				]
			};

			registerTemplate(template);

			const retrieved = getTemplate('custom-1');
			expect(retrieved).toEqual(template);
		});

		it('throws error for conflicting built-in template ID', () => {
			const template: LayoutTemplate = {
				id: 'two-column', // Conflicts with built-in
				name: 'My Two Column',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			expect(() => registerTemplate(template)).toThrow(/conflicts with built-in/);
		});

		it('throws error for duplicate custom template ID', () => {
			const template1: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom Layout 1',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			const template2: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom Layout 2',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			registerTemplate(template1);
			expect(() => registerTemplate(template2)).toThrow(/already exists/);
		});

		it('throws error for template with no panes', () => {
			const template: LayoutTemplate = {
				id: 'invalid-1',
				name: 'Invalid',
				panes: []
			};

			expect(() => registerTemplate(template)).toThrow(/at least one pane/);
		});

		it('throws error for template with no root pane', () => {
			const template: LayoutTemplate = {
				id: 'invalid-2',
				name: 'Invalid',
				panes: [
					{ id: 'pane1', position: 'left' },
					{ id: 'pane2', position: 'right' }
				]
			};

			expect(() => registerTemplate(template)).toThrow(/exactly one root pane/);
		});

		it('throws error for template with multiple root panes', () => {
			const template: LayoutTemplate = {
				id: 'invalid-3',
				name: 'Invalid',
				panes: [
					{ id: 'pane1', position: 'root' },
					{ id: 'pane2', position: 'root' }
				]
			};

			expect(() => registerTemplate(template)).toThrow(/exactly one root pane/);
		});
	});

	describe('unregisterTemplate', () => {
		it('unregisters a custom template', () => {
			const template: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom Layout',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			registerTemplate(template);
			expect(getTemplate('custom-1')).toBeDefined();

			const result = unregisterTemplate('custom-1');
			expect(result).toBe(true);
			expect(getTemplate('custom-1')).toBeUndefined();
		});

		it('returns false for non-existent template', () => {
			const result = unregisterTemplate('non-existent');
			expect(result).toBe(false);
		});

		it('cannot unregister built-in templates', () => {
			const result = unregisterTemplate('two-column');
			expect(result).toBe(false);
			expect(getTemplate('two-column')).toBeDefined();
		});
	});

	describe('getTemplate', () => {
		it('retrieves built-in template', () => {
			const template = getTemplate('two-column');
			expect(template).toBeDefined();
			expect(template?.name).toBe('Two Column');
		});

		it('retrieves custom template', () => {
			const template: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom Layout',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			registerTemplate(template);

			const retrieved = getTemplate('custom-1');
			expect(retrieved).toEqual(template);
		});

		it('returns undefined for non-existent template', () => {
			const template = getTemplate('non-existent');
			expect(template).toBeUndefined();
		});

		it('custom template shadows built-in template (prevents conflicts)', () => {
			// This won't actually happen due to registerTemplate validation,
			// but test the lookup order
			const customCount = listTemplates().length;
			expect(getTemplate('two-column')).toBe(BUILTIN_TEMPLATES['two-column']);
		});
	});

	describe('listTemplates', () => {
		it('lists all built-in templates', () => {
			const templates = listTemplates();
			expect(templates.length).toBeGreaterThanOrEqual(8); // At least 8 built-ins
		});

		it('includes custom templates', () => {
			const template: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom Layout',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			registerTemplate(template);

			const templates = listTemplates();
			expect(templates).toContainEqual(template);
		});

		it('filters templates by function', () => {
			const devTemplates = listTemplates((t) => t.metadata?.category === 'development');
			expect(devTemplates).toContainEqual(BUILTIN_TEMPLATES['ide']);
		});

		it('filters templates by pane count', () => {
			const simple = listTemplates((t) => t.panes.length === 2);
			expect(simple.length).toBeGreaterThan(0);
			simple.forEach((t) => {
				expect(t.panes.length).toBe(2);
			});
		});
	});

	describe('validateTemplate', () => {
		it('validates correct template', () => {
			const template: LayoutTemplate = {
				id: 'valid-1',
				name: 'Valid Layout',
				panes: [
					{ id: 'pane1', position: 'root', size: 0.5 },
					{ id: 'pane2', position: 'right', size: 0.5 }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('detects missing ID', () => {
			const template = {
				name: 'No ID',
				panes: [{ id: 'pane1', position: 'root' }]
			} as LayoutTemplate;

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('must have an ID'))).toBe(true);
		});

		it('detects missing name', () => {
			const template = {
				id: 'test',
				panes: [{ id: 'pane1', position: 'root' }]
			} as LayoutTemplate;

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('must have a name'))).toBe(true);
		});

		it('detects missing panes array', () => {
			const template = {
				id: 'test',
				name: 'Test'
			} as LayoutTemplate;

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('panes array'))).toBe(true);
		});

		it('detects empty panes array', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: []
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('at least one pane'))).toBe(true);
		});

		it('detects no root pane', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [
					{ id: 'pane1', position: 'left' },
					{ id: 'pane2', position: 'right' }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('exactly one root'))).toBe(true);
		});

		it('detects multiple root panes', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [
					{ id: 'pane1', position: 'root' },
					{ id: 'pane2', position: 'root' }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('root panes'))).toBe(true);
		});

		it('detects pane without ID', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [
					{ position: 'root' } as any,
					{ id: 'pane2', position: 'right' }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('must have an ID'))).toBe(true);
		});

		it('detects pane without position', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [
					{ id: 'pane1' } as any,
					{ id: 'pane2', position: 'right' }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('must have a position'))).toBe(true);
		});

		it('detects invalid position', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [
					{ id: 'pane1', position: 'invalid' as any },
					{ id: 'pane2', position: 'right' }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('invalid position'))).toBe(true);
		});

		it('detects invalid size type', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [{ id: 'pane1', position: 'root', size: 'invalid' as any }]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('must be a number'))).toBe(true);
		});

		it('detects size out of range (too small)', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [{ id: 'pane1', position: 'root', size: 0 }]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('between 0 and 1'))).toBe(true);
		});

		it('detects size out of range (too large)', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [{ id: 'pane1', position: 'root', size: 1.5 }]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('between 0 and 1'))).toBe(true);
		});

		it('detects duplicate pane IDs', () => {
			const template: LayoutTemplate = {
				id: 'test',
				name: 'Test',
				panes: [
					{ id: 'pane1', position: 'root' },
					{ id: 'pane1', position: 'right' }
				]
			};

			const result = validateTemplate(template);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Duplicate pane ID'))).toBe(true);
		});
	});

	describe('clearCustomTemplates', () => {
		it('clears all custom templates', () => {
			const template1: LayoutTemplate = {
				id: 'custom-1',
				name: 'Custom 1',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			const template2: LayoutTemplate = {
				id: 'custom-2',
				name: 'Custom 2',
				panes: [{ id: 'pane1', position: 'root' }]
			};

			registerTemplate(template1);
			registerTemplate(template2);

			expect(getTemplate('custom-1')).toBeDefined();
			expect(getTemplate('custom-2')).toBeDefined();

			clearCustomTemplates();

			expect(getTemplate('custom-1')).toBeUndefined();
			expect(getTemplate('custom-2')).toBeUndefined();
		});

		it('does not affect built-in templates', () => {
			clearCustomTemplates();
			expect(getTemplate('two-column')).toBeDefined();
		});
	});

	describe('exportTemplateToJSON', () => {
		it('exports template to JSON string', () => {
			const template = getTemplate('two-column');
			const json = exportTemplateToJSON(template!);

			expect(json).toBeTruthy();
			expect(() => JSON.parse(json)).not.toThrow();
		});

		it('exports with pretty formatting', () => {
			const template = getTemplate('two-column');
			const json = exportTemplateToJSON(template!, true);

			expect(json).toContain('\n');
			expect(json).toContain('  ');
		});

		it('exports without formatting by default', () => {
			const template = getTemplate('two-column');
			const json = exportTemplateToJSON(template!);

			expect(json).not.toContain('\n');
		});
	});

	describe('importTemplateFromJSON', () => {
		it('imports valid template from JSON', () => {
			const original = getTemplate('two-column')!;
			const json = exportTemplateToJSON(original);

			const imported = importTemplateFromJSON(json);

			expect(imported).toEqual(original);
		});

		it('throws error for invalid JSON', () => {
			const invalidJson = '{ invalid json }';

			expect(() => importTemplateFromJSON(invalidJson)).toThrow(/Invalid JSON/);
		});

		it('throws error for invalid template structure', () => {
			const invalidTemplate = JSON.stringify({
				id: 'invalid',
				name: 'Invalid',
				panes: [] // Empty panes array
			});

			expect(() => importTemplateFromJSON(invalidTemplate)).toThrow(/Invalid template/);
		});

		it('validates imported template', () => {
			const validTemplate = JSON.stringify({
				id: 'imported',
				name: 'Imported',
				panes: [{ id: 'pane1', position: 'root' }]
			});

			const template = importTemplateFromJSON(validTemplate);

			expect(template.id).toBe('imported');
			expect(template.panes).toHaveLength(1);
		});
	});
});
