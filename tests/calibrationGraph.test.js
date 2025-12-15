import { calculateWilsonCI, renderCalibrationGraph } from '../public/calibrationGraph.js';

beforeEach(() => {
    document.body.innerHTML = '<div id="results-container"></div>';
});

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

describe('renderCalibrationGraph', () => {
    test('creates SVG element with correct dimensions', () => {
        const decileScores = [
            { decileRange: '50-60%', score: 0.6, correct: 3, total: 5 }
        ];

        renderCalibrationGraph(decileScores);

        const svg = document.querySelector('#calibration-graph');
        expect(svg).not.toBeNull();
        expect(svg.getAttribute('width')).toBe('400');
        expect(svg.getAttribute('height')).toBe('300');
    });

    test('renders diagonal reference line', () => {
        const decileScores = [
            { decileRange: '50-60%', score: 0.6, correct: 3, total: 5 }
        ];

        renderCalibrationGraph(decileScores);

        const diagonalLine = document.querySelector('#calibration-graph .diagonal-line');
        expect(diagonalLine).not.toBeNull();
    });

    test('renders data point for non-empty bin', () => {
        const decileScores = [
            { decileRange: '50-60%', score: 0.6, correct: 3, total: 5 }
        ];

        renderCalibrationGraph(decileScores);

        const dataPoints = document.querySelectorAll('#calibration-graph .data-point');
        expect(dataPoints.length).toBe(1);
    });

    test('skips empty bins', () => {
        const decileScores = [
            { decileRange: '50-60%', score: null, correct: 0, total: 0 },
            { decileRange: '60-70%', score: 0.8, correct: 4, total: 5 }
        ];

        renderCalibrationGraph(decileScores);

        const dataPoints = document.querySelectorAll('#calibration-graph .data-point');
        expect(dataPoints.length).toBe(1);
    });

    test('renders error bars for data points', () => {
        const decileScores = [
            { decileRange: '50-60%', score: 0.6, correct: 3, total: 5 }
        ];

        renderCalibrationGraph(decileScores);

        const errorBars = document.querySelectorAll('#calibration-graph .error-bar');
        expect(errorBars.length).toBe(1);
    });
});
