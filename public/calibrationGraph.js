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
