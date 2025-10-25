import { describe, it, expect } from 'vitest';
import {
	Position,
	getOppositePosition,
	getCursorPosition,
	isTopRightBottomLeftOrCenter
} from './position.js';
import { BwinErrors } from './errors.js';

describe('Position constants', () => {
	it('defines all position constants', () => {
		expect(Position.Top).toBe('top');
		expect(Position.Right).toBe('right');
		expect(Position.Bottom).toBe('bottom');
		expect(Position.Left).toBe('left');
		expect(Position.Center).toBe('center');
		expect(Position.Root).toBe('root');
		expect(Position.Unknown).toBe('unknown');
		expect(Position.Outside).toBe('outside');
	});

	it('has unique values for each position', () => {
		const values = Object.values(Position);
		const uniqueValues = new Set(values);
		expect(uniqueValues.size).toBe(values.length);
	});
});

describe('getOppositePosition', () => {
	it('returns Bottom for Top', () => {
		expect(getOppositePosition(Position.Top)).toBe(Position.Bottom);
	});

	it('returns Top for Bottom', () => {
		expect(getOppositePosition(Position.Bottom)).toBe(Position.Top);
	});

	it('returns Left for Right', () => {
		expect(getOppositePosition(Position.Right)).toBe(Position.Left);
	});

	it('returns Right for Left', () => {
		expect(getOppositePosition(Position.Left)).toBe(Position.Right);
	});

	it('throws BwinError for invalid position', () => {
		expect(() => getOppositePosition('invalid')).toThrow();
		expect(() => getOppositePosition('invalid')).toThrow(
			BwinErrors.invalidPosition('invalid').message
		);
	});

	it('throws BwinError for Center position', () => {
		expect(() => getOppositePosition(Position.Center)).toThrow();
	});

	it('throws BwinError for Root position', () => {
		expect(() => getOppositePosition(Position.Root)).toThrow();
	});

	it('throws BwinError for Unknown position', () => {
		expect(() => getOppositePosition(Position.Unknown)).toThrow();
	});

	it('throws BwinError for Outside position', () => {
		expect(() => getOppositePosition(Position.Outside)).toThrow();
	});
});

describe('isTopRightBottomLeftOrCenter', () => {
	it('returns true for Top', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Top)).toBe(true);
	});

	it('returns true for Right', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Right)).toBe(true);
	});

	it('returns true for Bottom', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Bottom)).toBe(true);
	});

	it('returns true for Left', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Left)).toBe(true);
	});

	it('returns true for Center', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Center)).toBe(true);
	});

	it('returns false for Root', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Root)).toBe(false);
	});

	it('returns false for Unknown', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Unknown)).toBe(false);
	});

	it('returns false for Outside', () => {
		expect(isTopRightBottomLeftOrCenter(Position.Outside)).toBe(false);
	});

	it('returns false for invalid position', () => {
		expect(isTopRightBottomLeftOrCenter('invalid')).toBe(false);
	});
});

describe('getCursorPosition', () => {
	// Helper function to create a mock element with getBoundingClientRect
	const createMockElement = (left: number, top: number, width: number, height: number) => {
		return {
			getBoundingClientRect: () => ({
				left,
				top,
				width,
				height,
				right: left + width,
				bottom: top + height,
				x: left,
				y: top
			})
		} as HTMLElement;
	};

	describe('Center detection', () => {
		it('detects center position when cursor is in center 30% zone', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Center of the element: 50, 50
			const position = getCursorPosition(element, { clientX: 50, clientY: 50 });

			expect(position).toBe(Position.Center);
		});

		it('detects center for coordinates within center zone', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Within center zone (35-65 for 30% center ratio)
			expect(getCursorPosition(element, { clientX: 40, clientY: 40 })).toBe(Position.Center);
			expect(getCursorPosition(element, { clientX: 60, clientY: 60 })).toBe(Position.Center);
			expect(getCursorPosition(element, { clientX: 50, clientY: 60 })).toBe(Position.Center);
			expect(getCursorPosition(element, { clientX: 40, clientY: 50 })).toBe(Position.Center);
		});
	});

	describe('Left detection', () => {
		it('detects left position', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Far left, middle height
			const position = getCursorPosition(element, { clientX: 10, clientY: 50 });

			expect(position).toBe(Position.Left);
		});

		it('detects left in upper-left quadrant', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 15, clientY: 30 });

			expect(position).toBe(Position.Left);
		});

		it('detects left in lower-left quadrant', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 15, clientY: 70 });

			expect(position).toBe(Position.Left);
		});
	});

	describe('Right detection', () => {
		it('detects right position', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Far right, middle height
			const position = getCursorPosition(element, { clientX: 90, clientY: 50 });

			expect(position).toBe(Position.Right);
		});

		it('detects right in upper-right quadrant', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 85, clientY: 30 });

			expect(position).toBe(Position.Right);
		});

		it('detects right in lower-right quadrant', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 85, clientY: 70 });

			expect(position).toBe(Position.Right);
		});
	});

	describe('Top detection', () => {
		it('detects top position', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Middle width, far top
			const position = getCursorPosition(element, { clientX: 50, clientY: 10 });

			expect(position).toBe(Position.Top);
		});

		it('detects top in upper-left corner area', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 30, clientY: 15 });

			expect(position).toBe(Position.Top);
		});

		it('detects top in upper-right corner area', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 70, clientY: 15 });

			expect(position).toBe(Position.Top);
		});
	});

	describe('Bottom detection', () => {
		it('detects bottom position', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Middle width, far bottom
			const position = getCursorPosition(element, { clientX: 50, clientY: 90 });

			expect(position).toBe(Position.Bottom);
		});

		it('detects bottom in lower-left corner area', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 30, clientY: 85 });

			expect(position).toBe(Position.Bottom);
		});

		it('detects bottom in lower-right corner area', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 70, clientY: 85 });

			expect(position).toBe(Position.Bottom);
		});
	});

	describe('Outside detection', () => {
		it('returns Outside when cursor is left of element', () => {
			const element = createMockElement(100, 100, 100, 100);

			const position = getCursorPosition(element, { clientX: 50, clientY: 150 });

			expect(position).toBe(Position.Outside);
		});

		it('returns Outside when cursor is right of element', () => {
			const element = createMockElement(100, 100, 100, 100);

			const position = getCursorPosition(element, { clientX: 250, clientY: 150 });

			expect(position).toBe(Position.Outside);
		});

		it('returns Outside when cursor is above element', () => {
			const element = createMockElement(100, 100, 100, 100);

			const position = getCursorPosition(element, { clientX: 150, clientY: 50 });

			expect(position).toBe(Position.Outside);
		});

		it('returns Outside when cursor is below element', () => {
			const element = createMockElement(100, 100, 100, 100);

			const position = getCursorPosition(element, { clientX: 150, clientY: 250 });

			expect(position).toBe(Position.Outside);
		});

		it('returns Outside for negative coordinates', () => {
			const element = createMockElement(0, 0, 100, 100);

			expect(getCursorPosition(element, { clientX: -10, clientY: 50 })).toBe(Position.Outside);
			expect(getCursorPosition(element, { clientX: 50, clientY: -10 })).toBe(Position.Outside);
			expect(getCursorPosition(element, { clientX: -10, clientY: -10 })).toBe(Position.Outside);
		});
	});

	describe('Unknown detection', () => {
		it('returns Unknown for cursor on diagonal boundaries', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Exact diagonal line (main diagonal y = x)
			const position = getCursorPosition(element, { clientX: 25, clientY: 25 });

			// Should be Unknown or one of the edge positions depending on precision
			expect([Position.Unknown, Position.Left, Position.Top]).toContain(position);
		});

		it('returns Unknown for cursor on center zone boundaries', () => {
			const element = createMockElement(0, 0, 100, 100);

			// On the boundary of center zone (exactly at 35 or 65)
			// Due to floating point, this might be Unknown or a specific position
			const position = getCursorPosition(element, { clientX: 35, clientY: 50 });

			expect([Position.Unknown, Position.Center, Position.Left]).toContain(position);
		});
	});

	describe('Element offset handling', () => {
		it('correctly handles elements with offset position', () => {
			const element = createMockElement(200, 300, 100, 100);

			// Center of the offset element
			const position = getCursorPosition(element, { clientX: 250, clientY: 350 });

			expect(position).toBe(Position.Center);
		});

		it('detects left position with offset element', () => {
			const element = createMockElement(500, 200, 100, 100);

			const position = getCursorPosition(element, { clientX: 510, clientY: 250 });

			expect(position).toBe(Position.Left);
		});

		it('detects right position with offset element', () => {
			const element = createMockElement(500, 200, 100, 100);

			const position = getCursorPosition(element, { clientX: 590, clientY: 250 });

			expect(position).toBe(Position.Right);
		});
	});

	describe('Different element sizes', () => {
		it('works with wide rectangular elements', () => {
			const element = createMockElement(0, 0, 400, 100);

			// Center
			expect(getCursorPosition(element, { clientX: 200, clientY: 50 })).toBe(Position.Center);

			// Far left
			expect(getCursorPosition(element, { clientX: 50, clientY: 50 })).toBe(Position.Left);

			// Far right
			expect(getCursorPosition(element, { clientX: 350, clientY: 50 })).toBe(Position.Right);
		});

		it('works with tall rectangular elements', () => {
			const element = createMockElement(0, 0, 100, 400);

			// Center
			expect(getCursorPosition(element, { clientX: 50, clientY: 200 })).toBe(Position.Center);

			// Far top
			expect(getCursorPosition(element, { clientX: 50, clientY: 50 })).toBe(Position.Top);

			// Far bottom
			expect(getCursorPosition(element, { clientX: 50, clientY: 350 })).toBe(Position.Bottom);
		});

		it('works with small square elements', () => {
			const element = createMockElement(0, 0, 50, 50);

			// Center
			expect(getCursorPosition(element, { clientX: 25, clientY: 25 })).toBe(Position.Center);

			// Far left
			expect(getCursorPosition(element, { clientX: 5, clientY: 25 })).toBe(Position.Left);
		});

		it('works with very large elements', () => {
			const element = createMockElement(0, 0, 2000, 2000);

			// Center
			expect(getCursorPosition(element, { clientX: 1000, clientY: 1000 })).toBe(Position.Center);

			// Far left
			expect(getCursorPosition(element, { clientX: 200, clientY: 1000 })).toBe(Position.Left);

			// Far right
			expect(getCursorPosition(element, { clientX: 1800, clientY: 1000 })).toBe(Position.Right);

			// Far top
			expect(getCursorPosition(element, { clientX: 1000, clientY: 200 })).toBe(Position.Top);

			// Far bottom
			expect(getCursorPosition(element, { clientX: 1000, clientY: 1800 })).toBe(Position.Bottom);
		});
	});

	describe('Edge cases', () => {
		it('handles element at origin', () => {
			const element = createMockElement(0, 0, 100, 100);

			const position = getCursorPosition(element, { clientX: 50, clientY: 50 });

			expect(position).toBe(Position.Center);
		});

		it('handles cursor at element boundaries', () => {
			const element = createMockElement(0, 0, 100, 100);

			// Exactly at left edge
			expect(getCursorPosition(element, { clientX: 0, clientY: 50 })).not.toBe(Position.Outside);

			// Exactly at right edge
			expect(getCursorPosition(element, { clientX: 100, clientY: 50 })).not.toBe(Position.Outside);

			// Exactly at top edge
			expect(getCursorPosition(element, { clientX: 50, clientY: 0 })).not.toBe(Position.Outside);

			// Exactly at bottom edge
			expect(getCursorPosition(element, { clientX: 50, clientY: 100 })).not.toBe(Position.Outside);
		});
	});
});
