import { initEncounter } from './encounter.js';
import { initAuth } from './auth.js';

const homeSections = document.querySelectorAll('.home-section');
const loggingScreen = document.getElementById('logging-screen');
const loginScreen = document.getElementById('login-screen');

let currentScreen = 'home';

function showScreen(screen) {
  currentScreen = screen;

  homeSections.forEach(section => {
    section.hidden = screen !== 'home';
  });

  loggingScreen.hidden = screen !== 'encounter';
  loginScreen.hidden = screen !== 'login';
}

const auth = initAuth({
  showScreen,
  getCurrentScreen: () => currentScreen,
});
document.getElementById('home-link').addEventListener('click', async event => {
  if (event.defaultPrevented) return;
  event.preventDefault();

  await auth.ready;

  document.getElementById('preview-notice').hidden =
    Boolean(auth.getAccessToken());

  document.getElementById('account-dropdown').open = false;
  showScreen('home');
  document.getElementById('start-encounter').focus();
});

initEncounter({
  showScreen,
  getAccessToken: auth.getAccessToken,
  requireLogin: auth.requireLogin,
});

document.querySelectorAll('[data-account-screen]').forEach(link => {
  link.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await auth.ready;
    document.getElementById('account-dropdown').open = false;
    document.getElementById('preview-notice').hidden = Boolean(auth.getAccessToken());

    if (link.dataset.accountScreen === 'encounter') {
      document.getElementById('start-encounter').click();
    } else {
      showScreen('home');
      document.getElementById('start-encounter').focus();
    }
  });
});

auth.ready.then(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('log') !== '1') return;

  if (auth.getAccessToken()) {
    document.getElementById('start-encounter').click();
  }

  params.delete('log');
  const query = params.toString();

  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  );
});
