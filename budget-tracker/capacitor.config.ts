import type { CapacitorConfig } from '@capacitor/cli';

// Android app wrapper. The web app is built with `npm run build:android` into dist/.
const config: CapacitorConfig = {
  appId: 'io.github.aaravb29.budgettracker',
  appName: 'Budget Tracker',
  webDir: 'dist',
  android: {
    // Android 15+ draws apps edge to edge; keep the app clear of the status and navigation bars.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
