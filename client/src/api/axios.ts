// client/src/api/axios.ts
import axios from 'axios';
import { getApp } from "firebase/app";
import { getToken } from "firebase/app-check";

// This logic checks if the app is in production mode.
// If true, it uses the VITE_API_URL. If false, it uses the relative path for the proxy.
const baseURL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : '/api';

const api = axios.create({
  baseURL: baseURL,
});

// --- THIS IS THE CRITICAL MISSING PIECE ---
// This 'interceptor' runs before every single API request is sent.
api.interceptors.request.use(
  async (config) => {
    // We only need to attach the token for production requests to the real backend.
    if (import.meta.env.PROD) {
      try {
        // Get the initialized Firebase app instance
        const app = getApp(); 
        // Get the App Check token
        const appCheckTokenResponse = await getToken(app, /* forceRefresh= */ false);
        // Set the token in the request headers
        config.headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
      } catch (err) {
        // If getting the token fails, log the error. The request will proceed without the token.
        console.error("Failed to get App Check token", err);
      }
    }
    return config;
  },
  (error) => {
    // Handle any errors that occur during the request setup
    return Promise.reject(error);
  }
);
// --- END OF THE MISSING PIECE ---

export default api;