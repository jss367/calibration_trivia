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
