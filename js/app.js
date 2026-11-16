const homeSections = document.querySelectorAll('.home-section');
const loggingScreen = document.getElementById('logging-screen');
const startButton = document.getElementById('start-encounter');
const backButton = document.getElementById('back-home');
const encounterTimeDisplay = document.getElementById('encounter-time');
const mapButtons = document.querySelectorAll('.map-option');
const continueButton = document.getElementById('continue-encounter');
const mapStep = document.getElementById('map-step');
const serverStep = document.getElementById('server-step');
const serverHeading = document.getElementById('server-heading');
const selectedMapSummary = document.getElementById('selected-map-summary');
const backMapButton = document.getElementById('back-map');

let encounterTime = null;
let selectedMap = null;

function showLogging(isLogging) {
  homeSections.forEach(section => {
    section.hidden = isLogging;
  });

  loggingScreen.hidden = !isLogging;

  if (isLogging) {
    backButton.focus();
  } else {
    startButton.focus();
  }
}

function showStep(step) {
  mapStep.hidden = step !== 'map';
  serverStep.hidden = step !== 'server';
}

startButton.addEventListener('click', () => {
  selectedMap = null;
  continueButton.disabled = true;

  showStep('map');

  mapButtons.forEach(button => {
    button.setAttribute('aria-pressed', 'false');
  });

  encounterTime = new Date();
  encounterTimeDisplay.textContent = `Encounter time: ${encounterTime.toLocaleString()}`;
  showLogging(true);
});

backButton.addEventListener('click', () => {
  showLogging(false);
});

mapButtons.forEach(button => {
  button.addEventListener('click', () => {
    const wasSelected = button.getAttribute('aria-pressed') === 'true';

    mapButtons.forEach(mapButton => {
      mapButton.setAttribute('aria-pressed', 'false');
    });

    selectedMap = wasSelected ? null : button.textContent.trim();
    continueButton.disabled = selectedMap === null;
    button.setAttribute('aria-pressed', String(!wasSelected));
  });
});

continueButton.addEventListener('click', () => {
  if (selectedMap === null) {
    return;
  }

  selectedMapSummary.textContent = `Selected map: ${selectedMap}`;
  showStep('server');
  serverHeading.focus();
});

backMapButton.addEventListener('click', () => {
  showStep('map');
  continueButton.focus();
});

const API_BASE = 'http://127.0.0.1:8000';

const loginScreen = document.getElementById('login-screen');
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
  loginScreen.hidden = !isOpen;
  loggingScreen.hidden = true;

  homeSections.forEach(section => {
    section.hidden = isOpen;
  });

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
    startButton.focus();
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
