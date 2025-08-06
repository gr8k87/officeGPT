// client/src/api/axios.ts
import axios from 'axios';

// This logic checks if the app is in production mode.
// If true, it uses the VITE_API_URL from your .env.production file.
// If false (in local dev), it uses a relative path for the Vite proxy.
const baseURL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : '/api';

const api = axios.create({
  baseURL: baseURL,
});

export default api;
