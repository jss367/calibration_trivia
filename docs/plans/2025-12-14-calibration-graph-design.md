# Calibration Graph Design

## Overview

A static SVG calibration chart displayed at the top of the results section. It visualizes how well the user's confidence predictions matched their actual accuracy.

## Core Elements

- **X-axis**: Confidence bins (deciles: 0-10%, 10-20%, ..., 90-100%)
- **Y-axis**: Percentage correct (0-100%)
- **Diagonal line**: "Perfect calibration" reference (y = x)
- **Data points**: User's actual accuracy per bin
- **Error bars**: 95% confidence intervals on each point

## Key Behavior

- Only bins with at least one answer are plotted (empty bins omitted)
- Points above the diagonal = underconfident (actual accuracy higher than guessed)
- Points below the diagonal = overconfident (guessed higher than actual)
- Wider error bars indicate fewer data points in that bin

## Visual Layout

### Dimensions
- Width: ~400px, Height: ~300px (responsive within results container)
- Padding: ~40px left (Y-axis labels), ~30px bottom (X-axis labels)

### Visual Elements
- **Diagonal line**: Light gray dashed line from (0,0) to (100,100)
- **Data points**: Solid blue circles (~6px radius) at each bin's midpoint (e.g., 65% for the 60-70% bin)
- **Error bars**: Vertical lines extending above/below each point showing 95% CI
- **Axis labels**: "Confidence (%)" on X-axis, "Accuracy (%)" on Y-axis
- **Grid lines**: Light gray horizontal lines at 25%, 50%, 75%

### Color Scheme
- Blue points, gray reference line, black axes/text
- Matches existing minimal CSS style

## Implementation Approach

### Data Flow
1. Reuse existing `calculateConfidenceDecileScores()` from `quizLogic.js`
2. Calculate 95% CI using Wilson score interval
3. Generate SVG elements dynamically
4. Insert at top of results container

### Files to Modify
- `public/results.js` — add graph rendering function, call it in `displayResults()`
- `public/styles.css` — minimal styling for SVG container

### New Function
```javascript
function renderCalibrationGraph(decileScores) {
  // Build SVG with axes, diagonal, points, error bars
  // Insert at top of results container
}
```

## Error Bar Calculation

Wilson score interval for 95% CI:

For each bin with `k` correct out of `n` total:

```
p = k/n (observed proportion)
z = 1.96 (for 95% CI)

center = (p + z²/2n) / (1 + z²/n)
margin = z * sqrt(p(1-p)/n + z²/4n²) / (1 + z²/n)

lower = center - margin
upper = center + margin
```

Why Wilson over simple normal approximation:
- Works correctly when p is near 0% or 100%
- Handles small sample sizes (e.g., only 2 answers in a bin)
- Never produces intervals outside [0, 1]
