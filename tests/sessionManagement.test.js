// sessionManagement.test.js
import { joinSelectedSession } from '../public/sessionManagement';

// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('joinSelectedSession', () => {
    beforeEach(() => {
        // Reset mocks before each test
        localStorageMock.clear();
        localStorageMock.setItem.mockClear();
        document.body.innerHTML = `
      <div id="session-id-selection-container">
        <select id="session-id-select">
          <option value="test-session">Test Session</option>
        </select>
      </div>
    `;
    });

    it('should set session ID in localStorage and hide selection container', async () => {
        const select = document.getElementById('session-id-select');
        select.value = 'test-session';

        await joinSelectedSession();

        expect(localStorageMock.setItem).toHaveBeenCalledWith('currentSessionId', 'test-session');
        expect(document.getElementById('session-id-selection-container').style.display).toBe('none');

        const sessionInfoContainer = document.getElementById('session-info-container');
        expect(sessionInfoContainer).not.toBeNull();
        expect(sessionInfoContainer.textContent).toBe('Selected Session: test-session');
    });

    it('should reject if no session is selected', async () => {
        const select = document.getElementById('session-id-select');
        select.value = '';

        await expect(joinSelectedSession()).rejects.toThrow('No session selected.');
    });
});
