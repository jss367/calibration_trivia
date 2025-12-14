# Calibration Graph Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a static SVG calibration chart to the results page showing user accuracy vs confidence with error bars.

**Architecture:** Create a new `calibrationGraph.js` module with pure SVG rendering. The graph uses existing decile data from `calculateConfidenceDecileScores()`, adds Wilson score CI calculation, and renders at the top of the results container.

**Tech Stack:** Vanilla JavaScript, SVG (no external libraries)

---

## Task 1: Create Wilson Score CI Calculator

**Files:**
- Create: `public/calibrationGraph.js`
- Test: `tests/calibrationGraph.test.js`

**Step 1: Write the failing test**

Create `tests/calibrationGraph.test.js`:

```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/calibrationGraph.test.js`
Expected: FAIL with "Cannot find module '../public/calibrationGraph.js'"

**Step 3: Write minimal implementation**

Create `public/calibrationGraph.js`:

```javascript
/**
 * Calculate Wilson score confidence interval
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of answers
 * @param {number} z - Z-score for confidence level (default 1.96 for 95% CI)
 * @returns {{lower: number, upper: number}}
 */
export function calculateWilsonCI(correct, total, z = 1.96) {
    if (total === 0) {
        return { lower: 0, upper: 0 };
    }

    const p = correct / total;
    const denominator = 1 + (z * z) / total;
    const center = (p + (z * z) / (2 * total)) / denominator;
    const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));

    return {
        lower: Math.max(0, center - margin),
        upper: Math.min(1, center + margin)
    };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/calibrationGraph.test.js`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add public/calibrationGraph.js tests/calibrationGraph.test.js
git commit -m "feat: add Wilson score CI calculator for calibration graph"
```

---

## Task 2: Create SVG Graph Renderer

**Files:**
- Modify: `public/calibrationGraph.js`
- Test: `tests/calibrationGraph.test.js`

**Step 1: Write the failing test**

Add to `tests/calibrationGraph.test.js`:

```javascript
import { calculateWilsonCI, renderCalibrationGraph } from '../public/calibrationGraph.js';

// Add at the top after imports
beforeEach(() => {
    document.body.innerHTML = '<div id="results-container"></div>';
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/calibrationGraph.test.js`
Expected: FAIL with "renderCalibrationGraph is not a function" or similar

**Step 3: Write minimal implementation**

Add to `public/calibrationGraph.js`:

```javascript
// Graph dimensions
const WIDTH = 400;
const HEIGHT = 300;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

/**
 * Convert data coordinates to SVG coordinates
 */
function toSvgX(percentage) {
    return PADDING.left + (percentage / 100) * PLOT_WIDTH;
}

function toSvgY(percentage) {
    return PADDING.top + PLOT_HEIGHT - (percentage / 100) * PLOT_HEIGHT;
}

/**
 * Parse decile range string to get midpoint
 * @param {string} decileRange - e.g., "50-60%"
 * @returns {number} - midpoint, e.g., 55
 */
function getDecileMidpoint(decileRange) {
    const match = decileRange.match(/(\d+)-(\d+)/);
    if (match) {
        const low = parseInt(match[1], 10);
        const high = parseInt(match[2], 10);
        return (low + high) / 2;
    }
    return 50;
}

/**
 * Render calibration graph as SVG
 * @param {Array} decileScores - Array of {decileRange, score, correct, total}
 */
export function renderCalibrationGraph(decileScores) {
    const container = document.getElementById('results-container');
    if (!container) return;

    // Filter to only bins with data
    const dataPoints = decileScores.filter(d => d.total > 0);

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'calibration-graph');
    svg.setAttribute('width', WIDTH);
    svg.setAttribute('height', HEIGHT);
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);

    // Add styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
        .axis-line { stroke: #333; stroke-width: 1; }
        .grid-line { stroke: #ddd; stroke-width: 1; }
        .diagonal-line { stroke: #999; stroke-width: 1; stroke-dasharray: 5,5; }
        .data-point { fill: #2563eb; }
        .error-bar { stroke: #2563eb; stroke-width: 2; }
        .axis-label { font-size: 12px; fill: #333; }
        .tick-label { font-size: 10px; fill: #666; }
    `;
    svg.appendChild(style);

    // Draw grid lines
    [25, 50, 75].forEach(val => {
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('class', 'grid-line');
        gridLine.setAttribute('x1', PADDING.left);
        gridLine.setAttribute('y1', toSvgY(val));
        gridLine.setAttribute('x2', WIDTH - PADDING.right);
        gridLine.setAttribute('y2', toSvgY(val));
        svg.appendChild(gridLine);
    });

    // Draw diagonal reference line (perfect calibration)
    const diagonal = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    diagonal.setAttribute('class', 'diagonal-line');
    diagonal.setAttribute('x1', toSvgX(0));
    diagonal.setAttribute('y1', toSvgY(0));
    diagonal.setAttribute('x2', toSvgX(100));
    diagonal.setAttribute('y2', toSvgY(100));
    svg.appendChild(diagonal);

    // Draw axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('class', 'axis-line');
    xAxis.setAttribute('x1', PADDING.left);
    xAxis.setAttribute('y1', HEIGHT - PADDING.bottom);
    xAxis.setAttribute('x2', WIDTH - PADDING.right);
    xAxis.setAttribute('y2', HEIGHT - PADDING.bottom);
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('class', 'axis-line');
    yAxis.setAttribute('x1', PADDING.left);
    yAxis.setAttribute('y1', PADDING.top);
    yAxis.setAttribute('x2', PADDING.left);
    yAxis.setAttribute('y2', HEIGHT - PADDING.bottom);
    svg.appendChild(yAxis);

    // Draw tick labels
    [0, 25, 50, 75, 100].forEach(val => {
        // X-axis ticks
        const xTick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xTick.setAttribute('class', 'tick-label');
        xTick.setAttribute('x', toSvgX(val));
        xTick.setAttribute('y', HEIGHT - PADDING.bottom + 15);
        xTick.setAttribute('text-anchor', 'middle');
        xTick.textContent = `${val}%`;
        svg.appendChild(xTick);

        // Y-axis ticks
        const yTick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yTick.setAttribute('class', 'tick-label');
        yTick.setAttribute('x', PADDING.left - 10);
        yTick.setAttribute('y', toSvgY(val) + 4);
        yTick.setAttribute('text-anchor', 'end');
        yTick.textContent = `${val}%`;
        svg.appendChild(yTick);
    });

    // Draw axis labels
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('class', 'axis-label');
    xLabel.setAttribute('x', WIDTH / 2);
    xLabel.setAttribute('y', HEIGHT - 5);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.textContent = 'Confidence';
    svg.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('class', 'axis-label');
    yLabel.setAttribute('x', 15);
    yLabel.setAttribute('y', HEIGHT / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('transform', `rotate(-90, 15, ${HEIGHT / 2})`);
    yLabel.textContent = 'Accuracy';
    svg.appendChild(yLabel);

    // Draw data points with error bars
    dataPoints.forEach(point => {
        const x = toSvgX(getDecileMidpoint(point.decileRange));
        const y = toSvgY(point.score * 100);
        const ci = calculateWilsonCI(point.correct, point.total);

        // Error bar
        const errorBar = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        errorBar.setAttribute('class', 'error-bar');
        errorBar.setAttribute('x1', x);
        errorBar.setAttribute('y1', toSvgY(ci.lower * 100));
        errorBar.setAttribute('x2', x);
        errorBar.setAttribute('y2', toSvgY(ci.upper * 100));
        svg.appendChild(errorBar);

        // Data point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'data-point');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 6);
        svg.appendChild(circle);
    });

    // Insert at top of results container
    container.insertBefore(svg, container.firstChild);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/calibrationGraph.test.js`
Expected: PASS (9 tests)

**Step 5: Commit**

```bash
git add public/calibrationGraph.js tests/calibrationGraph.test.js
git commit -m "feat: add SVG calibration graph renderer"
```

---

## Task 3: Integrate Graph into Results Display

**Files:**
- Modify: `public/results.js:1-15` (imports)
- Modify: `public/results.js:53-66` (after decile calculation)

**Step 1: Add import to results.js**

In `public/results.js`, change line 13:

```javascript
import { calculateConfidenceDecileScores } from './quizLogic.js';
```

to:

```javascript
import { calculateConfidenceDecileScores } from './quizLogic.js';
import { renderCalibrationGraph } from './calibrationGraph.js';
```

**Step 2: Call renderCalibrationGraph after calculating decile scores**

In `public/results.js`, after line 53 (`const confidenceDecileScores = calculateConfidenceDecileScores(answers);`), the results HTML is built and set via `resultsContainer.innerHTML`.

We need to:
1. First set the innerHTML
2. Then call renderCalibrationGraph to insert the SVG at the top

Change the section from line 53-74 to insert the graph after innerHTML is set. Modify lines 69-74:

Replace:

```javascript
    // Only add the leaderboard button for group modes
    if (modeGroupQuestioner.checked || modeGroupParticipant.checked) {
        resultsHTML += '<button id="show-leaderboard">Show Leaderboard</button>';
    }

    resultsContainer.innerHTML = resultsHTML;
```

With:

```javascript
    // Only add the leaderboard button for group modes
    if (modeGroupQuestioner.checked || modeGroupParticipant.checked) {
        resultsHTML += '<button id="show-leaderboard">Show Leaderboard</button>';
    }

    resultsContainer.innerHTML = resultsHTML;

    // Render calibration graph at top of results (only for non-questioner modes)
    if (!modeGroupQuestioner.checked) {
        renderCalibrationGraph(confidenceDecileScores);
    }
```

**Step 3: Test manually**

Run: `npm run build && npm run start` (or however the dev server runs)
Play a quiz and verify the graph appears at the top of results.

**Step 4: Commit**

```bash
git add public/results.js
git commit -m "feat: integrate calibration graph into results display"
```

---

## Task 4: Add Graph Title and Styling

**Files:**
- Modify: `public/calibrationGraph.js`
- Modify: `public/styles.css`

**Step 1: Add title to the graph**

In `public/calibrationGraph.js`, add a title element after the style element (around line where style is appended):

After `svg.appendChild(style);`, add:

```javascript
    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('class', 'graph-title');
    title.setAttribute('x', WIDTH / 2);
    title.setAttribute('y', 15);
    title.setAttribute('text-anchor', 'middle');
    title.textContent = 'Calibration';
    svg.appendChild(title);
```

And update the style element to include:

```javascript
    style.textContent = `
        .axis-line { stroke: #333; stroke-width: 1; }
        .grid-line { stroke: #ddd; stroke-width: 1; }
        .diagonal-line { stroke: #999; stroke-width: 1; stroke-dasharray: 5,5; }
        .data-point { fill: #2563eb; }
        .error-bar { stroke: #2563eb; stroke-width: 2; }
        .axis-label { font-size: 12px; fill: #333; }
        .tick-label { font-size: 10px; fill: #666; }
        .graph-title { font-size: 14px; font-weight: bold; fill: #333; }
    `;
```

**Step 2: Add CSS for graph container**

Add to `public/styles.css`:

```css
#calibration-graph {
    display: block;
    margin: 20px auto;
    max-width: 100%;
    height: auto;
}
```

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add public/calibrationGraph.js public/styles.css
git commit -m "feat: add graph title and responsive styling"
```

---

## Task 5: Final Testing and Cleanup

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Build the project**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Manual testing checklist**

- [ ] Start a single-player quiz with 10+ questions
- [ ] Complete the quiz with varying confidence levels
- [ ] Verify graph appears at top of results
- [ ] Verify diagonal line is visible
- [ ] Verify data points appear for answered confidence ranges
- [ ] Verify error bars are visible on each point
- [ ] Verify empty bins are not shown
- [ ] Verify axis labels are readable

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for calibration graph feature"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Wilson CI calculator | `calibrationGraph.js`, `calibrationGraph.test.js` |
| 2 | SVG graph renderer | `calibrationGraph.js`, `calibrationGraph.test.js` |
| 3 | Integration with results | `results.js` |
| 4 | Title and styling | `calibrationGraph.js`, `styles.css` |
| 5 | Final testing | Manual verification |
