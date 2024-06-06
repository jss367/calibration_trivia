import { appVersion } from './constants.js';
import { initialize } from './initialization.js';

console.log('App Version:', appVersion); // Log the app version

document.addEventListener('DOMContentLoaded', initialize);
