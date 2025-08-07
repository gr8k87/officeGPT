// client/src/api/axios.ts
import axios from 'axios';

// With the Firebase proxy, ALL requests (dev and prod)
// should go to a relative /api path.
const api = axios.create({
  baseURL: '/api',
});

export default api;