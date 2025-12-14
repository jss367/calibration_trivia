import { calculateWilsonCI } from '../public/calibrationGraph.js';

describe('calculateWilsonCI', () => {
    test('returns correct CI for 50% accuracy with 10 samples', () => {
        const { lower, upper } = calculateWilsonCI(5, 10);
        // Wilson CI for p=0.5, n=10 at 95% is approximately [0.24, 0.76]
        expect(lower).toBeCloseTo(0.24, 1);
        expect(upper).toBeCloseTo(0.76, 1);
    });

    test('returns correct CI for 100% accuracy', () => {
        const { lower, upper } = calculateWilsonCI(5, 5);
        // Should not be exactly [1, 1] - Wilson handles edge cases
        expect(lower).toBeGreaterThan(0.5);
        expect(upper).toBe(1);
    });

    test('returns correct CI for 0% accuracy', () => {
        const { lower, upper } = calculateWilsonCI(0, 5);
        expect(lower).toBe(0);
        expect(upper).toBeLessThan(0.5);
    });

    test('handles single sample', () => {
        const { lower, upper } = calculateWilsonCI(1, 1);
        expect(lower).toBeGreaterThanOrEqual(0);
        expect(upper).toBeLessThanOrEqual(1);
    });
});
