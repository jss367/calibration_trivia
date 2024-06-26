// setupTests.js
require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock Firebase
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
        collection: jest.fn(() => ({
            doc: jest.fn(() => ({
                get: jest.fn(),
                set: jest.fn(),
            })),
        })),
    })),
}));
