import { login, getCurrentUser, createAccount } from './api.js';

export function initAuth({ showScreen }) {

    const loginForm = document.getElementById('login-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const confirmPassword = document.getElementById('confirm-password');
    const confirmPasswordField = document.getElementById('confirm-password-field');
    const loginMessage = document.getElementById('login-message');
    const submitLogin = document.getElementById('submit-login');
    const showLoginButton = document.getElementById('show-login');
    const cancelLoginButton = document.getElementById('cancel-login');
    const logoutButton = document.getElementById('logout');
    const authStatus = document.getElementById('auth-status');

    const accountDropdown = document.getElementById('account-dropdown');
    const accountTrigger = document.getElementById('account-trigger');
    const accountLabel = document.getElementById('account-label');
    const signedInOptions = document.getElementById('signed-in-options');
    const createAccountButton = document.getElementById('create-account');
    const loginHeading = document.getElementById('login-heading');
    let creatingAccount = false;

    document.addEventListener('click', event => {
        if (!accountDropdown.contains(event.target)) {
            accountDropdown.open = false;
        }
    });

    accountDropdown.addEventListener('keydown', event => {
        if (event.key === 'Escape' && accountDropdown.open) {
            accountDropdown.open = false;
            accountTrigger.focus();
            event.preventDefault();
        }
    });

    accountDropdown.addEventListener('click', event => {
        if (event.target.closest('a, button:not(:disabled)')) {
            accountDropdown.open = false;
        }
    });

    let accessToken = sessionStorage.getItem('tushonka-token');
    let authBusy = false;

    function updateAuth(user = null) {
        const signedIn = user !== null;

        showLoginButton.hidden = signedIn;
        createAccountButton.hidden = signedIn;
        signedInOptions.hidden = !signedIn;
        logoutButton.hidden = !signedIn;
        accountLabel.textContent = signedIn ? user.username : 'Account';
        authStatus.textContent = signedIn ? `Signed in as ${user.username}` : '';
        accountDropdown.open = false;
    }

    function clearSession() {
        accessToken = null;
        sessionStorage.removeItem('tushonka-token');
        updateAuth();
    }

    function showLogin(isOpen, create = false) {
        creatingAccount = create;
        showScreen(isOpen ? 'login' : 'home');
        confirmPasswordField.hidden = !create;
        confirmPassword.disabled = !create;
        confirmPassword.required = create;
        confirmPassword.value = '';
        loginHeading.textContent = create ? 'Create account' : 'Log in';
        submitLogin.textContent = create ? 'Create account' : 'Log in';
        loginUsername.maxLength = 50;
        loginPassword.autocomplete = create ? 'new-password' : 'current-password';
        loginPassword.minLength = create ? 12 : 1;
        loginPassword.maxLength = create ? 128 : 524288;

        loginMessage.textContent = create
            ? 'Choose a username and a password of 12–128 characters.'
            : '';
        loginPassword.value = '';

        if (isOpen) {
            loginUsername.focus();
        } else {
            accountTrigger.focus();
        }
    }
    createAccountButton.addEventListener('click', () => {
        if (!authBusy) showLogin(true, true);
    });
    showLoginButton.addEventListener('click', () => {
        if (!authBusy) showLogin(true);
    });
    cancelLoginButton.addEventListener('click', () => {
        showLogin(false);
    });

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (authBusy) return;


        if (creatingAccount && loginPassword.value !== confirmPassword.value) {
            loginMessage.textContent = 'Passwords do not match.';
            confirmPassword.focus();
            return;
        }

        let accountCreated = false;
        authBusy = true;
        submitLogin.disabled = true;
        cancelLoginButton.disabled = true;
        loginMessage.textContent = creatingAccount ? 'Creating account…' : 'Logging in…';
        try {
            if (creatingAccount) {
                const response = await createAccount(
                    loginUsername.value,
                    loginPassword.value
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 409
                            ? 'That username is already taken.'
                            : response.status === 422
                                ? 'Use a username of 1–50 characters and a password of 12–128 characters.'
                                : 'Could not create your account. Please try again.'
                    );
                }

                accountCreated = true;
                loginMessage.textContent = 'Account created. Signing you in…';
            }
            const response = await login(
                loginUsername.value,
                loginPassword.value
            );

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? 'Incorrect username or password.'
                        : 'Login failed. Please try again.'
                );
            }

            const token = await response.json();

            const userResponse = await getCurrentUser(token.access_token);

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
            const detail = error instanceof TypeError
                ? 'Cannot reach the server. Check that the backend is running.'
                : error.message;

            if (accountCreated) {
                showLogin(true);
                loginMessage.textContent =
                    `Your account was created, but automatic login failed. ${detail} Please log in.`;
                loginPassword.focus();
            } else {
                loginMessage.textContent = detail;
            }
        } finally {
            loginPassword.value = '';
            confirmPassword.value = '';
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
            const response = await getCurrentUser(accessToken);

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
    return {
        getAccessToken: () => authBusy ? null : accessToken,
    };

}
