// client/src/firebase.ts

import { initializeApp } from "firebase/app";
// CORRECTED IMPORT: The App Check functions now come from the main 'firebase/app-check' module
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyC6N0ofRhG37iGTWMKeNkutVy7pwWqPOm8",
  authDomain: "officegpt-c6072.firebaseapp.com",
  projectId: "officegpt-c6072",
  // CORRECTED TYPO: The storageBucket URL should not contain 'firebasestorage'
  storageBucket: "officegpt-c6072.appspot.com", 
  messagingSenderId: "751773410136",
  appId: "1:751773410136:web:ff62dfc436a08f459ebb2d",
  measurementId: "G-W1RWPJ98DD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with your reCAPTCHA Site Key
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lfv3p0rAAAAAGB9xRXn2UHs7fK4cc05q-cUULgV'),
  isTokenAutoRefreshEnabled: true
});

export default app;