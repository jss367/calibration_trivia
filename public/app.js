import { appVersion } from './constants.js';
import { initialize } from './initialization.js';

console.log('App Version:', appVersion);

document.addEventListener('DOMContentLoaded', initialize);
