import { describe, it, expect } from 'vitest';
import { BwinError, BwinErrors } from './errors.js';

describe('BwinError class', () => {
	describe('constructor', () => {
		it('creates an error with message only', () => {
			const error = new BwinError('Test error message');

			expect(error.message).toBe('[bwin] Test error message');
			expect(error.name).toBe('BwinError');
			expect(error.code).toBeUndefined();
			expect(error.context).toBeUndefined();
		});

		it('creates an error with message and code', () => {
			const error = new BwinError('Test error message', 'TEST_CODE');

			expect(error.message).toBe('[bwin] Test error message');
			expect(error.name).toBe('BwinError');
			expect(error.code).toBe('TEST_CODE');
			expect(error.context).toBeUndefined();
		});

		it('creates an error with message, code, and context', () => {
			const context = { foo: 'bar', baz: 123 };
			const error = new BwinError('Test error message', 'TEST_CODE', context);

			expect(error.message).toBe('[bwin] Test error message');
			expect(error.name).toBe('BwinError');
			expect(error.code).toBe('TEST_CODE');
			expect(error.context).toEqual(context);
		});

		it('prefixes message with [bwin]', () => {
			const error = new BwinError('Something went wrong');
			expect(error.message).toContain('[bwin]');
			expect(error.message).toBe('[bwin] Something went wrong');
		});

		it('is an instance of Error', () => {
			const error = new BwinError('Test');
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(BwinError);
		});
	});
});

describe('BwinErrors factory functions', () => {
	describe('frameNotInitialized', () => {
		it('returns a BwinError with correct properties', () => {
			const error = BwinErrors.frameNotInitialized();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Frame not initialized');
			expect(error.code).toBe('FRAME_NOT_INIT');
			expect(error.context).toBeUndefined();
		});
	});

	describe('paneNotFound', () => {
		it('returns a BwinError with sash ID in message and context', () => {
			const error = BwinErrors.paneNotFound('test-123');

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Pane not found: test-123');
			expect(error.code).toBe('PANE_NOT_FOUND');
			expect(error.context).toEqual({ sashId: 'test-123' });
		});
	});

	describe('invalidPosition', () => {
		it('returns a BwinError with position in message and context', () => {
			const error = BwinErrors.invalidPosition('diagonal');

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Invalid position: diagonal');
			expect(error.code).toBe('INVALID_POSITION');
			expect(error.context).toEqual({ position: 'diagonal' });
		});
	});

	describe('missingSashId', () => {
		it('returns a BwinError without element', () => {
			const error = BwinErrors.missingSashId();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sash ID not found on element');
			expect(error.code).toBe('MISSING_SASH_ID');
			expect(error.context).toEqual({ element: undefined });
		});

		it('returns a BwinError with element className in context', () => {
			// Mock an HTMLElement with className property
			const element = { className: 'test-pane' } as HTMLElement;
			const error = BwinErrors.missingSashId(element);

			expect(error).toBeInstanceOf(BwinError);
			expect(error.code).toBe('MISSING_SASH_ID');
			expect(error.context).toEqual({ element: 'test-pane' });
		});
	});

	describe('invalidDimensions', () => {
		it('returns a BwinError with dimensions in message and context', () => {
			const error = BwinErrors.invalidDimensions(100, 200);

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Invalid dimensions: 100x200');
			expect(error.code).toBe('INVALID_DIMENSIONS');
			expect(error.context).toEqual({ width: 100, height: 200 });
		});

		it('handles negative dimensions', () => {
			const error = BwinErrors.invalidDimensions(-50, -100);

			expect(error.message).toBe('[bwin] Invalid dimensions: -50x-100');
			expect(error.context).toEqual({ width: -50, height: -100 });
		});

		it('handles zero dimensions', () => {
			const error = BwinErrors.invalidDimensions(0, 0);

			expect(error.message).toBe('[bwin] Invalid dimensions: 0x0');
			expect(error.context).toEqual({ width: 0, height: 0 });
		});
	});

	describe('componentNotReady', () => {
		it('returns a BwinError with component name in message and context', () => {
			const error = BwinErrors.componentNotReady('Frame');

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Frame component not ready');
			expect(error.code).toBe('COMPONENT_NOT_READY');
			expect(error.context).toEqual({ component: 'Frame' });
		});
	});

	describe('invalidConfiguration', () => {
		it('returns a BwinError with config message', () => {
			const error = BwinErrors.invalidConfiguration('minWidth must be positive');

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Invalid configuration: minWidth must be positive');
			expect(error.code).toBe('INVALID_CONFIG');
			expect(error.context).toBeUndefined();
		});
	});

	describe('paneElementNotFound', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.paneElementNotFound();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Pane element not found');
			expect(error.code).toBe('PANE_ELEMENT_NOT_FOUND');
			expect(error.context).toBeUndefined();
		});
	});

	describe('paneElementMissingSashId', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.paneElementMissingSashId();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Pane element missing data-sash-id attribute');
			expect(error.code).toBe('PANE_MISSING_SASH_ID');
			expect(error.context).toBeUndefined();
		});
	});

	describe('sillElementNotFound', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.sillElementNotFound();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sill element not found when minimizing');
			expect(error.code).toBe('SILL_NOT_FOUND');
			expect(error.context).toBeUndefined();
		});
	});

	describe('minimizedGlassCreationFailed', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.minimizedGlassCreationFailed();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Failed to create minimized glass element');
			expect(error.code).toBe('MINIMIZED_GLASS_FAILED');
			expect(error.context).toBeUndefined();
		});
	});

	describe('siblingsNotOpposite', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.siblingsNotOpposite();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sibling position and current position are not opposite');
			expect(error.code).toBe('SIBLINGS_NOT_OPPOSITE');
			expect(error.context).toBeUndefined();
		});
	});

	describe('siblingSizesSumNot1', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.siblingSizesSumNot1();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sum of sibling sizes is not equal to 1');
			expect(error.code).toBe('SIBLING_SIZES_SUM');
			expect(error.context).toBeUndefined();
		});
	});

	describe('siblingSizesSumNotWidth', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.siblingSizesSumNotWidth();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sum of sibling sizes is not equal to parent width');
			expect(error.code).toBe('SIBLING_SIZES_WIDTH');
			expect(error.context).toBeUndefined();
		});
	});

	describe('siblingSizesSumNotHeight', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.siblingSizesSumNotHeight();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sum of sibling sizes is not equal to parent height');
			expect(error.code).toBe('SIBLING_SIZES_HEIGHT');
			expect(error.context).toBeUndefined();
		});
	});

	describe('invalidSize', () => {
		it('returns a BwinError with numeric size', () => {
			const error = BwinErrors.invalidSize(999);

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Invalid size value: 999');
			expect(error.code).toBe('INVALID_SIZE');
			expect(error.context).toEqual({ size: 999 });
		});

		it('returns a BwinError with string size', () => {
			const error = BwinErrors.invalidSize('invalid');

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Invalid size value: invalid');
			expect(error.code).toBe('INVALID_SIZE');
			expect(error.context).toEqual({ size: 'invalid' });
		});
	});

	describe('invalidConfigValue', () => {
		it('returns a BwinError with config value', () => {
			const config = { invalid: true };
			const error = BwinErrors.invalidConfigValue(config);

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toContain('Invalid config value');
			expect(error.code).toBe('INVALID_CONFIG_VALUE');
			expect(error.context).toEqual({ config });
		});
	});

	describe('sashPositionRequired', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.sashPositionRequired();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sash position is required');
			expect(error.code).toBe('SASH_POSITION_REQUIRED');
			expect(error.context).toBeUndefined();
		});
	});

	describe('sashNotFoundWhenSwapping', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.sashNotFoundWhenSwapping();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Sash not found when swapping IDs');
			expect(error.code).toBe('SASH_SWAP_FAILED');
			expect(error.context).toBeUndefined();
		});
	});

	describe('maxChildrenExceeded', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.maxChildrenExceeded();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Maximum 2 children allowed');
			expect(error.code).toBe('MAX_CHILDREN_EXCEEDED');
			expect(error.context).toBeUndefined();
		});
	});

	describe('parameterMustBePositiveInteger', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.parameterMustBePositiveInteger();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Parameter must be a positive integer');
			expect(error.code).toBe('PARAM_NOT_POSITIVE_INT');
			expect(error.context).toBeUndefined();
		});
	});

	describe('parametersMustBeNonNegative', () => {
		it('returns a BwinError', () => {
			const error = BwinErrors.parametersMustBeNonNegative();

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Parameters must be non-negative numbers');
			expect(error.code).toBe('PARAMS_NOT_NON_NEGATIVE');
			expect(error.context).toBeUndefined();
		});
	});

	describe('keyAlreadyExists', () => {
		it('returns a BwinError with key in message and context', () => {
			const error = BwinErrors.keyAlreadyExists('testKey');

			expect(error).toBeInstanceOf(BwinError);
			expect(error.message).toBe('[bwin] Key "testKey" already exists in target object');
			expect(error.code).toBe('KEY_ALREADY_EXISTS');
			expect(error.context).toEqual({ key: 'testKey' });
		});
	});

	describe('all error codes are unique', () => {
		it('ensures no duplicate error codes', () => {
			const codes = Object.values(BwinErrors).map((fn) => {
				const error = typeof fn === 'function' ? fn('test') : fn();
				return error.code;
			});

			const uniqueCodes = new Set(codes);
			expect(uniqueCodes.size).toBe(codes.length);
		});
	});

	describe('all errors have [bwin] prefix', () => {
		it('ensures all errors are prefixed correctly', () => {
			Object.values(BwinErrors).forEach((fn) => {
				const error = typeof fn === 'function' ? fn('test') : fn();
				expect(error.message).toMatch(/^\[bwin\]/);
			});
		});
	});

	describe('error factory returns BwinError instances', () => {
		it('ensures all factories return BwinError instances', () => {
			Object.values(BwinErrors).forEach((fn) => {
				const error = typeof fn === 'function' ? fn('test') : fn();
				expect(error).toBeInstanceOf(BwinError);
				expect(error).toBeInstanceOf(Error);
			});
		});
	});
});
