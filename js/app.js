import { initEncounter } from './encounter.js';
import { initAuth } from './auth.js';

const homeSections = document.querySelectorAll('.home-section');
const loggingScreen = document.getElementById('logging-screen');
const loginScreen = document.getElementById('login-screen');

function showScreen(screen) {
  homeSections.forEach(section => {
    section.hidden = screen !== 'home';
  });

  loggingScreen.hidden = screen !== 'encounter';
  loginScreen.hidden = screen !== 'login';
}

const auth = initAuth({ showScreen });

initEncounter({
  showScreen,
  getAccessToken: auth.getAccessToken,
});
