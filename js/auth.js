import { login, getCurrentUser, createAccount } from './api.js';

export function initAuth({ showScreen, getCurrentScreen }) {

    const loginForm = document.getElementById('login-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const confirmPassword = document.getElementById('confirm-password');
    const confirmPasswordField = document.getElementById('confirm-password-field');
    const loginMessage = document.getElementById('login-message');
    const submitLogin = document.getElementById('submit-login');
    const showLoginButton = document.getElementById('show-login');
    const logoutButton = document.getElementById('logout');
    const authStatus = document.getElementById('auth-status');

    const accountDropdown = document.getElementById('account-dropdown');
    const accountTrigger = document.getElementById('account-trigger');
    const accountLabel = document.getElementById('account-label');
    const signedInOptions = document.getElementById('signed-in-options');
    const createAccountButton = document.getElementById('create-account');
    const loginHeading = document.getElementById('login-heading');
    const switchAuthMode = document.getElementById('switch-auth-mode');

    switchAuthMode.addEventListener('click', () => {
        if (!authBusy) showLogin(true, !creatingAccount);
    });

    let creatingAccount = false;
    let returnScreen = 'home';

    const previewButton = document.getElementById('preview-app');
    const previewNotice = document.getElementById('preview-notice');

    previewButton.addEventListener('click', () => {
        if (authBusy || signedIn) return;

        returnScreen = 'home';
        previewNotice.hidden = false;
        showScreen('home');
        document.getElementById('start-encounter').focus();
    });

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
    let signedIn = false;

    function updateAuth(user = null) {
        signedIn = user !== null;
        previewNotice.hidden = true;

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
        if (isOpen && getCurrentScreen() !== 'login') {
            returnScreen = getCurrentScreen();
        }

        creatingAccount = create;

        switchAuthMode.textContent = create
            ? 'Already have an account? Log in'
            : 'Create account';

        const destination = isOpen
            ? 'login'
            : returnScreen === 'encounter'
                ? 'encounter'
                : signedIn ? 'home' : 'login';

        showScreen(destination);

        if (!isOpen) {
            returnScreen = 'home';
        }
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
        } else if (destination === 'encounter') {
            const reviewHeading = document.getElementById('review-heading');
            const reviewVisible = !document.getElementById('review-step').hidden;

            if (reviewVisible) {
                document.getElementById('save-message').textContent =
                    'You are signed in. Save your report when ready.';
            }

            (reviewVisible
                ? reviewHeading
                : document.getElementById('back-home')).focus();
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
        previewButton.disabled = true;
        switchAuthMode.disabled = true;
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

            updateAuth(user);
            showLogin(false);
            if (getCurrentScreen() === 'home') {
                document.getElementById('start-encounter').focus();
            }
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
            previewButton.disabled = false;
            switchAuthMode.disabled = false;
        }
    });

    logoutButton.addEventListener('click', () => {
        returnScreen = 'home';
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

    showScreen('login');

    const ready = restoreSession().then(() => {
        if (signedIn) {
            showScreen('home');
        } else {
            showLogin(true);
            previewButton.disabled = false;
        }
    });
    return {
        ready,
        getAccessToken: () => authBusy || !signedIn ? null : accessToken,
        requireLogin: () => {
            clearSession();
            showLogin(true);
            authStatus.textContent = 'Session expired. Log in to save your report.';
        },
    };

}
