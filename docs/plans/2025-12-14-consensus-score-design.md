# Consensus Score Design

## Overview

Add a "Group Consensus" section to the leaderboard showing how the group collectively answered each question, using two methods:

1. **Majority vote** — most common answer wins
2. **Confidence-weighted** — sum each answer's confidences, highest total wins

Each question displays both results with a checkmark or cross indicating correctness.

## Display Format

At the top of the leaderboard, before individual scores:

```
Group Consensus
───────────────
Q1: Paris ✓ (majority) / Paris ✓ (weighted)
Q2: 1945 ✓ (majority) / 1944 ✗ (weighted)
Q3: Blue ✗ (majority) / Green ✓ (weighted)
...
Summary: Majority 8/10 correct | Weighted 9/10 correct
```

When majority and weighted agree, they'll often both be right or both wrong. The interesting cases are when they differ — showing that high-confidence minority votes can outweigh low-confidence majority.

## Calculation Logic

For each question:
1. **Majority**: Count votes per answer, pick highest count
2. **Weighted**: Sum confidences per answer, pick highest sum

Example for Q1:
- User A: Paris (0.8), User B: Paris (0.6), User C: London (0.9)
- Majority: Paris wins (2 votes vs 1)
- Weighted: Paris wins (1.4 vs 0.9)

## Implementation

**Files to modify:**
- `public/leaderboard.js` — add consensus calculation and rendering in the existing `displayLeaderboard` function

**No new files needed** — straightforward addition to existing leaderboard logic.
