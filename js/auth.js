import { API_BASE } from './api.js';

export function initAuth({ showScreen }) {

    const loginForm = document.getElementById('login-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');
    const submitLogin = document.getElementById('submit-login');
    const showLoginButton = document.getElementById('show-login');
    const cancelLoginButton = document.getElementById('cancel-login');
    const logoutButton = document.getElementById('logout');
    const authStatus = document.getElementById('auth-status');

    let accessToken = sessionStorage.getItem('tushonka-token');
    let authBusy = false;

    function updateAuth(user = null) {
        showLoginButton.hidden = user !== null;
        logoutButton.hidden = user === null;
        authStatus.textContent = user ? `Signed in as ${user.username}` : '';
    }

    function clearSession() {
        accessToken = null;
        sessionStorage.removeItem('tushonka-token');
        updateAuth();
    }

    function showLogin(isOpen) {
        showScreen(isOpen ? 'login' : 'home');

        loginMessage.textContent = '';
        loginPassword.value = '';

        if (isOpen) {
            loginUsername.focus();
        } else {
            showLoginButton.focus();
        }
    }

    showLoginButton.addEventListener('click', () => {
        if (!authBusy) showLogin(true);
    });
    cancelLoginButton.addEventListener('click', () => {
        showLogin(false);
    });

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (authBusy) return;

        authBusy = true;
        submitLogin.disabled = true;
        cancelLoginButton.disabled = true;
        loginMessage.textContent = 'Logging in…';

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: loginUsername.value,
                    password: loginPassword.value,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? 'Incorrect username or password.'
                        : 'Login failed. Please try again.'
                );
            }

            const token = await response.json();

            const userResponse = await fetch(`${API_BASE}/me`, {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });

            if (!userResponse.ok) {
                throw new Error('Could not verify your account. Please try again.');
            }

            const user = await userResponse.json();
            sessionStorage.setItem('tushonka-token', token.access_token);
            accessToken = token.access_token;

            showLogin(false);
            updateAuth(user);
            document.getElementById('start-encounter').focus();
        } catch (error) {
            loginMessage.textContent = error instanceof TypeError
                ? 'Cannot reach the server. Check that the backend is running.'
                : error.message;
        } finally {
            loginPassword.value = '';
            authBusy = false;
            submitLogin.disabled = false;
            cancelLoginButton.disabled = false;
        }
    });

    logoutButton.addEventListener('click', () => {
        clearSession();
        showLogin(false);
    });

    async function restoreSession() {
        if (!accessToken) return;

        authBusy = true;
        showLoginButton.disabled = true;
        authStatus.textContent = 'Checking session…';

        try {
            const response = await fetch(`${API_BASE}/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response.status === 401) {
                clearSession();
                authStatus.textContent = 'Session expired. Please log in again.';
                return;
            }

            if (!response.ok) {
                throw new Error('Could not check your session.');
            }

            updateAuth(await response.json());
        } catch {
            authStatus.textContent =
                'Could not check your session. Try refreshing when the server is available.';
        } finally {
            authBusy = false;
            showLoginButton.disabled = false;
        }
    }

    restoreSession();

}
