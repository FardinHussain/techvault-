/* ── API base URL ────────────────────────────────────────────── */
const API_URL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8080/api'
    : 'https://your-backend.railway.app/api';
