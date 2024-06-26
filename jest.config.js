module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!@testing-library/jest-dom).+\\.js$'
    ],
};
