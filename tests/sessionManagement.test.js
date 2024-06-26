// sessionManagement.test.js
import { joinSelectedSession } from '../public/sessionManagement';

describe('joinSelectedSession', () => {
    beforeEach(() => {
        // Reset mocks before each test
        localStorage.clear.mockClear();
        localStorage.setItem.mockClear();
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

        expect(localStorage.setItem).toHaveBeenCalledWith('currentSessionId', 'test-session');
        expect(document.getElementById('session-id-selection-container').style.display).toBe('none');
        expect(document.getElementById('session-info-container')).not.toBeNull();
        expect(document.getElementById('session-info-container').textContent).toContain('Test Session');
    });

    it('should reject if no session is selected', async () => {
        const select = document.getElementById('session-id-select');
        select.value = '';

        await expect(joinSelectedSession()).rejects.toThrow('No session selected.');
    });
});
