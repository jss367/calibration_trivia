const { calculateConfidenceDecileScores } = require('../public/scripts.js');


describe('calculateConfidenceDecileScores', () => {
    test('calculates scores correctly for one decile', () => {
        const userAnswers = [
            { userAnswer: 'A', correctAnswer: ['A'], userConfidence: 0.5 },
            { userAnswer: 'A', correctAnswer: ['B'], userConfidence: 0.5 },
            { userAnswer: 'B', correctAnswer: ['B'], userConfidence: 0.5 },
            { userAnswer: 'C', correctAnswer: ['C'], userConfidence: 0.5 },
            { userAnswer: 'D', correctAnswer: ['D'], userConfidence: 0.5 },
            { userAnswer: 'D', correctAnswer: ['E'], userConfidence: 0.5 },
        ];
        const expectedScores = {
            '40-50': { total: 6, correct: 4 }
        };
        const actualScores = calculateConfidenceDecileScores(userAnswers);
        expect(actualScores).toEqual(expectedScores);
    });

    test('calculates scores correctly for multiple deciles', () => {
        const userAnswers = [
            { userAnswer: 'A', correctAnswer: ['A'], userConfidence: 0.1 },
            { userAnswer: 'A', correctAnswer: ['B'], userConfidence: 0.1 },
            { userAnswer: 'B', correctAnswer: ['B'], userConfidence: 0.3 },
            { userAnswer: 'C', correctAnswer: ['C'], userConfidence: 0.3 },
            { userAnswer: 'D', correctAnswer: ['D'], userConfidence: 0.7 },
            { userAnswer: 'D', correctAnswer: ['E'], userConfidence: 0.9 },
        ];
        const expectedScores = {
            '0-10': { total: 2, correct: 1 },
            '20-30': { total: 2, correct: 2 },
            '60-70': { total: 1, correct: 1 },
            '80-90': { total: 1, correct: 0 },
        };
        const actualScores = calculateConfidenceDecileScores(userAnswers);
        expect(actualScores).toEqual(expectedScores);
    });
});
